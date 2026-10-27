// Small helper around fetch() that every page uses to talk to the API.
// - Adds the login token to every request
// - Sends JSON, or FormData when uploading an image
// - Throws an Error with the server's message when something fails

const TOKEN_KEY = "uniloopToken";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
    const { method = "GET", body } = options;
    const headers = {};

    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    let payload;
    if (body instanceof FormData) {
        payload = body; // browser sets the multipart Content-Type itself
    } else if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch("/api" + path, { method, headers, body: payload });
    } catch {
        throw new Error("Cannot reach the server. Is it running?");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || "Something went wrong.");
        error.status = response.status;
        throw error;
    }

    return data;
}
