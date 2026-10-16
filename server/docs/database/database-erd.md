# Analytics Dashboard Database Design

This document defines the PostgreSQL/Prisma schema for the analytics dashboard. It is intentionally limited to database design and documentation; it does not add application code, API routes, controllers, or services.

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    enum Role {
        ADMIN
        USER
    }

    enum ImportBatchStatus {
        PROCESSING
        COMPLETED
        FAILED
    }

    enum AuditAction {
        CREATE
        UPDATE
        DELETE
        IMPORT
        BATCH_DELETE
    }

    Employee ||--o| User : dashboard_account
    Employee ||--o{ EmployeePerformance : historical_records

    User ||--o{ ImportBatch : uploaded_batches
    User ||--o{ BranchDailyMetric : created_metrics
    User ||--o{ BranchDailyMetric : updated_metrics
    User ||--o{ AuditLog : performed_actions

    ImportBatch ||--o{ EmployeePerformance : contains_records

    Employee {
        UUID id PK
        STRING employeeCode
        STRING name
        DATETIME createdAt
        DATETIME updatedAt
    }

    User {
        UUID id PK
        UUID employeeId "nullable" FK
        STRING email
        STRING passwordHash
        Role role
        BOOLEAN isActive
        DATETIME createdAt
        DATETIME updatedAt
    }

    ImportBatch {
        UUID id PK
        STRING fileName
        DATETIME periodStart
        DATETIME periodEnd
        ImportBatchStatus status
        UUID uploadedById FK
        DATETIME createdAt
    }

    EmployeePerformance {
        UUID id PK
        UUID employeeId FK
        UUID importBatchId FK
        DATETIME periodStart
        DATETIME periodEnd
        INT orders
        DECIMAL opsCR
        DECIMAL dispatchTime
        DECIMAL pickingTime
        DECIMAL assignmentTime
        DECIMAL prepTime
        DATETIME createdAt
        DATETIME updatedAt
    }

    BranchDailyMetric {
        UUID id PK
        DATE metricDate
        DECIMAL opsCR
        DECIMAL dispatchTime
        DECIMAL prepTime
        DECIMAL assignmentTime
        UUID createdById FK
        UUID updatedById FK "nullable"
        DATETIME createdAt
        DATETIME updatedAt
    }

    AuditLog {
        UUID id PK
        UUID actorUserId FK "nullable"
        JSON actorSnapshot "nullable"
        AuditAction action
        STRING entityType
        STRING entityId
        JSON beforeData "nullable"
        JSON afterData "nullable"
        DATETIME createdAt
    }
```

## 2. Model Responsibilities

### Employee
Represents the company employee identity used in operational data imports. It is separate from the dashboard login model because not every employee needs an account.

Key responsibilities:
- stores the canonical `employeeCode` from imported Excel files
- keeps the `name` for display and history
- has an optional one-to-one relationship with `User`
- can have many historical `EmployeePerformance` records

### User
Represents the dashboard authentication identity for a person who may or may not also be an `Employee`.

Key responsibilities:
- stores a unique email and password hash only
- assigns a role (`ADMIN` or `USER`)
- optionally links to one employee record
- allows a user to be active/inactive without losing historical data

### ImportBatch
Represents one Excel upload operation as an auditable batch of imported rows.

Key responsibilities:
- tracks the source file name and time range for the upload
- keeps an upload status such as `PROCESSING`, `COMPLETED`, or `FAILED`
- records which user uploaded the file
- supports historical comparisons across multiple uploads of the same period
- remains independently identifiable even when another upload covers the same reporting period

### EmployeePerformance
Represents one employee's imported performance record for a reporting period as captured by a specific `ImportBatch`.

Key responsibilities:
- preserves original metric values from the source Excel
- links every record back to both the employee and the import batch
- allows multiple uploads covering the same employee and same period to coexist
- keeps historical records intact without any soft-delete field or restoration workflow

### BranchDailyMetric
Represents manual, daily branch-level operational metrics entered by an administrator.

Key responsibilities:
- captures daily operational values for the single existing branch
- stores who created the record and who last updated it
- keeps actual values only; it is separate from employee score calculations
- supports daily reporting and trend analysis without introducing a branch dimension prematurely

### AuditLog
Records important administrative actions for accountability and operational traceability.

Key responsibilities:
- logs actions such as `CREATE`, `UPDATE`, `DELETE`, `IMPORT`, and `BATCH_DELETE`
- identifies the actor, entity type, and entity key
- stores before/after snapshots in JSON when useful and safe
- stores an optional `actorSnapshot` JSON snapshot of the actor's identity at the time the action occurs
- remains available even when a source business record is hard-deleted

## 3. Relationship Summary

- One `Employee` can have zero or one `User` account.
- One `Employee` can have many `EmployeePerformance` rows.
- One `ImportBatch` can contain many `EmployeePerformance` rows.
- One `User` can upload many `ImportBatch` records.
- One `User` can create many `BranchDailyMetric` rows.
- One `User` can update many `BranchDailyMetric` rows.
- One `User` can perform many `AuditLog` actions.
- `AuditLog` is intentionally not strongly cascaded to business records because audit records must remain after the source record is hard-deleted.

## 4. Indexes and Unique Constraints

| Name / Scope | Type | Fields | Why it is needed |
| --- | --- | --- | --- |
| `Employee.employeeCode` | Unique constraint | `employeeCode` | Ensures the company employee identity is not duplicated when importing data. |
| `User.email` | Unique constraint | `email` | Prevents duplicate dashboard login identities. |
| `User.employeeId` | Unique constraint, nullable | `employeeId` | Enforces a zero-or-one dashboard account per employee. |
| `BranchDailyMetric.metricDate` | Unique constraint | `metricDate` | For the current single-branch design, this allows one daily branch metric record per business day and avoids accidental duplicates. If multiple branches are added later, the key should become `(branchId, metricDate)`. |
| `EmployeePerformance(employeeId, periodStart, periodEnd)` | Index | `employeeId`, `periodStart`, `periodEnd` | Supports employee history views and historical reporting by employee and time range. |
| `EmployeePerformance(periodStart, periodEnd)` | Index | `periodStart`, `periodEnd` | Speeds date-range filtering for dashboards and period reports. |
| `EmployeePerformance(importBatchId)` | Index | `importBatchId` | Enables batch review and validation of performance rows associated with a specific import batch. |
| `ImportBatch(uploadedById, createdAt)` | Index | `uploadedById`, `createdAt` | Helps administrator review recent uploads and audit upload history. |
| `ImportBatch(periodStart, periodEnd)` | Index | `periodStart`, `periodEnd` | Supports import filtering and period-based comparisons. |
| `AuditLog(createdAt)` | Index | `createdAt` | Speeds recent audit queries and timeline review. |
| `AuditLog(entityType, entityId)` | Index | `entityType`, `entityId` | Allows traceability of all actions affecting a specific record. |
| `BranchDailyMetric(metricDate)` | Index | `metricDate` | Needed for daily branch trend queries and date lookups. |

### Important data-integrity notes
- `EmployeePerformance` intentionally does not have a unique constraint on `(employeeId, periodStart, periodEnd)`. This is required because separate import batches for the same employee and same reporting period must be preserved as distinct historical records.
- `ImportBatch` does not enforce uniqueness on a period pair because multiple uploads can cover the same reporting period and should remain independently identifiable.
- `BranchDailyMetric` is treated as a single-branch daily record. A uniqueness rule on `metricDate` is appropriate only because there is one branch and the business process assumes one metric entry per day. If a future multi-branch design is introduced, the key should be modified to `(branchId, metricDate)` instead.

## 5. Numeric Metric Types and Precision Choices

The employee performance and branch metric tables should use PostgreSQL `DECIMAL` (numeric) rather than floating-point types. `DECIMAL` gives exact arithmetic and avoids subtle rounding drift when calculating score formulas and when displaying operational metrics to end users.

Recommended precision:
- `DECIMAL(10,3)` for all operational metric values (`opsCR`, `dispatchTime`, `pickingTime`, `assignmentTime`, `prepTime`)
- `INT` for `orders`

Why this precision is appropriate:
- The business targets are small values, such as `1`, `7`, `1.7`, `0.3`, and `2`.
- Real-world values are typically measured with up to three decimal places and remain within a practical operational range.
- `DECIMAL(10,3)` allows numbers up to `9999999.999` with three decimals, which is comfortably above expected safe-zone and reporting values.
- Exact decimal math is safer than `FLOAT`/`DOUBLE PRECISION` for ratios and score calculations.

Business score formula:
- `score = min(100, safeZone / actualValue * 100)`
- The database stores the original raw values, not derived scores, because those values are source data and can be re-calculated consistently when rules change.

Validation rules for imported performance metrics:
- `orders >= 0`
- `opsCR > 0`
- `dispatchTime > 0`
- `pickingTime > 0`
- `assignmentTime > 0`
- `prepTime > 0`

These checks prevent dividing by zero and stop obviously invalid or impossible measurements from being accepted silently.

## 6. Deletion & Audit History Strategy

### Hard delete vs soft delete
Version 1 uses hard deletion for business records. There are no `deletedAt` fields in the Prisma schema and no soft-delete workflow is documented or required.

This means:
- deleting an `ImportBatch` hard-deletes its child `EmployeePerformance` rows through the existing `onDelete: Cascade` relation
- deleting a `BranchDailyMetric` removes that daily record permanently
- historical reporting is preserved by retaining the business records that were created, and by auditing administrative actions separately

### Batch-delete behavior
When an entire import batch is deleted:
1. the `ImportBatch` row is removed
2. all associated `EmployeePerformance` rows are removed by the Prisma relation rule (`onDelete: Cascade`)
3. the audit trail remains available for investigation and compliance
4. related `AuditLog` rows remain intact because they are not tied to a cascading delete path from business records

This is a database-level consequence of the existing relation configuration and should be implemented carefully in application transactions when a batch delete is performed.

### Audit log rules
`AuditLog` remains independent from hard-deleted business records.

Required behavior:
- `AuditLog.actorUserId` is nullable
- `onDelete: SetNull` is used for `actorUserId`
- `AuditLog.actorSnapshot` stores a business-safe snapshot of the actor at the time of the action, for example `{ id, email, role }`
- `actorSnapshot` must never include passwords, password hashes, tokens, or other secrets
- `AuditLog` must not cascade delete when a business record is removed
- `AuditLog.entityId` should remain a plain identifier for the affected record and should not be tied to a foreign key on the business table
- keep payloads concise: store only the fields necessary for accountability, not passwords, secrets, or unrelated sensitive data

This preserves administrative accountability while keeping the audit trail durable.

## 7. Prisma Compatibility and Naming Notes

This design is implementable in Prisma with PostgreSQL and follows standard Prisma naming conventions:
- model names use PascalCase: `Employee`, `User`, `ImportBatch`, `EmployeePerformance`, `BranchDailyMetric`, `AuditLog`
- field names use camelCase: `employeeCode`, `passwordHash`, `periodStart`, `actorSnapshot`
- enums use singular names: `Role`, `ImportBatchStatus`, `AuditAction`
- relation names should be explicit and descriptive, for example: `employee`, `importBatch`, `createdBy`, `updatedBy`, `actorUser`

The schema maps cleanly to Prisma relation definitions without adding unnecessary complexity. This is suitable for the current single-branch dashboard and can be extended later if new business domains are introduced.

## 8. Assumptions and Unresolved Decisions

The design intentionally documents the main assumptions that need confirmation:

1. Dashboard accounts are optional for employees.
   - The current design assumes some employees are not system users.

2. A user may be linked to at most one employee.
   - This is enforced by `User.employeeId UNIQUE` and is the cleanest representation of optional employee-to-account mapping.

3. One branch is assumed for the current version.
   - `BranchDailyMetric` intentionally does not include a `branchId` because the system currently manages a single branch.

4. Daily branch metrics are treated as one record per day.
   - The current business assumption is that each day has a single branch metric record.
   - If the business later allows multiple branch metric records per day, the schema should be revisited and the unique key should become `(branchId, metricDate)` or the model should allow multiple rows with a different business grouping.

5. Scores are calculated in application or reporting SQL, not stored as authoritative fields.
   - This preserves the ability to recompute scores when formulas or safe-zone targets change.

6. Audit payloads do not include secrets or password data.
   - `beforeData`/`afterData` should contain only business-safe JSON snapshots.

7. Business records use hard deletion by default in Version 1.
   - There is no `deletedAt` field or soft-delete/restore workflow in the current Prisma schema.
   - Deleting an import batch permanently removes its associated employee performance records through the cascade relation.
   - Audit records remain independent of deleted business records and preserve accountability history.

## 9. Query and Reporting Support

This schema supports the dashboard's required behaviors:

- employee performance history by employee and date range
- traceability from each employee performance row back to the exact import batch
- historical reporting across multiple uploads for the same employee and period
- admin review of recent import batches and failures
- manually entered daily branch metrics without mixing them with imported employee performance records
- score recalculation from raw values without storing redundant derived data
- audit review for import, update, delete, and batch-delete actions

The separation between `EmployeePerformance` and `BranchDailyMetric` is deliberate: imported employee performance is historical operational data, while branch metrics are daily management data entered by administrators. This separation makes trend reporting and score calculation easier and clearer for the dashboard.

## 10. Future Extension Considerations

If the business later adds multiple branches, the schema can evolve without redesigning the entire model:
- add `Branch` as a first-class model
- add `branchId` to `BranchDailyMetric`
- change the uniqueness rule to `(branchId, metricDate)`
- update the business rules for branch-level reporting, access control, and metric comparisons

This keeps the single-branch design simple while preserving a clear extension path.
