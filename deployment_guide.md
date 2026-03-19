# Hướng dẫn cài đặt ứng dụng Quản lý Hợp đồng trên máy chủ

Tài liệu này hướng dẫn các bước để triển khai (deploy) ứng dụng từ mã nguồn lên một máy chủ Windows hoặc Linux chạy môi trường Node.js.

## 1. Yêu cầu hệ thống (Prerequisites)

- **Node.js**: Phiên bản 20.x trở lên.
- **npm**: Đi kèm với Node.js.
- **Cơ sở dữ liệu**: SQLite (không cần cài đặt server riêng, chỉ cần thư viện `better-sqlite3`).
- **Trình quản lý quy trình (Khuyên dùng)**: [PM2](https://pm2.keymetrics.io/) để giữ ứng dụng luôn chạy ngầm.

## 2. Các bước cài đặt

### Bước 1: Tải mã nguồn và cài đặt thư viện
Mở terminal tại thư mục dự án và chạy lệnh:
```bash
npm install
```

### Bước 2: Build ứng dụng
Ứng dụng cần được biên dịch (build) sang mã máy (JavaScript thuần) để chạy tối ưu trong môi trường production.
```bash
npm run build
```
Sau khi chạy xong, thư mục `dist` sẽ được tạo ra chứa mã nguồn đã build.

### Bước 3: Cấu hình Cơ sở dữ liệu
Đảm bảo cấu trúc cơ sở dữ liệu SQLite được đồng bộ với mã nguồn:
```bash
npm run db:push
```
Lệnh này sẽ tạo file [database.sqlite](file:///d:/TD/Contract-manager-TD/database.sqlite) (nếu chưa có) và cập nhật các bảng cần thiết.

## 3. Chạy ứng dụng

### Cách 1: Chạy trực tiếp (để kiểm tra)
```bash
npm start
```
Ứng dụng sẽ chạy tại cổng **5000** (mặc định). Bạn có thể truy cập qua: `http://<dia-chi-ip>:5000`

### Cách 2: Chạy bằng PM2 (Môi trường Production)
Cài đặt PM2 nếu chưa có:
```bash
npm install -g pm2
```

Chạy ứng dụng với PM2:
```bash
pm2 start dist/index.js --name "contract-manager"
```

Lưu cấu hình để tự động chạy lại khi server khởi động:
```bash
pm2 save
pm2 startup
```

## 4. Lưu ý quan trọng

- **Cổng (Port)**: Mặc định ứng dụng chạy ở cổng `5000`. Hãy đảm bảo Firewall của server đã mở cổng này.
- **Dung lượng File**: Hệ thống đã được cấu hình nhận file (payload) lên đến **50MB**.
- **Sao lưu**: File [database.sqlite](file:///d:/TD/Contract-manager-TD/database.sqlite) chứa toàn bộ dữ liệu của bạn. Hãy thực hiện sao lưu định kỳ file này.
- **Biến môi trường**: Nếu cần chạy ở cổng khác, bạn có thể thiết lập biến môi trường `PORT` trước khi chạy (ví dụ: `cross-env PORT=8080 npm start`).

## 5. Cấu trúc thư mục sau khi Build
- [dist/index.js](file:///d:/TD/Contract-manager-TD/dist/index.js): File thực thi chính của server.
- `dist/public/`: Thư mục chứa giao diện web (HTML/JS/CSS).
- `database.sqlite`: File dữ liệu (sinh ra sau khi chạy).
