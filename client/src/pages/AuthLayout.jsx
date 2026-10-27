// Shared two-column layout for the Login and Register pages
export default function AuthLayout({ icon, title, subtitle, children }) {
    return (
        <div className="login-page">
            <div className="login-left">
                <div className="brand">UniLoop</div>
                <h1>Your hostel.<br />Your community.</h1>
                <p>Share everyday items, borrow what you need, and make hostel life easier.</p>

                <div className="login-features">
                    <span>🏸 Share items</span>
                    <span>🤝 Help each other</span>
                    <span>🏠 Built for hostels</span>
                </div>
            </div>

            <div className="login-box">
                <div className="login-icon">{icon}</div>
                <h2>{title}</h2>
                <p>{subtitle}</p>
                {children}
            </div>
        </div>
    );
}
