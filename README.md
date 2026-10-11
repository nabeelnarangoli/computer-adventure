# Computer Adventure

A self-paced computer course for kids and adults on **Mac or Windows**, from the very first click to advanced skills. Learners log in, pick their computer and a course, take a short placement check, and get a personal course. Each learner's progress is saved separately. An admin panel lets you create learners and follow their progress.

- **Basic course:** 30 lessons in 5 units: the computer, files and the internet, Word and PowerPoint, Excel and everyday skills, and a graduation project.
- **Advanced course:** 25 lessons in 7 units: power-user skills, Word/PowerPoint pro, Excel pro, cloud and teamwork, online security, design/video/coding/AI, and a graduation project.
- **Lessons:** every lesson has animated demos that look like the learner's own Mac or Windows screen, a read-aloud button, a checklist to try on the real computer, practice games, a challenge and a show-and-tell task.
- **Learner types:** "Child" accounts get playful wording that mentions parents. "Adult" accounts get plain wording.

## How it's built

| Part | What it is |
|---|---|
| `public/` | The website: plain HTML, CSS and JavaScript (no build step) |
| `public/index.html` | Learner site |
| `public/admin.html` | Admin panel (also at `/admin`) |
| `public/js/course-*.js` | Lesson content (edit text here) |
| `public/js/placement.js` | Placement questions and the plan builder |
| `netlify/functions/api.mjs` | The API, running as a Netlify Function at `/api/*` |
| `netlify/lib/handler.mjs` | API logic: logins, learners, progress |
| Netlify Blobs | Storage for learners and progress (built into Netlify, no database to set up) |

## Put it online (GitHub + Netlify)

1. **Push this folder to GitHub.** (If Claude created the repository for you, skip this step.)
2. Sign in at **app.netlify.com**, then go to **Add new site → Import an existing project → GitHub**, and pick the repository.
3. Netlify reads `netlify.toml` by itself. Leave the build settings as they are and click **Deploy**.
4. Go to **Site configuration → Environment variables** and add:
   - `ADMIN_PASSWORD`: a long password only you know. This is required.
   - `SESSION_SECRET` (optional): any long random text. It signs login sessions. If you set it, changing it logs everyone out.
5. Go to **Deploys → Trigger deploy → Deploy site** so the new variables take effect.
6. Open `https://<your-site>.netlify.app/admin`, log in with your admin password, and add learners.
7. Send each learner the site address with their username and PIN.

Optional: add your own domain under **Domain management** (for example `learn.yourcompany.ae`).

## Run it on your own computer

You need Node.js 22 or newer.

```bash
npm install
ADMIN_PASSWORD=choose-a-password npm run dev
# open http://localhost:8888  (admin: http://localhost:8888/admin)
```

Local data is saved as JSON files in `.data/`. This folder is ignored by git.

## Security notes

- PINs are stored as salted scrypt hashes, never as plain text.
- Logins are rate-limited:
  - A learner who gets the PIN wrong 8 times is locked out for 5 minutes.
  - 6 wrong admin passwords lock the admin login for 5 minutes.
- Learner sessions last 30 days on that browser. Admin sessions last 12 hours and end when the browser tab closes.
- A short PIN is fine for children at home. For adults or anything public, use longer passwords: the PIN field accepts up to 20 characters.
- Netlify serves the site over HTTPS automatically.

## Editing lessons

Lessons are JavaScript objects in `public/js/course-*.js`. Text can contain:

- `{{mac text||windows text}}`: shows the right version for each learner.
- `[name]`: the learner's first name.
- Mac key symbols (⌘ ⌥ ⇧): these become Ctrl / Alt / Shift automatically for Windows learners.

Commit and push your changes, and Netlify redeploys within about a minute.
