# LAM SHOP V2 — GitHub Pages + trang Admin

Website bán hàng dùng HTML, CSS và TypeScript. Website public trên GitHub Pages; sản phẩm và nội dung shop được quản lý bằng Google Apps Script Admin, lưu trong Google Sheets. Ảnh tải từ máy tính lên Cloudinary nên không cần commit ảnh.

## Chức năng website

- Hiển thị sản phẩm và giá.
- Tìm kiếm theo tên, mã, danh mục và thẻ.
- Lọc danh mục và các khoảng giá cấu hình từ Admin.
- Sắp xếp và phân trang.
- Giỏ hàng lưu trên trình duyệt.
- Copy nội dung đơn và mở Fanpage Messenger.
- Giao diện trắng–đen responsive theo phong cách hiện đại, ô tìm kiếm lớn ở hero.
- Xem chi tiết sản phẩm, thư viện tối đa 5 ảnh và trạng thái tồn kho.
- Chọn kênh đặt hàng mặc định: Facebook, Instagram, Zalo cá nhân, Zalo OA hoặc TikTok.
- Tự dùng dữ liệu mẫu nếu chưa kết nối Google Sheets.

## Chức năng Admin

- Danh sách sản phẩm có tìm kiếm và phân trang.
- Thêm, sửa, nhân bản, lưu trữ và bật/tắt hiển thị sản phẩm.
- Quản lý mã, tên, mô tả, danh mục, giá bán, giá gốc, thẻ và trạng thái nổi bật.
- Chọn ảnh sản phẩm hoặc logo từ máy tính và tải trực tiếp lên Cloudinary.
- Tải tối đa 5 ảnh cùng lúc cho mỗi sản phẩm; quản lý tồn kho và trạng thái đang bán/hết hàng/bản nháp.
- Quản lý ảnh lớn đầu trang và các link kênh bán hàng.
- Quản lý tên shop, slogan, tiêu đề tab, mô tả tìm kiếm và số sản phẩm mỗi trang.
- Quản lý tiêu đề đầu trang, nội dung nổi bật và footer.
- Quản lý địa chỉ, số điện thoại, email và Fanpage.
- Thêm, sửa, xóa và sắp xếp các khoảng lọc giá.

## Cài đặt

Đọc [SETUP_ADMIN.md](SETUP_ADMIN.md) để tạo Google Sheets, Cloudinary, Apps Script Admin và Public API.

## Chạy website trên máy

Yêu cầu Node.js 20 trở lên.

### Cách nhanh nhất

- macOS: nhấp đúp `RUN_LOCAL.command`.
- Windows: nhấp đúp `RUN_LOCAL_WINDOWS.bat`.

Lần đầu script tự cài thư viện, build website, mở trình duyệt tại `http://127.0.0.1:4173`.

Nếu macOS chặn file: nhấp phải `RUN_LOCAL.command` → **Open**, hoặc chạy `chmod +x RUN_LOCAL.command` một lần.

### Chạy bằng Terminal

```bash
npm install
npm run preview
```

Website hoàn chỉnh được build vào thư mục `dist/`.

## Kết nối Public API

Sau khi triển khai Apps Script Public API, mở:

```text
src/ts/config/runtime.config.ts
```

Dán URL `/exec` vào `catalogApiUrl`. Đây là lần commit cấu hình duy nhất. Sau đó cập nhật sản phẩm bằng Admin không cần commit.

## Dữ liệu dự phòng

File `data/products.xlsx` chỉ còn vai trò dữ liệu mẫu khi Public API chưa được cấu hình hoặc đang lỗi. Website thực tế sẽ ưu tiên dữ liệu Google Sheets.

Nếu muốn thay dữ liệu mẫu, sửa Excel rồi chạy `npm run build`. Việc này không bắt buộc khi Admin đã hoạt động.

## Đưa lên GitHub Pages

1. Push source lên nhánh `main`.
2. Vào **Settings → Pages**.
3. Tại **Build and deployment → Source**, chọn **GitHub Actions**.
4. Workflow `.github/workflows/deploy-pages.yml` sẽ build và public thư mục `dist`.

Repository `lamshop` sẽ có địa chỉ dạng:

```text
https://USERNAME.github.io/lamshop/
```

## Cấu trúc dự án

```text
├── index.html
├── assets/images/products/          # Chỉ dùng cho ảnh mẫu cũ
├── data/products.xlsx               # Dữ liệu mẫu dự phòng
├── src/
│   ├── styles/main.css
│   └── ts/
│       ├── app.ts
│       ├── config/
│       │   ├── runtime.config.ts    # URL Public API
│       │   └── shop.config.ts       # Cấu hình dự phòng
│       ├── services/
│       │   ├── catalog.service.ts   # Tải dữ liệu Google Sheets
│       │   └── cart.service.ts
│       └── ...
├── apps-script/
│   ├── admin/
│   │   ├── Code.gs                  # API quản trị và ký upload ảnh
│   │   ├── Admin.html               # Giao diện Admin
│   │   └── appsscript.json
│   └── public-api/
│       ├── Code.gs                  # API công khai chỉ đọc
│       └── appsscript.json
├── SETUP_ADMIN.md
├── scripts/
└── .github/workflows/
```

## Bảo mật

- Không đưa `CLOUDINARY_API_SECRET` lên GitHub.
- Secret chỉ lưu trong Apps Script Properties của project Admin.
- Admin phải triển khai ở chế độ chỉ tài khoản quản trị truy cập.
- Public API chỉ chứa hàm đọc dữ liệu và không thể sửa Google Sheets.
- Link kênh bán hàng chỉ mở đúng tài khoản. Facebook/Zalo/Instagram/TikTok không cho website tự dán hoặc tự gửi nội dung thay khách.
