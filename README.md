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

## API so far

| Method | Route                | Access    | Purpose                              |
|--------|----------------------|-----------|--------------------------------------|
| GET    | `/api/health`        | Public    | Check the server is up               |
| POST   | `/api/auth/register` | Public    | Create an account → returns a token  |
| POST   | `/api/auth/login`    | Public    | Log in → returns a token             |
| GET    | `/api/auth/me`       | Logged in | Get the current user                 |

Protected routes expect the header `Authorization: Bearer <token>`.

## How authentication and authorization work

- **Authentication** (who you are):
  - On register, `bcryptjs` hashes the password in a Mongoose `pre("save")` hook, so plain-text passwords are never stored.
  - On login, the server checks the password and signs a **JWT** that contains the user's id.
  - The `protect` middleware verifies that token on every protected request and sets `req.user`.
- **Authorization** (what you may do):
  - `authorize("admin")` restricts routes by role.
  - Ownership checks (only an item's owner can edit or delete it, or approve requests for it) are added with the items and requests routes.
  - Users can't make themselves admin: `role` is ignored on register.

## Data models

- **User**: name, email (unique), password (hashed), hostel, role (`student` / `admin`)
- **Item**: owner → User, name, description, category, condition, pricePerDay, imageUrl, pickupLocation, availability
- **Request**: item → Item, requester → User, owner → User, startDate, endDate, message, status

Request statuses can only change along these paths:
`pending → approved / rejected / cancelled`, `approved → active / cancelled`, `active → completed`.
