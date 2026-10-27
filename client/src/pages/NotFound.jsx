import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <section className="section empty-page">
            <div className="item-icon big">🧭</div>
            <h2>Page not found</h2>
            <p>The page you're looking for doesn't exist.</p>
            <Link to="/" className="button">Back to browsing</Link>
        </section>
    );
}
