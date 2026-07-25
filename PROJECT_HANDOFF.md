# MCONNECTS — Project Handoff

> Paste this into a new chat, or add it as "project knowledge" in a claude.ai Project,
> so any future chat understands the whole project.

---

## How to work with me (please follow these)
1. **I'm a complete beginner** at web development — I don't know any programming languages. I'm learning by building this project, so don't just hand me code — help me understand.
2. **Explain each step in plain language** as you go (briefly), not just a summary at the end.
3. **Teach me the technical term** whenever I use an everyday word (e.g. I say "colour" → tell me it's the *theme/palette*; "the box" → *component*). Keep it short and inline.
4. **Warn me before anything outside the code** — publishing Firestore rules, creating Firebase accounts, restarting the dev server, deploying — with exact click-by-click steps.
5. When something breaks, **explain what the error means in simple terms** before fixing it.

---

## What the project is
**MCONNECTS** — a student transport web app for **Mohan Babu University (MBU), Tirupati**:
on-demand auto rides, student-to-student carpool rides, APSRTC bus schedules, live tracking,
chat, SOS, coupons, and role-based dashboards.

## Tech stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** — theme: white background, **near-black buttons + refined gold accents**, forced light mode. Heading font **Plus Jakarta Sans**, body **Inter**.
- **Firebase** — Authentication + Cloud Firestore (real-time). Project id `mconnects-37df5`; config in `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).
- **Maps**: Leaflet + OpenStreetMap tiles, OSRM (road routing), Nominatim (place search). Firestore uses `experimentalAutoDetectLongPolling` (fixes "client is offline" on campus networks).
- Runs on **port 9002** (`npm run dev`).

## Roles (lowercase, case-sensitive)
`student` · `driver` · `student-driver` · `admin`
- **Login** = one page with a **role dropdown** (4 options); the chosen role is enforced.
- **Email domains**: students & student-drivers `@mbu.asia`; driver & admin `@gmail.com`.
- Only students self-signup. Driver/admin/student-driver accounts are created by hand in Firebase:
  **Auth user + a `users/{uid}` doc where the Document ID = the account's UID**, with `role`
  (+ `gender` for student-drivers, needed for the female-only feature).

## Features built
**Rides (auto + student carpool)**
- Map booking with a **30 km MBU radius** rule, typeahead place search, distance-based fare.
- Student-ride extras: **bike = 1 seat / car = up to 4 seats**, **female-only** option (only female students can pick it; blocks with "no female drivers at present" if none online).
- **Broadcast dispatch** → online drivers see requests → **first to Accept wins** (Firestore transaction).
- **OTP to start**: on accept, student gets a 4-digit OTP; driver enters it to start the ride.
- **Live tracking**: auto icon drives the real road route (~10s simulated), auto-completes.
- **Cash-only** note + **5-star ratings both ways**.
- Safety logic: one active ride per driver, one active booking per student, resume-on-refresh, "no drivers available" fallback, block identical pickup/drop.

**Other**
- **Live chat** per booking (tracking screen + `/messages`, `/driver/messages`, `/student-driver/messages`).
- **SOS** button → `sos` collection → admin SOS page (live).
- **Driver Online/Offline toggle** (only online drivers get/count for requests).
- **Coupons**: admin-only manager `/admin/coupons`; shown on student dashboard; **discounts apply to fare** — auto offers ("first ride FREE", "10% off first 5 rides", from completed-ride count) + typed codes; best discount wins.
- **File a complaint** (student, Contact page) → admin Complaints page.
- **Bus schedule** page (schedule-only, no booking) — curated Tirupati→MBU→Piler list + deep-links to apsrtclivetrack.com.
- **Admin** area (all real Firestore data): dashboard, students, drivers, student-drivers, active rides, all rides, analytics, complaints, coupons, SOS.
- **PWA** installable (`app/manifest.ts`, `public/icon.svg`, `public/sw.js`, `pwa-register.tsx`).
- **Mobile responsive** (hamburger nav; tables scroll).

## Architecture (key files)
- `src/app/...` — pages; folder = URL. Groups: `(student)/`, `driver/`, `student-driver/`, `admin/`.
- `src/lib/db.ts` — **ALL Firestore reads/writes** live here.
- `src/lib/types.ts` — shared types (Booking, UserProfile, Offer, roles…).
- `src/lib/geo.ts` — 30 km rule, fare, `computeDiscount`, routing, place search.
- `src/context/auth-context.tsx` — auth + current user/role.
- `src/components/` — `ui/` (primitives), `layout/` (navs + admin-shell), `auth/`, `map/`, `chat/`.
- `firestore.rules` — security rules (**must be published in the Firebase console after any change**).
- `README.md` — full setup docs.

## ⚠️ Setup gotchas
1. **Publish `firestore.rules`** in Firebase Console (Firestore → Rules → paste → Publish) — needed for admin lists, coupons, complaints, chat, driver-availability reads.
2. Authentication → **Authorized domains**: add the deploy URL (e.g. the Vercel URL) or login breaks on the live site.
3. `.env.local` is git-ignored — each teammate creates their own with the shared Firebase config.
4. Drivers must toggle **Online** to receive requests. To clear ghost/test rides, delete docs in the `bookings` collection in the Firebase console (the console bypasses security rules).

## Deploy
Push to GitHub → import to **Vercel** → add the six `NEXT_PUBLIC_FIREBASE_*` env vars → deploy →
add the Vercel URL to Firebase **Authorized domains**.

## Not done yet / possible next steps
- Real GPS tracking (currently simulated).
- Loading skeletons + hover micro-interactions (final polish).
- Share-my-trip link, referral/loyalty wallet, off-peak discounts.
- Admin actions (suspend/activate users, resolve complaints).
- Reverse bus direction (Piler→Tirupati).
- Coupon usage limits / expiry.

---

## Resume points

**One-line description**
> A full-stack, real-time ride-hailing and transport platform for a university campus — on-demand auto rides, student carpooling, live tracking, chat, and role-based admin dashboards.

**Bullets (pick 2–4 for the resume):**
- Built a **full-stack, real-time ride-hailing platform** (Next.js 15, React 19, TypeScript, Firebase Firestore) supporting **4 role-based dashboards** (student, driver, student-driver, admin) with route-guarded access.
- Engineered an **Uber/Rapido-style dispatch system**: broadcast requests to online drivers with **first-to-accept concurrency handling via Firestore transactions**, **OTP-verified ride start**, and two-way ratings.
- Implemented **live map tracking** (Leaflet + OpenStreetMap) with **OSRM road routing**, **Nominatim place search**, and a **30 km geofence** validating pickup/drop.
- Developed **real-time features** via Firestore snapshot listeners — in-app chat, live status, driver availability, and an SOS emergency flow.
- Secured the data layer with **Firestore Security Rules** enforcing role-based permissions across all collections.
- Built an **admin-managed coupon/discount engine** and admin CRUD analytics dashboards; shipped a responsive **installable PWA** deployed on **Vercel**.

**Tech stack line**
> Next.js 15, React 19, TypeScript, Firebase (Auth + Cloud Firestore), Tailwind CSS, Leaflet, OSRM, Nominatim, PWA, Vercel

**Skills demonstrated**
Full-stack development · Real-time databases · Authentication & role-based access control (RBAC) · Security rules · Concurrency (transactions) · Maps & geolocation · 3rd-party API integration · Responsive UI / design systems · PWAs · Git/GitHub · Vercel deployment
