# Repository Tree

```text
Talabat-KPI-s/
├── .gitignore
├── .vscode/
├── docker-compose.yml
├── README.md
├── public/
├── repository-tree.md
├── server/
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package-lock.json
│   ├── package.json
│   ├── docs/
│   │   └── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │       └── 20261013120000_init/
│   │           └── migration.sql
│   ├── scripts/
│   │   └── bootstrap-admin.js
│   ├── src/
│   │   ├── main.js
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── admins/
│   │   │   │   └── employeeAdminController.js
│   │   │   ├── auth/
│   │   │   │   └── authController.js
│   │   │   └── employees/
│   │   │       └── employeeController.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── auth/
│   │   │       ├── auth.js
│   │   │       └── authorize.js
│   │   ├── prisma/
│   │   │   └── prismaClient.js
│   │   ├── routes/
│   │   │   ├── admins/
│   │   │   │   └── employeeAdminRoutes.js
│   │   │   ├── auth/
│   │   │   │   └── authRoutes.js
│   │   │   └── employees/
│   │   │       └── employeeRoutes.js
│   │   ├── security/
│   │   │   ├── passwordService.js
│   │   │   └── tokenService.js
│   │   ├── services/
│   │   │   ├── admins/
│   │   │   ├── auth/
│   │   │   │   └── authService.js
│   │   │   └── employees/
│   │   │       └── employeeService.js
│   │   ├── utils/
│   │   │   └── AppError.js
│   │   └── validators/
│   │       ├── admins/
│   │       └── users/
│   └── tests/
│       └── admin-employee-routes.test.js
```
