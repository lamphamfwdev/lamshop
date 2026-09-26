# Public Catalog API

Apps Script này chỉ đọc các sản phẩm đang bật hiển thị, cấu hình shop và bộ lọc giá từ Google Sheets.

1. Tạo một Apps Script project mới.
2. Copy `Code.gs` và `appsscript.json` vào project.
3. Trong **Project Settings → Script Properties**, thêm `SPREADSHEET_ID`.
4. Deploy dạng **Web app**:
   - Execute as: `Me`.
   - Who has access: `Anyone`.
5. Copy URL kết thúc bằng `/exec` vào `src/ts/config/runtime.config.ts` của website.

API này không có hàm ghi, sửa hoặc xóa dữ liệu.
