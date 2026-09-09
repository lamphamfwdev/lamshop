# LAM SHOP — website bán hàng tĩnh

Website chỉ dùng HTML, CSS và TypeScript. Dữ liệu giỏ hàng được lưu bằng `localStorage`; không cần backend hoặc database.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run build
npm run preview
```

Sau khi build, website hoàn chỉnh nằm trong thư mục `dist/`.

## Chỉnh thông tin shop

Mở `src/ts/config/shop.config.ts` để sửa:

- tên shop;
- số điện thoại, email, địa chỉ;
- tên fanpage;
- `facebookPageUsername` — phần cuối URL fanpage.

Ví dụ fanpage là `https://facebook.com/lamshop` thì đặt:

```ts
facebookPageUsername: "lamshop"
```

## Thêm hoặc sửa sản phẩm

Mở `src/ts/data/products.ts`. Mỗi sản phẩm có cấu trúc:

```ts
{
  id: "SP007",
  name: "Tên sản phẩm",
  description: "Mô tả ngắn",
  category: "Danh mục",
  price: 250000,
  originalPrice: 300000,
  image: "./assets/images/products/sp007.jpg",
  tags: ["Đặc điểm 1", "Đặc điểm 2"],
  featured: true
}
```

Nếu dùng ảnh nội bộ, đặt ảnh trong `assets/images/products/` và dùng đường dẫn như ví dụ trên. Tên file ảnh nên viết thường, không dấu, không khoảng trắng, ví dụ `tai-nghe-airbeat-mini.webp`.

Ưu tiên ảnh WebP hoặc AVIF, kích thước khoảng 900 × 675 px và dưới 250 KB để website tải nhanh.

## Vì sao không dùng Excel?

Excel phù hợp để nhập liệu hàng loạt, nhưng không nên là nguồn dữ liệu trực tiếp cho website tĩnh vì:

- trình duyệt phải tải thêm thư viện để đọc Excel;
- file lớn và khó phát hiện dữ liệu sai;
- việc tìm kiếm/lọc chậm và khó bảo trì hơn;
- GitHub Pages phục vụ file tĩnh, không tự chuyển Excel thành dữ liệu website.

Với quy mô nhỏ, giữ dữ liệu trong `products.ts` là rõ ràng nhất. Khi số lượng sản phẩm lớn, có thể quản lý bằng Google Sheets/Excel rồi chạy một script chuyển thành JSON lúc build.

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub.
2. Push toàn bộ source lên nhánh `main`.
3. Vào **Settings → Pages**.
4. Tại **Build and deployment → Source**, chọn **GitHub Actions**.
5. Workflow có sẵn sẽ tự build và public website sau mỗi lần push.

Lưu ý: website tĩnh không thể tự gửi tin nhắn thay khách hàng. Nút đặt hàng sẽ copy nội dung đơn rồi mở Messenger; khách hàng dán và bấm gửi.

## Cấu trúc chính

```text
├── index.html                     # Khung trang
├── assets/images/products/        # Ảnh sản phẩm
├── src/styles/main.css            # Toàn bộ giao diện
├── src/ts/
│   ├── app.ts                     # Điều phối giao diện và sự kiện
│   ├── config/shop.config.ts      # Thông tin shop / fanpage
│   ├── data/products.ts           # Dữ liệu sản phẩm
│   ├── models/product.ts          # Kiểu dữ liệu
│   ├── services/cart.service.ts   # Xử lý giỏ hàng
│   ├── ui/product-card.ts         # Render thẻ sản phẩm
│   └── utils/format.ts            # Hàm dùng chung
├── scripts/build.mjs              # Build ra thư mục dist
└── .github/workflows/             # Tự deploy GitHub Pages
```
