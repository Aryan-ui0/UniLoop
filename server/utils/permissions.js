// Ownership check used for AUTHORIZATION on items and requests.
// ownerId can be an ObjectId or a populated user document.
function isOwner(user, ownerId) {
    const id = ownerId && ownerId._id ? ownerId._id : ownerId;
    return String(id) === String(user._id);
}

function isOwnerOrAdmin(user, ownerId) {
    return user.role === "admin" || isOwner(user, ownerId);
}

module.exports = { isOwner, isOwnerOrAdmin };
