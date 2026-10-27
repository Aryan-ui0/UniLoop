# UniLoop: Viva Notes

Short explanations of each technology and where it appears in the code.

## 1. Architecture

```
React (client, :5173)  --HTTP + JSON-->  Express API (server, :5000)  --Mongoose-->  MongoDB Atlas
        |                                        |
   JWT kept in localStorage           Multer saves images to server/uploads/
```

- **Client–server split:** React only handles the UI. Every rule (who can do what, valid dates, overlapping bookings) is checked on the server, because anything in the browser can be changed by the user.
- **REST API:** URLs name things (`/api/items/:id`) and HTTP methods name actions: GET reads, POST creates, PUT updates, PATCH partly updates, DELETE removes.
- **Status codes we use:**

  | Code | Meaning |
  |------|---------|
  | 200 / 201 | OK / created |
  | 400 | Bad input |
  | 401 | Not logged in |
  | 403 | Logged in but not allowed |
  | 404 | Not found |
  | 409 | Conflicts with the current state (e.g. dates already booked) |

## 2. Node.js and Express

- **Node.js** runs JavaScript on the server.
- **Express** is a small framework for building the API:
  - `app.use(express.json())` parses JSON request bodies into `req.body`.
  - **Routers** (`routes/*.js`) map URLs to **controller** functions (`controllers/*.js`).
  - **Middleware** is a function `(req, res, next)` that runs before the handler. It either calls `next()` or sends a response itself. Ours are:
    - `protect`: checks the login token
    - `authorize`: checks the user's role
    - `upload.single("image")`: Multer reads the uploaded file
    - `errorHandler`: turns errors into JSON responses
  - Express 5 automatically sends errors thrown in `async` handlers to the error handler.

## 3. MongoDB and Mongoose

- **MongoDB** is a NoSQL document database: it stores JSON-like documents in collections. **Atlas** is MongoDB's cloud hosting.
- **Mongoose** adds **schemas** (field types, `required`, `min`, `enum`, `maxlength`) and validation on top of MongoDB.
- **Relationships:** `Item.owner` and `Request.item/requester/owner` store `ObjectId`s with `ref`. `.populate("owner", "name hostel")` swaps an id for the referenced document's fields.
- **Hooks:** `userSchema.pre("save")` hashes the password before saving. `requestSchema.pre("validate")` checks that the end date is on or after the start date.
- **Why Request is a separate collection:** an item can have many requests over time, and each one has its own dates and status.

## 4. Authentication (who are you?)

1. **Register:** the password is hashed with **bcrypt** (salted, slow on purpose), so the database never stores plain text. The `password` field has `select: false`, so normal queries never return it.
2. **Login:** `bcrypt.compare` checks the password. On success, the server signs a **JWT** with `jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" })`.
3. **Every later request** sends `Authorization: Bearer <token>`. The `protect` middleware runs `jwt.verify` (checking the signature and expiry), loads the user, and sets `req.user`.
4. **JWT structure:** `header.payload.signature`. The payload is readable but can't be changed without the secret, because the signature would no longer match. This is why `JWT_SECRET` must stay private (it lives in `.env`, which is gitignored).
5. **Login errors:** the same message ("Invalid email or password") is used whether the email or the password is wrong, so attackers can't find out which emails are registered.

## 5. Authorization (what are you allowed to do?)

- **Role-based:** `authorize("admin")` middleware. Users can't make themselves admin, because `role` is never read from the register form. Admins are created with `npm run make-admin -- email`.
- **Ownership-based** (`utils/permissions.js`):
  - Only the item's owner or an admin can edit or delete it, otherwise the API returns 403.
  - The owner approves, rejects, hands over and completes requests; only the requester can cancel.
  - Only the two people involved, or an admin, can view a request.
- **Server-controlled fields:** `owner` is always `req.user._id`, never taken from the form. `pickFields()` whitelists which fields a user may edit.
- **Frontend checks are for UX only:** `ProtectedRoute` and hiding buttons make the UI nicer, but the real protection is on the server.

## 6. Multer (file uploads)

- Forms with files are sent as `multipart/form-data` (React builds a `FormData` object). `express.json()` can't read this format; Multer can.
- `multer.diskStorage` decides the folder (`server/uploads/`) and the file name. We generate `timestamp-random.ext` instead of using the user's file name, which could be unsafe.
- `fileFilter` accepts only JPG, PNG, WEBP and GIF images, and `limits.fileSize` is 2 MB. Multer errors become 400 responses.
- `upload.single("image")` puts the file information in `req.file`. We save `/uploads/<filename>` in `item.imageUrl`, and `express.static` serves the folder.
- Cleanup: the file is deleted when its item is deleted, when the image is replaced, or when the request fails (validation error or not the owner).

## 7. React

- **Components** are functions that return JSX; data is passed down as **props**. Examples: `ItemCard`, `RequestCard`, `ItemForm`.
- **Hooks:**
  - `useState` holds data that changes the UI.
  - `useEffect` runs side effects, such as loading data when a filter changes. Home waits 300 ms after the user stops typing before searching (debouncing).
  - `useRef` lets us scroll to the form.
- **Context:** `AuthContext` shares `user`, `login`, `register` and `logout` with every component, so props don't have to be passed through every level.
- **React Router:** `<Routes>` and `<Route>` map URLs to pages, and `useParams` reads `:id`. `ProtectedRoute` redirects to `/login` and remembers where the user was going.
- **Controlled forms:** each input's `value` comes from state and `onChange` updates it. Validation runs before sending, and the server validates again.
- **Safe rendering:** React escapes text automatically, so a listing named `<script>` is shown as text and never runs. The old version used `innerHTML`, which was an XSS risk.
- **Vite** is the dev server and build tool. Its proxy forwards `/api` to Express during development, so no CORS setup is needed in the browser.

## 8. Request workflow

```
pending ──approve──> approved ──handed over──> active ──returned──> completed
   │  └──reject──> rejected        │
   └──cancel──> cancelled <──cancel┘
```

- Rejected, cancelled and completed requests can't change again (`STATUS_TRANSITIONS` in `models/Request.js`).
- **Booking overlap:** two date ranges overlap when `existing.start <= new.end` AND `existing.end >= new.start`. Approved and active bookings block new requests for those dates.
- Approving a request automatically rejects other pending requests for the same dates.
- The item becomes `reserved` while it has an approved or active booking, and `available` again when there are none. `unavailable` is the owner's manual pause.

## 9. Possible questions

- **Why JWT instead of sessions?** It's stateless: the server doesn't store sessions, and the token works across devices. Trade-off: a token can't be revoked before it expires.
- **Is localStorage safe for the token?** It's simple and common in projects like this. A stronger option is an httpOnly cookie, which JavaScript can't read, protecting it from XSS.
- **Why hash and not encrypt passwords?** Hashing is one-way, so even we can't recover a password. bcrypt adds a salt and is slow on purpose, to resist brute-force attacks.
- **What happens if two people approve at the same time?** The server checks for overlaps again when approving. For production you would add a database transaction or a unique booking lock.
- **What's still missing for production?** Email notifications, reviews, cloud image storage (e.g. Cloudinary or S3), rate limiting, tests in CI, and HTTPS deployment.
