# ⚡ Logic Gate Plumber (Nối Mạch Kỹ Thuật Số)

> **Game giải đố xoay cổng logic số trên Mobile & Web**  
> Kết hợp giữa cơ chế "Thợ sửa ống nước" (Plumber / Pipe Puzzle) kinh điển và kiến trúc vi mạch số (Digital Logic Circuit).

---

## 🎮 Chơi Trực Tiếp 24/7 (Không cần mở máy tính)

- 🌐 **Link Chơi Trực Tiếp Trên Web (GitHub Pages):**  
  👉 **`https://luancoder121002.github.io/logic-gate-plumber/`**
- 📱 **Tải Ứng Dụng Native Android (APK 12.3 MB):**  
  👉 [Tải LogicGatePlumber.apk](https://github.com/luancoder121002/logic-gate-plumber/raw/main/LogicGatePlumber.apk) hoặc tải trực tiếp ngay trên giao diện web.
- 📲 **Cài đặt PWA (Progressive Web App):**  
  Mở link trên bằng trình duyệt Chrome/Safari trên điện thoại -> Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** để chơi toàn màn hình không có thanh địa chỉ!

---

## 🌟 Tính Năng Nổi Bật

1. **Hệ thống 20 Màn chơi tăng tiến độ khó mượt mà:**
   - **Màn 1 - 3 (Tân thủ):** Làm quen dây dẫn thẳng, góc và nguồn điện 1/0 trên lưới 3x3 kèm hướng dẫn trực quan.
   - **Màn 4 - 8 (Nhập môn cổng logic):** Khám phá cổng OR, NOT, AND cơ bản.
   - **Màn 9 - 14 (Trung cấp & Phân nhánh):** Cổng XOR, bộ chia tín hiệu (Splitter), 2 bóng LED đồng thời.
   - **Màn 15 - 20 (Chuyên gia Bảng mạch):** Mạch bán cộng (Half-Adder), mạng đa cổng AND/OR/XOR đan xen, đòi hỏi tư duy tối ưu hóa tín hiệu.
2. **Khóa Màn chơi (Strict Sequential Progression):**
   - Người chơi phải giải lần lượt từ Màn 1 đến Màn 20.
   - Màn chưa chơi được khóa với biểu tượng ổ khóa `🔒` và hiệu ứng rung cảnh báo khi chạm vào.
   - Tiến trình và số sao (⭐ - ⭐⭐⭐) được tự động lưu vào `localStorage`.
3. **Nút "QUA MÀN" Trực Tiếp (In-Game HUD & Victory Modal):**
   - Ngay khi mạch điện thông suốt và toàn bộ đèn LED bật sáng, nút **`[ ⏩ QUA MÀN TIẾP THEO ]`** nổi bật màu xanh neon nhấp nháy ngay trên thanh điều khiển và tiêu đề màn hình.
   - Hộp thoại chiến thắng cho phép chuyển màn ngay lập tức, chơi lại hoặc xem danh sách màn mà không bao giờ bị khựng hay đen màn hình.
4. **Hiệu ứng Dòng điện Phát sáng Thời gian thực (Neon Electric Pulse):**
   - Hạt photon điện tích chạy dọc theo dây dẫn và cổng logic khi tín hiệu là 1.
5. **Nút Gợi Ý (Hint) & Bảng Tra Cứu (Cheat Sheet):**
   - Hỗ trợ người chơi khi gặp câu đố hóc búa, tự động xoay đúng 1 cổng bị sai và khóa lại.
6. **Đa dạng Phương thức Điều khiển:**
   - Cần gạt ảo (Virtual Joystick) điều khiển nhân vật Thợ Sửa Ống Nước di chuyển trên bảng mạch + Phím cờ lê xoay cổng.
   - Chạm trực tiếp (Direct Touch / Tap) vào bất kỳ ô nào để xoay ngay tức thì.
   - Bàn phím máy tính: Phím `W/A/S/D`, Mũi tên, `Space` để xoay, `H` để gợi ý, `C` để mở bảng chân lý.

---

## 🛠️ Công Nghệ Phát Triển

- **Game Engine:** [Phaser 3](https://phaser.io/) (WebGL & Canvas Rendering)
- **Ngôn ngữ:** TypeScript + Vite
- **Đóng gói Mobile App:** [Capacitor 6 Android](https://capacitorjs.com/)
- **Tự động Triển khai CI/CD:** GitHub Actions -> GitHub Pages

---

## 🚀 Hướng Dẫn Phát Triển & Build

### 1. Cài đặt Dependencies:
```bash
npm install
```

### 2. Chạy máy chủ Dev (Local / LAN):
```bash
npm run dev -- --host
```

### 3. Build Web Production:
```bash
npm run build
```

### 4. Đồng bộ & Build Android APK:
```bash
npx cap sync android
cd android
./gradlew assembleDebug
```
File APK sẽ xuất tại: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

© 2026 Developed by **luancoder121002**. Chúc bạn chơi game vui vẻ và chinh phục trọn vẹn 20 màn chơi vi mạch số!
