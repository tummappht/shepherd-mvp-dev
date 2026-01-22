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

// Pending token fetch promise to prevent concurrent requests
let tokenFetchPromise = null;

// Initialize cache from sessionStorage on load
if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
  try {
    const cached = sessionStorage.getItem("auth_token_cache");
    if (cached) {
      tokenCache = JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Failed to load token from sessionStorage:", e);
  }
}

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

  // If a token fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Fetch new token with mutex pattern
  tokenFetchPromise = (async () => {
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

          // Persist to sessionStorage
          if (typeof sessionStorage !== "undefined") {
            try {
              sessionStorage.setItem(
                "auth_token_cache",
                JSON.stringify(tokenCache),
              );
            } catch (e) {
              console.warn("Failed to save token to sessionStorage:", e);
            }
          }

          return token;
        }
      } else if (tokenResponse.status === 401) {
        // Clear cache if unauthorized
        tokenCache = { token: null, expiresAt: null, fetchedAt: null };
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("auth_token_cache");
        }
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    } finally {
      tokenFetchPromise = null;
    }

    return null;
  })();

  return tokenFetchPromise;
};

// Clear token cache (useful for logout)
export const clearAuthToken = () => {
  tokenCache = { token: null, expiresAt: null, fetchedAt: null };
  tokenFetchPromise = null;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("auth_token_cache");
  }
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

  const config = {
    headers: {
      ...options.headers,
    },
    ...options,
  };

  // Get JWT token (cached or fresh)
  if (typeof window !== "undefined") {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

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

    return data;
    // return {
    //   success: true,
    //   status: response.status,
    //   data,
    // };
  } catch (error) {
    throw error;
  }
};

export const get = (path, options = {}) => {
  let url = path;
  if (options.params && typeof options.params === "object") {
    const searchParams = new URLSearchParams(options.params).toString();
    url += (url.includes("?") ? "&" : "?") + searchParams;
    const { params, ...rest } = options;
    options = rest;
  }
  return callService(url, { ...options, method: "GET" });
};

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
