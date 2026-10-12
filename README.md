# Task Manager API

This is the backend for the Practical 6 Full Stack Task Management Application.

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

---

## Technologies Used

- Node.js v18+
- Express.js
- MongoDB
- MongoDB Compass
- Mongoose
- dotenv
- CORS

---

## Project Structure

task-manager-api
│
├── middleware
│   ├── logger.js
│   ├── errorHandler.js
│   ├── contentType.js
│   ├── auth.js
│   └── requestValidation.js
│
├── models
│   ├── Task.js
│   └── User.js
│
├── routes
│   ├── taskRoutes.js
│   └── authRoutes.js
│
├── .env
├── .env.example
├── .gitignore
├── app.js
├── package.json
└── package-lock.json