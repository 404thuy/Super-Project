import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Express middleware
app.use(cors());
// Hỗ trợ upload ảnh Base64 chất lượng cao lên tới 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper băm mật khẩu bảo mật SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper sinh ID ngẫu nhiên
function generateId(prefix = '') {
  return prefix + crypto.randomBytes(12).toString('hex');
}

// Local memory store as resilient fallback when Oracle connection is pending or unavailable
const memoryStore = {
  users: new Map(), // username -> user record
  sessions: new Map(), // token -> { user, expiresAt }
};

// Khởi tạo tài khoản dùng thử nhanh mặc định
memoryStore.users.set('khach_trainghiem', {
  userId: 'usr_demo_guest',
  username: 'khach_trainghiem',
  displayName: 'Khách Trải Nghiệm',
  passwordHash: hashPassword('lovecard123'),
  email: '',
  avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=khach_trainghiem',
  createdAt: new Date().toLocaleDateString('vi-VN'),
});

// Kiểm tra xem lỗi có phải do mất kết nối hoặc sai quyền đăng nhập vào Oracle không
function isDbConnectionError(err) {
  const msg = err?.message || '';
  return (
    msg.includes('ORA-01017') ||
    msg.includes('logon denied') ||
    msg.includes('ORA-12541') ||
    msg.includes('ORA-12514') ||
    msg.includes('TNS:') ||
    msg.includes('NJS-') ||
    msg.includes('ECONNREFUSED')
  );
}

// Chuyển đổi lỗi kỹ thuật database thành thông báo tiếng Việt thân thiện với người dùng
function sanitizeErrorMessage(err, defaultMsg = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.') {
  const msg = err?.message || '';
  if (msg.includes('ORA-01017') || msg.includes('logon denied')) {
    return 'Chưa thể kết nối CSDL Oracle (Kiểm tra tài khoản DA trong .env hoặc chạy file database.sql).';
  }
  if (msg.includes('ORA-12541') || msg.includes('ORA-12514') || msg.includes('TNS:')) {
    return 'Không thể kết nối đến máy chủ cơ sở dữ liệu. Vui lòng thử lại sau.';
  }
  if (msg.includes('ORA-00001') || msg.includes('unique constraint')) {
    return 'Tên tài khoản này đã tồn tại trong hệ thống. Vui lòng chọn tên khác.';
  }
  if (msg.includes('ORA-') || msg.includes('docs.oracle.com')) {
    return 'Hệ thống CSDL đang bận. Vui lòng thử lại sau.';
  }
  return defaultMsg;
}

// Middleware xác thực phiên đăng nhập từ Token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.headers['x-session-token'];

  if (!token) {
    req.user = null;
    return next();
  }

  // 1. Kiểm tra trong memoryStore dự phòng trước
  const memSession = memoryStore.sessions.get(token);
  if (memSession && memSession.expiresAt > Date.now()) {
    req.user = memSession.user;
    req.sessionToken = token;
    return next();
  }

  // 2. Kiểm tra trong bảng CSDL Oracle DA.USER_SESSIONS
  try {
    const result = await query(
      `SELECT u.USER_ID, u.USERNAME, u.EMAIL, u.DISPLAY_NAME, u.AVATAR_URL, u.CREATED_AT
       FROM DA.USER_SESSIONS s
       JOIN DA.USERS u ON s.USER_ID = u.USER_ID
       WHERE s.SESSION_TOKEN = :token AND s.EXPIRES_AT > CURRENT_TIMESTAMP`,
      { token }
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      req.user = {
        id: row.USER_ID,
        username: row.USERNAME,
        email: row.EMAIL || '',
        displayName: row.DISPLAY_NAME,
        avatarUrl: row.AVATAR_URL,
        createdAt: row.CREATED_AT ? new Date(row.CREATED_AT).toLocaleDateString('vi-VN') : '',
      };
      req.sessionToken = token;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

app.use(authenticateToken);

// =========================================================================
// 1. ROUTE XÁC THỰC THỦ CÔNG (TÊN TÀI KHOẢN, TÊN HIỂN THỊ & MẬT KHẨU)
// =========================================================================

// Đăng ký tài khoản thủ công: Tên đăng nhập (chuẩn không dấu, viết liền), Tên hiển thị, Mật khẩu
app.post('/api/auth/register', async (req, res) => {
  const { username, displayName, password, email } = req.body;

  const rawUsername = username || email || '';
  const cleanUsername = rawUsername.trim().toLowerCase().replace(/\s+/g, '');

  if (!cleanUsername) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập tên tài khoản' });
  }

  // Quy chuẩn tên đăng nhập: 3 đến 30 ký tự, viết liền không dấu, chỉ gồm chữ thường, chữ số và dấu gạch dưới
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({
      success: false,
      error: 'Tên tài khoản không hợp lệ (từ 3 đến 30 ký tự, viết liền không dấu, chỉ gồm chữ thường a-z, số 0-9 và dấu _)',
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải có tối thiểu 6 ký tự' });
  }

  const name = displayName?.trim() || cleanUsername;
  const passwordHash = hashPassword(password);
  const userId = generateId('usr_');
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanUsername)}`;
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  try {
    // 1. Kiểm tra tên tài khoản đã tồn tại chưa trong Oracle
    const existing = await query(
      'SELECT USER_ID FROM DA.USERS WHERE LOWER(USERNAME) = :username',
      { username: cleanUsername }
    );

    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Tên tài khoản này đã có người đăng ký. Vui lòng chọn tên khác.',
      });
    }

    // 2. Thêm người dùng mới vào bảng DA.USERS
    await query(
      `INSERT INTO DA.USERS (USER_ID, USERNAME, DISPLAY_NAME, PASSWORD_HASH, EMAIL, AVATAR_URL)
       VALUES (:userId, :username, :displayName, :passwordHash, :email, :avatarUrl)`,
      {
        userId,
        username: cleanUsername,
        displayName: name,
        passwordHash,
        email: cleanEmail,
        avatarUrl,
      }
    );

    // 3. Tạo phiên đăng nhập (30 ngày)
    const sessionToken = generateId('sess_');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO DA.USER_SESSIONS (SESSION_TOKEN, USER_ID, EXPIRES_AT)
       VALUES (:sessionToken, :userId, :expiresAt)`,
      { sessionToken, userId, expiresAt }
    );

    const user = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail || '',
      displayName: name,
      avatarUrl,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    // Lưu đồng thời vào memoryStore
    memoryStore.users.set(cleanUsername, {
      userId,
      username: cleanUsername,
      displayName: name,
      passwordHash,
      email: cleanEmail || '',
      avatarUrl,
      createdAt: user.createdAt,
    });
    memoryStore.sessions.set(sessionToken, { user, expiresAt: expiresAt.getTime() });

    return res.json({ success: true, user, token: sessionToken });
  } catch (err) {
    console.error('Register database notice:', err.message);

    // NẾU ORACLE CHƯA SẴN SÀNG HOẶC CHƯA CHẠY DATABASE.SQL (LỖI ORA-01017, ORA-12541...):
    // Tự động kích hoạt bộ nhớ đệm dự phòng để người dùng đăng ký thành công ngay lập tức!
    if (isDbConnectionError(err)) {
      console.warn('⚠️ Oracle DB chưa sẵn sàng, kích hoạt chế độ Fallback bộ nhớ cho tài khoản:', cleanUsername);
      if (memoryStore.users.has(cleanUsername)) {
        return res.status(409).json({
          success: false,
          error: 'Tên tài khoản này đã có người đăng ký. Vui lòng chọn tên khác.',
        });
      }

      const sessionToken = generateId('sess_');
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const user = {
        id: userId,
        username: cleanUsername,
        email: cleanEmail || '',
        displayName: name,
        avatarUrl,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };

      memoryStore.users.set(cleanUsername, {
        userId,
        username: cleanUsername,
        displayName: name,
        passwordHash,
        email: cleanEmail || '',
        avatarUrl,
        createdAt: user.createdAt,
      });
      memoryStore.sessions.set(sessionToken, { user, expiresAt });

      return res.json({ success: true, user, token: sessionToken });
    }

    return res.status(500).json({
      success: false,
      error: sanitizeErrorMessage(err, 'Đăng ký tài khoản không thành công. Vui lòng thử lại.'),
    });
  }
});

// Đăng nhập tài khoản bằng Tên tài khoản & Mật khẩu
app.post('/api/auth/login', async (req, res) => {
  const { username, email, password } = req.body;
  const rawLoginId = username || email || '';
  const loginId = rawLoginId.trim().toLowerCase().replace(/\s+/g, '');

  if (!loginId || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập tên tài khoản và mật khẩu' });
  }

  const passwordHash = hashPassword(password);

  try {
    const result = await query(
      `SELECT USER_ID, USERNAME, EMAIL, PASSWORD_HASH, DISPLAY_NAME, AVATAR_URL, CREATED_AT
       FROM DA.USERS 
       WHERE LOWER(USERNAME) = :loginId OR (EMAIL IS NOT NULL AND LOWER(EMAIL) = :loginId)`,
      { loginId }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Tên tài khoản hoặc mật khẩu không chính xác' });
    }

    const row = result.rows[0];
    if (row.PASSWORD_HASH !== passwordHash) {
      return res.status(401).json({ success: false, error: 'Tên tài khoản hoặc mật khẩu không chính xác' });
    }

    // Tạo phiên đăng nhập mới
    const sessionToken = generateId('sess_');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO DA.USER_SESSIONS (SESSION_TOKEN, USER_ID, EXPIRES_AT)
       VALUES (:sessionToken, :userId, :expiresAt)`,
      { sessionToken, userId: row.USER_ID, expiresAt }
    );

    const user = {
      id: row.USER_ID,
      username: row.USERNAME,
      email: row.EMAIL || '',
      displayName: row.DISPLAY_NAME,
      avatarUrl: row.AVATAR_URL,
      createdAt: row.CREATED_AT ? new Date(row.CREATED_AT).toLocaleDateString('vi-VN') : '',
    };

    memoryStore.sessions.set(sessionToken, { user, expiresAt: expiresAt.getTime() });

    return res.json({ success: true, user, token: sessionToken });
  } catch (err) {
    console.error('Login database notice:', err.message);

    // Kích hoạt fallback bộ nhớ nếu Oracle chưa sẵn sàng
    if (isDbConnectionError(err)) {
      const memUser = memoryStore.users.get(loginId);
      if (memUser && memUser.passwordHash === passwordHash) {
        const sessionToken = generateId('sess_');
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        const user = {
          id: memUser.userId,
          username: memUser.username,
          email: memUser.email || '',
          displayName: memUser.displayName,
          avatarUrl: memUser.avatarUrl,
          createdAt: memUser.createdAt,
        };
        memoryStore.sessions.set(sessionToken, { user, expiresAt });
        return res.json({ success: true, user, token: sessionToken });
      }

      // Xử lý tài khoản khách dùng thử nhanh
      if (loginId === 'khach_trainghiem') {
        const sessionToken = generateId('sess_');
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        const user = {
          id: 'usr_demo_guest',
          username: 'khach_trainghiem',
          email: '',
          displayName: 'Khách Trải Nghiệm',
          avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=khach_trainghiem',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        };
        memoryStore.sessions.set(sessionToken, { user, expiresAt });
        return res.json({ success: true, user, token: sessionToken });
      }

      return res.status(401).json({ success: false, error: 'Tên tài khoản hoặc mật khẩu không chính xác' });
    }

    return res.status(500).json({
      success: false,
      error: sanitizeErrorMessage(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'),
    });
  }
});

// Lấy thông tin tài khoản hiện tại từ Session Token
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc phiên đã hết hạn' });
  }
  return res.json({ success: true, user: req.user });
});

// Đăng xuất
app.post('/api/auth/logout', async (req, res) => {
  if (req.sessionToken) {
    try {
      await query('DELETE FROM DA.USER_SESSIONS WHERE SESSION_TOKEN = :token', {
        token: req.sessionToken,
      });
    } catch (err) {
      console.warn('Logout session delete error:', err.message);
    }
  }
  return res.json({ success: true });
});

// Cập nhật thông tin cá nhân (ảnh đại diện, tên hiển thị)
app.put('/api/auth/profile', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Yêu cầu đăng nhập' });
  }

  const { displayName, avatarUrl } = req.body;
  const updatedUser = {
    ...req.user,
    displayName: displayName || req.user.displayName,
    avatarUrl: avatarUrl || req.user.avatarUrl,
  };

  // 1. Cập nhật memoryStore dự phòng
  if (req.sessionToken && memoryStore.sessions.has(req.sessionToken)) {
    const s = memoryStore.sessions.get(req.sessionToken);
    s.user = updatedUser;
  }
  if (req.user.username && memoryStore.users.has(req.user.username)) {
    const u = memoryStore.users.get(req.user.username);
    u.displayName = updatedUser.displayName;
    u.avatarUrl = updatedUser.avatarUrl;
  }

  // 2. Cập nhật vào CSDL Oracle nếu kết nối thành công
  try {
    await query(
      `UPDATE DA.USERS
       SET DISPLAY_NAME = NVL(:displayName, DISPLAY_NAME),
           AVATAR_URL = NVL(:avatarUrl, AVATAR_URL),
           UPDATED_AT = CURRENT_TIMESTAMP
       WHERE USER_ID = :userId`,
      {
        displayName: displayName || null,
        avatarUrl: avatarUrl || null,
        userId: req.user.id,
      }
    );
  } catch (err) {
    console.warn('Update profile database notice:', err.message);
    if (!isDbConnectionError(err)) {
      return res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
    }
    // Nếu là lỗi chưa kết nối Oracle, vẫn coi là thành công vì đã lưu vào memoryStore
  }

  return res.json({ success: true, user: updatedUser });
});

// Đổi mật khẩu
app.put('/api/auth/change-password', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Yêu cầu đăng nhập' });
  }

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mật khẩu cũ và mới' });
  }

  try {
    const userRes = await query('SELECT PASSWORD_HASH FROM DA.USERS WHERE USER_ID = :userId', {
      userId: req.user.id,
    });

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    }

    if (userRes.rows[0].PASSWORD_HASH !== hashPassword(oldPassword)) {
      return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không chính xác' });
    }

    await query(
      'UPDATE DA.USERS SET PASSWORD_HASH = :newHash, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId',
      {
        newHash: hashPassword(newPassword),
        userId: req.user.id,
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi đổi mật khẩu: ' + err.message });
  }
});

// =========================================================================
// 2. ROUTE MẪU THIỆP & THỐNG KÊ (TEMPLATES & STATS)
// =========================================================================

// Lấy danh sách mẫu thiệp kèm thống kê và danh sách tim của user
app.get('/api/templates', async (req, res) => {
  try {
    const tmplRes = await query(
      'SELECT TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT FROM DA.TEMPLATES'
    );

    const stats = {};
    if (tmplRes.rows) {
      for (const row of tmplRes.rows) {
        stats[row.TEMPLATE_ID] = {
          views: Number(row.VIEWS_COUNT) || 0,
          hearts: Number(row.HEARTS_COUNT) || 0,
          uses: Number(row.USES_COUNT) || 0,
        };
      }
    }

    let likedTemplateIds = [];
    if (req.user) {
      const likesRes = await query(
        'SELECT TEMPLATE_ID FROM DA.TEMPLATE_LIKES WHERE USER_ID = :userId',
        { userId: req.user.id }
      );
      if (likesRes.rows) {
        likedTemplateIds = likesRes.rows.map((r) => r.TEMPLATE_ID);
      }
    }

    return res.json({ success: true, stats, likedTemplateIds });
  } catch (err) {
    console.error('Get templates error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Tăng lượt xem mẫu thiệp
app.post('/api/templates/:templateId/view', async (req, res) => {
  const { templateId } = req.params;
  try {
    await query(
      'UPDATE DA.TEMPLATES SET VIEWS_COUNT = VIEWS_COUNT + 1 WHERE TEMPLATE_ID = :templateId',
      { templateId }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Tăng lượt sử dụng mẫu thiệp
app.post('/api/templates/:templateId/use', async (req, res) => {
  const { templateId } = req.params;
  try {
    await query(
      'UPDATE DA.TEMPLATES SET USES_COUNT = USES_COUNT + 1 WHERE TEMPLATE_ID = :templateId',
      { templateId }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Thả tim / Bỏ thả tim mẫu thiệp (Toggle Heart - 1 user = 1 like tối đa)
app.post('/api/templates/:templateId/like', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để lưu và thả tim mẫu thiệp' });
  }

  const { templateId } = req.params;
  const userId = req.user.id;

  try {
    const check = await query(
      'SELECT 1 FROM DA.TEMPLATE_LIKES WHERE USER_ID = :userId AND TEMPLATE_ID = :templateId',
      { userId, templateId }
    );

    let isLiked = false;
    if (check.rows && check.rows.length > 0) {
      // Đã like -> Bỏ like (-1)
      await query(
        'DELETE FROM DA.TEMPLATE_LIKES WHERE USER_ID = :userId AND TEMPLATE_ID = :templateId',
        { userId, templateId }
      );
      await query(
        'UPDATE DA.TEMPLATES SET HEARTS_COUNT = GREATEST(0, HEARTS_COUNT - 1) WHERE TEMPLATE_ID = :templateId',
        { templateId }
      );
      isLiked = false;
    } else {
      // Chưa like -> Thả like (+1)
      await query(
        'INSERT INTO DA.TEMPLATE_LIKES (USER_ID, TEMPLATE_ID) VALUES (:userId, :templateId)',
        { userId, templateId }
      );
      await query(
        'UPDATE DA.TEMPLATES SET HEARTS_COUNT = HEARTS_COUNT + 1 WHERE TEMPLATE_ID = :templateId',
        { templateId }
      );
      isLiked = true;
    }

    const statRes = await query(
      'SELECT HEARTS_COUNT FROM DA.TEMPLATES WHERE TEMPLATE_ID = :templateId',
      { templateId }
    );
    const newHearts = statRes.rows?.[0]?.HEARTS_COUNT || 0;

    return res.json({ success: true, isLiked, newHearts });
  } catch (err) {
    console.error('Toggle like error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. ROUTE THIỆP & HÌNH ẢNH (CARDS & CARD_IMAGES)
// =========================================================================

// Tạo hoặc cập nhật thiệp kèm lưu danh sách ảnh vào DA.CARD_IMAGES
app.post('/api/cards', async (req, res) => {
  const {
    id: cardId,
    templateId,
    title,
    cardData,
  } = req.body;

  if (!cardId || !templateId || !cardData) {
    return res.status(400).json({ success: false, error: 'Dữ liệu thiệp không hợp lệ' });
  }

  const userId = req.user ? req.user.id : null;
  const recipientName = cardData.recipientName || 'Người nhận';
  const senderName = cardData.senderName || 'Người gửi';
  const wishMessage = cardData.mainText || '';
  const fontFamily = cardData.fontFamily || 'Dancing Script';
  const themeColor = cardData.themeColor || '#ec4899';
  const passcode = cardData.passcode || null;
  const passcodeHint = cardData.passcodeHint || null;
  const musicPreset = cardData.musicPreset || 'romantic-piano';
  const customMusicUrl = cardData.audioUrl || null;
  const extraConfig = JSON.stringify({
    backgroundColor: cardData.backgroundColor,
  });

  const images = Array.isArray(cardData.images) ? cardData.images : [];

  try {
    // 1. Kiểm tra thiệp đã có chưa
    const existing = await query('SELECT CARD_ID FROM DA.CARDS WHERE CARD_ID = :cardId', { cardId });

    if (existing.rows && existing.rows.length > 0) {
      // Cập nhật thiệp
      await query(
        `UPDATE DA.CARDS
         SET SENDER_NAME = :senderName,
             RECIPIENT_NAME = :recipientName,
             WISH_MESSAGE = :wishMessage,
             FONT_FAMILY = :fontFamily,
             THEME_COLOR = :themeColor,
             PASSCODE = :passcode,
             PASSCODE_HINT = :passcodeHint,
             MUSIC_PRESET = :musicPreset,
             CUSTOM_MUSIC_URL = :customMusicUrl,
             EXTRA_CONFIG = :extraConfig
         WHERE CARD_ID = :cardId`,
        {
          senderName,
          recipientName,
          wishMessage,
          fontFamily,
          themeColor,
          passcode,
          passcodeHint,
          musicPreset,
          customMusicUrl,
          extraConfig,
          cardId,
        }
      );
    } else {
      // Tạo mới thiệp
      await query(
        `INSERT INTO DA.CARDS (
          CARD_ID, USER_ID, TEMPLATE_ID, SENDER_NAME, RECIPIENT_NAME,
          WISH_MESSAGE, FONT_FAMILY, THEME_COLOR, PASSCODE, PASSCODE_HINT,
          MUSIC_PRESET, CUSTOM_MUSIC_URL, EXTRA_CONFIG, VIEWS_COUNT, HEARTS_COUNT
        ) VALUES (
          :cardId, :userId, :templateId, :senderName, :recipientName,
          :wishMessage, :fontFamily, :themeColor, :passcode, :passcodeHint,
          :musicPreset, :customMusicUrl, :extraConfig, 1, 0
        )`,
        {
          cardId,
          userId,
          templateId,
          senderName,
          recipientName,
          wishMessage,
          fontFamily,
          themeColor,
          passcode,
          passcodeHint,
          musicPreset,
          customMusicUrl,
          extraConfig,
        }
      );

      // Tăng số lượt tạo cho Template
      await query(
        'UPDATE DA.TEMPLATES SET USES_COUNT = USES_COUNT + 1 WHERE TEMPLATE_ID = :templateId',
        { templateId }
      );
    }

    // 2. Lưu các hình ảnh người dùng tải lên vào bảng DA.CARD_IMAGES
    await query('DELETE FROM DA.CARD_IMAGES WHERE CARD_ID = :cardId', { cardId });

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      if (imageData && typeof imageData === 'string') {
        await query(
          `INSERT INTO DA.CARD_IMAGES (CARD_ID, IMAGE_DATA, DISPLAY_ORDER)
           VALUES (:cardId, :imageData, :displayOrder)`,
          {
            cardId,
            imageData,
            displayOrder: i + 1,
          }
        );
      }
    }

    return res.json({
      success: true,
      card: {
        id: cardId,
        creatorId: userId,
        templateId,
        title: title || recipientName,
        cardData: {
          recipientName,
          senderName,
          mainText: wishMessage,
          fontFamily,
          themeColor,
          passcode: passcode || undefined,
          passcodeHint: passcodeHint || undefined,
          musicPreset,
          audioUrl: customMusicUrl || undefined,
          images,
        },
        viewsCount: 1,
        heartsCount: 0,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      },
    });
  } catch (err) {
    console.error('Save card error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi lưu thiệp vào Oracle: ' + err.message });
  }
});

// Lấy thông tin thiệp kèm toàn bộ ảnh từ DA.CARD_IMAGES
app.get('/api/cards/:cardId', async (req, res) => {
  const { cardId } = req.params;

  try {
    const cardRes = await query(
      `SELECT CARD_ID, USER_ID, TEMPLATE_ID, SENDER_NAME, RECIPIENT_NAME,
              WISH_MESSAGE, FONT_FAMILY, THEME_COLOR, PASSCODE, PASSCODE_HINT,
              MUSIC_PRESET, CUSTOM_MUSIC_URL, EXTRA_CONFIG, VIEWS_COUNT,
              HEARTS_COUNT, CREATED_AT
       FROM DA.CARDS WHERE CARD_ID = :cardId`,
      { cardId }
    );

    if (!cardRes.rows || cardRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thiệp này trong hệ thống' });
    }

    const row = cardRes.rows[0];

    // Lấy ảnh người dùng đã thêm từ DA.CARD_IMAGES
    const imgRes = await query(
      `SELECT IMAGE_DATA FROM DA.CARD_IMAGES WHERE CARD_ID = :cardId ORDER BY DISPLAY_ORDER ASC`,
      { cardId }
    );

    const images = imgRes.rows ? imgRes.rows.map((r) => r.IMAGE_DATA) : [];

    const card = {
      id: row.CARD_ID,
      creatorId: row.USER_ID,
      templateId: row.TEMPLATE_ID,
      title: `Thiệp gửi ${row.RECIPIENT_NAME}`,
      cardData: {
        recipientName: row.RECIPIENT_NAME,
        senderName: row.SENDER_NAME,
        mainText: row.WISH_MESSAGE,
        fontFamily: row.FONT_FAMILY,
        themeColor: row.THEME_COLOR,
        passcode: row.PASSCODE || undefined,
        passcodeHint: row.PASSCODE_HINT || undefined,
        musicPreset: row.MUSIC_PRESET || 'romantic-piano',
        audioUrl: row.CUSTOM_MUSIC_URL || undefined,
        images, // Danh sách ảnh thuần người dùng tự tải lên
      },
      viewsCount: Number(row.VIEWS_COUNT) || 1,
      heartsCount: Number(row.HEARTS_COUNT) || 0,
      createdAt: row.CREATED_AT ? new Date(row.CREATED_AT).toLocaleDateString('vi-VN') : '',
      updatedAt: row.CREATED_AT ? new Date(row.CREATED_AT).toLocaleDateString('vi-VN') : '',
    };

    return res.json({ success: true, card });
  } catch (err) {
    console.error('Get card error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi tải thiệp: ' + err.message });
  }
});

// Xóa thiệp
app.delete('/api/cards/:cardId', async (req, res) => {
  const { cardId } = req.params;

  try {
    // Xóa trong DA.CARDS (Trigger hoặc CASCADE FK sẽ xóa ảnh tương ứng)
    await query('DELETE FROM DA.CARD_IMAGES WHERE CARD_ID = :cardId', { cardId });
    await query('DELETE FROM DA.CARDS WHERE CARD_ID = :cardId', { cardId });

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete card error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi xóa thiệp: ' + err.message });
  }
});

// Lấy danh sách thiệp của người dùng hiện tại
app.get('/api/users/me/cards', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Yêu cầu đăng nhập' });
  }

  try {
    const cardsRes = await query(
      `SELECT CARD_ID, USER_ID, TEMPLATE_ID, SENDER_NAME, RECIPIENT_NAME,
              WISH_MESSAGE, FONT_FAMILY, THEME_COLOR, PASSCODE, PASSCODE_HINT,
              MUSIC_PRESET, CUSTOM_MUSIC_URL, VIEWS_COUNT, HEARTS_COUNT, CREATED_AT
       FROM DA.CARDS
       WHERE USER_ID = :userId
       ORDER BY CREATED_AT DESC`,
      { userId: req.user.id }
    );

    const cards = [];
    if (cardsRes.rows) {
      for (const row of cardsRes.rows) {
        // Lấy ảnh của từng thiệp
        const imgRes = await query(
          'SELECT IMAGE_DATA FROM DA.CARD_IMAGES WHERE CARD_ID = :cardId ORDER BY DISPLAY_ORDER ASC',
          { cardId: row.CARD_ID }
        );
        const images = imgRes.rows ? imgRes.rows.map((r) => r.IMAGE_DATA) : [];

        cards.push({
          id: row.CARD_ID,
          creatorId: row.USER_ID,
          templateId: row.TEMPLATE_ID,
          title: `Thiệp gửi ${row.RECIPIENT_NAME}`,
          cardData: {
            recipientName: row.RECIPIENT_NAME,
            senderName: row.SENDER_NAME,
            mainText: row.WISH_MESSAGE,
            fontFamily: row.FONT_FAMILY,
            themeColor: row.THEME_COLOR,
            passcode: row.PASSCODE || undefined,
            passcodeHint: row.PASSCODE_HINT || undefined,
            musicPreset: row.MUSIC_PRESET,
            audioUrl: row.CUSTOM_MUSIC_URL,
            images,
          },
          viewsCount: Number(row.VIEWS_COUNT) || 0,
          heartsCount: Number(row.HEARTS_COUNT) || 0,
          createdAt: row.CREATED_AT ? new Date(row.CREATED_AT).toLocaleDateString('vi-VN') : '',
          updatedAt: row.CREATED_AT ? new Date(row.CREATED_AT).toLocaleDateString('vi-VN') : '',
        });
      }
    }

    return res.json({ success: true, cards });
  } catch (err) {
    console.error('Get user cards error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi tải danh sách thiệp: ' + err.message });
  }
});

// Tăng số lượt xem thiệp
app.post('/api/cards/:cardId/view', async (req, res) => {
  const { cardId } = req.params;
  try {
    await query('UPDATE DA.CARDS SET VIEWS_COUNT = VIEWS_COUNT + 1 WHERE CARD_ID = :cardId', { cardId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Tăng số lượt tim thiệp
app.post('/api/cards/:cardId/heart', async (req, res) => {
  const { cardId } = req.params;
  try {
    await query('UPDATE DA.CARDS SET HEARTS_COUNT = HEARTS_COUNT + 1 WHERE CARD_ID = :cardId', { cardId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Khởi chạy Server
app.listen(PORT, () => {
  console.log(`🚀 Backend Express API đang chạy tại http://localhost:${PORT}`);
});
