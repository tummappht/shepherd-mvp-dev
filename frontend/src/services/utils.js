export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://mas-v2-dev.fly.dev/"
).replace(/\/+$/, "");

export const getSocketUrl = (runId) => {
  if (!runId) return null;
  const u = new URL(API_BASE);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = u.pathname.replace(/\/$/, "") + `/ws/${runId}`;
  return u.toString();
};

// Token cache with timestamp
let tokenCache = {
  token: null,
  expiresAt: null,
  fetchedAt: null,
};

const getAuthToken = async () => {
  const now = Math.floor(Date.now() / 1000);

  // Check if cached token is still valid (has >5 minutes left)
  if (
    tokenCache.token &&
    tokenCache.expiresAt &&
    tokenCache.expiresAt > now + 300
  ) {
    return tokenCache.token;
  }

  // Fetch new token
  try {
    const tokenResponse = await fetch("/api/auth/token");
    if (tokenResponse.ok) {
      const { token, expiresAt } = await tokenResponse.json();
      if (token) {
        tokenCache = {
          token,
          expiresAt,
          fetchedAt: now,
        };
        return token;
      }
    } else if (tokenResponse.status === 401) {
      // Clear cache if unauthorized
      tokenCache = { token: null, expiresAt: null, fetchedAt: null };
    }
  } catch (error) {
    console.warn("Failed to get auth token:", error);
  }

  return null;
};

// Clear token cache (useful for logout)
export const clearAuthToken = () => {
  tokenCache = { token: null, expiresAt: null, fetchedAt: null };
};

export const callService = async (path, options = {}) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    options.headers = {
      ...options.headers,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  // Get JWT token (cached or fresh)
  let authHeaders = {};
  if (typeof window !== "undefined") {
    const token = await getAuthToken();
    if (token) {
      authHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const config = {
    headers: {
      ...options.headers,
      ...authHeaders,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type");

    let data;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else if (contentType?.includes("text/")) {
      data = await response.text();
    } else {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.message || "Unknown error");
      error.status = response.status;
      throw error;
    }

    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    throw error;
  }
};

export const get = (path, options = {}) =>
  callService(path, { ...options, method: "GET" });

export const post = (path, body, options = {}) =>
  callService(path, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const put = (path, body, options = {}) =>
  callService(path, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const del = (path, options = {}) =>
  callService(path, { ...options, method: "DELETE" });

export const patch = (path, body, options = {}) =>
  callService(path, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
