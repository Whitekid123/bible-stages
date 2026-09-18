# Bible Stages

A **phone app** for Sunday school and church Bible exams — not a website you browse in a tab.

Students install it on the home screen. Lecturers write questions in the teacher desk. The question pack downloads onto each phone at login, even if they sit later. Papers start and submit so the teacher can mark from another device.

## What it includes

- Five stages: **I General**, **II Little ones**, **III Growing**, **IV Juniors**, **V Youth**
- Lecturer question bank (write, edit, CSV upload, Mix / Yours / Core)
- Auto pack download on login
- Timed sittings with tab-leave integrity
- Teacher desk: papers, keys, results, hall notice, sitting lock
- Revision, flashcards, verse trainer, honour board, certificates
- Works offline for answering; start and hand-in need a connection

## Preview login (change these)

| Role | Password |
| --- | --- |
| Student / class | `class` |
| Teacher / lecturer | `teacher` |

Change both at the teacher desk after the first login.

---

## This is an app. Hosting is only how phones get it.

Phones cannot install a Play Store package from this chat. They install **Bible Stages** the same way as many church apps: open the class link once, then **Add to Home Screen**. After that it opens full-screen with its own icon — no browser bar.

You still publish one live address so every student installs the **same** hall.

### 1. Database

1. Open [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string (`postgresql://…`).

### 2. Put the app online

1. Open [vercel.com/new](https://vercel.com/new) and import `Whitekid123/bible-stages`.
2. Add environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | your Neon connection string |
| `VITE_AUTH_ENABLED` | `false` |

3. Deploy. That live URL is the **class app link**.

### 3. Install on each phone

**Android (Chrome)**
1. Open the class link
2. Menu (⋮) → **Install app** / Add to Home screen
3. Open the new **Bible Stages** icon

**iPhone (Safari)**
1. Open the class link in Safari
2. Share → **Add to Home Screen**
3. Open the new **Bible Stages** icon

The login screen also shows these steps. Once installed, questions stay on that phone.

### 4. Before class

- Teacher password `teacher` → desk → **change passwords**
- Add questions in **Question bank**
- Switch bank mode to Mix or Yours if needed
- Share the class link (or tell students to use the home-screen icon)

---

## Try it on a computer

You need [Node.js 22](https://nodejs.org/).

```bash
npm install
npm run dev
```

That is for trying the app. A real class on many phones needs the hosted app link above.

---

## Passwords and data

- Class and teacher passwords are hashed in the database.
- Change the default passwords before students install.
- Student names and scripts live in the hall database.

## Stack

React 19, TanStack Start, Tailwind v4, Postgres (Neon when hosted). Installable as a standalone app (manifest + service worker).
