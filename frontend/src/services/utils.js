export const API_BASE = (
  process.env.DEV_API_BASE_URL || "https://shepherd-mas-dev.fly.dev/"
).replace(/\/+$/, "");

export const getSocketUrl = (runId) => {
  if (!runId) return null;
  const u = new URL(API_BASE);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = u.pathname.replace(/\/$/, "") + `/ws/${runId}`;
  return u.toString();
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
