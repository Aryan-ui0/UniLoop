import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wraps pages that need a login. Not logged in -> go to /login,
// and remember where the user was going so we can send them back.
export default function ProtectedRoute() {
    const { user, checking } = useAuth();
    const location = useLocation();

    if (checking) return <p className="page-status">Loading…</p>;

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
