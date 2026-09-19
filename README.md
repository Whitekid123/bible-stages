# Bible Stages

A **phone exam app** for Sunday school. Students sit on their own phones. The teacher watches the class live — who is writing, who left the app, who handed in.

## How a real sitting works

1. Every student has the **Bible Stages** app on their own phone.
2. **Internet is on** (data or WiFi). That is how the class is connected.
3. Students enter their **full name** and the class password.
4. They tap **Begin** → **Start the exam**.
5. On the teacher phone, the **Live class** board shows each student.
6. If a student leaves the app or switches away, the teacher sees **Left the app**.
7. When they hand in, the script is on the teacher desk.

| Role | Password (change these) |
| --- | --- |
| Student / class | `class` |
| Teacher / lecturer | `teacher` |

---

## What you need to do (once)

The phones must share **one class hall** on the internet. You already started this with Vercel. Do not use Neon.

### 1. Give the class a database (inside Vercel)

1. Open [vercel.com](https://vercel.com) and open the **bible-stages** project.
2. Click **Storage**.
3. Click **Create Database** → **Postgres**.
4. Confirm. Vercel adds `DATABASE_URL` by itself.
5. Open **Deployments** → ⋮ on the latest → **Redeploy**.

When that finishes, you get a live class link (looks like `https://….vercel.app`).

### 2. Put the app on every phone

**Android**
- Install the **Bible Stages** APK I give you, **or** open the class link in Chrome → menu ⋮ → **Add to Home screen**.

**iPhone**
- Open the class link in **Safari** → Share → **Add to Home Screen**.

### 3. On exam day

1. Teacher: open the app → **Teacher** → password `teacher`.
2. Watch **Live class**. Students appear as they enter.
3. Students: open the same app → full name → password `class` → **Enter the hall** → **Begin**.
4. Keep internet on until they hand in.

Change the passwords at the teacher desk before a real exam.

---

## Lecturer questions

Teacher desk → **Bank**. Write questions or upload CSV. Students download the pack when they enter, even if they sit later.

---

## Try it on a computer

You need [Node.js 22](https://nodejs.org/).

```bash
npm install
npm run dev
```
