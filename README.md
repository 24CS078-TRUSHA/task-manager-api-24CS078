# Task Manager API

This is the backend for Full Stack Task Management Application.

The backend is built using:

- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS
- bcryptjs
- jsonwebtoken

The API provides CRUD operations for managing tasks.

## Authentication

Set `MONGO_URI` and `JWT_SECRET` in `.env`. Use a long, randomly generated JWT
secret and keep `.env` out of source control.

- `POST /auth/register` accepts `{ "email": "name@example.com", "password": "at-least-8-characters" }`.
- `POST /auth/login` accepts the same fields and returns a JWT that expires after one hour.
- `GET /auth/me` returns the authenticated user's public details.
- Include the login token in the Authorization header using the Bearer scheme for every request to `/tasks`.

Task creation and updates validate and sanitize the allowed task fields before
the database is accessed. New tasks require a non-empty `title`.

## Task list caching

`GET /tasks` caches the task list in memory for up to 60 seconds. The response
includes `X-Cache: MISS` when MongoDB is queried and `X-Cache: HIT` when the
cached list is returned. Successful task creation, update, or deletion clears
the cached list so the next `GET /tasks` fetches fresh data.

To compare response times in Postman or Thunder Client:

1. Sign in, then select Bearer Token authorization in Postman or Thunder Client
   and paste the returned JWT for `GET /tasks`.
2. With caching enabled, send `GET /tasks` three times. Record the `Time` value
   and `X-Cache` header for each request; the first should be a miss and
   subsequent requests should be hits (unless the cache expires or a write
   occurs).
3. For an uncached comparison, temporarily bypass the cache lookup and cache
   write in `routes/taskRoutes.js`, restart the server, and send the same
   request three times with the same data and environment.
4. Restore caching afterward. Successful POST, PUT, or DELETE requests clear
   the cached list.

Record measurements from your own environment; response times depend on the
database, server, and network:

| Run | Uncached response time | Cached response time |
| --- | --- | --- |
| 1 | ____ ms | ____ ms |
| 2 | ____ ms | ____ ms |
| 3 | ____ ms | ____ ms |

---

## Technologies Used

- Node.js v18+
- Express.js
- MongoDB
- MongoDB Compass
- Mongoose
- dotenv
- CORS
