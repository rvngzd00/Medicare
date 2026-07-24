# Medicare admin frontend

The admin UI supports two explicit runtime modes:

- Demo mode is selected with `NEXT_PUBLIC_ADMIN_DEMO_MODE=true`. If the variable is omitted, demo mode is only inherited when `NEXT_PUBLIC_USE_MOCK_API=true`; otherwise real mode is the safe default. It uses local Azerbaijani sample data; UI mutations are not durable and no credentials are hardcoded.
- Real mode is selected explicitly with `NEXT_PUBLIC_ADMIN_DEMO_MODE=false`. When that variable is omitted, `NEXT_PUBLIC_USE_MOCK_API=false` also selects real admin mode. It uses `NEXT_PUBLIC_API_URL`, accepting either an origin such as `http://localhost:4000` or a full `/api/v1` base.

For a complete real-mode run, start the backend and its PostgreSQL database first, then use:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_ADMIN_DEMO_MODE=false
```

The backend must allow the frontend origin through `CORS_ORIGINS`. The top-level [frontend README](../../README.md) documents the independent public/admin mode combinations.

## Real-mode contracts

`adminApi.js` keeps the access token in memory, sends the refresh cookie with `credentials: "include"`, retries one unauthorized request through `/auth/refresh`, and emits `medicare:session-expired` when renewal fails. `AdminShell` verifies `/auth/me` before rendering protected routes.

The resource list/editor screens use the supported individual CRUD endpoints for doctors, departments, services, articles, and users. User edit pages load the dedicated `GET /admin/users/:id` route, so they are not limited by list pagination. Bulk actions are composed from individual supported requests, so there is no undocumented bulk endpoint dependency. Editors expose only fields that can be persisted safely by the current backend contract.

Appointments persist `status` and `adminNotes`. Messages operate on admin contacts and persist contact status. A reply draft is durably appended to `adminNotes`; it is explicitly labelled as an internal note because the backend has no mail-send endpoint.

Content modules map to backend resources as follows:

| Admin module | Backend resource |
| --- | --- |
| Ana səhifə | `home-sections` |
| Haqqımızda | `pages` (`slug=about`) |
| FAQ | `faqs` |
| Pasiyent rəyləri | `testimonials` |
| Filiallar | `branches` |
| Rəhbərlik | `leadership` |
| Qalereya | `gallery` plus media upload |
| Sertifikatlar | `certificates` |
| Naviqasiya | `navigation` |
| Sosial media | `social-links` |
| Əlaqə məlumatları | `settings` (`key=contact`) |

The Home hero and About page are singleton records and therefore cannot be created or deleted from their section editors. Other content modules support creation when their required fields can be represented safely. Gallery creation uploads media first and then persists the returned media ID; optional leadership and certificate media use the same pipeline.

Roles load the backend permission catalogue and preserve granular permission codes that are only partially represented by a grouped checkbox. Settings persist public configuration records; auth security policy and server secrets are shown as server-managed because those controls are not mutable through the current API.

All effect-based requests use `AbortController`. API errors are normalized from the backend error envelope, and real-mode screens expose loading, empty, error, retry, confirmation, and mutation feedback states. Sidebar modules are filtered using `/auth/me` permission codes; the API remains the authoritative enforcement layer. Appointments persist status/admin notes; contacts persist status and reply drafts as internal notes. No e-mail delivery is claimed because the API does not provide a mail-send endpoint.
