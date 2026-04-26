const BASE_URL = "http://localhost:4000/api";

const getAccessToken = () => {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

const buildHeaders = (hasBody = false) => {
  const headers = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const normalizeBackendError = (payload, fallbackMessage) => {
  const backendMessage =
    payload?.error?.message ||
    payload?.message ||
    fallbackMessage ||
    "Request failed";

  const error = new Error(String(backendMessage));
  error.code = payload?.error?.code || "API_ERROR";
  error.details = payload?.error?.details ?? null;
  error.payload = payload ?? null;
  return error;
};

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const request = async (method, url, body) => {
  const fullUrl = `${BASE_URL}${url}`;
  const hasBody = body !== undefined && body !== null;

  let response;
  try {
    response = await fetch(fullUrl, {
      method,
      headers: buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Network error");
  }

  const payload = await safeJson(response);

  // Preferred backend contract: { success, data, error }
  if (payload && typeof payload.success === "boolean") {
    if (payload.success) {
      return payload.data;
    }
    throw normalizeBackendError(payload, "Request failed");
  }

  // Backward compatibility: if endpoint still returns raw JSON on success.
  if (response.ok) {
    return payload;
  }

  throw normalizeBackendError(payload, `HTTP ${response.status}`);
};

const get = (url) => request("GET", url);
const post = (url, body) => request("POST", url, body);
const patch = (url, body) => request("PATCH", url, body);
const del = (url) => request("DELETE", url);

export const apiClient = {
  get,
  post,
  patch,
  delete: del,
};

export { get, post, patch, del as deleteRequest };

