import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import RequestCard from "../components/RequestCard.jsx";

const TABS = [
    { key: "open", label: "Open", statuses: ["pending", "approved", "active"] },
    { key: "done", label: "History", statuses: ["completed", "rejected", "cancelled"] }
];

export default function MyRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("open");
    const [message, setMessage] = useState({ type: "", text: "" });

    async function load() {
        try {
            const data = await api("/requests/sent");
            setRequests(data.requests);
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function cancel(request) {
        if (!window.confirm("Cancel your request for \"" + (request.item ? request.item.name : "this item") + "\"?")) return;
        try {
            await api("/requests/" + request._id + "/status", { method: "PATCH", body: { status: "cancelled" } });
            setMessage({ type: "success", text: "Request cancelled." });
            load();
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        }
    }

    const current = TABS.find((t) => t.key === tab);
    const shown = requests.filter((r) => current.statuses.includes(r.status));

    if (loading) return <p className="page-status">Loading…</p>;

    return (
        <section className="section page-top">
            <div className="section-heading">
                <span className="small-label">THINGS YOU ASKED FOR</span>
                <h2>My Requests</h2>
                <p>Track the items you've asked to borrow.</p>
            </div>

            {message.text && (
                <p className={(message.type === "error" ? "form-error" : "form-success") + " center"} role="status">
                    {message.text}
                </p>
            )}

            <div className="tabs" role="tablist">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        className={tab === t.key ? "tab active" : "tab"}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}{" "}
                        <span className="tab-count">{requests.filter((r) => t.statuses.includes(r.status)).length}</span>
                    </button>
                ))}
            </div>

            <div className="request-list">
                {shown.length === 0 && (
                    <div className="empty-state">
                        <div className="item-icon">📋</div>
                        <h3>{tab === "open" ? "No open requests" : "No past requests"}</h3>
                        <p><Link to="/">Browse items</Link> to find something to borrow.</p>
                    </div>
                )}

                {shown.map((r) => (
                    <RequestCard key={r._id} request={r} personLabel="Owner" person={r.owner}>
                        {(r.status === "pending" || r.status === "approved") && (
                            <button className="delete-button" onClick={() => cancel(r)}>Cancel request</button>
                        )}
                        {r.status === "approved" && (
                            <span className="hint">Approved! Contact the owner to arrange pickup.</span>
                        )}
                    </RequestCard>
                ))}
            </div>
        </section>
    );
}
