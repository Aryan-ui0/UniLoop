import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <header className="navbar">
            <Link to="/" className="logo">Uni<span>Loop</span></Link>

            <nav>
                <NavLink to="/" end>Browse</NavLink>
                {user && <NavLink to="/my-listings">My Listings</NavLink>}
                {user && <NavLink to="/my-requests">My Requests</NavLink>}
            </nav>

            <div className="nav-user">
                {user ? (
                    <>
                        <span className="profile" title={user.email}>
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="nav-name">
                            {user.name}
                            {user.role === "admin" && <small className="admin-tag">admin</small>}
                        </span>
                        <button className="button-light small" onClick={handleLogout}>Log out</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-login">Log in</Link>
                        <Link to="/register" className="button small">Sign up</Link>
                    </>
                )}
            </div>
        </header>
    );
}
