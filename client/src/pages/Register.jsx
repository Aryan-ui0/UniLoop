import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "./AuthLayout.jsx";

export default function Register() {
    const { user, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const goTo = (location.state && location.state.from) || "/";

    const [form, setForm] = useState({ name: "", email: "", hostel: "", password: "", confirm: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to={goTo} replace />;

    function update(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    function validate() {
        if (!form.name.trim() || !form.email.trim() || !form.password) return "Please fill name, email and password.";
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Please enter a valid email.";
        if (form.password.length < 6) return "Password must be at least 6 characters.";
        if (form.password !== form.confirm) return "Passwords do not match.";
        return "";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const problem = validate();
        setError(problem);
        if (problem) return;

        setBusy(true);
        try {
            await register({
                name: form.name.trim(),
                email: form.email.trim(),
                hostel: form.hostel.trim(),
                password: form.password
            });
            navigate(goTo, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout icon="👋" title="Create your account" subtitle="Join your hostel's sharing community">
            <form onSubmit={handleSubmit} noValidate>
                <input name="name" placeholder="Full name" autoComplete="name" value={form.name} onChange={update} />
                <input name="email" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={update} />
                <input name="hostel" placeholder="Hostel / block (optional)" value={form.hostel} onChange={update} />
                <input name="password" type="password" placeholder="Password (min 6 characters)" autoComplete="new-password" value={form.password} onChange={update} />
                <input name="confirm" type="password" placeholder="Confirm password" autoComplete="new-password" value={form.confirm} onChange={update} />

                <button className="main-button" disabled={busy}>
                    {busy ? "Creating account…" : "Sign up"}
                </button>

                {error && <p className="form-error" role="alert">{error}</p>}
            </form>

            <p className="switch-auth">
                Already have an account? <Link to="/login" state={location.state}>Log in</Link>
            </p>
        </AuthLayout>
    );
}
