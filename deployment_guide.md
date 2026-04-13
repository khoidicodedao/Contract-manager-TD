# Hướng dẫn cài đặt ứng dụng Quản lý Hợp đồng trên máy chủ

Tài liệu này cung cấp hướng dẫn chi tiết các bước để triển khai (deploy) ứng dụng trên hai hệ điều hành phổ biến: **Windows** và **Ubuntu (Linux)**.

---

## PHẦN 1: HƯỚNG DẪN CHO WINDOWS

### 1. Yêu cầu hệ thống

- **Node.js**: Phiên bản 20.x trở lên.
- **Git**: (Tùy chọn) Để tải mã nguồn.

### 2. Các bước cài đặt

1. **Cài đặt thư viện**: Mở CMD/PowerShell tại thư mục dự án và chạy:

   ```bash
   npm install
   ```

2. **Biên dịch (Build)**:

   ```bash
   npm run build
   ```

3. **Khởi tạo dữ liệu**:

   ```bash
   npm run db:push
   ```

### 3. Chạy ứng dụng Production (với PM2)
Để ứng dụng tự khởi động lại khi reboot máy hoặc gặp lỗi:
- **Cài đặt PM2 toàn cục**: `npm install -g pm2`
- **Cài đặt công cụ khởi động trên Windows**:
  ```bash
  npm install -g pm2-windows-startup
  pm2-startup install
  ```
- **Chạy ứng dụng**: `pm2 start dist/index.cjs --name "contract-manager"`
- **Lưu trạng thái** (Quan trọng để PM2 nhớ ứng dụng khi reboot):
  ```bash
  pm2 save
  ```

---

## PHẦN 2: HƯỚNG DẪN CHO UBUNTU (LINUX)

### 1. Cài đặt môi trường ban đầu
Cập nhật hệ thống và cài đặt các công cụ biên dịch thiết yếu:
```bash
sudo apt update
sudo apt install build-essential python3 curl -y
```

Cài đặt **Node.js 20.x**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Triển khai ứng dụng
1. **Cài đặt thư viện**: `npm install`
2. **Biên dịch (Build)**: `npm run build`
3. **Khởi tạo dữ liệu**: `npm run db:push`

### 3. Quản lý quy trình với PM2

```bash
sudo npm install -g pm2
pm2 start dist/index.cjs --name "contract-manager"
pm2 save
pm2 startup
```

*(Lưu ý: copy câu lệnh do `pm2 startup` trả về và chạy nó để kích hoạt tự động khởi động cùng hệ thống).*

Ví dụ quy trình đầy đủ trên Ubuntu:

```bash
pm2 start dist/index.cjs --name "contract-manager"
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

Sau khi chạy `pm2 startup systemd -u $USER --hp $HOME`, PM2 sẽ in ra một câu lệnh `sudo ...`. Hãy copy và chạy đúng câu lệnh đó một lần để đăng ký service khởi động cùng máy chủ.

Các lệnh kiểm tra hữu ích:

```bash
pm2 list
pm2 status
pm2 logs contract-manager
systemctl status pm2-$USER
```

### 4. Cấu hình Nginx (Reverse Proxy)

Để truy cập qua cổng 80 (HTTP) thay vì 5000:

- Cài đặt: `sudo apt install nginx -y`
- Tạo file cấu hình: `sudo nano /etc/nginx/sites-available/contract-manager`
- Nội dung cấu hình:

  ```nginx
  server {
      listen 80;
      location / {
          proxy_pass http://localhost:5000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
      }
  }
  ```

- Kích hoạt và restart:

  ```bash
  sudo ln -s /etc/nginx/sites-available/contract-manager /etc/nginx/sites-enabled/
  sudo systemctl restart nginx
  ```

---

## LƯU Ý CHUNG CHO CẢ HAI HỆ ĐIỀU HÀNH

- **File dữ liệu**: Toàn bộ dữ liệu nằm trong file [database.sqlite](file:///d:/TD/Contract-manager-TD/database.sqlite) ở thư mục gốc. Hãy sao lưu file này thường xuyên.
- **Port**: Ứng dụng mặc định chạy ở cổng **5000**.
- **Upload**: Hệ thống hỗ trợ upload file tối đa **50MB**.
- **Quyền truy cập**: Đảm bảo folder dự án có quyền ghi để ứng dụng có thể cập nhật file database SQLite.
