export const CATEGORY_ICONS = {
    Sports: "🏸",
    Electronics: "🖱️",
    Appliances: "🔌",
    Books: "📚",
    Stationery: "✏️",
    Clothing: "👕",
    Other: "📦"
};

export const STATUS_LABELS = {
    pending: "🟡 Pending",
    approved: "🟢 Approved",
    rejected: "🔴 Rejected",
    cancelled: "⚪ Cancelled",
    active: "🔵 Borrowed",
    completed: "✅ Returned"
};

export const AVAILABILITY_LABELS = {
    available: "Available",
    reserved: "Reserved",
    unavailable: "Unavailable"
};

export function formatPrice(price) {
    return Number(price) === 0 ? "Free" : "₹" + price + " / day";
}

export function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Number of days including both the first and last day
export function countDays(start, end) {
    const ms = new Date(end) - new Date(start);
    return Math.round(ms / 86400000) + 1;
}

// "YYYY-MM-DD" for <input type="date">, in local time
export function toInputDate(date) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}
