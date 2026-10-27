import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api.js";

// Shares the logged-in user with every component, so any page can
// call useAuth() instead of passing the user down through props.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // true until we've checked whether a saved token is still valid
    const [checking, setChecking] = useState(Boolean(getToken()));

    // On first load, turn a saved token back into a user
    useEffect(() => {
        if (!getToken()) return;

        api("/auth/me")
            .then((data) => setUser(data.user))
            .catch(() => setToken(null)) // expired or invalid
            .finally(() => setChecking(false));
    }, []);

    async function login(email, password) {
        const data = await api("/auth/login", { method: "POST", body: { email, password } });
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    async function register(details) {
        const data = await api("/auth/register", { method: "POST", body: details });
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    function logout() {
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, checking, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
