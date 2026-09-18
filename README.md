# Bible Stages

A classroom Bible exam hall for Sunday school and church classes.

Lecturers write and upload their own questions. Students download the full pack as soon as they enter — even if they sit later. Papers start and submit online so the teacher can mark them from another device. Answering still works if the connection drops.

## What it includes

- Five stages: **I General**, **II Little ones**, **III Growing**, **IV Juniors**, **V Youth**
- Lecturer question bank (write, edit, CSV upload, Mix / Yours / Core)
- Auto pack download on login
- Timed sittings with tab-leave integrity
- Teacher desk: papers, keys, results, hall notice, sitting lock
- Revision, flashcards, verse trainer, honour board, certificates
- Offline-friendly answering with queued hand-in

## Preview login (change these)

| Role | Password |
| --- | --- |
| Student / class | `class` |
| Teacher / lecturer | `teacher` |

Change both at the teacher desk after the first login.

---

## Host it live (recommended)

You need two free accounts: **GitHub** (already connected) and **Vercel**, plus a **Neon** Postgres database so every phone shares the same hall.

### 1. Database

1. Open [neon.tech](https://neon.tech) and create a project (region close to your class).
2. Copy the connection string. It looks like `postgresql://…@….neon.tech/neondb?sslmode=require`.

### 2. Deploy on Vercel

1. Open [vercel.com/new](https://vercel.com/new) and import this repository.
2. Framework preset can stay on **Other** / Vite. Build command: `npm run build`.
3. Add environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | your Neon connection string |
| `VITE_AUTH_ENABLED` | `false` |

4. Deploy. Vercel will install, build, and run the hall migrations automatically.
5. Open the live URL. Teacher password `teacher` → desk → **change passwords**.

Share the live URL with the class. Students enter their full name + class password. The question pack downloads onto their phone at login.

### 3. After deploy

- Add your own questions in **Question bank**
- Switch bank mode to **Mix** or **Yours** if you do not want only the built-in set
- Post a hall notice if the sitting is today
- Turn **sittings** on when you are ready, off when the paper is closed
- Use **Release marks** when you want students to see scores

---

## Run on your own computer

You need [Node.js 22](https://nodejs.org/) (or newer).

```bash
npm install
npm run dev
```

Then open the address the terminal prints (it serves on port 8080). Without `DATABASE_URL` the app uses a local database on that machine — fine for trying it, not for a real class on many phones.

For a real class on your own server, set `DATABASE_URL` to a shared Postgres database, set `VITE_AUTH_ENABLED=false`, then:

```bash
npm install
npm run build
```

Host the Vercel build output, or keep using Vercel / another Node host that understands the Nitro `vercel` preset in `vite.config.ts`.

---

## Passwords and data

- Class and teacher passwords are hashed in the database. Default hashes are seeded so the preview login works on first boot.
- Student names and scripts are stored in the hall database. Do not put private pastoral notes in teacher comments if the hall is on a shared demo database.
- Change the default passwords before you give the link to students.

## Stack

React 19, TanStack Start, Tailwind v4, Postgres (Neon in production, embedded PGLite when no `DATABASE_URL`).
