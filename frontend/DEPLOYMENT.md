# Deployment

- Frontend (Vercel): https://motox-group-5ah4.vercel.app
- Backend API (Wasmer): https://motox-backend.wasmer.app

The frontend reads the API base URL from the `VITE_API_URL` environment
variable (set in Vercel project settings). It falls back to
`http://localhost:8000` for local development.
