import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Bắt buộc cấu hình oracledb theo yêu cầu
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.ORACLE_USER || 'DA',
  password: process.env.ORACLE_PASSWORD || 'Matkhaua123@',
  connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/ORCL',
};

let pool = null;

export async function getPool() {
  if (!pool) {
    try {
      console.log(`🔌 Đang kết nối Oracle 19c [${dbConfig.user}@${dbConfig.connectString}]...`);
      pool = await oracledb.createPool({
        ...dbConfig,
        poolMin: 1,
        poolMax: 10,
        poolIncrement: 1,
        poolTimeout: 60,
      });
      console.log('✅ Kết nối Oracle 19c thành công!');
    } catch (err) {
      console.error('❌ Lỗi kết nối Oracle 19c:', err.message);
      console.error('💡 Gợi ý: Hãy kiểm tra Oracle Listener, Service Name (ORCL / ORCLPDB / XE) và tài khoản DA trong file .env');
      throw err;
    }
  }
  return pool;
}

export async function query(sql, binds = {}, options = {}) {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      ...options,
    });
    return result;
  } catch (err) {
    console.error('❌ Database query error:', err.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.warn('Warning closing connection:', err.message);
      }
    }
  }
}
