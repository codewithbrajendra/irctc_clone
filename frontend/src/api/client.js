const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

const ACCESS_KEY = "railway_access_token";
const REFRESH_KEY = "railway_refresh_token";
const USER_KEY = "railway_user";

function storageWithAuth() {
  return localStorage.getItem(ACCESS_KEY) ? localStorage : sessionStorage;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
}

export function getCurrentUser() {
  const saved = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* recover from token claims below */ }
  }

  const token = getAccessToken();
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(normalized))));
    const username = payload.name || payload.fullName || payload.username || payload.email || payload.sub;
    return username ? { name: username, email: payload.email || payload.sub || "" } : null;
  } catch {
    return null;
  }
}

export function saveAuth(data, remember = true, loginUsername = "") {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(key => other.removeItem(key));

  if (data.accessToken) target.setItem(ACCESS_KEY, data.accessToken);
  if (data.refreshToken) target.setItem(REFRESH_KEY, data.refreshToken);

  const rawUser = data.user || data.userDetails || data.profile || {};
  const name = rawUser.name || rawUser.fullName || data.name || data.fullName ||
    data.username || loginUsername || "";
  const email = rawUser.email || data.email || loginUsername || "";
  if (name || email) target.setItem(USER_KEY, JSON.stringify({ ...rawUser, name: name || email, email }));
}

export function clearAuth() {
  [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }
  return body;
}

export { API_BASE };
