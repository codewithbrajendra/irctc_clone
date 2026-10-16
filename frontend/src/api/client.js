const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
const ACCESS_KEY = "railway_access_token";
const REFRESH_KEY = "railway_refresh_token";
const USER_KEY = "railway_user";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
}
function tokenIsUnexpired(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(part))));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch { return false; }
}
export function hasSession() {
  const token = getAccessToken();
  const refresh = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  return Boolean((token && tokenIsUnexpired(token)) || (token && refresh));
}
function authStorage() {
  return localStorage.getItem(ACCESS_KEY) ? localStorage : sessionStorage;
}
export function getCurrentUser() {
  const saved = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (saved) { try { return JSON.parse(saved); } catch { /* read token below */ } }
  const token = getAccessToken();
  if (!token) return null;
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(part))));
    const label = payload.name || payload.fullName || payload.username || payload.email || payload.sub;
    return label ? { name: label, email: payload.email || payload.sub || "", roles: payload.roles || payload.authorities || [] } : null;
  } catch { return null; }
}
export function hasRole(role) {
  const user = getCurrentUser();
  const roles = user?.roles || user?.authorities || [];
  return roles.some(item => {
    const name = typeof item === "string" ? item : item?.name || item?.authority || item?.id;
    return String(name || "").toUpperCase() === role.toUpperCase() ||
      String(name || "").toUpperCase() === `ROLE_${role.replace(/^ROLE_/, "").toUpperCase()}`;
  });
}
export function saveAuth(data, remember = true, loginUsername = "") {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(key => other.removeItem(key));
  const access = data.accessToken || data.token;
  if (access) target.setItem(ACCESS_KEY, access);
  if (data.refreshToken) target.setItem(REFRESH_KEY, data.refreshToken);
  const rawUser = data.user || data.userDetails || data.profile || {};
  const name = rawUser.name || rawUser.fullName || data.name || data.fullName || data.username || loginUsername || "";
  const email = rawUser.email || data.email || loginUsername || "";
  const roles = rawUser.roles || data.roles || [];
  if (name || email || roles.length) target.setItem(USER_KEY, JSON.stringify({ ...rawUser, name: name || email, email, roles }));
}
export function clearAuth() {
  [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
}
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: "POST", headers: { "Content-Type": "text/plain" }, body: refreshToken
  });
  if (!response.ok) return false;
  const data = await response.json();
  const store = authStorage();
  if (data.accessToken || data.token) store.setItem(ACCESS_KEY, data.accessToken || data.token);
  if (data.refreshToken) store.setItem(REFRESH_KEY, data.refreshToken);
  if (data.user) store.setItem(USER_KEY, JSON.stringify(data.user));
  return Boolean(data.accessToken || data.token);
}
export async function apiRequest(path, options = {}) {
  const send = () => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}), ...options.headers }
  });
  let response = await send();
  if (response.status === 401 && !path.startsWith("/auth/") && await refreshAccessToken()) response = await send();
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearAuth();
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }
  return body;
}
export { API_BASE };
