const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8081";
const ACCESS_KEY = "railway_access_token";
const REFRESH_KEY = "railway_refresh_token";
const USER_KEY = "railway_user";
const AUTH_EVENT = "railway-auth-change";

function authStorage() {
  return localStorage.getItem(ACCESS_KEY) ? localStorage : sessionStorage;
}
export function getAccessToken() {
  return authStorage().getItem(ACCESS_KEY);
}
function tokenPayload(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
  } catch { return null; }
}
function tokenIsUnexpired(token) {
  const payload = tokenPayload(token);
  return typeof payload?.exp === "number" && payload.exp * 1000 > Date.now();
}
export function hasSession() {
  return tokenIsUnexpired(getAccessToken());
}
export function subscribeAuth(listener) {
  window.addEventListener(AUTH_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(AUTH_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
function notifyAuth() { window.dispatchEvent(new Event(AUTH_EVENT)); }
export function getCurrentUser() {
  try { return JSON.parse(authStorage().getItem(USER_KEY)) || null; }
  catch { return null; }
}
export function hasRole(role) {
  if (!hasSession()) return false;
  const user = getCurrentUser();
  const roles = user?.roles || user?.authorities || [];
  const normalize = value => String(value || "").toUpperCase().replace(/^ROLE_/, "");
  return Array.isArray(roles) && roles.some(item =>
    normalize(typeof item === "string" ? item : item?.name || item?.authority) === normalize(role));
}
export function saveAuth(data, remember = true, loginUsername = "") {
  const access = data.accessToken || data.token;
  if (!tokenIsUnexpired(access)) throw new Error("The server did not return a valid access token.");
  const rawUser = data.user || data.userDetails || data.profile || {};
  const user = {
    name: rawUser.name || rawUser.fullName || data.name || data.fullName || loginUsername || rawUser.email || "",
    email: rawUser.email || data.email || loginUsername || "",
    roles: rawUser.roles || rawUser.authorities || data.roles || [],
  };
  // Persist only the profile fields needed by the UI, never a password from the DTO.
  [localStorage, sessionStorage].forEach(store => {
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(key => store.removeItem(key));
  });
  const target = remember ? localStorage : sessionStorage;
  target.setItem(ACCESS_KEY, access);
  if (data.refreshToken) target.setItem(REFRESH_KEY, data.refreshToken);
  target.setItem(USER_KEY, JSON.stringify(user));
  notifyAuth();
}
export function clearAuth() {
  [localStorage, sessionStorage].forEach(store => {
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(key => store.removeItem(key));
  });
  ["railway_search", "railway_selected_train"].forEach(key => sessionStorage.removeItem(key));
  notifyAuth();
}
let refreshPromise;
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const store = authStorage();
  const refreshToken = store.getItem(REFRESH_KEY);
  if (!tokenIsUnexpired(refreshToken)) { clearAuth(); return false; }
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: "POST", headers: { "Content-Type": "text/plain" }, body: refreshToken
      });
      // Ignore a response belonging to a session that has since logged out or changed.
      if (store.getItem(REFRESH_KEY) !== refreshToken) return false;
      if (!response.ok) { clearAuth(); return false; }
      const data = await response.json();
      if (store.getItem(REFRESH_KEY) !== refreshToken) return false;
      saveAuth({ ...data, user: data.user || getCurrentUser() }, store === localStorage);
      return true;
    } catch {
      if (store.getItem(REFRESH_KEY) === refreshToken) clearAuth();
      return false;
    }
  })();
  try { return await refreshPromise; }
  finally { refreshPromise = undefined; }
}
export async function ensureSession() {
  return hasSession() || await refreshAccessToken();
}
async function authenticatedResponse(path, options = {}) {
  const protectedRequest = !path.startsWith("/auth/");
  if (protectedRequest && !await ensureSession()) throw new Error("Your session has expired. Please sign in again.");
  const send = () => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(protectedRequest && getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}), ...options.headers }
  });
  let response = await send();
  if (response.status === 401 && protectedRequest && await refreshAccessToken()) response = await send();
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && protectedRequest) clearAuth();
    throw new Error(body.message || body.error || Object.values(body).filter(v => typeof v === "string").join(" ") || `Request failed (${response.status})`);
  }
  return response;
}
export async function apiRequest(path, options = {}) {
  const response = await authenticatedResponse(path, options);
  return response.json().catch(() => ({}));
}
export async function apiDownload(path, options = {}) {
  const response = await authenticatedResponse(path, {
    ...options, headers: { Accept: "application/pdf, application/json", ...options.headers },
  });
  if (!response.headers.get("Content-Type")?.toLowerCase().startsWith("application/pdf")) {
    throw new Error("The server did not return a PDF ticket. Please try again.");
  }
  return response.blob();
}
export { API_BASE };
