import { useEffect, useState } from "react";
import { api } from "../api.js";

const BLANK = {
    name: "",
    description: "",
    category: "Other",
    condition: "Good",
    pricePerDay: "",
    pickupLocation: "",
    availability: "available"
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Used for both "list a new item" and "edit item".
// item = the item being edited, or null for a new one.
export default function ItemForm({ item, onSaved, onCancel }) {
    const [options, setOptions] = useState({ categories: [], conditions: [] });
    const [form, setForm] = useState(BLANK);
    const [image, setImage] = useState(null);       // File chosen by the user
    const [preview, setPreview] = useState("");     // URL shown in the <img>
    const [removeImage, setRemoveImage] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api("/items/meta").then(setOptions).catch(() => {});
    }, []);

    // Fill the form when we start editing a different item
    useEffect(() => {
        if (item) {
            setForm({
                name: item.name,
                description: item.description,
                category: item.category,
                condition: item.condition,
                pricePerDay: String(item.pricePerDay),
                pickupLocation: item.pickupLocation || "",
                availability: item.availability
            });
            setPreview(item.imageUrl || "");
        } else {
            setForm(BLANK);
            setPreview("");
        }
        setImage(null);
        setRemoveImage(false);
        setError("");
    }, [item]);

    // Free the temporary preview URL when it's no longer needed
    useEffect(() => {
        return () => {
            if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function update(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    function chooseImage(event) {
        const file = event.target.files[0];
        event.target.value = ""; // allow choosing the same file again
        if (!file) return;

        if (!IMAGE_TYPES.includes(file.type)) {
            setError("Only JPG, PNG, WEBP or GIF images are allowed.");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setError("Image must be 2 MB or smaller.");
            return;
        }

        setError("");
        setImage(file);
        setRemoveImage(false);
        setPreview(URL.createObjectURL(file));
    }

    function clearImage() {
        setImage(null);
        setPreview("");
        setRemoveImage(true);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!form.name.trim() || !form.description.trim() || form.pricePerDay === "") {
            setError("Please fill name, description and price.");
            return;
        }
        if (Number(form.pricePerDay) < 0 || isNaN(Number(form.pricePerDay))) {
            setError("Price must be 0 (free) or more.");
            return;
        }

        // FormData lets us send text fields and the image file together
        // (multipart/form-data), which is what Multer on the server reads.
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (key === "availability" && !item) return;
            data.append(key, typeof value === "string" ? value.trim() : value);
        });
        if (image) data.append("image", image);
        if (item && removeImage && !image) data.append("removeImage", "true");

        setBusy(true);
        try {
            const result = item
                ? await api("/items/" + item._id, { method: "PUT", body: data })
                : await api("/items", { method: "POST", body: data });

            if (!item) {
                setForm(BLANK);
                setImage(null);
                setPreview("");
            }
            onSaved(result.item);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="item-form" onSubmit={handleSubmit} noValidate>
            <h3>{item ? "Edit “" + item.name + "”" : "List a new item"}</h3>

            <div className="item-form-grid">
                <div className="image-picker">
                    {preview ? (
                        <img src={preview} alt="Item preview" />
                    ) : (
                        <div className="image-empty">📷<small>No photo</small></div>
                    )}
                    <label className="button-light file-label">
                        {preview ? "Change photo" : "Add photo"}
                        <input type="file" accept={IMAGE_TYPES.join(",")} onChange={chooseImage} hidden />
                    </label>
                    {preview && (
                        <button type="button" className="link-button" onClick={clearImage}>Remove photo</button>
                    )}
                    <small className="hint">JPG, PNG, WEBP or GIF · max 2 MB</small>
                </div>

                <div className="form-fields">
                    <label>
                        Item name *
                        <input name="name" maxLength="60" value={form.name} onChange={update} placeholder="e.g. Badminton racket" />
                    </label>
                    <label>
                        Description *
                        <textarea name="description" rows="3" maxLength="500" value={form.description} onChange={update} placeholder="Condition, what's included…" />
                    </label>
                    <div className="field-row">
                        <label>
                            Category
                            <select name="category" value={form.category} onChange={update}>
                                {options.categories.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </label>
                        <label>
                            Condition
                            <select name="condition" value={form.condition} onChange={update}>
                                {options.conditions.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="field-row">
                        <label>
                            Price per day (₹) *
                            <input name="pricePerDay" type="number" min="0" value={form.pricePerDay} onChange={update} placeholder="0 = free" />
                        </label>
                        <label>
                            Pickup location
                            <input name="pickupLocation" maxLength="80" value={form.pickupLocation} onChange={update} placeholder="e.g. Block A, Room 204" />
                        </label>
                    </div>
                    {item && (
                        <label>
                            Availability
                            <select name="availability" value={form.availability} onChange={update}>
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="unavailable">Unavailable (pause new requests)</option>
                            </select>
                        </label>
                    )}
                </div>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-buttons">
                <button disabled={busy}>{busy ? "Saving…" : item ? "Save changes" : "+ List Item"}</button>
                {onCancel && <button type="button" className="button-light" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}
