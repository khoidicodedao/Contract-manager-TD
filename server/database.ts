import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@shared/schema";

export const sqlite = new Database("./database.sqlite");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
export const db = drizzle(sqlite, { schema });
const DB_INITIALIZED_KEY = "DB_INITIALIZED";

function getSystemSetting(key: string): { key: string; value: string | null } | undefined {
  return sqlite
    .prepare("SELECT key, value FROM system_settings WHERE key = ?")
    .get(key) as { key: string; value: string | null } | undefined;
}

function upsertSystemSetting(key: string, value: string) {
  sqlite
    .prepare(`
      INSERT INTO system_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, value);
}

// Create tables manually since we don't have migrations
function createTables() {
  console.log("Creating database tables...");

  // Create all tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS loai_hop_dong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS can_bo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      chuc_vu TEXT,
      so_dien_thoai TEXT,
      email TEXT,
      dia_chi TEXT,
      mo_ta TEXT,
      anh TEXT,
      trang_thai TEXT
    );
    
    CREATE TABLE IF NOT EXISTS nha_cung_cap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      dia_chi TEXT,
      so_dien_thoai TEXT,
      email TEXT,
      nguoi_lien_he TEXT,
      chuc_vu_nguoi_lien_he TEXT,
      mo_ta TEXT,
      ma_quoc_gia TEXT,
      anh TEXT,
      latitude REAL,
      longitude REAL
    );
    
    CREATE TABLE IF NOT EXISTS chu_dau_tu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      dia_chi TEXT,
      so_dien_thoai TEXT,
      email TEXT,
      nguoi_lien_he TEXT,
      chuc_vu_nguoi_lien_he TEXT,
      mo_ta TEXT,
      anh TEXT
    );
    
    CREATE TABLE IF NOT EXISTS loai_ngan_sach (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS loai_hinh_thuc_thanh_toan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS loai_thanh_toan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS loai_tien (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS loai_trang_bi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS trang_thai_hop_dong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trang_thai INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS hop_dong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      mo_ta TEXT,
      so_hd_noi TEXT,
      so_hd_ngoai TEXT,
      ngay TEXT,
      gia_tri_hop_dong REAL,
      loai_hop_dong_id INTEGER,
      chu_dau_tu_id INTEGER,
      nha_cung_cap_id INTEGER,
      loai_ngan_sach_id INTEGER,
      can_bo_id INTEGER,
      trang_thai_hop_dong_id INTEGER,
      loai_tien_id INTEGER,
      ty_gia REAL,
      phi_uy_thac REAL,
      thue_nha_thau REAL,
      thu_truong_phu_trach TEXT,
      so_lan_giao_hang INTEGER,
      hinh_thuc_hop_dong TEXT,
      hinh_thuc_giao_hang TEXT,
      tong_han_muc_ngan_sach REAL,
      loai_tien_tong_han_muc TEXT,
      chi_phi_doan_ra_doan_vao REAL,
      chi_phi_thuc_hien_trong_nuoc REAL,
      so_bien_ban_thanh_ly TEXT,
      ngay_bien_ban_thanh_ly TEXT,
      so_bien_ban_ban_giao_dong_bo TEXT,
      ngay_bien_ban_ban_giao_dong_bo TEXT,
      phong_ban_id INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS trang_bi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      ten TEXT NOT NULL,
      loai_trang_bi_id INTEGER,
      don_gia REAL,
      so_luong INTEGER,
      loai_tien_id INTEGER,
      nha_cung_cap_id INTEGER,
      mo_ta TEXT,
      trang_thai TEXT,
      ngay_mua TEXT,
      bao_hanh TEXT
    );

    CREATE TABLE IF NOT EXISTS cap_tien (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay_cap TEXT NOT NULL,              
  hop_dong_id INTEGER NOT NULL,       
  so_tien REAL NOT NULL,               
  loai_tien_id INTEGER NOT NULL,      
  ty_gia REAL,                         
  ghi_chu TEXT,
  ben_cap TEXT,
  so_tien_quy_doi REAL,
  loai_tien_quy_doi TEXT,
  FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id),
  FOREIGN KEY (loai_tien_id) REFERENCES loai_tien(id)
);

    
    CREATE TABLE IF NOT EXISTS thanh_toan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      loai_tien_id INTEGER,
      loai_hinh_thuc_thanh_toan_id INTEGER,
      loai_thanh_toan_id INTEGER,
      so_tien REAL,
      ngay_den_han TEXT,
      ngay_thanh_toan TEXT,
      ghi_chu TEXT,
      da_thanh_toan INTEGER DEFAULT 0,
      noi_dung TEXT,
      han_hop_dong TEXT,
      han_thuc_hien TEXT
    );
    
    CREATE TABLE IF NOT EXISTS buoc_thuc_hien (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      ten TEXT NOT NULL,
      mo_ta TEXT,
      ngay_bat_dau TEXT,
      ngay_ket_thuc TEXT,
      ngay_bat_dau_thuc_te TEXT,
      ngay_ket_thuc_thuc_te TEXT,
      trang_thai TEXT,
      thu_tu INTEGER,
      can_bo_phu_trach_id INTEGER,
      chi_phi TEXT,
      ty_gia REAL,
      dia_diem TEXT,
      ghi_chu TEXT,
      loai_tien_id INTEGER

    );
    
    CREATE TABLE IF NOT EXISTS file_hop_dong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      ten_file TEXT NOT NULL,
      loai_file TEXT,
      duong_dan TEXT,
      noi_dung_file TEXT,
      kich_thuoc INTEGER,
      ngay_tai_len TEXT,
      nguoi_tai_len INTEGER,
      ghi_chu TEXT,
      so_van_ban TEXT,
      ngay_thuc_hien TEXT
    );

    CREATE TABLE IF NOT EXISTS dia_diem_thong_quan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      chi_cuc TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tiep_nhan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      ten_hang TEXT NOT NULL,
      so_to_khai TEXT,
      so_van_don TEXT,
      so_phieu_dong_goi TEXT,
      so_hoa_don TEXT,
      so_bao_hiem TEXT,
      dia_diem_thong_quan_id INTEGER,
      dia_diem_thong_quan_tu_do TEXT,
      dieu_kien_giao_hang_id INTEGER,
      ngay_thuc_hien TEXT NOT NULL,
      trong_luong REAL,
      so_kien REAL,
      gia_tri_hoa_don REAL,
      hinh_thuc TEXT,
      so_giay_phep TEXT,
      thoi_han_giay_phep TEXT,
      so_hai_quan_dac_biet TEXT,
      so_thong_bao_mien_thue TEXT,
      so_bien_ban_ban_giao TEXT,
      ngay_ban_giao TEXT,
      ma_hs_code TEXT,
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id),
      FOREIGN KEY (dia_diem_thong_quan_id) REFERENCES dia_diem_thong_quan(id),
      FOREIGN KEY (dieu_kien_giao_hang_id) REFERENCES dieu_kien_giao_hang(id)
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'assistant',
      phong_ban_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS phong_ban (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      mo_ta TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      timestamp TEXT NOT NULL,
      details TEXT,
      hop_dong_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS dieu_kien_giao_hang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loai_hoa_don (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      ghi_chu TEXT
    );
    
    CREATE TABLE IF NOT EXISTS hoa_don (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loai_hoa_don_id INTEGER NOT NULL,
      ten_hoa_don TEXT NOT NULL,
      ngay_hoa_don TEXT,
      tri_gia REAL,
      loai_tien_id INTEGER,
      ty_gia REAL,
      ghi_chu TEXT,
      hop_dong_id INTEGER,
      FOREIGN KEY (loai_hoa_don_id) REFERENCES loai_hoa_don(id),
      FOREIGN KEY (loai_tien_id) REFERENCES loai_tien(id),
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id)
    );

    CREATE TABLE IF NOT EXISTS loai_bao_lanh (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten_loai TEXT NOT NULL,
      ghi_chu TEXT
    );

    CREATE TABLE IF NOT EXISTS bao_lanh (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      so_bao_lanh TEXT,
      loai_bao_lanh_id INTEGER,
      tri_gia REAL,
      ty_gia REAL,
      ty_le REAL,
      nguoi_thu_huong TEXT,
      ngay_cap TEXT,
      thoi_han TEXT,
      ghi_chu TEXT,
      file_scan TEXT,
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id),
      FOREIGN KEY (loai_bao_lanh_id) REFERENCES loai_bao_lanh(id)
    );

    CREATE TABLE IF NOT EXISTS thu_tin_dung (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      so_lc TEXT,
      ngay_mo TEXT,
      tri_gia REAL,
      ty_gia REAL,
      thoi_han TEXT,
      nguoi_thu_huong TEXT,
      ghi_chu TEXT,
      file_scan TEXT,
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id)
    );

    CREATE TABLE IF NOT EXISTS loai_van_ban_phap_ly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER,
      ten_loai_phap_ly TEXT NOT NULL,
      ghi_chu TEXT
    );

    CREATE TABLE IF NOT EXISTS van_ban_phap_ly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loai_van_ban_id INTEGER NOT NULL,
      hop_dong_id INTEGER NOT NULL,
      ten_van_ban TEXT NOT NULL,
      ngay_van_ban TEXT,
      ghi_chu TEXT
    );

    CREATE TABLE IF NOT EXISTS loai_doan_ra_vao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten_loai TEXT NOT NULL,
      phan_loai TEXT NOT NULL,
      ghi_chu TEXT
    );

    CREATE TABLE IF NOT EXISTS doan_ra_vao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loai_doan_id INTEGER NOT NULL,
      ten_doan TEXT NOT NULL,
      hop_dong_id INTEGER NOT NULL,
      chi_phi REAL,
      loai_tien_id INTEGER,
      ty_gia REAL,
      ghi_chu TEXT,
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id),
      FOREIGN KEY (loai_tien_id) REFERENCES loai_tien(id)
    );

    CREATE TABLE IF NOT EXISTS loai_chi_phi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_loai TEXT,
      ten_loai TEXT NOT NULL,
      ghi_chu TEXT
    );

    CREATE TABLE IF NOT EXISTS chi_phi_thuc_te (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      loai_chi_phi_id INTEGER NOT NULL,
      ngay_thuc_hien TEXT,
      tri_gia REAL,
      ghi_chu TEXT,
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id),
      FOREIGN KEY (loai_chi_phi_id) REFERENCES loai_chi_phi(id)
    );

    CREATE TABLE IF NOT EXISTS chi_phi_theo_hop_dong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hop_dong_id INTEGER NOT NULL,
      loai_chi_phi_id INTEGER NOT NULL,
      ngay_thuc_hien TEXT,
      tri_gia REAL,
      ghi_chu TEXT,
      FOREIGN KEY (hop_dong_id) REFERENCES hop_dong(id),
      FOREIGN KEY (loai_chi_phi_id) REFERENCES loai_chi_phi(id)
    );
  `);
}

// Helper to add missing columns to hop_dong table
function addMissingColumns() {
  const columnsToAdd = [
    { name: "thu_truong_phuTrach", type: "TEXT" },
    { name: "so_lan_giao_hang", type: "INTEGER" },
    { name: "hinh_thuc_hop_dong", type: "TEXT" },
    { name: "hinh_thuc_giao_hang", type: "TEXT" },
    { name: "tong_han_muc_ngan_sach", type: "REAL" },
    { name: "loai_tien_tong_han_muc", type: "TEXT" },
    { name: "chi_phi_doan_ra_doan_vao", type: "REAL" },
    { name: "chi_phi_thuc_hien_trong_nuoc", type: "REAL" },
    { name: "so_bien_ban_thanh_ly", type: "TEXT" },
    { name: "ngay_bien_ban_thanh_ly", type: "TEXT" },
    { name: "so_bien_ban_ban_giao_dong_bo", type: "TEXT" },
    { name: "ngay_bien_ban_ban_giao_dong_bo", type: "TEXT" }
  ];

  const tiepNhanColumns = [
    { name: "hinh_thuc", type: "TEXT" },
    { name: "so_giay_phep", type: "TEXT" },
    { name: "thoi_han_giay_phep", type: "TEXT" },
    { name: "so_hai_quan_dac_biet", type: "TEXT" },
    { name: "so_thong_bao_mien_thue", type: "TEXT" },
    { name: "so_bien_ban_ban_giao", type: "TEXT" },
    { name: "ngay_ban_giao", type: "TEXT" },
    { name: "ma_hs_code", type: "TEXT" },
  ];

  columnsToAdd.forEach((col) => {
    try {
      sqlite.exec(`ALTER TABLE hop_dong ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to hop_dong table`);
    } catch (e) {
      // Column might already exist
    }
  });

  tiepNhanColumns.forEach((col) => {
    try {
      sqlite.exec(`ALTER TABLE tiep_nhan ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to tiep_nhan table`);
    } catch (e) {
      // Column might already exist
    }
  });

  const capTienColumns = [
    { name: "ben_cap", type: "TEXT" },
    { name: "so_tien_quy_doi", type: "REAL" },
    { name: "loai_tien_quy_doi", type: "TEXT" },
  ];

  capTienColumns.forEach((col) => {
    try {
      sqlite.exec(`ALTER TABLE cap_tien ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to cap_tien table`);
    } catch (e) {
      // Column might already exist
    }
  });

  const canBoColumns = [
    { name: "trang_thai", type: "TEXT" },
  ];

  canBoColumns.forEach((col) => {
    try {
      sqlite.exec(`ALTER TABLE can_bo ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to can_bo table`);
    } catch (e) {
      // Column might already exist
    }
  });

  try {
    sqlite.exec(`ALTER TABLE bao_lanh ADD COLUMN file_scan TEXT`);
    console.log(`Added column file_scan to bao_lanh table`);
  } catch (e) { }

  try {
    sqlite.exec(`ALTER TABLE thu_tin_dung ADD COLUMN file_scan TEXT`);
    console.log(`Added column file_scan to thu_tin_dung table`);
  } catch (e) { }

  try {
    sqlite.exec(`ALTER TABLE buoc_thuc_hien ADD COLUMN canh_bao INTEGER`);
    console.log(`Added column canh_bao to buoc_thuc_hien table`);
  } catch (e) { }

  try {
    sqlite.exec(`ALTER TABLE buoc_thuc_hien ADD COLUMN thu_tu INTEGER`);
    console.log(`Added column thu_tu to buoc_thuc_hien table`);
  } catch (e) { }

  try {
    sqlite.exec(`ALTER TABLE buoc_thuc_hien ADD COLUMN can_bo_phu_trach_id INTEGER`);
    console.log(`Added column can_bo_phu_trach_id to buoc_thuc_hien table`);
  } catch (e) { }

  // RBAC Columns
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'assistant'`);
    console.log(`Added column role to users table`);
  } catch (e) { }

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN phong_ban_id INTEGER`);
    console.log(`Added column phong_ban_id to users table`);
  } catch (e) { }

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN can_bo_id INTEGER`);
    console.log(`Added column can_bo_id to users table`);
  } catch (e) {
    // Column might already exist
  }
  
  try {
    sqlite.exec(`ALTER TABLE hop_dong ADD COLUMN phong_ban_id INTEGER`);
    console.log(`Added column phong_ban_id to hop_dong table`);
  } catch (e) { }
}

// Initialize database with sample data
export async function initializeDatabase() {
  console.log("Initializing SQLite database...");

  // Create tables first
  createTables();

  // Seed default system settings
  const defaultSettings = [
    { key: "SYSTEM_NAME", value: "Quáº£n lÃ½ dá»± Ã¡n" },
    { key: "DEVELOPER_NAME", value: "Tran Ngoc Tuan" },
    { key: "USER_NAME", value: "NgÃ´ VÄƒn Khang" },
    { key: "USER_ROLE", value: "Quáº£n lÃ½ dá»± Ã¡n / Vaxuco" },
    { key: "USER_PHOTO", value: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100" },
    { key: "DEVELOPER_PHOTO", value: "/placeholder-logo.png" },
  ];

  for (const s of defaultSettings) {
    try {
      sqlite.prepare("INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)").run(s.key, s.value);
    } catch (e) {
      console.error(`Error seeding setting ${s.key}:`, e);
    }
  }

  // Migrate schema for existing tables
  addMissingColumns();

  let transactionOpen = false;

  try {
    sqlite.exec("BEGIN IMMEDIATE");
    transactionOpen = true;

    const initializedMarker = getSystemSetting(DB_INITIALIZED_KEY);
    if (initializedMarker?.value) {
      console.log("Database already initialized, skipping seed");
      sqlite.exec("COMMIT");
      transactionOpen = false;
      return;
    }

    const existingContract = sqlite
      .prepare("SELECT id FROM hop_dong LIMIT 1")
      .get() as { id: number } | undefined;

    if (existingContract) {
      console.log("Database already has data, marking initialization as completed");
      upsertSystemSetting(DB_INITIALIZED_KEY, new Date().toISOString());
      sqlite.exec("COMMIT");
      transactionOpen = false;
      return;
    }

    console.log("Seeding database with initial data...");

    await db
      .insert(schema.loaiHopDong)
      .values([
        { ten: "Nháº­p kháº©u" },
        { ten: "Xuáº¥t kháº©u" },
        { ten: "Táº¡m xuáº¥t â€“ TÃ¡i nháº­p" },
        { ten: "Táº¡m nháº­p â€“ TÃ¡i xuáº¥t" },
      ]);

    await db
      .insert(schema.loaiNganSach)
      .values([
        { ten: "NgÃ¢n sÃ¡ch thÆ°á»ng xuyÃªn" },
        { ten: "NgÃ¢n sÃ¡ch dÃ´i dÆ°" },
        { ten: "NgÃ¢n sÃ¡ch 432" },
        { ten: "NgÃ¢n sÃ¡ch Ä‘áº·c biá»‡t" },
        { ten: "NgÃ¢n sÃ¡ch Ä‘áº·c thÃ¹" },
      ]);

    await db
      .insert(schema.loaiTien)
      .values([{ ten: "USD" }, { ten: "EUR" }, { ten: "VNÄ" }]);

    await db
      .insert(schema.loaiHinhThucThanhToan)
      .values([
        { ten: "Äiá»‡n chuyá»ƒn tiá»n L/C" },
        { ten: "Tiá»n máº·t" },
        { ten: "Chuyá»ƒn khoáº£n" },
      ]);

    await db
      .insert(schema.loaiThanhToan)
      .values([
        { ten: "GiÃ¡ trá»‹ hÃ ng hoÃ¡" },
        { ten: "Thuáº¿ nhÃ  tháº§u" },
        { ten: "Thuáº¿ VAT" },
        { ten: "PhÃ­ nháº­n hÃ ng" },
        { ten: "PhÃ­ giao hÃ ng" },
      ]);

    await db
      .insert(schema.loaiTrangBi)
      .values([
        { ten: "Trang bá»‹ CÃ´ng nghá»‡ thÃ´ng tin" },
        { ten: "Trang bá»‹ Ä‘iá»‡n tá»­" },
        { ten: "Trang bá»‹ HoÃ¡ há»c" },
        { ten: "Lá»¥c quÃ¢n" },
        { ten: "ChÃ­nh trá»‹" },
        { ten: "KhÃ´ng quÃ¢n" },
        { ten: "PhÃ²ng khÃ´ng" },
        { ten: "Háº£i quÃ¢n" },
        { ten: "TÃ¬nh bÃ¡o" },
        { ten: "BiÃªn phÃ²ng" },
        { ten: "QuÃ¢n y" },
        { ten: "Doanh tráº¡i" },
        { ten: "Váº­n táº£i" },
        { ten: "XÄƒng dáº§u" },
        { ten: "QuÃ¢n nhu" },
        { ten: "QuÃ¢n khÃ­" },
        { ten: "TuyÃªn huáº¥n" },
        { ten: "Báº£o vá»‡ an ninh" },
        { ten: "GÃ¬n giá»¯ hoÃ  bÃ¬nh" },
        { ten: "TÃ i chÃ­nh" },
        { ten: "Äá»‘i ngoáº¡i" },
        { ten: "Cáº£nh sÃ¡t biá»ƒn" },
        { ten: "CÃ´ng binh" },
        { ten: "ThÃ´ng tin liÃªn láº¡c" },
        { ten: "TÃ¡c chiáº¿n Ä‘iá»‡n tá»­" },
        { ten: "Äá»‹a hÃ¬nh quÃ¢n sá»±" },
        { ten: "PhÃ¡o binh" },
        { ten: "TÄƒng thiáº¿t giÃ¡p" },
        { ten: "PhÃ²ng hoÃ¡" },
      ]);

    await db.insert(schema.trangThaiHopDong).values([
      { trangThai: 1 },
      { trangThai: 2 },
      { trangThai: 3 },
    ]);

    await db.insert(schema.loaiHoaDon).values([
      { ten: "HÃ³a Ä‘Æ¡n giÃ¡ trá»‹ gia tÄƒng (GTGT)" },
      { ten: "HÃ³a Ä‘Æ¡n thÆ°Æ¡ng máº¡i (Commercial Invoice)" },
      { ten: "HÃ³a Ä‘Æ¡n xuáº¥t kháº©u" },
    ]);

    await db.insert(schema.loaiBaoLanh).values([
      { tenLoai: "Báº£o lÃ£nh thá»±c hiá»‡n há»£p Ä‘á»“ng" },
      { tenLoai: "Báº£o lÃ£nh táº¡m á»©ng" },
      { tenLoai: "Báº£o lÃ£nh báº£o hÃ nh" },
      { tenLoai: "Báº£o lÃ£nh dá»± tháº§u" },
    ]);

    await db.insert(schema.canBo).values([
      {
        ten: "Quáº£n trá»‹ viÃªn",
        chucVu: "TrÆ°á»Ÿng phÃ²ng",
        soDienThoai: "0123456789",
        email: "ngovankang@customs.gov.vn",
        diaChi: "HÃ  Ná»™i",
        moTa: "TrÆ°á»Ÿng phÃ²ng vá»›i 15 nÄƒm kinh nghiá»‡m",
      },
      {
        ten: "Nguyá»…n VÄƒn SÃ¡u",
        chucVu: "PhÃ³ trÆ°á»Ÿng phÃ²ng",
        soDienThoai: "0987654321",
        email: "nguyenvansau@customs.gov.vn",
        diaChi: "HÃ  Ná»™i",
        moTa: "PhÃ³ trÆ°á»Ÿng phÃ²ng phá»¥ trÃ¡ch nghiá»‡p vá»¥",
      },
      {
        ten: "HoÃ ng VÄƒn CÃ´ng",
        chucVu: "Trá»£ lÃ½",
        soDienThoai: "0112233445",
        email: "hoangvancong@customs.gov.vn",
        diaChi: "HÃ  Ná»™i",
        moTa: "Trá»£ lÃ½ trÆ°á»Ÿng phÃ²ng",
      },
      {
        ten: "Phan QuÃ¢n",
        chucVu: "Trá»£ lÃ½",
        soDienThoai: "0556677889",
        email: "phanquan@customs.gov.vn",
        diaChi: "HÃ  Ná»™i",
        moTa: "Trá»£ lÃ½ chuyÃªn viÃªn",
      },
      {
        ten: "TÃ´ QuyÃªn",
        chucVu: "Trá»£ lÃ½",
        soDienThoai: "0334455667",
        email: "toquyen@customs.gov.vn",
        diaChi: "HÃ  Ná»™i",
        moTa: "Trá»£ lÃ½ ká»¹ thuáº­t",
      },
    ]);

    await db.insert(schema.nhaCungCap).values([
      {
        ten: "YXG",
        diaChi: "Singapore, Singapore",
        soDienThoai: "+65 6555 1234",
        email: "contact@yxg.com.sg",
        nguoiLienHe: "Lim Wei Ming",
        chucVuNguoiLienHe: "Sales Director",
        moTa: "NhÃ  cung cáº¥p thiáº¿t bá»‹ cÃ´ng nghá»‡ cao",
        maQuocGia: "SG",
      },
      {
        ten: "Yamaha",
        diaChi: "Madrid, TÃ¢y Ban Nha",
        soDienThoai: "+34 91 555 6789",
        email: "spain@yamaha.com",
        nguoiLienHe: "Carlos Rodriguez",
        chucVuNguoiLienHe: "Regional Manager",
        moTa: "CÃ´ng ty sáº£n xuáº¥t thiáº¿t bá»‹ Ã¢m thanh vÃ  Ä‘iá»‡n tá»­",
        maQuocGia: "ES",
      },
      {
        ten: "Corpus",
        diaChi: "Praha, CH SÃ©c",
        soDienThoai: "+420 222 555 888",
        email: "info@corpus.cz",
        nguoiLienHe: "Pavel NovÃ¡k",
        chucVuNguoiLienHe: "Export Manager",
        moTa: "NhÃ  sáº£n xuáº¥t thiáº¿t bá»‹ y táº¿ vÃ  khoa há»c",
        maQuocGia: "CZ",
      },
    ]);

    await db
      .insert(schema.dieuKienGiaoHang)
      .values([
        { ten: "Ex Works(EXW)" },
        { ten: "Free Carrier (FCA)" },
        { ten: "Carriage Paid To(CPT)" },
        { ten: "Carriage and Insurance Paid To(CIP)" },
        { ten: "Delivered at Terminal(DAT)" },
        { ten: "Delivered at Place(DAP)" },
        { ten: "Delivered Duty Paid (DDP)" },
        { ten: "Free Alongside Ship(FAS)" },
        { ten: "Cost and Freight(CFR)" },
        { ten: "Free On Board(FOB)" },
        { ten: "Cost, Insurance and Freight(CIF)" },
      ]);

    await db.insert(schema.chuDauTu).values([
      {
        ten: "Cá»¥c Y táº¿",
        diaChi: "138A Giáº£ng VÃµ, Äá»‘ng Äa, HÃ  Ná»™i",
        soDienThoai: "024-3962-5555",
        email: "cuc.yte@moh.gov.vn",
        nguoiLienHe: "Pháº¡m Duy Tuáº¥n",
        chucVuNguoiLienHe: "Cá»¥c trÆ°á»Ÿng",
        moTa: "CÆ¡ quan quáº£n lÃ½ y táº¿ dá»± phÃ²ng vÃ  y táº¿ cÃ´ng cá»™ng",
      },
      {
        ten: "Cá»¥c Tráº¯c Ä‘á»‹a",
        diaChi: "1 HoÃ ng Diá»‡u, Ba ÄÃ¬nh, HÃ  Ná»™i",
        soDienThoai: "024-3734-6666",
        email: "cuc.tracdia@monre.gov.vn",
        nguoiLienHe: "LÃª VÄƒn Nam",
        chucVuNguoiLienHe: "Cá»¥c trÆ°á»Ÿng",
        moTa: "CÆ¡ quan quáº£n lÃ½ Ä‘o Ä‘áº¡c báº£n Ä‘á»“ vÃ  thÃ´ng tin Ä‘á»‹a lÃ½",
      },
      {
        ten: "Cá»¥c Váº­n táº£i",
        diaChi: "80 Tráº§n HÆ°ng Äáº¡o, HoÃ n Kiáº¿m, HÃ  Ná»™i",
        soDienThoai: "024-3942-7777",
        email: "cuc.vantai@mt.gov.vn",
        nguoiLienHe: "Nguyá»…n VÄƒn HÃ¹ng",
        chucVuNguoiLienHe: "Cá»¥c trÆ°á»Ÿng",
        moTa: "CÆ¡ quan quáº£n lÃ½ váº­n táº£i Ä‘Æ°á»ng bá»™, Ä‘Æ°á»ng sáº¯t, Ä‘Æ°á»ng thá»§y",
      },
    ]);

    const { seedSQLiteDatabase } = await import("./seed-data-sqlite");
    await seedSQLiteDatabase();

    upsertSystemSetting(DB_INITIALIZED_KEY, new Date().toISOString());
    sqlite.exec("COMMIT");
    transactionOpen = false;

    console.log("Database initialization completed!");
  } catch (error) {
    if (transactionOpen) {
      sqlite.exec("ROLLBACK");
    }
    throw error;
  }
}

