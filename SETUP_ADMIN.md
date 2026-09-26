# Cài trang Admin, Google Sheets và Cloudinary

Bạn chỉ thực hiện phần cài đặt này một lần. Sau đó việc thêm sản phẩm, đổi ảnh, giá, tiêu đề hoặc bộ lọc không cần commit GitHub.

## 1. Tạo Google Sheets

1. Vào Google Sheets và tạo một bảng tính trống.
2. Copy ID nằm giữa `/d/` và `/edit` trong URL.

Ví dụ:

```text
https://docs.google.com/spreadsheets/d/1AbcXYZ/edit
                                    └──────┘
                                  SPREADSHEET_ID
```

Không cần tự tạo cột. Admin sẽ tạo ba sheet `Products`, `Settings` và `PriceFilters`.

Nếu nâng cấp từ bản cũ, chỉ cần cập nhật mã Apps Script rồi mở Admin một lần. Các cột mới cho nhiều ảnh, tồn kho, trạng thái và lưu trữ sẽ được thêm mà không làm mất dữ liệu cũ.

## 2. Chuẩn bị Cloudinary

1. Tạo tài khoản Cloudinary.
2. Trong Dashboard, lấy `Cloud name`, `API key` và `API secret`.
3. Không ghi `API secret` vào GitHub hoặc file TypeScript.

Ảnh được chọn từ máy tính trong Admin, tải thẳng lên Cloudinary và chỉ lưu URL vào Google Sheets.

## 3. Tạo Apps Script Admin

1. Vào [script.google.com](https://script.google.com) và tạo project mới tên `LAM SHOP Admin`.
2. Copy nội dung `apps-script/admin/Code.gs` vào file `Code.gs`.
3. Tạo file HTML tên `Admin`, rồi copy nội dung `apps-script/admin/Admin.html`.
4. Bật hiển thị file manifest trong Project Settings và thay `appsscript.json` bằng file tương ứng trong dự án.
5. Trong **Project Settings → Script Properties**, thêm:

| Property | Giá trị |
| --- | --- |
| `SPREADSHEET_ID` | ID Google Sheets ở bước 1 |
| `ADMIN_EMAIL` | Email Google được phép quản trị |
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

6. Trong trình soạn thảo, chọn hàm `setupDatabase` và bấm **Run** một lần. Cấp quyền theo yêu cầu.
7. Chọn **Deploy → New deployment → Web app**:
   - Execute as: `User accessing the web app`.
   - Who has access: `Only myself`.
8. Mở URL `/exec` để sử dụng Admin.

Nếu muốn thêm một quản trị viên khác, cần điều chỉnh phương thức triển khai và danh sách email. Không triển khai trang Admin ở chế độ `Anyone`.

## 4. Tạo Apps Script Public API

Public API chỉ có quyền đọc dữ liệu để website GitHub Pages hiển thị sản phẩm.

1. Tạo Apps Script project thứ hai tên `LAM SHOP Public API`.
2. Copy `apps-script/public-api/Code.gs` và `appsscript.json` tương ứng.
3. Thêm Script Property:

| Property | Giá trị |
| --- | --- |
| `SPREADSHEET_ID` | Cùng ID Google Sheets ở bước 1 |

4. Chọn **Deploy → New deployment → Web app**:
   - Execute as: `Me`.
   - Who has access: `Anyone`.
5. Copy URL kết thúc bằng `/exec`.

Public API không chứa hàm thêm, sửa hoặc xóa nên người xem website không thể thay đổi Google Sheets.

## 5. Kết nối website

Mở file:

```text
src/ts/config/runtime.config.ts
```

Thay:

```ts
catalogApiUrl: "PASTE_PUBLIC_APPS_SCRIPT_URL_HERE"
```

bằng URL Public API `/exec`, sau đó commit và push lên GitHub một lần.

Từ lần này trở đi:

- Thêm, sửa, xóa hoặc ẩn sản phẩm: làm trong Admin.
- Tải ảnh sản phẩm và logo: làm trong Admin.
- Đổi tiêu đề, slogan, footer: làm trong Admin.
- Đổi các khoảng lọc giá: làm trong Admin.
- Đổi ảnh đầu trang, tồn kho, trạng thái và kênh nhận đơn: làm trong Admin.
- Không cần build hoặc commit lại website.

Dữ liệu mới có thể mất tối đa khoảng 30 giây để xuất hiện vì Public API có cache ngắn.

## 6. Kênh nhận đơn

Trong Admin → **Nội dung shop → Kênh nhận đơn mặc định**:

- Facebook: ưu tiên link dạng `https://m.me/username`.
- Instagram: link trang cá nhân `https://instagram.com/username`.
- Zalo cá nhân: thường dùng `https://zalo.me/so-dien-thoai`.
- Zalo OA: dán link chính thức của OA.
- TikTok: dán link trang cá nhân hoặc link shop.

Trình duyệt chỉ cho phép website copy nội dung và mở liên kết. Nội dung không thể tự điền hoặc tự gửi vào ứng dụng chat.

## 7. Kiểm tra

1. Mở Admin và thêm một sản phẩm.
2. Bật **Hiển thị trên website**.
3. Mở URL Public API. Kết quả phải có `products`, `settings` và `priceFilters`.
4. Mở website và tải lại trang.
5. Nếu website vẫn hiện dữ liệu mẫu, kiểm tra URL trong `runtime.config.ts` đã là URL `/exec` hay chưa.

## Khi cập nhật code Apps Script

Sau khi sửa `Code.gs` hoặc `Admin.html`, vào **Deploy → Manage deployments → Edit**, chọn phiên bản mới rồi deploy lại. URL `/exec` có thể tiếp tục giữ nguyên.
