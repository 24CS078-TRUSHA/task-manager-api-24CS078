# Task Manager API

[![CI Pipeline](https://github.com/24CS078-TRUSHA/task-manager-api-24CS078/actions/workflows/ci.yml/badge.svg)](https://github.com/24CS078-TRUSHA/task-manager-api-24CS078/actions/workflows/ci.yml)

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

## AI task descriptions

The authenticated endpoint `POST /api/ai/generate-description` accepts a task
title and returns a concise AI-generated description using Gemini. The React
task form lets the user edit the suggestion before saving. Gemini requests are
made only by the backend; the API key is never sent to the browser.

Set `GEMINI_API_KEY` in the backend `.env` file (see `.env.example`). Create a
Gemini API key in Google AI Studio. The default model is `gemini-3.8-flash`;
set `GEMINI_MODEL` if you need to select another model available to your key.
The key is optional for running the rest of the application. If it is missing
or the provider request fails or times out, the endpoint responds with a clear
error and the frontend leaves the task form available for manual entry. The UI
displays a reminder to review AI-generated content.

To try it, sign in and click **Generate description** in the task form. For an
API test, send an authorized JSON request to
`POST http://localhost:5000/api/ai/generate-description` with
`{ "title": "Prepare a project status report" }`. Do not paste the API key into
frontend code or include it in screenshots. When running with Docker Compose,
restart the backend container after changing `.env` so it receives the new
environment value.

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

## Run the full application with Docker Compose

Docker Compose starts MongoDB, the Express API, and the React frontend. Run
these commands from the backend project folder. The frontend source folder
(`task-manager-api-frontend`) must be next to this folder because Compose uses
it as the frontend build context.

1. Install and start Docker Desktop, then check the CLI:

   ```powershell
   docker --version
   docker compose version
   ```

2. Ensure the backend `.env` file contains a `JWT_SECRET`. Compose supplies the
   MongoDB service URL automatically, so the local `MONGO_URI` value is
   overridden inside the backend container. Keep `.env` private.
3. Build and start all services:

   ```powershell
   docker compose up --build
   ```

4. Open `http://localhost:5173` for the frontend. The frontend proxies API
   requests to the backend, and the backend connects to MongoDB using the
   internal service name `mongodb`.
5. In another terminal, verify the containers are running:

   ```powershell
   docker compose ps
   ```

6. Stop the services with `Ctrl+C`, then run `docker compose down`. MongoDB
   data remains in the named `mongodb-data` volume between restarts.

The backend is also mapped to `http://localhost:5000` and MongoDB to
`localhost:27017` for local API tools and database clients. Both projects have
a `.dockerignore` file so local dependencies and `.env` files are excluded
from image build contexts.

## Technologies Used

- Node.js v18+
- Express.js
- MongoDB
- MongoDB Compass
- Mongoose
- dotenv
- CORS

## Continuous integration

GitHub Actions runs `npm install` and `npm test` on pushes and pull requests
targeting `main`. Tests use Supertest to exercise the API without requiring a
MongoDB server; the task query is mocked in the test.

Run the tests locally with:

```powershell
npm test
```

To demonstrate both pipeline outcomes for the practical:

1. Push the working workflow and tests to `main`, then capture the green run in
   the repository's **Actions** tab.
2. Temporarily change the expected status in `tests/api.test.js` from `200` to
   `201`, commit and push that deliberate test failure to `main`, and capture
   the red run. Do not leave this broken expectation in the final code.
3. Restore the expected status to `200`, commit and push the fix, then capture
   the passing run. Keep the failed and passing screenshots in your lab
   submission; add them to the repository only if your instructor requires it.
