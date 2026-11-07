# Máy tính điểm vinh danh 30 năm VTF (`/tinh-diem/`)

Một tệp HTML tự đủ (không CDN, không `type="module"`) chạy được trên web và bằng `file://`. Mã nguồn ở `src/`, tệp ghép ở `public/tinh-diem/index.html` (Vite chép vào `dist/`).

```bash
npm run build:tinh-diem   # ghép lại public/tinh-diem/index.html (npm run build tự chạy bước này trước)
npm test                  # tất cả test, gồm test "tệp ghép khớp nguồn"
```

| Tệp trong `src/` | Vai trò |
|---|---|
| `rules-036.cjs` | **Nguồn duy nhất của thang điểm** 036/VTF, hạng, quy tắc và quy ước. Bảng tiêu chí trên giao diện đọc từ đây |
| `engine.cjs` | Bộ tính: `evaluate(hồ sơ)` → điểm, breakdown, cảnh báo. Hàm thuần |
| `history.cjs` | Hồ sơ, phiên bản, chốt/mở khóa, lọc, sắp xếp |
| `store.cjs` | Lưu trữ: IndexedDB → localStorage → bộ nhớ tạm |
| `xlsx.cjs` | Ghi/đọc `.xlsx` tự viết (trang tính ẩn `_du_lieu` chứa dữ liệu đầy đủ) |
| `backup.cjs` | Bảng xuất, CSV, gói JSON, nhập/gộp, nhắc sao lưu, danh sách minh chứng |
| `ui.js`, `style.css`, `template.html` | Giao diện (JavaScript thuần) |

Thứ tự nạp script trong `template.html` quan trọng: rules → engine → history → xlsx → backup → store → ui.

## Khi tiêu chí thay đổi

1. Sửa số liệu trong `rules-036.cjs` và đổi `version`.
2. Sửa/thêm ca trong `tests/tinh-diem.test.mjs` (các ca Phụ lục B và ngưỡng biên) cho khớp văn bản mới.
3. `npm run build:tinh-diem`, `npm test`. Hồ sơ cũ giữ `ruleVersion` và điểm đã lưu; chỉ tính lại khi người dùng mở và lưu phiên bản mới.

## Ghi chú kỹ thuật

- CSV: dấu chấm phẩy + BOM UTF-8, **không** có dòng `sep=;` (đã thử với Excel 16 thật, dòng đó làm Excel bỏ qua BOM và hiện sai dấu tiếng Việt).
- Nút chính dùng `--brand-fill` / `--bad-fill` (chữ trắng ≥ 4,5:1 cả hai chế độ sáng/tối); `--brand` chỉ dùng cho chữ/viền.
- XLSX không nén (ZIP "store"); 500 hồ sơ khoảng 7 MB. Đọc được cả tệp Excel đã nén khi trình duyệt có `DecompressionStream`.
- `window.print()` + CSS `@media print` in `#print-area`; lớp `.print-preview` xem trước phiếu trên màn hình.
- Thử trên máy dev: `npx vite --port 5199` rồi mở `/tinh-diem/index.html` (máy chủ dev trả trang chủ cho `/tinh-diem/`; bản build và Vercel phục vụ đúng thư mục).
- Máy xem thử `vite preview` khóa thư mục `dist`: tắt nó trước khi chạy `npm run build`.
