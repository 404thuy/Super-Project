-- =========================================================================
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU CHUẨN ORACLE 19C CHO DỰ ÁN THIỆP 20/10
-- SCHEMA: DA | PASSWORD: Matkhaua123@ | CONNECT: localhost:1521/ORCL
-- =========================================================================

-- Kích hoạt cờ hỗ trợ Oracle Multitenant / Pluggable Database nếu chạy bằng SYS
BEGIN
    EXECUTE IMMEDIATE 'ALTER SESSION SET "_ORACLE_SCRIPT" = TRUE';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- =========================================================================
-- PHẦN 1: TẠO TABLESPACE VÀ USER QUẢN TRỊ DA (Matkhaua123@)
-- =========================================================================

DECLARE
    v_ts VARCHAR2(30) := 'USERS';
    v_count NUMBER;
BEGIN
    -- 1. Kiểm tra / Tạo Tablespace ts_DA (nếu lỗi đường dẫn sẽ tự fallback về USERS)
    SELECT COUNT(*) INTO v_count FROM dba_tablespaces WHERE tablespace_name = 'TS_DA';
    IF v_count = 0 THEN
        BEGIN
            EXECUTE IMMEDIATE 'CREATE TABLESPACE ts_DA DATAFILE ''ts_DA.dbf'' SIZE 100M AUTOEXTEND ON NEXT 50M MAXSIZE UNLIMITED';
            v_ts := 'TS_DA';
        EXCEPTION
            WHEN OTHERS THEN
                v_ts := 'USERS';
        END;
    ELSE
        v_ts := 'TS_DA';
    END IF;

    -- 2. Kiểm tra / Tạo User DA
    SELECT COUNT(*) INTO v_count FROM all_users WHERE username = 'DA';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE USER DA IDENTIFIED BY "Matkhaua123@" DEFAULT TABLESPACE ' || v_ts || ' TEMPORARY TABLESPACE temp QUOTA UNLIMITED ON ' || v_ts;
    ELSE
        EXECUTE IMMEDIATE 'ALTER USER DA IDENTIFIED BY "Matkhaua123@" ACCOUNT UNLOCK';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- Cấp đầy đủ quyền thao tác cho User DA
BEGIN
    EXECUTE IMMEDIATE 'GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO DA';
    EXECUTE IMMEDIATE 'GRANT CREATE SESSION, ALTER SESSION, CREATE TABLE, CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER, CREATE SEQUENCE, CREATE SYNONYM, CREATE TYPE, CREATE MATERIALIZED VIEW TO DA';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- Chuyển phiên làm việc sang Schema DA
ALTER SESSION SET CURRENT_SCHEMA = DA;

-- =========================================================================
-- PHẦN 2: TỰ ĐỘNG XÓA BẢNG CŨ AN TOÀN (CHẠY LẠI KHÔNG BAO GIỜ BỊ LỖI ORA-00955)
-- =========================================================================
BEGIN
    FOR t IN (
        SELECT table_name 
        FROM all_tables 
        WHERE owner = 'DA' 
          AND table_name IN ('CARD_IMAGES', 'CARDS', 'TEMPLATE_LIKES', 'TEMPLATES', 'USER_SESSIONS', 'USERS')
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE DA.' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- =========================================================================
-- PHẦN 3: TẠO CÁC BẢNG DỮ LIỆU CHUẨN ORACLE 19C
-- =========================================================================

-- 1. Bảng USERS: Đăng ký & Đăng nhập thủ công với Tên tài khoản (viết liền không dấu), Tên hiển thị, Mật khẩu
CREATE TABLE DA.USERS (
    USER_ID         VARCHAR2(64) PRIMARY KEY,
    USERNAME        VARCHAR2(60) NOT NULL CONSTRAINT UQ_USERS_USERNAME UNIQUE,
    DISPLAY_NAME    NVARCHAR2(150) NOT NULL,
    PASSWORD_HASH   VARCHAR2(255) NOT NULL,
    EMAIL           VARCHAR2(255),
    AVATAR_URL      CLOB,
    CREATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng USER_SESSIONS: Duy trì phiên đăng nhập 30 ngày
CREATE TABLE DA.USER_SESSIONS (
    SESSION_TOKEN   VARCHAR2(128) PRIMARY KEY,
    USER_ID         VARCHAR2(64) NOT NULL,
    EXPIRES_AT      TIMESTAMP NOT NULL,
    CREATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_SESSIONS_USER FOREIGN KEY (USER_ID) 
        REFERENCES DA.USERS(USER_ID) ON DELETE CASCADE
);

-- 3. Bảng TEMPLATES: Quản lý 9 mẫu thiệp 3D và thống kê thời gian thực
CREATE TABLE DA.TEMPLATES (
    TEMPLATE_ID     VARCHAR2(50) PRIMARY KEY,
    TEMPLATE_NAME   NVARCHAR2(150) NOT NULL,
    VIEWS_COUNT     NUMBER(10) DEFAULT 0 NOT NULL,
    HEARTS_COUNT    NUMBER(10) DEFAULT 0 NOT NULL,
    USES_COUNT      NUMBER(10) DEFAULT 0 NOT NULL
);

-- 4. Bảng TEMPLATE_LIKES: Lưu trạng thái thả tim theo User (1 User = 1 Like / Mẫu)
CREATE TABLE DA.TEMPLATE_LIKES (
    USER_ID         VARCHAR2(64) NOT NULL,
    TEMPLATE_ID     VARCHAR2(50) NOT NULL,
    LIKED_AT        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_TEMPLATE_LIKES PRIMARY KEY (USER_ID, TEMPLATE_ID),
    CONSTRAINT FK_LIKES_USER FOREIGN KEY (USER_ID) 
        REFERENCES DA.USERS(USER_ID) ON DELETE CASCADE,
    CONSTRAINT FK_LIKES_TEMPLATE FOREIGN KEY (TEMPLATE_ID) 
        REFERENCES DA.TEMPLATES(TEMPLATE_ID) ON DELETE CASCADE
);

-- 5. Bảng CARDS: Lưu toàn bộ thiệp do người dùng tạo ra
CREATE TABLE DA.CARDS (
    CARD_ID             VARCHAR2(64) PRIMARY KEY,
    USER_ID             VARCHAR2(64),
    TEMPLATE_ID         VARCHAR2(50) NOT NULL,
    SENDER_NAME         NVARCHAR2(150) NOT NULL,
    RECIPIENT_NAME      NVARCHAR2(150) NOT NULL,
    WISH_MESSAGE        NCLOB NOT NULL,
    FONT_FAMILY         VARCHAR2(100) DEFAULT 'Dancing Script',
    THEME_COLOR         VARCHAR2(30) DEFAULT '#ec4899',
    PASSCODE            VARCHAR2(20),
    PASSCODE_HINT       NVARCHAR2(255),
    MUSIC_PRESET        VARCHAR2(100),
    CUSTOM_MUSIC_URL    VARCHAR2(1000),
    EXTRA_CONFIG        CLOB,
    VIEWS_COUNT         NUMBER(10) DEFAULT 0 NOT NULL,
    HEARTS_COUNT        NUMBER(10) DEFAULT 0 NOT NULL,
    CREATED_AT          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CARDS_USER FOREIGN KEY (USER_ID) 
        REFERENCES DA.USERS(USER_ID) ON DELETE SET NULL,
    CONSTRAINT FK_CARDS_TEMPLATE FOREIGN KEY (TEMPLATE_ID) 
        REFERENCES DA.TEMPLATES(TEMPLATE_ID)
);

-- 6. Bảng CARD_IMAGES: Lưu hình ảnh Base64 kẹp trong thiệp
CREATE TABLE DA.CARD_IMAGES (
    IMAGE_ID        NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
    CARD_ID         VARCHAR2(64) NOT NULL,
    IMAGE_DATA      CLOB NOT NULL,
    DISPLAY_ORDER   NUMBER(5) DEFAULT 1 NOT NULL,
    CREATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_IMAGES_CARD FOREIGN KEY (CARD_ID) 
        REFERENCES DA.CARDS(CARD_ID) ON DELETE CASCADE
);

-- =========================================================================
-- PHẦN 4: INDEX TỐI ƯU TRUY VẤN
-- =========================================================================

CREATE INDEX DA.IDX_CARDS_USER_ID ON DA.CARDS(USER_ID);
CREATE INDEX DA.IDX_CARD_IMAGES_CARD_ID ON DA.CARD_IMAGES(CARD_ID);
CREATE INDEX DA.IDX_SESSIONS_USER_ID ON DA.USER_SESSIONS(USER_ID);

-- =========================================================================
-- PHẦN 5: NẠP SẴN 9 MẪU THIỆP 3D & COMMIT DỮ LIỆU
-- =========================================================================

INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('passcode-envelope', N'Passcode Envelope', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('galaxy-memories', N'Galaxy Memories', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('blossom-rain', N'Blossom Rain', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('vinyl-player', N'Vinyl Player', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('scratch-card', N'Scratch Card', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('lantern-festival', N'Lantern Festival', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('crystal-carousel', N'Crystal Carousel', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('cinema-filmstrip', N'Cinema Filmstrip', 0, 0, 0);
INSERT INTO DA.TEMPLATES (TEMPLATE_ID, TEMPLATE_NAME, VIEWS_COUNT, HEARTS_COUNT, USES_COUNT) VALUES ('interactive-bouquet', N'Interactive Bouquet', 0, 0, 0);

COMMIT;

-- Thông báo hoàn thành
BEGIN
    DBMS_OUTPUT.PUT_LINE('===========================================================');
    DBMS_OUTPUT.PUT_LINE('>>> KHOI TAO DATABASE DA (ORACLE 19C) HOAN TAT 100%! <<<');
    DBMS_OUTPUT.PUT_LINE('===========================================================');
END;
/
