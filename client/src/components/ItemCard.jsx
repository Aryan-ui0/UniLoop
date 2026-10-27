import { Link } from "react-router-dom";
import ItemImage from "./ItemImage.jsx";
import { AVAILABILITY_LABELS, formatPrice } from "../utils.js";

// children = optional extra buttons (used on My Listings)
export default function ItemCard({ item, children }) {
    return (
        <div className="item-card">
            <Link to={"/items/" + item._id} className="item-card-link">
                <ItemImage item={item} />
                <span className={"badge " + item.availability}>
                    {AVAILABILITY_LABELS[item.availability]}
                </span>
                <h3>{item.name}</h3>
                <p className="item-description">{item.description}</p>
                <p className="item-meta">
                    {item.category} · {item.condition}
                    {item.owner && item.owner.name && (
                        <> · {item.owner.name}{item.owner.hostel && ", " + item.owner.hostel}</>
                    )}
                </p>
                <p className="price">{formatPrice(item.pricePerDay)}</p>
            </Link>
            {children && <div className="card-actions">{children}</div>}
        </div>
    );
}
