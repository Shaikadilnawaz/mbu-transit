# MCONNECTS — Student Transport App (Mohan Babu University)

A campus transport app: on-demand **auto rides**, student-to-student **carpool rides**,
**APSRTC bus** schedules, live **tracking**, **chat**, **SOS**, and role-based dashboards
for students, drivers, student-drivers, and admins.

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS (white/black/gold theme, forced light)
- **Backend:** Firebase — Authentication + Cloud Firestore (real-time)
- **Maps:** Leaflet + OpenStreetMap (tiles), OSRM (routing), Nominatim (search)

---

## Getting started (run on any PC)

> The backend is Firebase in the cloud and is **shared** — there's nothing to install
> for the backend. Each PC just needs the app + the Firebase config.

1. **Install [Node.js](https://nodejs.org/)** (LTS).
2. **Clone the repo**, then `cd` into it.
3. **Create `.env.local`** in the project root. Copy `.env.local.example` and fill in the
   Firebase web config (ask a teammate for the values — same values for everyone since we
   share one Firebase project):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
4. **Install dependencies & run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:9002

`.env.local` is **git-ignored** (never committed). Firebase web config keys are safe to
share within the team — access is protected by Firestore security rules, not by hiding keys.

---

## Project structure

```
src/
├─ app/                         # Pages & routes (Next.js App Router). Folder = URL.
│  ├─ (student)/                # Student pages — the "(student)" name is just grouping,
│  │  ├─ dashboard/             #   not part of the URL. → /dashboard
│  │  ├─ book-auto/             # → /book-auto      (auto ride booking + map)
│  │  ├─ student-ride/          # → /student-ride   (carpool booking + map)
│  │  ├─ ride-history/          # → /ride-history
│  │  ├─ messages/              # → /messages       (chat list)
│  │  ├─ track/[id]/            # → /track/<id>     (live tracking, shared by all roles)
│  │  └─ contact/               # → /contact
│  ├─ driver/                   # Auto-driver pages    → /driver/...          (guarded)
│  ├─ student-driver/           # Student-driver pages → /student-driver/...  (guarded)
│  ├─ admin/                    # Admin pages          → /admin/...           (guarded)
│  ├─ login/  signup/  offers/  bus-schedule/  forgot-password/
│  ├─ layout.tsx                # Root layout (theme + auth provider)
│  └─ globals.css               # Theme colors (white/black/gold tokens)
│
├─ components/
│  ├─ ui/                       # Reusable UI primitives (button, card, table, input…)
│  ├─ layout/                   # Top navs: guest-nav, driver-nav, student-driver-nav,
│  │                            #   admin-shell
│  ├─ auth/                     # login-form, signup-form, role-guard, auth-shell, guest-only
│  ├─ map/                      # location-picker, ride-tracking-map, use-ride-progress
│  └─ chat/                     # chat-box, messages-view
│
├─ context/
│  └─ auth-context.tsx          # Login/signup/logout + current user & role (used everywhere)
│
├─ lib/
│  ├─ firebase.ts               # Firebase init (reads .env.local)
│  ├─ db.ts                     # ALL Firestore reads/writes live here (one place)
│  ├─ types.ts                  # Shared TypeScript types (Booking, UserProfile, roles…)
│  ├─ geo.ts                    # Map maths: 30km rule, fare, routing, place search
│  └─ utils.ts                  # Small helpers (cn)
│
└─ ai/                          # (Optional) Genkit AI — disabled unless an API key is set

firestore.rules                 # Security rules — must be PUBLISHED in the Firebase console
```

**Rules of thumb for teammates:**
- A new page → add a folder under `src/app/...` (the folder path becomes the URL).
- Any database read/write → add it to **`src/lib/db.ts`** (don't scatter Firestore calls).
- Shared types → **`src/lib/types.ts`**.
- Reusable button/card/etc. → **`src/components/ui/`**.

---

## Roles

`student` · `driver` · `student-driver` · `admin` (values are lowercase, case-sensitive).

- **Students** self-register (email must end `@mbu.asia`).
- **Driver / Admin** use `@gmail.com`; **student-driver** uses `@mbu.asia`.
- Driver / student-driver / admin accounts are created by hand in Firebase:
  Authentication → Add user, then a Firestore `users/<uid>` doc with `role` (+ `gender` for
  student-drivers, so the female-only feature works). The document ID **must equal the
  account's UID**.

---

## Firebase setup (one-time, in the console)

1. **Firestore → Rules** → paste the contents of `firestore.rules` → **Publish**.
2. **Authentication → Sign-in method** → enable **Email/Password** (and Google if used).
3. **Authentication → Settings → Authorized domains** → add your deploy domain (e.g. the
   Vercel URL) so login works on the live site.

---

## Deploy (Vercel — recommended for Next.js)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
3. In **Environment Variables**, add the same six `NEXT_PUBLIC_FIREBASE_*` values from
   `.env.local`.
4. **Deploy.** Vercel gives you a live URL.
5. Add that URL to Firebase **Authorized domains** (step above) so login works.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run locally at http://localhost:9002 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
