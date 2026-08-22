# Healthcare Appointment & Follow-up Manager

A full-stack healthcare appointment booking and follow-up management system with patient, doctor, and admin workflows. The application supports doctor availability, leave handling, appointment booking and cancellation, AI-assisted medical summaries, prescriptions, medication reminders, email notifications, Google Calendar links, and iCalendar (`.ics`) export.

## Features

- Patient, Doctor, and Admin portals
- Doctor discovery and availability lookup
- Appointment booking with double-booking prevention
- Doctor leave management and affected-patient alerts
- Appointment cancellation
- AI-assisted pre-visit symptom summary
- AI-generated post-visit patient-friendly summary
- Prescription management and medication reminders
- In-app notification feed and email notifications
- Google Calendar event link generation
- `.ics` calendar export
- SQLite database with seeded demo data

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, Lucide React  
**Backend:** Node.js, Express  
**Database:** SQLite using native `node:sqlite`  
**AI:** Google Gemini (`@google/generative-ai`) with graceful rule-based fallback  
**Email:** Nodemailer  
**Scheduling:** node-cron  
**Calendar:** Google Calendar event URL + iCalendar export

## Project Structure

```text
unthink/
├── client/                 # React/Vite frontend
│   ├── src/
│   │   ├── components/
│   │   └── portals/
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── db/
│   │   ├── schema.sql
│   │   └── database.sqlite
│   ├── routes/
│   ├── services/
│   ├── index.js
│   └── package.json
├── README.md
├── SYSTEM_DESIGN.md
├── .gitignore
└── render.yaml
```

## Local Setup

### Prerequisites

- Node.js **22 or newer**
- npm
- Optional: Gemini API key for live AI output
- Optional: SMTP credentials for real email delivery

The backend uses native `node:sqlite`, so a modern Node.js version is required.

### 1. Clone or extract the project

```bash
git clone <your-repository-url>
cd unthink
```

If using the supplied ZIP, simply extract it and open the `unthink` folder.

### 2. Configure environment variables

Copy the example file:

```bash
cd server
cp .env.example .env
```

Edit `.env` and add credentials if required. The application still runs with AI fallbacks if no Gemini key is supplied. If no SMTP configuration is supplied, the notification service attempts a Nodemailer test transport and continues to preserve in-app notification records.

### 3. Install and run the backend

```bash
cd server
npm install
npm start
```

Backend health endpoint:

```text
http://localhost:5050/api/health
```

### 4. Install and run the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL displayed by Vite, normally:

```text
http://localhost:3000
```

During local development, Vite proxies `/api/*` requests to `http://localhost:5050`.

## Environment Variables

Create `server/.env` from `server/.env.example`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port. Defaults to `5050`. |
| `GEMINI_API_KEY` | No | Google Gemini API key for live LLM generation. |
| `GOOGLE_API_KEY` | No | Alternate key name supported by the application. |
| `SMTP_HOST` | No | SMTP server host. |
| `SMTP_PORT` | No | SMTP server port, typically `587`. |
| `SMTP_SECURE` | No | `true` for secure SMTP transport; otherwise `false`. |
| `SMTP_USER` | No | SMTP username. |
| `SMTP_PASS` | No | SMTP password or app password. |

## API Documentation

Base URL: `http://localhost:5050/api`

### Health

- `GET /health` — Backend health check.

### Authentication and Users

- `POST /auth/register` — Register a user.
  - Body: `name`, `email`, optional `role`, `phone`, `avatar`.
- `POST /auth/login` — Login using an existing user's email.
  - Body: `email`.
- `GET /auth/users?role=PATIENT|DOCTOR|ADMIN` — List users, optionally filtered by role.

### Doctors

- `GET /doctors` — List doctors with leave dates.
- `GET /doctors/:id` — Get doctor details.
- `POST /doctors` — Create a doctor profile.
- `PUT /doctors/:id` — Update doctor profile and working hours.
- `POST /doctors/:id/leave` — Mark a doctor on leave.
  - Body: `leave_date`, optional `reason`.
- `DELETE /doctors/:id/leave/:date` — Remove a leave date.
- `GET /doctors/:id/available-slots?date=YYYY-MM-DD` — Get generated slots and availability.

### Appointments

- `GET /appointments` — List appointments.
  - Optional query filters: `patient_id`, `doctor_id`, `date`, `status`.
- `GET /appointments/:id` — Get appointment details and prescriptions.
- `POST /appointments` — Book an appointment.
  - Required body fields: `patient_id`, `doctor_id`, `appointment_date`, `time_slot`, `symptoms`.
  - Optional: `onset_date`, `severity`.
  - Returns `409 SLOT_UNAVAILABLE` if another active appointment occupies the same doctor/date/slot.
- `POST /appointments/:id/cancel` — Cancel an appointment.
  - Optional body: `reason`.
- `GET /appointments/:id/ical` — Download an `.ics` calendar event.
- `DELETE /appointments/:id` — Permanently delete an appointment.

### Prescriptions

- `POST /prescriptions/complete-visit` — Complete a visit, store notes/prescriptions, generate the post-visit summary, and schedule medication reminders.
  - Required: `appointment_id`, `clinical_notes`.
  - Optional: `prescriptions` array.
- `GET /prescriptions/patient/:patientId` — List patient prescriptions.

### Notifications

- `GET /notifications?user_id=<id>` — List notifications, optionally for one user.
- `DELETE /notifications/:userId` — Clear a user's notifications.

## Database Schema

The schema is stored in `server/db/schema.sql`.

### `users`

Stores patients, doctors, and administrators with name, email, role, phone, avatar, and creation time.

### `doctors`

Stores the doctor profile and references `users`. Includes specialization, bio, experience, consultation fee, working hours, and slot duration.

### `doctor_leaves`

Stores doctor/date leave records. A unique `(doctor_id, leave_date)` constraint prevents duplicate leave entries.

### `appointments`

Stores patient/doctor relationships, date, time slot, status, symptoms, severity, AI output, clinical notes, post-visit summary, and calendar data.

A unique partial index prevents more than one active appointment for the same doctor/date/time:

```sql
CREATE UNIQUE INDEX idx_unique_active_appointment
ON appointments(doctor_id, appointment_date, time_slot)
WHERE status NOT IN ('CANCELLED', 'CANCELLED_DUE_TO_LEAVE');
```

### `prescriptions`

Stores medication name, dosage, frequency, duration, instructions, and start date for an appointment.

### `medication_reminders`

Stores scheduled reminder time/date and `PENDING`, `SENT`, or `FAILED` status.

### `notifications`

Stores application notification events with type, title, message, channel, metadata, and status.

### Relationship Summary

```text
users (PATIENT) 1 ─── * appointments * ─── 1 doctors
users (DOCTOR)  1 ─── 1 doctors
users (PATIENT) 1 ─── * prescriptions
users (DOCTOR)  1 ─── * prescriptions
doctors          1 ─── * doctor_leaves
doctors          1 ─── * appointments
appointments     1 ─── * prescriptions
prescriptions    1 ─── * medication_reminders
users            1 ─── * notifications
```

## LLM Prompts

### Pre-Visit Summary

The application sends the following task to Gemini:

> Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: `<symptoms>`

The system instruction requires raw JSON with:

```json
{
  "urgencyLevel": "Low | Medium | High",
  "chiefComplaint": "string summary",
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}
```

The patient's reported severity and onset date are appended when available. If Gemini is unavailable, a rule-based fallback produces urgency, a chief complaint, and three contextual questions.

### Post-Visit Summary

The application sends:

> Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: `<notes>`

Prescription information is included with the notes. The system instruction requests these three sections:

1. Diagnosis & What We Found
2. Your Medication & Care Schedule
3. Next Steps & Follow-Up

A fallback formatter is used if the Gemini request fails.

## Google Calendar Setup

No Google Calendar OAuth client or Google Cloud Console configuration is required by the current implementation.

After an appointment is booked, the backend generates a direct Google Calendar event URL containing the event title, description, location, start time, and end time. The user opens that URL in Google Calendar and confirms the event.

The system also supports standard calendar export:

```text
GET /api/appointments/:id/ical
```

This downloads an `.ics` file that can be imported into compatible calendar applications.

## Deployment

The project is prepared for a two-service free-tier deployment:

- **Backend:** Render web service
- **Frontend:** Vercel static site

### Backend on Render

1. Push the project to GitHub.
2. In Render, create a new Web Service from the repository.
3. Set the service root directory to `server` if not detected automatically.
4. Build command: `npm install`
5. Start command: `npm start`
6. Set Node.js version to **22**.
7. Add environment variables from `server/.env.example` as needed.
8. Deploy and copy the resulting backend URL.

The included `render.yaml` contains the basic service configuration.

### Frontend on Vercel

1. Import the same repository into Vercel.
2. Set the Root Directory to `client`.
3. Vercel should detect Vite.
4. Before deploying, open `client/vercel.json` and replace:

```text
https://YOUR-RENDER-BACKEND-URL
```

with the actual Render backend URL, for example:

```text
https://healthcare-appointment-backend.onrender.com
```

5. Redeploy the frontend.
6. The final Vercel URL is the hosted application URL to submit.

> Note: the SQLite database is suitable for this project/demo. On an ephemeral free backend instance, runtime database changes may not survive service restarts. The application seeds its demo data on startup. A production deployment should use a managed persistent database.

## System Design

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for the submission-ready system design write-up (under 800 words), covering:

- Double-booking prevention
- Doctor leave conflict handling
- Slot-hold mechanism
- Notification failure handling

## Submission Contents

The final clean submission package should contain the source code and documentation, but exclude `node_modules`, frontend build artifacts, `.env` files, macOS metadata, and SQLite runtime journal files.
