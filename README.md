# Aqlyon Digital Skill Academy

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

## Subtitle languages

English is always the main text. Each learner can add a subtitle line in **Malayalam, Hindi or Arabic** (🌐 button in the top bar, the profile page, the first setup screen, or the admin panel).

- Translations live in `public/js/i18n/ml.js`, `hi.js` and `ar.js`, keyed by the English text. Numbers become `{0}`, `{1}`… and the learner's first name becomes `{N}`.
- `public/js/i18n.js` finds each piece of text on the page and adds the translation underneath, including the captions in the animated demos.
- If you change a lesson's English text, its subtitle disappears until you add the new sentence to the three language files. Untranslated text simply shows in English only.

## Self sign-up

The learner sign-in page has a **Create an account** button. People choose a name, username, PIN, child/adult wording and subtitle language, then see their sign-in details once. New accounts show up in the admin panel marked "signed up", and you manage them like any other learner. Untick **Let people create their own account** in the admin panel to close sign-up. Sign-ups are limited to 5 per hour from the same internet connection.

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

## Aqlyon AI Academy

A separate course inside the site (`#ai`), branded for Aqlyon Career Discovery Centre.

- 13 stages in 4 levels: Foundations, Everyday AI, Creative Studio, AI Pro. Content lives in `public/js/ai-content.js`; screens in `public/js/ai-academy.js`; styles in `public/css/ai.css`.
- Covers Claude, ChatGPT, Gemini, Microsoft Copilot, Kling, Runway and Higgsfield, with "which tool for which job" guidance, prompts to copy, practice games and animated demos.
- Optional 7-question level check opens the levels a learner is ready for. Every stage ends with a 5-question quiz; 4 of 5 passes and unlocks the next stage. Unlimited retries; best score counts.
- After all 13 quizzes are passed, `POST /api/ai/cert` checks the saved progress and issues a certificate number (`AQL-AI-YYYY-NNNNN`). The learner can save it as a PDF or print it.
- Child/adult wording: `[[child text||adult text]]` and `[[child-only text]]` in course text.
- Admin panel shows each learner's AI Academy progress, quiz scores and certificate.

## Certificate in AI-Powered Digital Marketing

A second Aqlyon programme (`#dm`), Beginner to Intermediate, built on the same screens as the AI Academy.

- 12 stages in 3 levels: Foundations (big picture, prompting for marketers, audience research, brand voice), Content and channels (content planning, social media, SEO, copywriting and email), Ads, analytics and optimisation (ad campaigns, marketing analytics, campaign optimisation, final project).
- Content: `public/js/dm-content.js`. Programme settings (names, certificate text, level-check rules): `public/js/programmes.js`. Shared screens: `public/js/academy.js`.
- Certificates come from `POST /api/cert/<programme>` (`AQL-AI-…` or `AQL-DM-…`). Add a programme by adding a content file, an entry in `programmes.js` and its stage count in `PROGRAMMES` in `netlify/lib/handler.mjs`.
- `#courses` lists every course; the top bar "Courses" button opens it.

## Company website (Aqlyon Career Discovery Centre)

- `/` is the company website: `public/index.html`, `public/site/site.css`, `public/site/site.js`.
- The learning app moved to `/academy` (`public/academy.html`). Every "Aqlyon Academy" button on the website opens it. Admin stays at `/admin`.
- The "Book a consultation" form uses Netlify Forms (form name `consultation`). In Netlify: Forms → enable form detection, then add an email notification so requests reach you. `/thanks` is the fallback page.

## Upcoming events (website + admin)
- Admin panel → **Events** tab: create events with name, summary, details, cover photo (resized in the browser), date/time and time zone, offline (location + Google Maps link) or online (private joining link), free or paid (price + currency), and registration: our form, an external link, or none. Optional seat limit and seats per person. Registration stays open until you untick it.
- Website: **Upcoming events** section after Aqlyon Academy (past events folded below). Each event has a shareable page at `/events/<slug>` with link-preview tags, Event schema, add-to-calendar and share buttons.
- Free events: registration is confirmed straight away; online events show the joining link after registering.
- Paid events: the registration is saved as *waiting for approval* and the visitor is sent to WhatsApp (number in Event settings) with their details and reference. Approve in **Registrations**; this opens WhatsApp to the attendee with the confirmation and joining link.
- Registration form (all required): name, email, mobile, WhatsApp ("same as mobile" by default), country, education level (SSLC, Plus Two, Bachelors, Masters, PhD, Other), student or parent, and number of people when allowed.
- Calendar: with **Google Calendar connected** (Admin → Events → Connect Google Calendar; an Apps Script web app on aqlyonacademy@gmail.com, protected by a private key in the code), each website event gets its own calendar entry titled with the event name, and every confirmed or approved person is added as a guest, so Google emails the invitation and their calendar reminds them. Reject/cancel removes them; editing the name, time or place updates all guests. Registrations from before connecting can be invited with **Send calendar invites**. Visitors can also download a calendar file when they press the button (reminders 1 day and 1 hour before) and Add to Google Calendar / Download calendar file buttons.
- Registrations: Admin → Events → **Registrations** (or Edit event → View registrations) opens a table of everyone who registered, with search, a status filter, totals (people, students, parents, waiting for approval), approve/reject/cancel/restore and WhatsApp buttons, and **Download Excel** (a real .xlsx file made in the browser, header row frozen with filters).
- Storage: Netlify Blobs stores `events`, `regs`, `images`. Functions: `api` (`/api/*`) and `event-page` (`/events/*`).
