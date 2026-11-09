# Nhận hồ sơ VTF 30 năm vào Google Sheet riêng tư

Tài liệu này dành cho người quản trị trang `vtf30.tkdai.vn` và Ban Tổ chức.

## 1. Hồ sơ đi đâu?

```
Người nộp điền biểu mẫu trên trang
   -> máy chủ của trang (Vercel, /api/submit-nomination): kiểm tra lại dữ liệu, tự tính lại điểm
   -> Apps Script (Code.gs): ghi vào Google Sheet RIÊNG TƯ, cấp mã hồ sơ VTF30-0001, 0002, ...
   -> trang chỉ báo "đã tiếp nhận" khi Sheet đã xác nhận ghi xong
```

- Trình duyệt của người nộp **không** biết địa chỉ Apps Script, chỉ máy chủ của trang biết (biến `VTF_GOOGLE_SHEET_WEBHOOK` trên Vercel).
- Không còn đường nào để người ngoài đọc danh sách hồ sơ qua Internet.
- Nếu Sheet không ghi được, người nộp thấy thông báo **"Hồ sơ CHƯA được gửi đi"** và thông tin họ đã nhập vẫn còn trên màn hình. Không còn "thành công giả".
- Máy tính chấm điểm chi tiết `/tinh-diem/` vẫn chạy hoàn toàn trên máy người dùng và không gửi gì đi.

## 2. Các tab trong Google Sheet

| Tab | Việc của tab |
|---|---|
| **Tổng quan** | Số liệu, hạn nộp (ô B3, sửa được), hướng dẫn |
| **Hệ A - Xếp hạng** | Danh sách Hệ A, điểm cao xuống thấp, tự cập nhật |
| **Hệ B - Xếp hạng** | Danh sách Hệ B, điểm cao xuống thấp, tự cập nhật |
| **Hồ sơ khác** | Kỷ yếu 34 tỉnh/thành, đăng ký Gala 19/12/2026, Kỷ yếu Bản Vàng |
| **Tất cả hồ sơ** | Nơi hệ thống ghi. Mỗi hồ sơ một dòng |
| **Nhật ký** | Mỗi lần nhận hồ sơ, không chứa thông tin cá nhân |

### Quy tắc xếp hạng
- Điểm cao xuống thấp. Bằng điểm thì hồ sơ nộp trước đứng trước.
- **Điểm dùng để xếp hạng** = Điểm Hội đồng chấm (nếu đã nhập tay) hoặc, nếu chưa có, **Điểm máy chủ tính lại** từ các lựa chọn người nộp đã chọn.
- **Điểm người nộp tự gửi không dùng để xếp hạng**, chỉ để đối chiếu (cột "Đối chiếu điểm": Khớp / LỆCH / Không có chi tiết / Sai hệ / Chi tiết không hợp lệ).
- Hồ sơ chưa có điểm nằm cuối bảng cho đến khi Hội đồng nhập điểm.
- Điểm từ máy tính nhanh là điểm **sơ bộ** (chưa kiểm điều kiện nền và minh chứng). Điểm chính thức do Hội đồng quyết định.

### Chỉ nhập tay vào 3 cột
Ở tab "Tất cả hồ sơ", các cột có chữ **NHẬP TAY**: *Điểm Hội đồng chấm*, *Trạng thái xử lý*, *Ghi chú*. Không chèn hay xóa cột vì các bảng xếp hạng đọc theo cột.

### Quyền xem
Bảng này **riêng tư**. Cho người khác xem bằng cách thêm đích danh email của họ. **Không** chia sẻ "Bất kỳ ai có liên kết". Nếu bảng bị chia sẻ công khai, Apps Script tự từ chối ghi hồ sơ mới (người nộp sẽ thấy "chưa gửi được") cho đến khi tắt chia sẻ công khai.

## 3. Thiết lập một lần (đã làm sẵn, ghi lại để khi cần làm lại)

1. Vào https://script.google.com, tạo dự án mới tên `VTF30 - Tiep nhan ho so`, dán toàn bộ `apps-script/Code.gs` vào.
2. Chọn hàm `thietLap`, bấm Chạy, cho phép các quyền được hỏi. Hàm tạo Google Sheet riêng tư và ghi địa chỉ vào Nhật ký thực thi.
3. Chọn hàm `kiemThuToanBo`, bấm Chạy. Kết quả phải là `"ketQua": "TẤT CẢ ĐẠT"`. Hàm ghi vài hồ sơ thử rồi tự xóa.
4. Triển khai > Triển khai mới > Loại: Ứng dụng web > Thực thi bằng: **Tôi** > Ai có quyền truy cập: **Bất kỳ ai** > Triển khai. Chép địa chỉ kết thúc bằng `/exec`.
5. Trên Vercel: dự án `vtf-30-nam-landingpage` > Settings > Environment Variables > thêm `VTF_GOOGLE_SHEET_WEBHOOK` = địa chỉ `/exec` (môi trường Production) > Redeploy.
6. Kiểm tra sức khỏe: mở `<địa chỉ /exec>?ping=1` phải thấy `"san_sang":true,"rieng_tu":true`.

## 4. Khi cần sửa mã

Dán mã mới vào Code.gs, rồi Triển khai > Quản lý bản triển khai > biểu tượng bút chì > Phiên bản: **Phiên bản mới** > Triển khai. Địa chỉ `/exec` **không đổi**.

## 5. Nếu địa chỉ `/exec` bị lộ

Địa chỉ này là "chìa khóa" để ghi hồ sơ (không đọc được dữ liệu). Nếu nghi bị lộ: tạo một bản triển khai mới (bước 4), cập nhật biến trên Vercel, rồi vào Quản lý bản triển khai và **lưu trữ** bản cũ.

## 6. Sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Người nộp thấy "Cổng tiếp nhận đang được bảo trì" | Biến `VTF_GOOGLE_SHEET_WEBHOOK` chưa đặt hoặc sai | Đặt đúng biến rồi Redeploy |
| Người nộp thấy "chưa lưu được hồ sơ" | Bảng đang chia sẻ công khai, hoặc Apps Script lỗi | Xem tab Nhật ký (dòng TỪ CHỐI / LỖI) và `?ping=1` |
| Có dòng "Trùng hồ sơ?" | Cùng SĐT nộp hai lần cùng hạng mục | Ban Tổ chức quyết định giữ dòng nào |
| Cột "Đối chiếu điểm" = LỆCH | Điểm người nộp gửi khác điểm máy chủ tính lại | Kiểm tra hồ sơ, dùng điểm máy chủ hoặc điểm Hội đồng |

## 7. Giới hạn đã cài

Tối đa 40 hồ sơ mỗi phút và 2000 hồ sơ mỗi ngày trên toàn hệ thống; mỗi địa chỉ IP tối đa 8 hồ sơ trong 10 phút. Quá giới hạn thì người nộp được báo chờ rồi gửi lại.
