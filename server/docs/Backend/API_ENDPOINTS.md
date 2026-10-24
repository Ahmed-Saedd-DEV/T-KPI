# Talabat KPI Dashboard Backend API Endpoints

> Base URL: http://localhost:3000
>
> Note: the application mounts routes under `/auth`, `/employees`, `/admin`, `/admin/import`, `/admin/metrics/daily`, and `/admin/users` in `server/src/main.js`.

## Common error response format

The app uses `AppError` plus a central error handler. All application-level failures return this JSON shape:

```json
{
  "status": "fail",
  "message": "Human readable error message"
}
```

Unexpected unhandled server failures return:

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Auth

### POST /auth/register

**Auth:** Not required

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Content-Type | yes | application/json |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | yes | Must match email format and is trimmed/lowercased before use |
| password | string | yes | Must be at least 12 characters and contain uppercase, lowercase, number, and special character |

**Responses:**

✅ 201 Created — User registered successfully
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "0f6d7f4e-5a93-47f8-8d97-9c0ad2d510f7",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

❌ 400 Bad Request — Invalid email format or weak password
```json
{
  "status": "fail",
  "message": "Invalid registration data"
}
```

```json
{
  "status": "fail",
  "message": "Password must be at least 12 characters and contain uppercase, lowercase, number, and special character."
}
```

❌ 409 Conflict — Email already exists
```json
{
  "status": "fail",
  "message": "Email already in use"
}
```

---

### POST /auth/login

**Auth:** Not required

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Content-Type | yes | application/json |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | yes | Must be a valid email |
| password | string | yes | Non-empty string |

**Responses:**

✅ 200 OK — Login successful
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "0f6d7f4e-5a93-47f8-8d97-9c0ad2d510f7",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

❌ 401 Unauthorized — Invalid email/password or inactive user
```json
{
  "status": "fail",
  "message": "Invalid credentials"
}
```

---

### GET /auth/me

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Path Params:** None

**Query Params:** None

**Request Body:** None

**Responses:**

✅ 200 OK — Current user fetched successfully
```json
{
  "id": "0f6d7f4e-5a93-47f8-8d97-9c0ad2d510f7",
  "email": "user@example.com",
  "role": "ADMIN",
  "isActive": true,
  "employeeId": null,
  "createdAt": "2026-10-21T10:11:12.000Z",
  "updatedAt": "2026-10-21T10:11:12.000Z"
}
```

❌ 401 Unauthorized — Missing, malformed, or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

---

## Employees (authenticated, any role)

### GET /employees

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Query Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| search | string | no | Text search against `name` and `employeeCode` |
| minScore | number | no | 0–100 |
| maxScore | number | no | 0–100 |
| minOpsCR | number | no | 0–100 |
| maxOpsCR | number | no | 0–100 |
| minDispatchTime | number | no | 0–100 |
| maxDispatchTime | number | no | 0–100 |
| minPickingTime | number | no | 0–100 |
| maxPickingTime | number | no | 0–100 |
| minAssignmentTime | number | no | 0–100 |
| maxAssignmentTime | number | no | 0–100 |
| minPrepTime | number | no | 0–100 |
| maxPrepTime | number | no | 0–100 |

**Request Body:** None

**Responses:**

✅ 200 OK — Employee list returned
```json
[
  {
    "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
    "employeeCode": "1001",
    "name": "Aisha Khan",
    "orders": 150,
    "metrics": {
      "opsCR": 92.5,
      "dispatchTime": 6.4,
      "pickingTime": 1.3,
      "assignmentTime": 0.2,
      "prepTime": 1.8
    },
    "kpi": {
      "scores": {
        "opsCR": 92.5,
        "dispatchTime": 91.2,
        "pickingTime": 76.4,
        "assignmentTime": 81.3,
        "prepTime": 88.1
      },
      "overallScore": 85.9
    }
  }
]
```

If the employee has no latest performance record:
```json
{
  "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
  "employeeCode": "1001",
  "name": "Aisha Khan",
  "orders": null,
  "metrics": null,
  "kpi": null
}
```

❌ 400 Bad Request — Invalid filter parameters
```json
{
  "status": "fail",
  "message": "Invalid filter parameters"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

---

### GET /employees/top

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Query Params:** None

**Request Body:** None

**Responses:**

✅ 200 OK — Top 3 employees
```json
{
  "status": "success",
  "data": [
    {
      "rank": 1,
      "employeeId": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
      "employeeCode": "1001",
      "name": "Aisha Khan",
      "overallScore": 92.5,
      "scores": {
        "opsCR": 92.5,
        "dispatchTime": 91.2,
        "pickingTime": 76.4,
        "assignmentTime": 81.3,
        "prepTime": 88.1
      },
      "lastPeriod": "2026-10-21"
    }
  ]
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

---

### GET /employees/:id

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | Valid employee UUID |

**Request Body:** None

**Responses:**

✅ 200 OK — Employee found
```json
{
  "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
  "employeeCode": "1001",
  "name": "Aisha Khan",
  "createdAt": "2026-10-21T10:11:12.000Z",
  "updatedAt": "2026-10-21T10:11:12.000Z"
}
```

❌ 400 Bad Request — Invalid employee id format
```json
{
  "status": "fail",
  "message": "Invalid employee id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 404 Not Found — Employee does not exist
```json
{
  "status": "fail",
  "message": "Employee not found"
}
```

---

### GET /employees/code/:employeeCode

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| employeeCode | string | yes | Employee code as stored in the database |

**Request Body:** None

**Responses:**

✅ 200 OK — Employee found by code
```json
{
  "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
  "employeeCode": "1001",
  "name": "Aisha Khan",
  "createdAt": "2026-10-21T10:11:12.000Z",
  "updatedAt": "2026-10-21T10:11:12.000Z"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 404 Not Found — Employee code does not exist
```json
{
  "status": "fail",
  "message": "Employee not found"
}
```

---

### GET /employees/:id/performance

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | Valid employee UUID |

**Request Body:** None

**Responses:**

✅ 200 OK — Employee performance history returned
```json
{
  "employee": {
    "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
    "employeeCode": "1001",
    "name": "Aisha Khan"
  },
  "performance": [
    {
      "batchId": "5a297a80-f6e0-4d26-b229-d3f0b1e0f66d",
      "fileName": "talabat.xlsx",
      "importedAt": "2026-10-21T10:21:43.000Z",
      "orders": 150,
      "metrics": {
        "opsCR": 92.5,
        "dispatchTime": 6.4,
        "pickingTime": 1.3,
        "assignmentTime": 0.2,
        "prepTime": 1.8
      },
      "kpi": {
        "scores": {
          "opsCR": 92.5,
          "dispatchTime": 91.2,
          "pickingTime": 76.4,
          "assignmentTime": 81.3,
          "prepTime": 88.1
        },
        "overallScore": 85.9
      }
    }
  ]
}
```

❌ 400 Bad Request — Invalid employee id format
```json
{
  "status": "fail",
  "message": "Invalid employee id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 404 Not Found — Employee not found
```json
{
  "status": "fail",
  "message": "Employee not found"
}
```

---

## Admin - Employees (ADMIN only)

### POST /admin/employees

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |
| Content-Type | yes | application/json |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| employeeCode | string | yes | Non-empty trimmed code string |
| name | string | yes | Non-empty trimmed employee name |

**Responses:**

✅ 201 Created — Employee created
```json
{
  "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
  "employeeCode": "1001",
  "name": "Aisha Khan",
  "createdAt": "2026-10-21T10:11:12.000Z",
  "updatedAt": "2026-10-21T10:11:12.000Z"
}
```

❌ 400 Bad Request — Missing or invalid employee fields
```json
{
  "status": "fail",
  "message": "Employee code and name are required"
}
```

```json
{
  "status": "fail",
  "message": "Invalid employee data"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 409 Conflict — Duplicate employee code
```json
{
  "status": "fail",
  "message": "Employee code already exists"
}
```

---

### PATCH /admin/employees/:id

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |
| Content-Type | yes | application/json |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | Existing employee UUID |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| employeeCode | string | no | Valid non-empty employee code |
| name | string | no | Valid non-empty employee name |

**Responses:**

✅ 200 OK — Employee updated successfully
```json
{
  "id": "d45b9e6d-d06b-4f11-9b48-40d9d53666aa",
  "employeeCode": "1001",
  "name": "Aisha Khan",
  "createdAt": "2026-10-21T10:11:12.000Z",
  "updatedAt": "2026-10-21T10:11:12.000Z"
}
```

❌ 400 Bad Request — Invalid id or invalid payload
```json
{
  "status": "fail",
  "message": "Invalid employee id"
}
```

```json
{
  "status": "fail",
  "message": "Invalid employee update payload"
}
```

```json
{
  "status": "fail",
  "message": "Employee code is required"
}
```

```json
{
  "status": "fail",
  "message": "Employee name is required"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — Employee not found
```json
{
  "status": "fail",
  "message": "Employee not found"
}
```

❌ 409 Conflict — New employee code duplicates an existing employee
```json
{
  "status": "fail",
  "message": "Employee code already exists"
}
```

---

### DELETE /admin/employees/:id

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | Existing employee UUID |

**Request Body:** None

**Responses:**

✅ 204 No Content — Employee deleted

❌ 400 Bad Request — Invalid employee id format
```json
{
  "status": "fail",
  "message": "Invalid employee id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — Employee not found
```json
{
  "status": "fail",
  "message": "Employee not found"
}
```

---

## Admin - Import (ADMIN only)

> In the actual code, the imported route is mounted at `/admin/import` and the file route is `/admin/import/employees`.

### POST /admin/import/employees

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |
| Content-Type | yes | `multipart/form-data` |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| file | file | yes | `.xlsx` file only; max size 10MB |

**Responses:**

✅ 200 OK — Import completed
```json
{
  "batchId": "0ed8be13-fb7a-4f0d-87d7-3fcb5d8cb961",
  "status": "COMPLETED",
  "totalRows": 100,
  "successCount": 95,
  "failedCount": 5,
  "errors": [
    {
      "row": 12,
      "reason": "Invalid row data"
    }
  ]
}
```

`status` may also be `FAILED` when no rows were imported successfully.

❌ 400 Bad Request — No file uploaded
```json
{
  "status": "fail",
  "message": "No file uploaded"
}
```

❌ 400 Bad Request — File type is not `.xlsx`
```json
{
  "status": "fail",
  "message": "Only .xlsx files are allowed"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

### GET /admin/import/batches

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Query Params:** None

**Request Body:** None

**Responses:**

✅ 200 OK — Import batches returned
```json
[
  {
    "id": "0ed8be13-fb7a-4f0d-87d7-3fcb5d8cb961",
    "fileName": "talabat.xlsx",
    "status": "COMPLETED",
    "periodStart": "2026-10-21T10:00:00.000Z",
    "periodEnd": "2026-10-21T10:00:00.000Z",
    "importedAt": "2026-10-21T10:21:43.000Z",
    "uploadedBy": {
      "id": "4a5d7352-65d3-477a-9301-24a289f4d0db",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
]
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

### DELETE /admin/import/batches/:id

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | Import batch UUID |

**Request Body:** None

**Responses:**

✅ 204 No Content — Batch deleted

❌ 400 Bad Request — Invalid batch id format
```json
{
  "status": "fail",
  "message": "Invalid batch id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — Batch does not exist
```json
{
  "status": "fail",
  "message": "Import batch not found"
}
```

---

## Admin - Metrics (ADMIN only unless noted)

### POST /admin/metrics/daily

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |
| Content-Type | yes | application/json |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| metricDate | string | yes | `YYYY-MM-DD` |
| recordedAt | string | no | ISO 8601 datetime; if present, the date portion must match `metricDate` |
| opsCR | number | no | Optional; if the date does not yet exist, it is created with this value; if it already exists and the field is null, it can be filled; otherwise 409 |
| dispatchTime | number | no | Optional; same rules as `opsCR` |
| prepTime | number | no | Optional; same rules as `opsCR` |
| assignmentTime | number | no | Optional; same rules as `opsCR` |

> Upsert behavior: if `metricDate` does not exist, a new record is created with any provided fields and nulls for the rest. If the date already exists: values that are currently `null` may be filled in; values that already have a value trigger a `409 Conflict`.

**Responses:**

✅ 201 Created — Daily branch metric created or updated with any newly provided null fields
```json
{
  "id": "f81221ac-c7b0-4a4d-b07f-f4254bb2cf14",
  "metricDate": "2026-10-21T00:00:00.000Z",
  "recordedAt": "2026-10-21T08:15:00.000Z",
  "opsCR": 94.5,
  "dispatchTime": 6.2,
  "prepTime": 1.8,
  "assignmentTime": 0.25,
  "createdById": "4a5d7352-65d3-477a-9301-24a289f4d0db",
  "updatedById": null,
  "createdAt": "2026-10-21T09:00:00.000Z",
  "updatedAt": "2026-10-21T09:00:00.000Z"
}
```

❌ 400 Bad Request — Missing or invalid `metricDate`
```json
{
  "status": "fail",
  "message": "Invalid or missing metricDate (expected YYYY-MM-DD)"
}
```

❌ 400 Bad Request — Invalid `recordedAt`
```json
{
  "status": "fail",
  "message": "recordedAt must be a valid ISO 8601 datetime"
}
```

```json
{
  "status": "fail",
  "message": "recordedAt date must match metricDate"
}
```

❌ 400 Bad Request — Invalid numeric value for a metric field
```json
{
  "status": "fail",
  "message": "Invalid value for opsCR"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 409 Conflict — Some metric fields already have a value on that date
```json
{
  "status": "fail",
  "message": "Field(s) already have a value: opsCR, dispatchTime. Use PATCH to update."
}
```

---

### GET /admin/metrics/daily

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Query Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| from | string | no | `YYYY-MM-DD` lower bound |
| to | string | no | `YYYY-MM-DD` upper bound |

**Request Body:** None

**Responses:**

✅ 200 OK — List of daily metrics for the date range
```json
[
  {
    "id": "f81221ac-c7b0-4a4d-b07f-f4254bb2cf14",
    "metricDate": "2026-10-21T00:00:00.000Z",
    "recordedAt": "2026-10-21T08:15:00.000Z",
    "opsCR": 94.5,
    "dispatchTime": null,
    "prepTime": 1.8,
    "assignmentTime": null,
    "createdById": "4a5d7352-65d3-477a-9301-24a289f4d0db",
    "updatedById": null,
    "createdAt": "2026-10-21T09:00:00.000Z",
    "updatedAt": "2026-10-21T09:00:00.000Z"
  }
]
```

> `opsCR`, `dispatchTime`, `prepTime`, and `assignmentTime` may be `null` for dates where a value has not been recorded yet.

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

### GET /admin/metrics/daily/best

**Auth:** Required (`Bearer` token)

**Role required:** Any authenticated role

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Query Params:** None

**Request Body:** None

**Responses:**

✅ 200 OK — Best-performing date calculated from known branch metrics
```json
{
  "status": "success",
  "data": {
    "metricDate": "2026-10-16",
    "opsCR": 0.02,
    "dispatchTime": 4.5,
    "assignmentTime": 0.15,
    "prepTime": 1.8,
    "recordedAt": "2026-10-16T14:30:00.000Z",
    "score": {
      "overall": 100,
      "opsCR": 100,
      "dispatchTime": 100,
      "assignmentTime": 100,
      "prepTime": 100
    }
  }
}
```

> Metric values can be `null` when a category has not been recorded, even though the best-day payload still returns the date-level KPI summary.

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 404 Not Found — No branch metrics exist yet
```json
{
  "status": "fail",
  "message": "No branch metrics found"
}
```

---

### GET /admin/metrics/daily/:date

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| date | string | yes | `YYYY-MM-DD` |

**Request Body:** None

**Responses:**

✅ 200 OK — Single daily metric returned
```json
{
  "id": "f81221ac-c7b0-4a4d-b07f-f4254bb2cf14",
  "metricDate": "2026-10-21T00:00:00.000Z",
  "recordedAt": "2026-10-21T08:15:00.000Z",
  "opsCR": 94.5,
  "dispatchTime": null,
  "prepTime": 1.8,
  "assignmentTime": null,
  "createdById": "4a5d7352-65d3-477a-9301-24a289f4d0db",
  "updatedById": null,
  "createdAt": "2026-10-21T09:00:00.000Z",
  "updatedAt": "2026-10-21T09:00:00.000Z"
}
```

> `opsCR`, `dispatchTime`, `prepTime`, and `assignmentTime` are nullable and may be returned as `null` for missing values.

❌ 400 Bad Request — Invalid date format
```json
{
  "status": "fail",
  "message": "Invalid date format (expected YYYY-MM-DD)"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — No record for the date
```json
{
  "status": "fail",
  "message": "No metric record found for this date"
}
```

---

### PATCH /admin/metrics/daily/:date

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |
| Content-Type | yes | application/json |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| date | string | yes | `YYYY-MM-DD` |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| opsCR | number | no | Optional; can be set to a value if the existing record has `null` at that field |
| dispatchTime | number | no | Optional; can be set to a value if the existing record has `null` at that field |
| prepTime | number | no | Optional; can be set to a value if the existing record has `null` at that field |
| assignmentTime | number | no | Optional; can be set to a value if the existing record has `null` at that field |
| recordedAt | string | no | ISO 8601 datetime; if present, the date portion must match `date` |

**Responses:**

✅ 200 OK — Metric updated successfully
```json
{
  "id": "f81221ac-c7b0-4a4d-b07f-f4254bb2cf14",
  "metricDate": "2026-10-21T00:00:00.000Z",
  "recordedAt": "2026-10-21T08:15:00.000Z",
  "opsCR": 95.0,
  "dispatchTime": 6.0,
  "prepTime": 1.7,
  "assignmentTime": 0.24,
  "createdById": "4a5d7352-65d3-477a-9301-24a289f4d0db",
  "updatedById": "4a5d7352-65d3-477a-9301-24a289f4d0db",
  "createdAt": "2026-10-21T09:00:00.000Z",
  "updatedAt": "2026-10-21T09:06:00.000Z"
}
```

❌ 400 Bad Request — Invalid date format
```json
{
  "status": "fail",
  "message": "Invalid date format (expected YYYY-MM-DD)"
}
```

❌ 400 Bad Request — Empty update payload
```json
{
  "status": "fail",
  "message": "Update payload is required"
}
```

❌ 400 Bad Request — Unknown field name supplied
```json
{
  "status": "fail",
  "message": "Invalid fields in update payload"
}
```

❌ 400 Bad Request — Invalid datetime or numeric value
```json
{
  "status": "fail",
  "message": "recordedAt must be a valid ISO 8601 datetime"
}
```

```json
{
  "status": "fail",
  "message": "Invalid value for opsCR"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — No metric record exists for this date
```json
{
  "status": "fail",
  "message": "No metric record found for this date"
}
```

---

### DELETE /admin/metrics/daily/:date

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| date | string | yes | `YYYY-MM-DD` |

**Request Body:** None

**Responses:**

✅ 204 No Content — Metric deleted

❌ 400 Bad Request — Invalid date format
```json
{
  "status": "fail",
  "message": "Invalid date format (expected YYYY-MM-DD)"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — Metric record does not exist
```json
{
  "status": "fail",
  "message": "No metric record found for this date"
}
```

---

## Admin - Users (ADMIN only)

### GET /admin/users

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**Query Params:** None

**Request Body:** None

**Responses:**

✅ 200 OK — User list returned
```json
[
  {
    "id": "4a5d7352-65d3-477a-9301-24a289f4d0db",
    "email": "admin@example.com",
    "role": "ADMIN",
    "isActive": true,
    "employeeId": null,
    "createdAt": "2026-10-21T09:00:00.000Z",
    "updatedAt": "2026-10-21T09:00:00.000Z"
  }
]
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

### GET /admin/users/:id

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | User UUID |

**Request Body:** None

**Responses:**

✅ 200 OK — User found
```json
{
  "id": "4a5d7352-65d3-477a-9301-24a289f4d0db",
  "email": "admin@example.com",
  "role": "ADMIN",
  "isActive": true,
  "employeeId": null,
  "createdAt": "2026-10-21T09:00:00.000Z",
  "updatedAt": "2026-10-21T09:00:00.000Z"
}
```

❌ 400 Bad Request — Invalid user id
```json
{
  "status": "fail",
  "message": "Invalid user id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — User does not exist
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

### PATCH /admin/users/:id

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |
| Content-Type | yes | application/json |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | User UUID |

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | no | Valid email address |
| role | string | no | `ADMIN` or `USER` |
| isActive | boolean | no | Active/inactive status |
| employeeId | UUID string or null | no | Employee UUID to link to this user |

**Responses:**

✅ 200 OK — User updated successfully
```json
{
  "id": "4a5d7352-65d3-477a-9301-24a289f4d0db",
  "email": "admin@example.com",
  "role": "ADMIN",
  "isActive": true,
  "employeeId": null,
  "createdAt": "2026-10-21T09:00:00.000Z",
  "updatedAt": "2026-10-21T09:00:00.000Z"
}
```

❌ 400 Bad Request — Invalid user id
```json
{
  "status": "fail",
  "message": "Invalid user id"
}
```

```json
{
  "status": "fail",
  "message": "Update payload is required"
}
```

```json
{
  "status": "fail",
  "message": "Invalid email"
}
```

```json
{
  "status": "fail",
  "message": "Invalid role"
}
```

```json
{
  "status": "fail",
  "message": "isActive must be a boolean"
}
```

```json
{
  "status": "fail",
  "message": "Invalid employee id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — User or linked employee not found
```json
{
  "status": "fail",
  "message": "User not found"
}
```

```json
{
  "status": "fail",
  "message": "Employee not found"
}
```

❌ 409 Conflict — Email already in use or employee already linked to another user
```json
{
  "status": "fail",
  "message": "Email already in use"
}
```

```json
{
  "status": "fail",
  "message": "Employee is already linked to another user"
}
```

---

### DELETE /admin/users/:id

**Auth:** Required (`Bearer` token)

**Role required:** `ADMIN`

**Request Headers:**
| Header | Required | Notes |
|--------|----------|-------|
| Authorization | yes | `Bearer <jwt>` |

**URL Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | yes | User UUID |

**Request Body:** None

**Responses:**

✅ 204 No Content — User deleted

❌ 400 Bad Request — Invalid user id
```json
{
  "status": "fail",
  "message": "Invalid user id"
}
```

❌ 401 Unauthorized — Missing or invalid token
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

❌ 403 Forbidden — User is not an admin
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

❌ 404 Not Found — User does not exist
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

## Notes on auth and role enforcement

- Auth middleware checks `Authorization: Bearer <token>` and rejects missing/invalid tokens with `401` and `{"status":"fail","message":"Unauthorized"}`.
- Role middleware checks `req.user.role` against allowed roles and rejects disallowed users with `403` and `{"status":"fail","message":"Forbidden"}`.
- All validators and services are implemented in the code under `server/src/validators` and `server/src/services` and were used as the source of truth for this documentation.
