// 在 Vue 組件中
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// 調用 API
fetch(`${apiBaseUrl}/api/health`)
  .then(response => response.json())
  .then(data => console.log(data));