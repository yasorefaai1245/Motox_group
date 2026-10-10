# Deployment

- Backend API (Wasmer): https://motox-backend.wasmer.app
- Frontend (Vercel): https://motox-group-5ah4.vercel.app

Required Wasmer environment variables (besides the DB_* ones Wasmer provides):

- `APP_KEY` (secret)
- `APP_ENV=staging` (so `php artisan migrate` runs without an interactive prompt)
- `DB_CONNECTION=mysql`
- `DB_DATABASE` = the value of `DB_NAME`

Migrations (including the catalog seed migration) run on every Git-triggered build.
Changing only environment variables does not run migrations.
