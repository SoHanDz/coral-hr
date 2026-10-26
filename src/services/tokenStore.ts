// Nơi lưu access token duy nhất - CHỈ trong bộ nhớ (biến JS), không localStorage/sessionStorage.
// Lý do: access token không được lưu bền để giảm rủi ro bị đánh cắp qua XSS (đọc localStorage).
// Khi refresh trang, access token mất đi và được lấy lại bằng refresh token (cookie httpOnly)
// thông qua lệnh gọi /auth/refresh lúc app khởi động - xem AuthContext.

let accessToken: string | null = null;

// Callback được AuthContext gán - gọi khi refresh token cũng không còn hợp lệ (phải đăng xuất)
let onAuthFailure: (() => void) | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  setOnAuthFailure: (handler: (() => void) | null) => {
    onAuthFailure = handler;
  },
  notifyAuthFailure: () => {
    accessToken = null;
    onAuthFailure?.();
  },
};
