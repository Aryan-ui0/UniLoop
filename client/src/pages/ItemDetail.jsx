import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ItemImage from "../components/ItemImage.jsx";
import { AVAILABILITY_LABELS, countDays, formatDate, formatPrice, toInputDate } from "../utils.js";

export default function ItemDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loadError, setLoadError] = useState("");

    const today = toInputDate(new Date());
    const [form, setForm] = useState({ startDate: today, endDate: today, message: "" });
    const [feedback, setFeedback] = useState({ type: "", text: "" });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api("/items/" + id)
            .then((data) => setItem(data.item))
            .catch((err) => setLoadError(err.message));
    }, [id]);

    if (loadError) {
        return (
            <section className="section empty-page">
                <div className="item-icon big">🔍</div>
                <h2>{loadError}</h2>
                <Link to="/" className="button">Back to browsing</Link>
            </section>
        );
    }
    if (!item) return <p className="page-status">Loading…</p>;

    const isOwner = user && item.owner && item.owner._id === user.id;
    const canDelete = user && (isOwner || user.role === "admin");
    const days = form.endDate >= form.startDate ? countDays(form.startDate, form.endDate) : 0;

    function update(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    async function sendRequest(event) {
        event.preventDefault();
        setFeedback({ type: "", text: "" });

        if (!form.startDate || !form.endDate) {
            setFeedback({ type: "error", text: "Please choose both dates." });
            return;
        }
        if (form.endDate < form.startDate) {
            setFeedback({ type: "error", text: "End date must be on or after the start date." });
            return;
        }

        setBusy(true);
        try {
            await api("/requests", { method: "POST", body: { itemId: item._id, ...form } });
            setFeedback({ type: "success", text: "Request sent! The owner will approve or decline it." });
            setForm({ startDate: today, endDate: today, message: "" });
        } catch (err) {
            setFeedback({ type: "error", text: err.message });
        } finally {
            setBusy(false);
        }
    }

    async function deleteItem() {
        if (!window.confirm("Delete \"" + item.name + "\"? This cannot be undone.")) return;
        try {
            await api("/items/" + item._id, { method: "DELETE" });
            navigate(isOwner ? "/my-listings" : "/");
        } catch (err) {
            setFeedback({ type: "error", text: err.message });
        }
    }

    return (
        <section className="section">
            <Link to="/" className="back-link">← Back to items</Link>

            <div className="detail">
                <ItemImage item={item} className="detail-image" />

                <div className="detail-info">
                    <span className={"badge " + item.availability}>{AVAILABILITY_LABELS[item.availability]}</span>
                    <h1>{item.name}</h1>
                    <p className="price big">{formatPrice(item.pricePerDay)}</p>
                    <p className="detail-description">{item.description}</p>

                    <dl className="detail-list">
                        <dt>Category</dt><dd>{item.category}</dd>
                        <dt>Condition</dt><dd>{item.condition}</dd>
                        {item.pickupLocation && <><dt>Pickup</dt><dd>{item.pickupLocation}</dd></>}
                        <dt>Owner</dt>
                        <dd>{item.owner ? item.owner.name + (item.owner.hostel ? " · " + item.owner.hostel : "") : "—"}</dd>
                        <dt>Listed</dt><dd>{formatDate(item.createdAt)}</dd>
                    </dl>

                    {isOwner && (
                        <div className="notice">
                            This is your listing. Manage it and its requests in{" "}
                            <Link to="/my-listings">My Listings</Link>.
                        </div>
                    )}

                    {!user && (
                        <div className="notice">
                            <Link to="/login" state={{ from: "/items/" + item._id }}>Log in</Link> to request this item.
                        </div>
                    )}

                    {user && !isOwner && item.availability === "unavailable" && (
                        <div className="notice">The owner has paused this item. Check back later.</div>
                    )}

                    {user && !isOwner && item.availability !== "unavailable" && (
                        <form className="request-box" onSubmit={sendRequest}>
                            <h3>Request this item</h3>
                            {item.availability === "reserved" && (
                                <p className="hint">Booked for some dates. Pick dates that don't overlap.</p>
                            )}
                            <div className="request-row">
                                <label>
                                    From
                                    <input type="date" name="startDate" min={today} value={form.startDate} onChange={update} />
                                </label>
                                <label>
                                    To
                                    <input type="date" name="endDate" min={form.startDate || today} value={form.endDate} onChange={update} />
                                </label>
                            </div>
                            <textarea
                                name="message"
                                rows="2"
                                maxLength="300"
                                placeholder="Message to the owner (optional)"
                                value={form.message}
                                onChange={update}
                            />
                            {days > 0 && (
                                <p className="hint">
                                    {days} day{days > 1 ? "s" : ""}
                                    {Number(item.pricePerDay) > 0 ? " · ≈ ₹" + days * item.pricePerDay + " total" : " · Free"}
                                </p>
                            )}
                            <button className="main-button" disabled={busy}>{busy ? "Sending…" : "Send Request"}</button>
                        </form>
                    )}

                    {feedback.text && (
                        <p className={feedback.type === "error" ? "form-error" : "form-success"} role="status">
                            {feedback.text}
                            {feedback.type === "success" && <> <Link to="/my-requests">View my requests →</Link></>}
                        </p>
                    )}

                    {canDelete && (
                        <button className="delete-button" onClick={deleteItem}>
                            {isOwner ? "Delete this item" : "Remove listing (admin)"}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
