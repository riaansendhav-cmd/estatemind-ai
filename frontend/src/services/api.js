import { mockDashboard, mockProperties } from "./mockData";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const STORAGE_KEY = "estatemind_user_properties";
const SAVED_KEY = "estatemind_saved_property_ids";
const SESSION_KEY = "estatemind_session";
const USERS_KEY = "estatemind_local_users";

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function userKey(base) {
  const session = getSession();
  return `${base}_${session?.user?.id || "guest"}`;
}

function savedIds() {
  try {
    return JSON.parse(localStorage.getItem(userKey(SAVED_KEY)) || "[]");
  } catch {
    return [];
  }
}

function writeSavedIds(ids) {
  localStorage.setItem(userKey(SAVED_KEY), JSON.stringify([...new Set(ids)]));
}

function applySavedState(items) {
  const ids = new Set(savedIds());
  return items.map((item) => ({ ...item, saved: ids.has(item.id) }));
}

function storedProperties() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const cleaned = parsed.filter((item) => {
      const amenities = (item.amenities || []).join(", ");
      return !(item.title === "My Premium Apartment" && amenities === "Gym, Security, Balcony");
    });
    if (cleaned.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch {
    return [];
  }
}

function saveStoredProperty(property) {
  const items = [property, ...storedProperties()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function updateStoredPropertySaved(id, saved) {
  const items = storedProperties().map((item) => (item.id === id ? { ...item, saved } : item));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function localPrediction(payload) {
  const predicted = Math.round((payload.area * 9200) + (payload.bedrooms * 325000) + (payload.bathrooms * 225000) + (payload.parking * 175000));
  return {
    predicted_price: predicted,
    confidence: 78,
    range_low: Math.round(predicted * 0.86),
    range_high: Math.round(predicted * 1.14),
    model_name: "AI valuation model",
    offline: true,
    chart: [
      { label: "Low", value: Math.round(predicted * 0.86) },
      { label: "Prediction", value: predicted },
      { label: "High", value: Math.round(predicted * 1.14) },
    ],
  };
}

function localProperty(payload) {
  const session = getSession();
  return {
    ...payload,
    id: `${payload.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    image: payload.image || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    listing_status: payload.listing_status || "For Sale",
    property_type: payload.property_type || "Apartment",
    seller_name: payload.seller_name || session?.user?.name || "Owner",
    owner_id: session?.user?.id || "local-owner",
    saved: false,
    published: true,
    offline: true,
  };
}

async function request(path, options = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const session = getSession();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
    signal: controller.signal,
    ...options,
  }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

function localUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function localAuthSession(payload, mode) {
  const email = payload.email.toLowerCase().trim();
  const users = localUsers();
  let user = users.find((item) => item.email === email);

  if (mode === "register") {
    if (user) throw new Error("Email already registered");
    user = {
      id: `local-${Date.now()}`,
      name: payload.name?.trim() || email.split("@")[0],
      email,
      password: payload.password,
    };
    writeLocalUsers([...users, user]);
  } else if (!user || user.password !== payload.password) {
    throw new Error("Invalid email or password");
  }

  const session = {
    user: { id: user.id, name: user.name, email: user.email },
    token: `local-token-${user.id}`,
    local: true,
  };
  setSession(session);
  return session;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }, 5000)
    .then((session) => {
      setSession(session);
      return session;
    })
    .catch(() => localAuthSession(payload, "register")),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }, 5000)
    .then((session) => {
      setSession(session);
      return session;
    })
    .catch(() => localAuthSession(payload, "login")),
  me: () => {
    const session = getSession();
    if (!session) return Promise.resolve(null);
    if (session.local) return Promise.resolve(session);
    return request("/api/auth/me").then(({ user }) => ({ ...session, user })).catch(() => session);
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    return Promise.resolve();
  },
  getProperties: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) search.set(key, value);
    });
    return request(`/api/properties?${search.toString()}`).catch(() => {
      let items = [...storedProperties(), ...mockProperties];
      if (params.search) {
        const needle = params.search.toLowerCase();
        items = items.filter((item) => {
          const haystack = `${item.title} ${item.location} ${item.seller_name || ""}`.toLowerCase();
          return haystack.includes(needle);
        });
      }
      if (params.location) items = items.filter((item) => item.location === params.location);
      if (params.property_type) items = items.filter((item) => item.property_type === params.property_type);
      if (params.furnishing) items = items.filter((item) => item.furnishing === params.furnishing);
      if (params.bedrooms) items = items.filter((item) => item.bedrooms === Number(params.bedrooms));
      if (params.max_price) items = items.filter((item) => item.price <= Number(params.max_price));
      if (params.sort === "price_asc") items.sort((a, b) => a.price - b.price);
      if (params.sort === "price_desc") items.sort((a, b) => b.price - a.price);
      if (params.sort === "area_desc") items.sort((a, b) => b.area - a.area);
      items = applySavedState(items);
      return { items, count: items.length, offline: true };
    });
  },
  toggleSaved: async (id) => {
    const ids = savedIds();
    const nextSaved = !ids.includes(id);
    writeSavedIds(nextSaved ? [...ids, id] : ids.filter((savedId) => savedId !== id));
    updateStoredPropertySaved(id, nextSaved);
    request(`/api/properties/${id}/save`, { method: "POST" }).catch(() => null);
    return { property_id: id, saved: nextSaved };
  },
  createProperty: async (payload) => {
    const property = localProperty(payload);
    saveStoredProperty(property);
    request("/api/properties", { method: "POST", body: JSON.stringify(payload) }, 1200).catch(() => null);
    return property;
  },
  predict: (payload) => request("/api/predict", { method: "POST", body: JSON.stringify(payload) }, 8000).catch(() => localPrediction(payload)),
  recommend: (payload) => request("/api/recommendations", { method: "POST", body: JSON.stringify(payload) }).catch(() => {
    const items = mockProperties
      .map((item) => ({
        ...item,
        match_score: Math.max(62, Math.min(96, 70 + (item.location === payload.location ? 14 : 0) + (item.bedrooms === payload.bedrooms ? 8 : 0))),
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 4);
    return { items, count: items.length, offline: true };
  }),
  dashboard: () => request("/api/dashboard").catch(() => {
    const dashboard = mockDashboard();
    const all = applySavedState([...storedProperties(), ...mockProperties]);
    dashboard.saved_properties = all.filter((item) => item.saved);
    dashboard.stats.saved = dashboard.saved_properties.length;
    return dashboard;
  }),
};
