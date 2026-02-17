import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import DriverApp from './DriverApp.tsx'
import './index.css'

// Lấy đường dẫn hiện tại trên trình duyệt
const path = window.location.pathname;

// 🛠 SỬA LỖI: Dùng .includes() thay vì ===
// Logic: Chỉ cần đường dẫn CÓ CHỨA chữ "driver" là vào App Tài xế
// (Giúp tránh lỗi dấu gạch chéo cuối cùng: /driver/ hay /driver)
const isDriverMode = path.includes('/driver');

// In ra Console (F12) để kiểm tra (Debug)
console.log("📍 Đường dẫn hiện tại:", path);
console.log("🚛 Chế độ Tài xế:", isDriverMode);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Điều hướng: Nếu là Driver Mode thì hiện App Tài xế, ngược lại hiện Admin */}
    {isDriverMode ? <DriverApp /> : <App />}
  </React.StrictMode>,
)