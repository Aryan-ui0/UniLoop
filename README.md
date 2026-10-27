# UniLoop

A hostel item-sharing and rental platform for students, built with the MERN stack.

| Folder    | What it is                                                       |
|-----------|------------------------------------------------------------------|
| `server/` | REST API: Node.js, Express, MongoDB (Mongoose), JWT auth, Multer |
| `client/` | React frontend (coming next)                                     |
| `legacy/` | Original HTML/CSS/JS + localStorage prototype (evaluation 1)     |

## Running the server

1. **Create a free MongoDB Atlas cluster**
   - Sign up at https://www.mongodb.com/cloud/atlas and create a free M0 cluster.
   - Under *Database Access*, add a database user with a username and password.
   - Under *Network Access*, add your IP address (or `0.0.0.0/0` while developing).
   - Click *Connect → Drivers* and copy the connection string.
2. **Configure environment variables**
   - Copy `server/.env.example` to `server/.env`.
   - Paste the connection string into `MONGO_URI`, replacing `<username>`, `<password>` and `<cluster>`. Keep `/uniloop` before the `?` so the database is called `uniloop`.
   - Set `JWT_SECRET` to any long random string.
3. **Install and start**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   You should see `MongoDB connected` followed by `UniLoop API running on http://localhost:5000`.

## API

Protected routes expect the header `Authorization: Bearer <token>`.

### Auth

| Method | Route                | Access    | Purpose                              |
|--------|----------------------|-----------|--------------------------------------|
| GET    | `/api/health`        | Public    | Check the server is up               |
| POST   | `/api/auth/register` | Public    | Create an account → returns a token  |
| POST   | `/api/auth/login`    | Public    | Log in → returns a token             |
| GET    | `/api/auth/me`       | Logged in | Get the current user                 |

### Items

| Method | Route             | Access         | Purpose |
|--------|-------------------|----------------|---------|
| GET    | `/api/items`      | Public         | Browse. Query: `search`, `category`, `availability`, `maxPrice`, `hostel`, `sort` (`newest`, `oldest`, `price_asc`, `price_desc`) |
| GET    | `/api/items/meta` | Public         | Category and condition lists for form dropdowns |
| GET    | `/api/items/mine` | Logged in      | My listings |
| GET    | `/api/items/:id`  | Public         | One item, with owner name and hostel |
| POST   | `/api/items`      | Logged in      | Create (form-data, optional `image` file) |
| PUT    | `/api/items/:id`  | Owner or admin | Edit (form-data; new `image` replaces the old one; `removeImage=true` clears it) |
| DELETE | `/api/items/:id`  | Owner or admin | Delete; blocked while the item is borrowed; cancels open requests |

Uploaded images are served at `http://localhost:5000/uploads/<file>`.

### Requests

| Method | Route                       | Access                    | Purpose |
|--------|-----------------------------|---------------------------|---------|
| POST   | `/api/requests`             | Logged in                 | `{ itemId, startDate, endDate, message }` |
| GET    | `/api/requests/sent`        | Logged in                 | Requests I made (optional `?status=`) |
| GET    | `/api/requests/received`    | Logged in                 | Requests for my items (optional `?status=`) |
| GET    | `/api/requests/:id`         | Requester, owner or admin | One request |
| PATCH  | `/api/requests/:id/status`  | Depends on status         | `{ status }`, see below |

| New status  | Who can set it | Meaning |
|-------------|----------------|---------|
| `approved`  | Item owner     | Accepted; other pending requests for the same dates are auto-rejected |
| `rejected`  | Item owner     | Declined |
| `active`    | Item owner     | Item handed over |
| `completed` | Item owner     | Item returned |
| `cancelled` | Requester      | Withdrawn (while pending or approved) |

A request is refused if the dates are in the past, if it's for your own item, if the item is marked unavailable, or if the dates overlap an approved or active booking.
An item shows as `reserved` while it has an approved or active booking, and goes back to `available` when there are none.

## File uploads (Multer)

`middleware/upload.js` configures Multer:
- Files are saved to `server/uploads/` with a generated name, so the user's original filename is never trusted.
- Only JPG, PNG, WEBP and GIF images are accepted, up to 2 MB.
- Routes use `upload.single("image")`, which reads one file from the form field `image` and makes it available as `req.file`.
- The image file is deleted when its item is deleted, when the image is replaced, or when the upload is rejected (for example, a non-owner trying to edit).

## Making an admin

Nobody can sign up as admin. To promote an existing account:
```bash
npm run make-admin -- someone@example.com
```

## How authentication and authorization work

- **Authentication** (who you are):
  - On register, `bcryptjs` hashes the password in a Mongoose `pre("save")` hook, so plain-text passwords are never stored.
  - On login, the server checks the password and signs a **JWT** that contains the user's id.
  - The `protect` middleware verifies that token on every protected request and sets `req.user`.
- **Authorization** (what you may do):
  - `authorize("admin")` restricts routes by role.
  - Ownership checks (`utils/permissions.js`): only an item's owner (or an admin) can edit or delete it, only the owner can approve, reject or complete requests for it, and only the requester can cancel.
  - Users can't make themselves admin: `role` is ignored on register.

## Data models

- **User**: name, email (unique), password (hashed), hostel, role (`student` / `admin`)
- **Item**: owner → User, name, description, category, condition, pricePerDay, imageUrl, pickupLocation, availability
- **Request**: item → Item, requester → User, owner → User, startDate, endDate, message, status

Request statuses can only change along these paths:
`pending → approved / rejected / cancelled`, `approved → active / cancelled`, `active → completed`.
