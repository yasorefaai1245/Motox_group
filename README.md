# MotoX Group

MotoX Group is a motorcycle showroom and catalog application prepared for a
technical assessment. It combines a public React website with a Laravel API
and a role-protected administration area. Showroom and image content identified
as demo/illustrative is not a claim about real MotoX locations, stock, or
authorized dealerships.

## Technology

- **Frontend:** React 19, JavaScript/JSX, Vite 8, Axios, and CSS.
- **Backend:** PHP 8.2+, Laravel 12, Laravel Sanctum, and PHPUnit 11.
- **Database:** MySQL (`motox_group`) for local application use. The Laravel
  project also supports SQLite; automated backend tests use in-memory SQLite.

## Project structure

```text
.
├── backend/
│   ├── app/                 # Laravel models, requests, middleware, controllers
│   ├── config/              # Laravel configuration, including database.php
│   ├── database/
│   │   ├── migrations/      # Schema migrations
│   │   └── seeders/         # Catalog, services, showrooms, demo users
│   ├── routes/api.php       # Public and authenticated API endpoints
│   └── tests/               # PHPUnit unit and feature tests
└── frontend/
    ├── src/
    │   ├── components/      # Public pages, catalog, and admin UI
    │   ├── context/         # Authentication state
    │   ├── hooks/           # API data and location hooks
    │   ├── services/        # Axios API client
    │   └── assets/          # Logos and local visual assets
    └── tests/               # Node-based frontend tests
```

## Requirements

- PHP 8.2 or later and Composer.
- Node.js and npm.
- MySQL and PHP's PDO MySQL extension.

## Local setup

### 1. Configure MySQL

Create the database and a MySQL user with access to it. For example:

```sql
CREATE DATABASE motox_group
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

In `backend/.env`, set the database connection values. The MySQL connection
uses the following Laravel environment variables:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=motox_group
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
```

The checked-in `backend/.env.example` defaults to SQLite; set the MySQL values
above when using the requested `motox_group` database. Do not commit `.env` or
real credentials.

### 2. Install, migrate, and seed the backend

From the project root:

```sh
cd backend
composer install
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Edit `.env`
to configure MySQL, then run:

```sh
php artisan key:generate
php artisan migrate
```

`migrate` applies pending migrations; it does not reset existing database
records. Never use `migrate:fresh` against a database whose data must be kept.

The catalog, core-services, and demo-showroom seeders can be run independently
and repeatedly without resetting the database:

```sh
php artisan db:seed --class=MotorcycleCatalogSeeder
php artisan db:seed --class=CoreServicesSeeder
php artisan db:seed --class=DemoShowroomSeeder
```

Run `MotorcycleCatalogSeeder` before `DemoShowroomSeeder` so the Doha demo
showroom can associate with currently active catalog brands. These seeders do
not replace unrelated records.

`DatabaseSeeder` creates the sample admin and data-entry accounts. It uses
plain `create` calls and is **not idempotent**; run it only once in a fresh
local assessment database if those accounts are needed:

```sh
php artisan db:seed --class=DatabaseSeeder
```

### 3. Start the backend and frontend

In one terminal:

```sh
cd backend
php artisan serve
```

The API defaults to `http://localhost:8000`. In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL when it starts. The Axios client uses
`http://localhost:8000` by default; if the backend runs at another origin, set
`VITE_API_URL` in the frontend environment to that origin (for example,
`http://localhost:8000`).

## Demo sign-in accounts

The following credentials are present in `DatabaseSeeder` for local assessment
use only. They are not production credentials; change or remove them before
deployment.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@vantaromotors.test` | `Admin@12345` |
| Data Entry | `dataentry@vantaromotors.test` | `Data@12345` |

The seeded Data Entry account has no brand assignments by default. An Admin
must assign one or more brands before it can manage brand-scoped records.

## Website pages and API

### Public website

- `/` — Home, brands/categories, featured motorcycles, services, test-ride
  request, and showroom sections.
- `/shop` — Paginated motorcycle catalog with search and filters.
- `/motorcycles/:id` — Motorcycle details.
- `/login` and `/register` — Customer authentication.
- `/admin/login` and `/admin/...` — Staff administration; access is enforced
  by the authenticated API and role checks.

### Public API

All API paths below are relative to `/api`:

- `GET /public/brands`
- `GET /public/motorcycles` and `GET /public/motorcycles/{id}`
- `GET /public/services`
- `GET /public/showrooms`
- `POST /enquiries` and `POST /test-rides` for public customer requests.
- `POST /login` and `POST /register`; public registration creates a customer
  account, not a staff account.

Public motorcycle results include active motorcycles for active brands and are
paginated (12 per page). Test-ride requests are validated against the selected
active motorcycle, its active brand, and an active showroom associated with
that brand.

Authenticated routes provide catalog/service management, enquiry and test-ride
workflows, and admin-only showroom and team management. Their complete route
definitions are in `backend/routes/api.php`.

## Staff roles and permissions

Both staff roles can sign in at `/admin/login`. API authorization is enforced
server-side; hiding a page or menu item is not the security boundary.

| Role | Access |
|---|---|
| **Admin** | Manage brands, motorcycles, services, showrooms, enquiries, test rides, and Data Entry accounts. Assign brands to Data Entry accounts. |
| **Data Entry** | Manage only assigned brands and their motorcycles/services; view and update enquiries and test rides associated with assigned brands. Cannot manage showrooms or team accounts, or delete enquiries/test rides. |
| **Customer** | Public browsing, account registration/login, and public enquiry/test-ride requests; no staff resource access. |

## Tests and production build

Run backend tests from `backend/`:

```sh
php artisan test
# Or use the Composer test script:
composer test
```

The PHPUnit configuration uses an in-memory SQLite database for tests; test
runs do not require the local MySQL database.

Run frontend checks from `frontend/`:

```sh
npm run test:catalog
npm run lint
npm run build
```

The production frontend bundle is written to `frontend/dist/`. For deployment,
configure the production database and environment securely, then apply pending
schema changes with `php artisan migrate --force`; do not use
`migrate:fresh` on production data.

## Design, demo content, and assets

- **Figma prototype:** [View MotoX Group Design](https://www.figma.com/proto/5M02IkHc5KSYPYFpH3hXXe/Untitled?node-id=3-6709&t=LR3CMmwsMiFoXNAT-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1)
- **Deployment:** [Add the deployed application URL]
- The design establishes the visual identity, layout, and user experience of
  the website. Ensure the prototype is accessible to reviewers without
  requiring special permissions.
- AI tools assisted with development and documentation. Some local motorcycle
  and showroom visuals are AI-generated or otherwise illustrative demo assets;
  they do not represent verified stock, real MotoX premises, or authorized
  dealerships.
- The four seeded showrooms (Doha, Dubai, Riyadh, and Cairo) are fictional demo
  records. Their addresses are explicitly marked as fictional; phone numbers
  and opening hours are not fabricated.
- The experience-section image is loaded from Unsplash (the image URL is in
  `frontend/src/components/HomeSections.jsx`).
- When a showroom image supplied by the API uses the existing Wikimedia
  Commons image paths, the frontend displays the associated attribution:
  Pierre Chapron (CC BY 3.0), Wide Awake! (CC BY 4.0), Albert Deccan (CC BY-SA
  3.0), and Rikki Mitterer (CC BY-SA 4.0). The corresponding source links and
  license labels are maintained in `frontend/src/components/HomeSections.jsx`.

## Assessment hand-off

Add the deployment URL above before submitting. Confirm that the local MySQL
credentials are configured for the assessor's environment, and change/remove
the local demo account passwords before any public deployment.
