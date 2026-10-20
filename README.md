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
- Calendar invitations: with invitations connected (Admin → Events → Calendar invitations; an Apps Script mailer on aqlyonacademy@gmail.com, protected by a private key in the code), every confirmed or approved person gets our own email, subject "Invitation from Aqlyon Academy: <event name>", with their details and reference and the event attached as a calendar invitation (invite.ics, reminders 1 day and 1 hour before). Changing an event emails an updated invitation (same UID, higher SEQUENCE); reject/cancel emails a cancellation that removes it from their calendar. Free Gmail sends about 100 a day; anyone not sent shows in Registrations with a Send calendar invites button. Email content is built in netlify/lib/invite-mail.mjs. Visitors can also press Add to Google Calendar or Download calendar file on the event page.
- Registrations: Admin → Events → **Registrations** (or Edit event → View registrations) opens a table of everyone who registered, with search, a status filter, totals (people, students, parents, waiting for approval), approve/reject/cancel/restore and WhatsApp buttons, and **Download Excel** (a real .xlsx file made in the browser, header row frozen with filters).
- Storage: Netlify Blobs stores `events`, `regs`, `images`. Functions: `api` (`/api/*`) and `event-page` (`/events/*`).
- Badges and check-in: every registration gets a private badge link (/badge/<token>, served by the event-page function) with a QR code; it is shown after registering (offline events), in the invitation email and in the WhatsApp confirmation. The badge can be saved as an image or printed, and only works once the registration is confirmed/approved. each event's page in the admin has **Registrations** and **Check-in** tabs (made for a phone): **Scan badge** with the camera (BarcodeDetector, or jsQR from /js/vendor), or find people by name/mobile/ref, then **Mark as attended** (optional: check in straight away after scanning). The QR holds <site>/admin#checkin/<token>, so the phone's own camera app opens the same check-in card. Registrations shows an Attended column, a Checked in total, a filter and an Attended column in the Excel file. 'Keep me signed in' on the admin login keeps the phone logged in for 2 weeks. QR libraries: qrcode-generator (MIT) and jsQR (Apache-2.0) in public/js/vendor.
- Registration form builder: in the event editor (Our registration form), name, email and mobile are always asked; WhatsApp, country, education level and student/parent can be switched off. **＋ Add field** opens a picker to tick any number of question types (short answer with number/email/link/phone checks, paragraph, multiple choice, checkboxes, dropdown, linear scale, rating, multiple choice grid, checkbox grid, date, time, file upload up to 3 MB, title and description) and ready-made questions (age, gender, school, class, stream, parent's name, how did you hear, consent, …). Each question can be edited, made required, moved, duplicated or deleted, options can be pasted as a list, and **Preview form** shows the form as visitors see it. Answers are checked on the server (netlify/lib/form-def.mjs), shown as columns in Registrations and the Excel file (grids get one column per row); uploaded files open from the Registrations table. Shared field code: public/js/form-fields.js. Dropdowns (and the Country / Education level lists) are searchable on the visitor form: tapping one opens a list with a **Type to search…** box that filters as you type (English or Malayalam, any word in the option), with arrow keys + Enter, Escape and tap-outside to close (FF.searchable; the real <select> stays hidden in the form so answers save as before). A dropdown can hold up to 5,000 options (tested: 4,000 open and search instantly on a phone); multiple choice and checkboxes stay at 50.
- Helper check-in link: the event's Check-in tab creates a private link /checkin#<key> for one event. Helpers open it on their phone (no admin password) to scan badges, find people (by name, ref or last 4 digits of mobile) and mark attendance. They can't see emails, full phone numbers or other events. The link can be shared on WhatsApp or as a QR code, reset (old link stops) or turned off, and it expires 2 days after the event. Check-ins record whether they were made by the admin or a helper link.
- Check-in report: on an event's Check-in tab, **Check-in report (Excel)** downloads Summary / Attended / Not attended sheets (attendance %, who checked people in, check-ins per hour, times in the event's time zone) and **Print report** opens a printable page that can be saved as PDF.
- Import and bulk actions: on an event's Registrations tab, **Import from Excel** reads an .xlsx/.xls/.csv file (SheetJS in /js/vendor, loaded only when needed), matches columns to the form automatically (editable), normalises mobile numbers with a chosen default country code, flags problems and duplicates, and imports the selected rows as "Imported, not confirmed" (they don't take seats yet). Rows can be ticked in the table; the bulk bar can **Confirm & email badges** (normal process: confirmed, badge, invitation email, 10 at a time), check in, cancel/reject or delete. A template can be downloaded from the import window.
- WhatsApp lists for helpers: select confirmed people in Registrations → **📤 WhatsApp list** → name the list, edit the message ({first name}, {event}, {date}, {venue}, {map}, {badge}, {ref}, {people}, {join}, {event page}) and create a private link /send#<key>. Helpers open it on their phone and tap **Send on WhatsApp** for each person (wa.me with the filled-in message); people are marked as sent, progress shows per list in Registrations and in a WhatsApp column. Lists can be shared again, turned off or deleted, and expire 2 days after the event. Several lists with different people can exist for one event.
- Share buttons: each event has **Show share buttons** (on by default). Unticked, the event page hides the top Share button, the Share this event box (copy link, WhatsApp, Facebook, LinkedIn, X) and the share options after registering.
- Badge design (per event, in the event editor): 4 templates (Classic, Minimal, Bold, Conference), a colour, organiser name and logo, Aqlyon branding on/off, what to show (date and time, venue, student/parent), and the printed size (A6, ID card 54 × 86 mm, A7, 4 × 6 in, landscape name tag 102 × 76 mm) with a live preview (/badge/preview#<design>). The badge is one layout sized in cqw, so it scales to each size; Print uses the exact page size and Save badge image paints the on-screen badge at 300 dpi (badge.js paint()).
- Event report: each event has a **📊 Report** tab (public/js/admin-report.js) that charts every question automatically from its type: choices/dropdowns/checkboxes/grid rows/scales/ratings as counts per answer, standard fields, status, check-in, number answers in ranges (with average), typed text grouped (case and spaces ignored), dates by month, registrations per day. Controls: count registrations or people, include attending / checked in / everyone, break down by another question (stacked bars with a legend). Each chart has a table view and hover numbers; Excel (one sheet per question) and Print / PDF.
