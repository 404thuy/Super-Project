import type { CardConfig, CardTemplate, CreatedCard } from '../types';
import { TEMPLATES } from '../types';
import { supabase, isSupabaseReady } from './supabaseClient';
import { BACKEND_URL, getTunnelHeaders } from './apiConfig';

const TOKEN_KEY = 'lovecard_session_token';
const CARDS_CACHE_KEY = 'lovecard_cards_cache_v2';
const TEMPLATE_STATS_KEY = 'lovecard_template_stats_v3';
const USER_LIKED_TEMPLATES_KEY = 'lovecard_user_liked_templates_v3';

// Danh sách các số liệu giả cũ từng bị seed vào database để tự động dọn dẹp
const OLD_MOCK_VIEWS = new Set([
  1520, 2410, 1340, 1890, 1650, 2890, 3450, 2760, 1980, 2100, 1780, 1920, 2340, 1850
]);

// Phát tín hiệu cập nhật stats tới toàn bộ các component đang render
export function notifyStatsChanged(templateId?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('template_stats_changed', { detail: { templateId } }));
  }
}

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('lovecard_user_cache_v2') || localStorage.getItem('lovecard_user_v2');
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id || null;
    }
  } catch {}
  return null;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return getTunnelHeaders(token ? { Authorization: `Bearer ${token}` } : {});
}

// Generate unique short ID for card
export function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'lc_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format numbers nicely: 1250 -> 1.3k
export function formatStat(num: number): string {
  if (!num || num === 0) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toString();
}

// ----------------------------------------------------
// 1. TEMPLATES STATS & LIKES (SUPABASE & ORACLE FALLBACK)
// ----------------------------------------------------

export async function fetchLiveTemplateStats(): Promise<{
  stats: Record<string, { views: number; hearts: number; uses: number }>;
  likedTemplateIds: string[];
}> {
  // 1. Supabase Cloud Sync
  if (isSupabaseReady && supabase) {
    try {
      // 1.1 Lấy toàn bộ lượt thích thực tế từ bảng template_likes
      const { data: allLikes } = await supabase.from('template_likes').select('template_id, user_id');
      const realHeartsMap: Record<string, number> = {};
      const uid = getCurrentUserId();
      const likedIds: string[] = [];

      if (allLikes) {
        allLikes.forEach((l: any) => {
          if (l.template_id) {
            realHeartsMap[l.template_id] = (realHeartsMap[l.template_id] || 0) + 1;
            if (uid && l.user_id === uid && !likedIds.includes(l.template_id)) {
              likedIds.push(l.template_id);
            }
          }
        });
      }

      // 1.2 Lấy toàn bộ số lượt thiệp thực tế đã được tạo từ bảng cards
      const { data: allCards } = await supabase.from('cards').select('template_id');
      const realUsesMap: Record<string, number> = {};
      if (allCards) {
        allCards.forEach((c: any) => {
          if (c.template_id) {
            realUsesMap[c.template_id] = (realUsesMap[c.template_id] || 0) + 1;
          }
        });
      }

      // 1.3 Lấy thông tin từ bảng templates
      const { data: tmplData } = await supabase.from('templates').select('*');
      const stats: Record<string, { views: number; hearts: number; uses: number }> = {};
      const existingTmplMap: Record<string, any> = {};

      if (tmplData) {
        tmplData.forEach((row: any) => {
          existingTmplMap[row.id] = row;
        });
      }

      // 1.4 Chuẩn hóa dữ liệu cho toàn bộ danh sách 22 templates (Loại bỏ triệt để số giả)
      for (const tmpl of TEMPLATES) {
        const row = existingTmplMap[tmpl.id];
        const realHearts = realHeartsMap[tmpl.id] || 0;
        const realUses = realUsesMap[tmpl.id] || 0;
        let realViews = 0;

        if (row) {
          const currentViews = Number(row.views_count) || 0;
          // Nếu views là số mock ảo cũ (thuộc OLD_MOCK_VIEWS hoặc >= 1000 và chưa khớp thực tế)
          if (OLD_MOCK_VIEWS.has(currentViews) || (currentViews >= 1000 && realUses < 100)) {
            realViews = Math.max(realUses * 2, 0);
          } else {
            realViews = Math.max(0, currentViews);
          }

          // Tự động dọn dẹp các giá trị ảo cũ trên Supabase để database của người dùng sạch 100%
          if (
            row.hearts_count !== realHearts ||
            row.uses_count !== realUses ||
            OLD_MOCK_VIEWS.has(currentViews)
          ) {
            supabase
              .from('templates')
              .update({
                views_count: realViews,
                hearts_count: realHearts,
                uses_count: realUses,
                updated_at: new Date().toISOString(),
              })
              .eq('id', tmpl.id)
              .then();
          }
        } else {
          // Chưa có bản ghi trong bảng templates -> Tạo mới với dữ liệu thật bắt đầu từ 0
          realViews = 0;
          supabase
            .from('templates')
            .upsert({
              id: tmpl.id,
              name: tmpl.titleVi,
              views_count: 0,
              hearts_count: realHearts,
              uses_count: realUses,
              updated_at: new Date().toISOString(),
            })
            .then();
        }

        stats[tmpl.id] = {
          views: realViews,
          hearts: realHearts,
          uses: realUses,
        };
      }

      localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(stats));
      localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(likedIds));
      notifyStatsChanged();

      return { stats, likedTemplateIds: likedIds };
    } catch (err) {
      console.warn('Supabase fetch templates stats fallback:', err);
    }
  }

  // 2. Oracle 19c local API fallback (chỉ khi không dùng Supabase)
  if (!isSupabaseReady) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/templates`, {
        headers: getAuthHeaders(),
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(data.stats));
          if (data.likedTemplateIds) {
            localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(data.likedTemplateIds));
          }
          notifyStatsChanged();
          return {
            stats: data.stats || {},
            likedTemplateIds: data.likedTemplateIds || [],
          };
        }
      }
    } catch (err) {
      // Vercel static fallback
    }
  }

  // 3. Fallback cache
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    const rawLiked = localStorage.getItem(USER_LIKED_TEMPLATES_KEY);
    return {
      stats: raw ? JSON.parse(raw) : {},
      likedTemplateIds: rawLiked ? JSON.parse(rawLiked) : [],
    };
  } catch {
    return { stats: {}, likedTemplateIds: [] };
  }
}

export function getTemplateLiveStats(templateId: string): { views: number; hearts: number; uses: number } {
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[templateId]) {
        const v = Number(data[templateId].views) || 0;
        const h = Number(data[templateId].hearts) || 0;
        const u = Number(data[templateId].uses) || 0;

        // Bỏ qua nếu còn dính số liệu mock cũ
        if (OLD_MOCK_VIEWS.has(v) || (v >= 1000 && h >= 500)) {
          return { views: 0, hearts: 0, uses: 0 };
        }
        return { views: v, hearts: h, uses: u };
      }
    }
  } catch {}
  return { views: 0, hearts: 0, uses: 0 };
}

export async function incrementTemplateView(templateId: string): Promise<void> {
  // 1. Cập nhật ngay vào LocalStorage để UI phản hồi tức thì
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    const statsData = raw ? JSON.parse(raw) : {};
    if (!statsData[templateId]) statsData[templateId] = { views: 0, hearts: 0, uses: 0 };
    statsData[templateId].views = (statsData[templateId].views || 0) + 1;
    localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));
    notifyStatsChanged(templateId);
  } catch {}

  // 2. Đồng bộ Supabase
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('templates').select('views_count').eq('id', templateId).maybeSingle();
      let current = data?.views_count || 0;
      if (OLD_MOCK_VIEWS.has(current) || current >= 1000) current = 0;
      await supabase.from('templates').upsert({ id: templateId, views_count: current + 1, updated_at: new Date().toISOString() });
      return;
    } catch {}
  }

  // 3. Backend fallback
  try {
    await fetch(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}/view`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
}

export async function incrementTemplateUse(templateId: string): Promise<void> {
  // 1. Cập nhật ngay vào LocalStorage để UI phản hồi tức thì
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    const statsData = raw ? JSON.parse(raw) : {};
    if (!statsData[templateId]) statsData[templateId] = { views: 0, hearts: 0, uses: 0 };
    statsData[templateId].uses = (statsData[templateId].uses || 0) + 1;
    localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));
    notifyStatsChanged(templateId);
  } catch {}

  // 2. Đồng bộ Supabase
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('templates').select('uses_count').eq('id', templateId).maybeSingle();
      let current = data?.uses_count || 0;
      if (current >= 1000) current = 0;
      await supabase.from('templates').upsert({ id: templateId, uses_count: current + 1, updated_at: new Date().toISOString() });
      return;
    } catch {}
  }

  // 3. Backend fallback
  try {
    await fetch(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}/use`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
}

export function getUserLikedTemplateIds(_userId?: string | null): string[] {
  try {
    const raw = localStorage.getItem(USER_LIKED_TEMPLATES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function isTemplateLikedByUser(templateId: string, _userId?: string | null): boolean {
  const list = getUserLikedTemplateIds();
  return list.includes(templateId);
}

// Toggle Heart: Like / Unlike hoạt động chuẩn 100%, 1 tài khoản = 1 tim
export async function toggleTemplateHeart(
  templateId: string,
  userIdParam?: string
): Promise<{ isLiked: boolean; newHearts: number }> {
  const uid = userIdParam || getCurrentUserId() || 'guest';

  // 1. Supabase Cloud Sync
  if (isSupabaseReady && supabase) {
    try {
      const { data: existing } = await supabase
        .from('template_likes')
        .select('*')
        .eq('user_id', uid)
        .eq('template_id', templateId)
        .maybeSingle();

      let isLiked = false;
      if (existing) {
        // Đã like -> Bỏ like
        await supabase.from('template_likes').delete().eq('user_id', uid).eq('template_id', templateId);
        isLiked = false;
      } else {
        // Chưa like -> Thả like
        await supabase.from('template_likes').insert({ user_id: uid, template_id: templateId });
        isLiked = true;
      }

      // Đếm chính xác số like thực tế từ bảng template_likes
      const { count } = await supabase
        .from('template_likes')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);

      const hearts = count !== null ? count : (isLiked ? 1 : 0);
      await supabase.from('templates').upsert({ id: templateId, hearts_count: hearts, updated_at: new Date().toISOString() });

      // Cập nhật LocalStorage
      const currentLikes = getUserLikedTemplateIds();
      const updatedLikes = isLiked
        ? [...currentLikes.filter((id) => id !== templateId), templateId]
        : currentLikes.filter((id) => id !== templateId);
      localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(updatedLikes));

      const rawStats = localStorage.getItem(TEMPLATE_STATS_KEY);
      const statsData = rawStats ? JSON.parse(rawStats) : {};
      if (!statsData[templateId]) statsData[templateId] = { views: 0, hearts: 0, uses: 0 };
      statsData[templateId].hearts = hearts;
      localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));
      notifyStatsChanged(templateId);

      return { isLiked, newHearts: hearts };
    } catch (err) {
      console.warn('Supabase toggleTemplateHeart error:', err);
    }
  }

  // 2. Oracle 19c local API fallback
  if (!isSupabaseReady) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const currentLikes = getUserLikedTemplateIds();
          const updatedLikes = data.isLiked
            ? [...currentLikes.filter((id) => id !== templateId), templateId]
            : currentLikes.filter((id) => id !== templateId);
          localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(updatedLikes));

          const rawStats = localStorage.getItem(TEMPLATE_STATS_KEY);
          const statsData = rawStats ? JSON.parse(rawStats) : {};
          if (!statsData[templateId]) statsData[templateId] = { views: 0, hearts: 0, uses: 0 };
          statsData[templateId].hearts = data.newHearts;
          localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));
          notifyStatsChanged(templateId);

          return { isLiked: data.isLiked, newHearts: data.newHearts };
        }
      }
    } catch (err) {
      console.warn('Backend toggle template heart error:', err);
    }
  }

  // 3. Fallback LocalStorage an toàn (chạy khi offline hoặc chưa cấu hình DB)
  const currentLikes = getUserLikedTemplateIds();
  const alreadyLiked = currentLikes.includes(templateId);
  const isLiked = !alreadyLiked;
  const updatedLikes = isLiked
    ? [...currentLikes.filter((id) => id !== templateId), templateId]
    : currentLikes.filter((id) => id !== templateId);
  localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(updatedLikes));

  const rawStats = localStorage.getItem(TEMPLATE_STATS_KEY);
  const statsData = rawStats ? JSON.parse(rawStats) : {};
  if (!statsData[templateId]) statsData[templateId] = { views: 0, hearts: 0, uses: 0 };
  const currentHearts = statsData[templateId].hearts || 0;
  const newHearts = Math.max(0, currentHearts + (isLiked ? 1 : -1));
  statsData[templateId].hearts = newHearts;
  localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));
  notifyStatsChanged(templateId);

  return { isLiked, newHearts };
}

export function getLikedTemplates(userId: string | null): CardTemplate[] {
  const likedIds = getUserLikedTemplateIds(userId);
  return TEMPLATES.filter((t) => likedIds.includes(t.id));
}

// ----------------------------------------------------
// 2. CARDS & CARD IMAGES (SUPABASE & ORACLE CLOUD/LOCAL)
// ----------------------------------------------------

// Fetch single card from Supabase or Oracle 19c
export async function fetchCardById(id: string): Promise<CreatedCard | null> {
  // 1. Supabase Cloud fetch
  if (isSupabaseReady && supabase) {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        const card: CreatedCard = {
          id: data.id,
          creatorId: data.user_id,
          templateId: data.template_id,
          title: data.template_id,
          cardData: data.card_data,
          viewsCount: data.views_count || 1,
          heartsCount: data.hearts_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        cacheCardLocally(card);
        return card;
      }
    } catch (err) {
      console.warn('Supabase fetchCardById fallback:', err);
    }
  }

  // 2. Oracle 19c local API fallback (chỉ thử khi chưa cấu hình Supabase Cloud)
  if (!isSupabaseReady) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        if (data.success && data.card) {
          cacheCardLocally(data.card);
          return data.card;
        }
      }
    } catch (err) {
      // Vercel static fallback
    }
  }

  // 3. Fallback to local cache if offline or direct template
  return getCardById(id);
}

// Save or update card into Supabase or Oracle 19c
export async function saveCard(card: CreatedCard): Promise<CreatedCard> {
  // Update local cache first
  cacheCardLocally(card);

  // 1. Save to Supabase Cloud
  if (isSupabaseReady && supabase) {
    try {
      const potentialUid = card.creatorId || getCurrentUserId() || null;
      const row: any = {
        id: card.id,
        user_id: potentialUid,
        template_id: card.templateId,
        sender_name: card.cardData?.senderName || null,
        recipient_name: card.cardData?.recipientName || null,
        wish_message: card.cardData?.mainText || null,
        card_data: card.cardData,
        views_count: card.viewsCount || 1,
        hearts_count: card.heartsCount || 0,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase.from('cards').upsert(row);

      // Nếu gặp lỗi foreign key do user_id không tồn tại trong bảng users trên Supabase -> Thử lại với user_id = null
      if (error && (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('cards_user_id_fkey'))) {
        row.user_id = null;
        const retryResult = await supabase.from('cards').upsert(row);
        error = retryResult.error;
      }

      if (!error) {
        return card;
      }
      console.warn('Supabase upsert card error, attempting backend fallback:', error);
    } catch (err) {
      console.warn('Supabase saveCard fallback:', err);
    }
  }

  // 2. Save to Oracle 19c local API fallback (khi không dùng Supabase hoặc Supabase gặp lỗi)
  try {
    const res = await fetch(`${BACKEND_URL}/api/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(card),
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.success && data.card) {
        cacheCardLocally(data.card);
        return data.card;
      }
    }
  } catch (err) {
    // Vercel static fallback
  }

  return card;
}

// Delete card
export async function deleteCard(id: string): Promise<void> {
  removeCardFromLocalCache(id);

  if (isSupabaseReady && supabase) {
    try {
      await supabase.from('cards').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteCard error:', err);
    }
    return;
  }

  try {
    await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    // Vercel static fallback
  }
}

// Fetch all cards belonging to current user
export async function fetchUserCards(): Promise<CreatedCard[]> {
  const currentUid = getCurrentUserId();

  // 1. Fetch from Supabase Cloud
  if (isSupabaseReady && supabase && currentUid) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', currentUid)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cards: CreatedCard[] = data.map((d: any) => ({
          id: d.id,
          creatorId: d.user_id,
          templateId: d.template_id,
          title: d.template_id,
          cardData: d.card_data,
          viewsCount: d.views_count || 1,
          heartsCount: d.hearts_count || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(cards));
        return cards;
      }
    } catch (err) {
      console.warn('Supabase fetchUserCards fallback:', err);
    }
    return getUserCards(currentUid);
  }

  // 2. Fetch from Oracle 19c local API (chỉ khi không dùng Supabase)
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/me/cards`, {
      headers: getAuthHeaders(),
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.success && Array.isArray(data.cards)) {
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(data.cards));
        return data.cards;
      }
    }
  } catch (err) {
    // Vercel static fallback
  }

  // 3. Fallback to cached cards
  return getAllCards();
}

// Increment view count
export async function incrementCardViews(id: string): Promise<number> {
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('cards').select('views_count').eq('id', id).maybeSingle();
      const current = data?.views_count || 0;
      await supabase.from('cards').update({ views_count: current + 1 }).eq('id', id);
      return current + 1;
    } catch {}
  }
  try {
    await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}/view`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
  return 1;
}

// Increment hearts count
export async function incrementCardHearts(id: string): Promise<number> {
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('cards').select('hearts_count').eq('id', id).maybeSingle();
      const current = data?.hearts_count || 0;
      await supabase.from('cards').update({ hearts_count: current + 1 }).eq('id', id);
      return current + 1;
    } catch {}
  }
  try {
    await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}/heart`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
  return 1;
}

// ----------------------------------------------------
// LOCAL CACHE HELPERS
// ----------------------------------------------------

function cacheCardLocally(card: CreatedCard) {
  try {
    // Lưu riêng thẻ này để truy xuất tức thì mà không cần duyệt mảng
    try {
      localStorage.setItem(`lovecard_card_${card.id}`, JSON.stringify(card));
    } catch {}

    const cards = getAllCards();
    const index = cards.findIndex((c) => c.id === card.id);
    let updated: CreatedCard[];
    if (index >= 0) {
      updated = [...cards];
      updated[index] = card;
    } else {
      updated = [card, ...cards];
    }
    // Giới hạn tối đa 15 thẻ gần nhất trong cache mảng để không vượt ngưỡng quota localStorage
    const trimmed = updated.slice(0, 15);
    try {
      localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(trimmed));
    } catch {
      try {
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(trimmed.slice(0, 5)));
      } catch {
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify([card]));
      }
    }
  } catch {}
}

function removeCardFromLocalCache(id: string) {
  try {
    const cards = getAllCards();
    const updated = cards.filter((c) => c.id !== id);
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getAllCards(): CreatedCard[] {
  try {
    const raw = localStorage.getItem(CARDS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUserCards(userId: string | null): CreatedCard[] {
  const all = getAllCards();
  if (userId) {
    return all.filter((c) => c.creatorId === userId);
  }
  return all.filter((c) => !c.creatorId || c.creatorId === 'guest');
}

export function getCardById(id: string): CreatedCard | null {
  // 1. Kiểm tra cache riêng biệt trước
  try {
    const direct = localStorage.getItem(`lovecard_card_${id}`);
    if (direct) {
      const parsed = JSON.parse(direct);
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  const cards = getAllCards();
  const cleanId = id.replace(/^demo-/, '');
  const found = cards.find((c) => c.id === id || c.id === cleanId || c.id === `demo-${cleanId}`);
  if (found) return found;

  const tmpl = TEMPLATES.find((t) => t.id === cleanId || t.id === id);
  if (tmpl) {
    return {
      id: tmpl.id,
      creatorId: null,
      templateId: tmpl.id,
      title: tmpl.titleVi,
      cardData: {
        ...tmpl.defaultConfig,
        images: [], // Tuyệt đối không dùng ảnh mẫu
      },
      viewsCount: 1,
      heartsCount: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };
  }
  return null;
}

// ----------------------------------------------------
// QR-Safe URL Encoding & Decoding (Never Overflows URL)
// ----------------------------------------------------

interface CompactPayload {
  t: string;       // templateId
  id?: string;     // card shortId for hydration from Oracle
  c: {
    r: string;     // recipientName
    s: string;     // senderName
    m: string;     // mainText
    p?: string;    // passcode
    ph?: string;   // passcodeHint
    a?: string;    // audioUrl
    mp?: string;   // musicPreset
    ast?: number;  // audioStartTime
    aet?: number;  // audioEndTime
    f?: string;    // fontFamily
    tc?: string;   // themeColor
    ct?: 'cyan' | 'purple' | 'rose' | 'gold' | 'midnight'; // crystalTheme
    cc?: 'rose' | 'heart' | 'swans' | 'castle' | 'teddy';  // crystalCenterpiece
    cw?: 'snow' | 'sparkles' | 'petals' | 'hearts' | 'notes'; // crystalWeather
    cbt?: string;  // crystalBaseTitle
    cbs?: string;  // crystalBaseSubtitle
    cq?: string[]; // crystalQuotes
    ccap?: string[]; // cinemaCaptions
  };
}

export function encodeCardData(
  templateId: string,
  config: CardConfig,
  cardId?: string
): string {
  try {
    // Tuyệt đối không nén audio dạng data: (Base64) hoặc blob: (session tạm thời) vào URL slug
    const safeAudioUrl = (config.audioUrl?.startsWith('data:') || config.audioUrl?.startsWith('blob:'))
      ? undefined
      : config.audioUrl;

    const payload: CompactPayload = {
      t: templateId,
      id: cardId,
      c: {
        r: config.recipientName,
        s: config.senderName,
        m: config.mainText,
        p: config.passcode,
        ph: config.passcodeHint,
        a: safeAudioUrl,
        mp: config.musicPreset,
        ast: config.audioStartTime,
        aet: config.audioEndTime,
        f: config.fontFamily,
        tc: config.themeColor,
        ct: config.crystalTheme,
        cc: config.crystalCenterpiece,
        cw: config.crystalWeather,
        cbt: config.crystalBaseTitle,
        cbs: config.crystalBaseSubtitle,
        cq: config.crystalQuotes,
        ccap: config.cinemaCaptions,
      },
    };

    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = encodeURIComponent(jsonStr).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    // Mã hóa Base64 URL-safe (thay + bằng -, / bằng _, bỏ padding =)
    const rawBase64 = btoa(utf8Bytes);
    return rawBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Error encoding card data:', err);
    return '';
  }
}

export function decodeCardData(
  encodedOrId: string,
  fallbackTemplate: CardTemplate
): { templateId: string; config: CardConfig; cardId?: string } {
  try {
    // Check if direct shortId like lc_...
    if (encodedOrId.startsWith('lc_')) {
      const stored = getCardById(encodedOrId);
      if (stored) {
        return {
          templateId: stored.templateId,
          config: {
            ...stored.cardData,
            images: stored.cardData?.images || [],
          },
          cardId: stored.id,
        };
      }
    }

    let cleanEncoded = encodedOrId.replace(/^c_/, '');
    // Chuyển đổi ngược Base64 URL-safe về Base64 chuẩn
    cleanEncoded = cleanEncoded.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanEncoded.length % 4 !== 0) {
      cleanEncoded += '=';
    }

    const binaryStr = atob(cleanEncoded);
    const jsonStr = decodeURIComponent(
      binaryStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const data: CompactPayload = JSON.parse(jsonStr);

    const isUserPreset = data.c?.mp?.startsWith('user-audio-');
    const defaultAudio = isUserPreset ? undefined : fallbackTemplate.defaultConfig.audioUrl;

    return {
      templateId: data.t || fallbackTemplate.id,
      cardId: data.id,
      config: {
        recipientName: data.c?.r || fallbackTemplate.defaultConfig.recipientName,
        senderName: data.c?.s || fallbackTemplate.defaultConfig.senderName,
        mainText: data.c?.m || fallbackTemplate.defaultConfig.mainText,
        passcode: data.c?.p || fallbackTemplate.defaultConfig.passcode,
        passcodeHint: data.c?.ph || fallbackTemplate.defaultConfig.passcodeHint,
        audioUrl: data.c?.a || defaultAudio,
        musicPreset: data.c?.mp || fallbackTemplate.defaultConfig.musicPreset,
        audioStartTime: data.c?.ast ?? fallbackTemplate.defaultConfig.audioStartTime,
        audioEndTime: data.c?.aet ?? fallbackTemplate.defaultConfig.audioEndTime,
        fontFamily: data.c?.f || fallbackTemplate.defaultConfig.fontFamily,
        themeColor: data.c?.tc || fallbackTemplate.defaultConfig.themeColor,
        crystalTheme: data.c?.ct || fallbackTemplate.defaultConfig.crystalTheme,
        crystalCenterpiece: data.c?.cc || fallbackTemplate.defaultConfig.crystalCenterpiece,
        crystalWeather: data.c?.cw || fallbackTemplate.defaultConfig.crystalWeather,
        crystalBaseTitle: data.c?.cbt || fallbackTemplate.defaultConfig.crystalBaseTitle,
        crystalBaseSubtitle: data.c?.cbs || fallbackTemplate.defaultConfig.crystalBaseSubtitle,
        crystalQuotes: data.c?.cq || fallbackTemplate.defaultConfig.crystalQuotes,
        cinemaCaptions: data.c?.ccap || fallbackTemplate.defaultConfig.cinemaCaptions,
        images: [], // Default to empty array - only user images are loaded
      },
    };
  } catch (err) {
    console.warn('Could not decode card data, using fallback:', err);
    return {
      templateId: fallbackTemplate.id,
      config: {
        ...fallbackTemplate.defaultConfig,
        images: [],
      },
    };
  }
}
