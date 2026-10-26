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

## Asynchronous task-created notifications

After a task is saved, `POST /tasks` responds with HTTP 201 and emits a
`task-created` event. The event listener schedules its notification log
asynchronously, so notification work does not delay the response. The log
includes the task title, event timestamp, authenticated user's ID, and listener
completion timestamp. A 150 ms timer makes the ordering visible in the server
console; it is only for this demonstration.

To demonstrate it:

1. Start the backend with `node app.js` and sign in to obtain a JWT.
2. In Postman or Thunder Client, send an authorized `POST http://localhost:5000/tasks`
   request with a valid task body, for example
   `{ "title": "Notification demo", "description": "Test the event listener" }`.
3. Confirm the response is HTTP 201 and note its response time.
4. Check the backend terminal. The `[API]` response timestamp should appear
   before the delayed `[Notification]` line, which includes the task title,
   timestamp, assigned user ID, and listener completion time.
5. Capture the response and console output as evidence. Keep the JWT and
   credentials out of screenshots.

## Technologies Used

- Node.js v18+
- Express.js
- MongoDB
- MongoDB Compass
- Mongoose
- dotenv
- CORS
