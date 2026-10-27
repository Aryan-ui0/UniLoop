import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "./AuthLayout.jsx";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const goTo = (location.state && location.state.from) || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to={goTo} replace />;

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please fill all fields.");
            return;
        }

        setBusy(true);
        try {
            await login(email.trim(), password);
            navigate(goTo, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout icon="🔄" title="Welcome back" subtitle="Log in to continue to UniLoop">
            <form onSubmit={handleSubmit} noValidate>
                <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="main-button" disabled={busy}>
                    {busy ? "Logging in…" : "Log in"}
                </button>

                {error && <p className="form-error" role="alert">{error}</p>}
            </form>

            <p className="switch-auth">
                New to UniLoop? <Link to="/register" state={location.state}>Create an account</Link>
            </p>
        </AuthLayout>
    );
}
