import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ItemCard from "../components/ItemCard.jsx";

const EMPTY_FILTERS = { search: "", category: "", availability: "", maxPrice: "", hostel: "", sort: "newest" };

export default function Home() {
    const { user } = useAuth();

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ total: 0, available: 0, hostels: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load the stats and category list once
    useEffect(() => {
        api("/items/meta").then((data) => setCategories(data.categories)).catch(() => {});

        api("/items").then((data) => {
            const hostels = new Set(data.items.map((i) => i.owner && i.owner.hostel).filter(Boolean));
            setStats({
                total: data.count,
                available: data.items.filter((i) => i.availability === "available").length,
                hostels: hostels.size
            });
        }).catch(() => {});
    }, []);

    // Reload items whenever a filter changes. The short delay means we don't
    // send a request for every single key typed in the search box.
    useEffect(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "") params.set(key, value);
        });

        setLoading(true);
        const timer = setTimeout(() => {
            api("/items?" + params.toString())
                .then((data) => {
                    setItems(data.items);
                    setError("");
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [filters]);

    function update(event) {
        setFilters({ ...filters, [event.target.name]: event.target.value });
    }

    const hasFilters = Object.keys(EMPTY_FILTERS).some((k) => k !== "sort" && filters[k] !== "");

    return (
        <>
            <section className="hero">
                <div className="hero-content">
                    <span className="small-label">HOSTEL SHARING MADE SIMPLE</span>
                    <h1>Everything you need.<br /><span>Already in your hostel.</span></h1>
                    <p>Borrow useful things from people around you, or share something you already have.</p>

                    <div className="hero-buttons">
                        <a href="#available" className="hero-button">Browse Items ↓</a>
                        <Link to={user ? "/my-listings" : "/register"} className="hero-button secondary">
                            {user ? "List an Item" : "Join UniLoop"}
                        </Link>
                    </div>
                </div>

                <div className="hero-illustration" aria-hidden="true">
                    <div className="floating-card card-one">🏸<br /><small>Badminton</small></div>
                    <div className="floating-card card-two">🖱️<br /><small>Mouse</small></div>
                    <div className="floating-card card-three">🔌<br /><small>Iron</small></div>
                    <div className="circle-logo">🔄</div>
                </div>
            </section>

            <section className="stats">
                <div className="stat"><h2>{stats.total}</h2><p>Items Listed</p></div>
                <div className="stat"><h2>{stats.available}</h2><p>Available Now</p></div>
                <div className="stat"><h2>{stats.hostels}</h2><p>Hostels Sharing</p></div>
            </section>

            <section id="available" className="section">
                <div className="section-heading">
                    <span className="small-label">BORROW SOMETHING</span>
                    <h2>Available Items</h2>
                    <p>Find something useful from people around your hostel.</p>
                </div>

                <div className="filter-bar">
                    <input
                        name="search"
                        className="filter-search"
                        placeholder="🔎 Search items…"
                        value={filters.search}
                        onChange={update}
                        aria-label="Search items"
                    />
                    <select name="category" value={filters.category} onChange={update} aria-label="Category">
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select name="availability" value={filters.availability} onChange={update} aria-label="Availability">
                        <option value="">Any availability</option>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                    </select>
                    <input
                        name="maxPrice"
                        type="number"
                        min="0"
                        placeholder="Max ₹/day"
                        value={filters.maxPrice}
                        onChange={update}
                        aria-label="Maximum price per day"
                    />
                    <input name="hostel" placeholder="Hostel" value={filters.hostel} onChange={update} aria-label="Hostel" />
                    <select name="sort" value={filters.sort} onChange={update} aria-label="Sort by">
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="price_asc">Price: low to high</option>
                        <option value="price_desc">Price: high to low</option>
                    </select>
                    {hasFilters && (
                        <button className="button-light" onClick={() => setFilters(EMPTY_FILTERS)}>Clear</button>
                    )}
                </div>

                {error && <p className="form-error center">{error}</p>}

                {!error && !loading && items.length === 0 && (
                    <div className="empty-state">
                        <div className="item-icon">📭</div>
                        <h3>{hasFilters ? "No items match your filters" : "No items listed yet"}</h3>
                        <p>{hasFilters ? "Try clearing some filters." : "Be the first to share something!"}</p>
                    </div>
                )}

                <div className={"items-container" + (loading ? " loading" : "")}>
                    {items.map((item) => <ItemCard key={item._id} item={item} />)}
                </div>
            </section>

            <section id="how-it-works" className="how-section">
                <div className="section-heading">
                    <span className="small-label">SIMPLE AS 1-2-3</span>
                    <h2>How UniLoop Works</h2>
                    <p>Making hostel life a little easier, one item at a time.</p>
                </div>

                <div className="steps">
                    <div className="step">
                        <div className="step-number">01</div>
                        <div className="step-icon">🔎</div>
                        <h3>Find</h3>
                        <p>Look through items shared by people in your hostel.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">02</div>
                        <div className="step-icon">📝</div>
                        <h3>Request</h3>
                        <p>Pick your dates and send a request. The owner approves or declines it.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">03</div>
                        <div className="step-icon">🤝</div>
                        <h3>Share</h3>
                        <p>Collect the item, use it, and return it on time.</p>
                    </div>
                </div>
            </section>
        </>
    );
}
