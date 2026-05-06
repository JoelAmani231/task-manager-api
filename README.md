# 📋 Task Manager API

A production-ready RESTful API built with **Node.js**, **Express**, **MySQL**, and **JWT authentication**. Manage tasks with full CRUD support, user authentication, status filtering, and priority levels.

---

## 🗂️ Project Structure

```
task-manager-api/
├── config/
│   └── database.js          # MySQL pool + auto-migration
├── controllers/
│   ├── authController.js    # Register / Login logic
│   └── taskController.js    # Task CRUD logic
├── middleware/
│   └── authMiddleware.js    # JWT verification middleware
├── routes/
│   ├── authRoutes.js        # POST /api/auth/*
│   └── taskRoutes.js        # /api/tasks/* (protected)
├── .env.example             # Environment variable template
├── .gitignore
├── package.json
├── server.js                # App entry point
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ (ESM support required)
- **MySQL** 8.0+

### 1 — Clone & Install

```bash
git clone <your-repo-url>
cd task-manager-api
npm install
```

### 2 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and a strong JWT secret:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=task_manager
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

### 3 — Create the MySQL Database

```sql
CREATE DATABASE IF NOT EXISTS task_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

> Tables (`users` and `tasks`) are **created automatically** on first server start.

### 4 — Start the Server

```bash
# Production
npm start

# Development (auto-restart on file change — Node 18+)
npm run dev
```

Server starts at **http://localhost:3000**

---

## 🗄️ Database Schema

### `users`

| Column       | Type         | Constraints                    |
|--------------|--------------|--------------------------------|
| `id`         | INT          | PRIMARY KEY, AUTO_INCREMENT    |
| `username`   | VARCHAR(255) | UNIQUE, NOT NULL               |
| `email`      | VARCHAR(255) | UNIQUE, NOT NULL               |
| `password`   | VARCHAR(255) | NOT NULL (bcrypt hashed)       |
| `created_at` | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      |

### `tasks`

| Column        | Type                                      | Constraints                              |
|---------------|-------------------------------------------|------------------------------------------|
| `id`          | INT                                       | PRIMARY KEY, AUTO_INCREMENT              |
| `user_id`     | INT                                       | FK → users.id (CASCADE DELETE)          |
| `title`       | VARCHAR(255)                              | NOT NULL                                 |
| `description` | TEXT                                      | NULL allowed                             |
| `status`      | ENUM('pending','in_progress','completed') | DEFAULT 'pending'                        |
| `priority`    | ENUM('low','medium','high')               | DEFAULT 'medium'                         |
| `due_date`    | DATE                                      | NULL allowed                             |
| `created_at`  | TIMESTAMP                                 | DEFAULT CURRENT_TIMESTAMP                |
| `updated_at`  | TIMESTAMP                                 | DEFAULT CURRENT_TIMESTAMP ON UPDATE ...  |

---

## 📡 API Reference

### Base URL
```
http://localhost:3000/api
```

### 🔑 Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response `201`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Validation Rules:**
- `username` — min 3 characters, unique
- `email` — valid format, unique
- `password` — min 8 characters, must contain at least one letter and one number

---

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### 📌 Task Endpoints
> All task endpoints require the `Authorization: Bearer <token>` header.

---

#### `GET /api/tasks`
Get all tasks for the authenticated user.

**Query Params (optional):**
| Param    | Values                                              | Default       |
|----------|-----------------------------------------------------|---------------|
| `sortBy` | `created_at`, `updated_at`, `due_date`, `priority`, `status`, `title` | `created_at` |
| `order`  | `asc`, `desc`                                       | `desc`        |

**Response `200`:**
```json
{
  "message": "Tasks retrieved successfully",
  "count": 2,
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-05-15",
      "created_at": "2026-05-05T10:30:00.000Z",
      "updated_at": "2026-05-05T10:30:00.000Z"
    }
  ]
}
```

---

#### `GET /api/tasks/:id`
Get a single task by ID.

**Response `200`:**
```json
{
  "message": "Task retrieved successfully",
  "task": { ... }
}
```

**Response `404`:**
```json
{ "message": "Task not found." }
```

---

#### `GET /api/tasks/filter/status?status=pending`
Filter tasks by status.

**Query Params:**
| Param    | Required | Values                                  |
|----------|----------|-----------------------------------------|
| `status` | ✅       | `pending`, `in_progress`, `completed`   |

**Response `200`:**
```json
{
  "message": "Tasks with status \"pending\" retrieved successfully",
  "count": 1,
  "tasks": [ ... ]
}
```

---

#### `POST /api/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "priority": "high",
  "due_date": "2026-05-15"
}
```

| Field         | Type   | Required | Default    | Values                                  |
|---------------|--------|----------|------------|-----------------------------------------|
| `title`       | string | ✅       | —          | max 255 chars                           |
| `description` | string | ❌       | null       | —                                       |
| `status`      | string | ❌       | `pending`  | `pending`, `in_progress`, `completed`   |
| `priority`    | string | ❌       | `medium`   | `low`, `medium`, `high`                 |
| `due_date`    | string | ❌       | null       | `YYYY-MM-DD`                            |

**Response `201`:**
```json
{
  "message": "Task created successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "status": "pending",
    "priority": "high",
    "due_date": "2026-05-15",
    "created_at": "2026-05-05T10:30:00.000Z",
    "updated_at": "2026-05-05T10:30:00.000Z"
  }
}
```

---

#### `PUT /api/tasks/:id`
Update an existing task. Send only the fields you want to change.

**Request Body (partial update supported):**
```json
{
  "status": "in_progress",
  "priority": "high"
}
```

**Response `200`:**
```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

---

#### `DELETE /api/tasks/:id`
Delete a task permanently.

**Response `200`:**
```json
{ "message": "Task deleted successfully." }
```

---

### 🔍 Health Check

#### `GET /health`
```json
{
  "status": "OK",
  "message": "Task Manager API is running",
  "timestamp": "2026-05-05T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 🔒 Security

| Feature               | Implementation                                  |
|-----------------------|-------------------------------------------------|
| Password hashing      | bcryptjs, salt rounds = 10                      |
| Authentication        | JWT (HS256), configurable expiry                |
| SQL Injection         | Parameterised queries via mysql2                |
| Input validation      | Custom validators on all endpoints              |
| Sensitive data        | Stored in `.env`, never in source code          |
| User scoping          | Tasks filtered by `user_id` on every query      |

---

## 📬 Testing with Postman

1. **Import** the collection (create a new collection called "Task Manager API")
2. Set a **collection variable** `baseUrl = http://localhost:3000`
3. After login, copy the token and set a variable `token`
4. Add header `Authorization: Bearer {{token}}` to task requests

### Sample Postman Flow:

```
POST {{baseUrl}}/api/auth/register   → Create account
POST {{baseUrl}}/api/auth/login      → Get JWT token
POST {{baseUrl}}/api/tasks           → Create a task
GET  {{baseUrl}}/api/tasks           → List all tasks
GET  {{baseUrl}}/api/tasks/1         → Get task #1
PUT  {{baseUrl}}/api/tasks/1         → Update task #1
GET  {{baseUrl}}/api/tasks/filter/status?status=pending  → Filter
DELETE {{baseUrl}}/api/tasks/1       → Delete task #1
```

---

## 📊 HTTP Status Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | OK — successful read/update      |
| 201  | Created — resource created       |
| 400  | Bad Request — validation failed  |
| 401  | Unauthorized — invalid/no token  |
| 404  | Not Found — resource missing     |
| 409  | Conflict — duplicate email/user  |
| 500  | Internal Server Error            |

---

## 🛠️ Tech Stack

| Layer          | Technology                |
|----------------|---------------------------|
| Runtime        | Node.js v18+              |
| Framework      | Express.js v4             |
| Database       | MySQL 8 + mysql2 driver   |
| Authentication | JWT (jsonwebtoken)        |
| Hashing        | bcryptjs                  |
| Environment    | dotenv                    |
| CORS           | cors                      |

---

## 📝 License

MIT
