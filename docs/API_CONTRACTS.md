# Brightloop API Contracts

## 1. Overview
The Brightloop backend is built on **Node.js + Express** and operates in tandem with **Supabase Auth**.
All protected backend endpoints authenticate requests using Supabase JWT Bearer tokens and verify user permissions against `public.profiles`.

---

## 2. Authentication Standard
- Protected API calls MUST send the access token received upon Supabase Auth login in the `Authorization` header:
  ```http
  Authorization: Bearer <supabase_access_token>
  ```
- Unauthenticated or expired tokens return `401 Unauthorized`.
- Authenticated users lacking required privileges return `403 Forbidden`.

---

## 3. Endpoints

### 3.1. Health Check
- **Endpoint**: `GET /api/health`
- **Access**: Public
- **Description**: Probes the status of the server and Supabase connectivity.
- **Success Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "service": "Brightloop API",
    "timestamp": "2026-10-31T09:30:00.000Z",
    "supabaseConnected": true
  }
  ```

---

### 3.2. Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (ADMIN, STAFF, or CUSTOMER)
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Returns the verified user profile from the database.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "7d9b97b1-...",
      "email": "customer@example.com",
      "full_name": "Jane Doe",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "created_at": "2026-10-31T09:00:00Z"
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Authorization header is missing or malformed."
  }
  ```
- **Error Response (403 Forbidden - Inactive Account)**:
  ```json
  {
    "success": false,
    "message": "Account is inactive. Please contact support."
  }
  ```

---

### 3.3. Create Staff Account (Admin Only)
- **Endpoint**: `POST /api/users/staff`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "email": "staff.member@brightloop.com",
    "password": "Password123!",
    "full_name": "Staff Member Name"
  }
  ```
- **Description**: Creates a staff user account securely via Supabase Admin SDK and assigns `STAFF` role.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Staff account created successfully.",
    "user": {
      "id": "f5e4c3b2-...",
      "email": "staff.member@brightloop.com",
      "full_name": "Staff Member Name",
      "role": "STAFF",
      "status": "ACTIVE"
    }
  }
  ```
- **Error Response (403 Forbidden)**:
  ```json
  {
    "success": false,
    "message": "Forbidden: Requires ADMIN privilege."
  }
  ```

---

### 3.4. List Users (Admin Only)
- **Endpoint**: `GET /api/users`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `role` (optional: `ADMIN`, `STAFF`, `CUSTOMER`)
  - `status` (optional: `ACTIVE`, `INACTIVE`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 2,
    "users": [
      {
        "id": "...",
        "full_name": "Admin User",
        "email": "admin@brightloop.com",
        "role": "ADMIN",
        "status": "ACTIVE",
        "created_at": "..."
      }
    ]
  }
  ```

---

### 3.5. Update User Status (Admin Only)
- **Endpoint**: `PATCH /api/users/:id/status`
- **Access**: ADMIN only
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User status updated to INACTIVE."
  }
  ```

---

## 4. Standard Error Format
All failure responses follow this consistent structure:
```json
{
  "success": false,
  "message": "Human-readable description of error",
  "error": "Optional technical error details in development"
}
```

