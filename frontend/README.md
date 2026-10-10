# MotoX Group frontend

Premium motorcycle showroom homepage built with React, JSX, and Vite.

## Run locally

```sh
npm install
npm run dev
```

The frontend uses the Laravel public catalog endpoints and test-ride request endpoint through the shared Axios client. Set `VITE_API_URL` to the Laravel server's origin when it differs from `http://localhost:8000`.

The public motorcycle catalog is available at `/shop`, with details at `/motorcycles/:id`. The Laravel-backed administration area starts at `/admin/login` and enforces the permissions returned by the existing session API. Motorcycle enquiries and test-ride requests are submitted to the existing public endpoints.

```sh
npm run build
npm run lint
```
