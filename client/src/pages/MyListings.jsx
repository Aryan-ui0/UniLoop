import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import ItemCard from "../components/ItemCard.jsx";
import ItemForm from "../components/ItemForm.jsx";
import RequestCard from "../components/RequestCard.jsx";

const TABS = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "active", label: "Borrowed" },
    { key: "done", label: "History" }
];
const DONE = ["completed", "rejected", "cancelled"];

export default function MyListings() {
    const [items, setItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [tab, setTab] = useState("pending");
    const [message, setMessage] = useState({ type: "", text: "" });
    const formRef = useRef(null);

    async function load() {
        try {
            const [mine, received] = await Promise.all([api("/items/mine"), api("/requests/received")]);
            setItems(mine.items);
            setRequests(received.requests);
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function flash(text, type = "success") {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    }

    function startEditing(item) {
        setEditing(item);
        formRef.current.scrollIntoView({ behavior: "smooth" });
    }

    function handleSaved(item) {
        flash(editing ? "Item updated." : "“" + item.name + "” is now listed!");
        setEditing(null);
        load();
    }

    async function deleteItem(item) {
        if (!window.confirm("Delete \"" + item.name + "\"? This cannot be undone.")) return;
        try {
            await api("/items/" + item._id, { method: "DELETE" });
            if (editing && editing._id === item._id) setEditing(null);
            flash("Item deleted.");
            load();
        } catch (err) {
            flash(err.message, "error");
        }
    }

    async function changeStatus(request, status) {
        try {
            await api("/requests/" + request._id + "/status", { method: "PATCH", body: { status } });
            flash("Request marked " + status + ".");
            load(); // approving may auto-reject others and change availability
        } catch (err) {
            flash(err.message, "error");
        }
    }

    const shown = requests.filter((r) => (tab === "done" ? DONE.includes(r.status) : r.status === tab));
    const countFor = (key) => requests.filter((r) => (key === "done" ? DONE.includes(r.status) : r.status === key)).length;

    if (loading) return <p className="page-status">Loading…</p>;

    return (
        <>
            <section className="section page-top">
                <div className="section-heading">
                    <span className="small-label">YOUR SHELF</span>
                    <h2>My Listings</h2>
                    <p>Share your items and respond to requests from other students.</p>
                </div>

                {message.text && (
                    <p className={(message.type === "error" ? "form-error" : "form-success") + " center"} role="status">
                        {message.text}
                    </p>
                )}

                <h2 className="sub-heading">Requests for your items</h2>

                <div className="tabs" role="tablist">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            className={tab === t.key ? "tab active" : "tab"}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label} <span className="tab-count">{countFor(t.key)}</span>
                        </button>
                    ))}
                </div>

                <div className="request-list">
                    {shown.length === 0 && <p className="empty-line">Nothing here right now.</p>}

                    {shown.map((r) => (
                        <RequestCard key={r._id} request={r} personLabel="Requested by" person={r.requester}>
                            {r.status === "pending" && (
                                <>
                                    <button onClick={() => changeStatus(r, "approved")}>Approve</button>
                                    <button className="delete-button" onClick={() => changeStatus(r, "rejected")}>Reject</button>
                                </>
                            )}
                            {r.status === "approved" && (
                                <button onClick={() => changeStatus(r, "active")}>Mark handed over</button>
                            )}
                            {r.status === "active" && (
                                <button onClick={() => changeStatus(r, "completed")}>Mark returned</button>
                            )}
                        </RequestCard>
                    ))}
                </div>
            </section>

            <section className="section request-section">
                <div ref={formRef} className="form-anchor">
                    <ItemForm item={editing} onSaved={handleSaved} onCancel={editing ? () => setEditing(null) : null} />
                </div>

                <h2 className="sub-heading">Your items ({items.length})</h2>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <div className="item-icon">📦</div>
                        <h3>You haven't listed anything yet</h3>
                        <p>Use the form above to share your first item.</p>
                    </div>
                ) : (
                    <div className="items-container">
                        {items.map((item) => (
                            <ItemCard key={item._id} item={item}>
                                <button className="item-button" onClick={() => startEditing(item)}>Edit</button>
                                <button className="delete-button" onClick={() => deleteItem(item)}>Delete</button>
                            </ItemCard>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
