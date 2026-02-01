import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in .env");
}

const API_PREFIX = "/api";

async function request(path, { method = "GET", body, headers } = {}) {
  const token = await SecureStore.getItemAsync("token");

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text; // if backend returns non-JSON
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed: ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // ---- Health / ping (you may need to change this path)
  health: () => request("/health"),

  // ---- Auth (edit paths + fields to match your backend)
  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    // Expecting { token: "..." } from backend
    if (data?.token) await SecureStore.setItemAsync("token", data.token);
    return data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
  },

  // ---- Example resource calls (edit paths to match your backend)
  getCases: () => request("/cases"),
  getCaseById: (id) => request(`/cases/${id}`),

  // Example: create a case
  createCase: (payload) =>
    request("/cases", { method: "POST", body: payload }),
};
