import { CATEGORY_ICONS } from "../utils.js";

// Shows the uploaded photo, or the category emoji if there isn't one
export default function ItemImage({ item, className = "item-image" }) {
    if (item.imageUrl) {
        return <img src={item.imageUrl} alt={item.name} className={className} />;
    }

    return (
        <div className={className + " placeholder"} aria-hidden="true">
            {CATEGORY_ICONS[item.category] || "📦"}
        </div>
    );
}
