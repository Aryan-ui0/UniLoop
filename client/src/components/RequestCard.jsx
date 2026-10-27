import { Link } from "react-router-dom";
import ItemImage from "./ItemImage.jsx";
import { STATUS_LABELS, countDays, formatDate, formatPrice } from "../utils.js";

// One rental request. "person" is the other side: the requester when
// you're the owner, or the owner when you made the request.
export default function RequestCard({ request, personLabel, person, children }) {
    const item = request.item;
    const days = countDays(request.startDate, request.endDate);

    return (
        <div className="request-card">
            {item ? (
                <Link to={"/items/" + item._id}>
                    <ItemImage item={item} className="request-thumb" />
                </Link>
            ) : (
                <div className="request-thumb placeholder">🗑️</div>
            )}

            <div className="request-info">
                <div className="request-top">
                    <h3>{item ? item.name : "Deleted item"}</h3>
                    <span className={"status " + request.status}>{STATUS_LABELS[request.status]}</span>
                </div>

                <p>
                    📅 {formatDate(request.startDate)} → {formatDate(request.endDate)}
                    {" "}({days} day{days > 1 ? "s" : ""})
                    {item && Number(item.pricePerDay) > 0 && (
                        <> · ≈ ₹{item.pricePerDay * days} total</>
                    )}
                    {item && Number(item.pricePerDay) === 0 && <> · {formatPrice(0)}</>}
                </p>

                {person && (
                    <p>
                        👤 {personLabel}: <strong>{person.name}</strong>
                        {person.hostel && " (" + person.hostel + ")"}
                        {person.email && <> · <a href={"mailto:" + person.email}>{person.email}</a></>}
                    </p>
                )}

                {request.message && <p className="request-message">“{request.message}”</p>}

                {children && <div className="request-actions">{children}</div>}
            </div>
        </div>
    );
}
