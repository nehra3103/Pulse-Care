# Pulse Care 🩺

A full-stack healthcare appointment booking and follow-up management system built with **React, Node.js, Express, SQLite, Google Gemini, and Nodemailer**.

## Live Deployment

- **Frontend:** https://pulse-care-flax.vercel.app
- **Backend API:** https://pulse-care-backend-pz3p.onrender.com
- **Health check:** https://pulse-care-backend-pz3p.onrender.com/api/health

> Note: The backend is hosted on Render's free tier and may take some time to wake up after inactivity.

## Features

- Patient, doctor, and admin workflows
- Doctor discovery and appointment booking
- Real-time available-slot calculation
- Double-booking prevention
- Doctor leave conflict handling
- AI-generated pre-visit and post-visit summaries
- Appointment confirmation and notification emails
- Prescription and medication reminder support
- Google Calendar event links and `.ics` export
- SQLite-backed persistence
- Production deployment on Vercel and Render

## Repository Structure

```text
Pulse-Care/
├── client/                 # React + Vite frontend
│   ├── .env.example        # Frontend environment template
│   └── src/
├── server/                 # Node.js + Express backend
│   ├── .env.example        # Backend environment template
│   ├── db/schema.sql       # Database schema
│   └── ...
├── README.md               # Setup guide, API docs and technical details
├── SYSTEM_DESIGN.md        # Assignment system-design write-up (<800 words)
└── render.yaml             # Render deployment configuration
```

## Setup Guide

### Prerequisites

- Node.js 22 or newer
- npm
- Optional: Google Gemini API key for AI features
- Optional: SMTP credentials for real email notifications

### 1. Clone the repository

```bash
git clone https://github.com/nehra3103/Pulse-Care.git
cd Pulse-Care
```

### 2. Configure environment variables

#### Backend

```bash
cd server
cp .env.example .env
```

Add your credentials to `server/.env` if you want Gemini and SMTP features enabled.

#### Frontend

```bash
cd ../client
cp .env.example .env
```

For local development, use:

```env
VITE_API_URL=http://localhost:5050/api
```

For production, configure `VITE_API_URL` with the deployed backend URL in your hosting provider's environment settings.

### 3. Install and run the backend

```bash
cd server
npm install
npm start
```

The backend runs on:

```text
http://localhost:5050
```

Health check:

```text
http://localhost:5050/api/health
```

### 4. Install and run the frontend

Open another terminal and run:

```bash
cd client
npm install
npm run dev
```

Open the URL displayed by Vite, normally:

```text
http://localhost:3000
```

## Environment Variables

### Server: `server/.env.example`

```env
PORT=5050
GEMINI_API_KEY=
GOOGLE_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

| Variable | Description |
|---|---|
| `PORT` | Backend port. Defaults to `5050`. |
| `GEMINI_API_KEY` | Google Gemini API key used for AI-generated summaries. |
| `GOOGLE_API_KEY` | Alternate API key name supported by the application. |
| `SMTP_HOST` | SMTP server host. |
| `SMTP_PORT` | SMTP server port, usually `587`. |
| `SMTP_SECURE` | Set to `true` for secure SMTP connections. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password or app password. |

### Client: `client/.env.example`

```env
VITE_API_URL=http://localhost:5050/api
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API used by the frontend. |

## API Documentation

Base URL:

```text
http://localhost:5050/api
```

Production base URL:

```text
https://pulse-care-backend-pz3p.onrender.com/api
```

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
- `GET /doctors/:id/available-slots?date=YYYY-MM-DD` — Get available appointment slots.

### Appointments

- `GET /appointments` — List appointments.
  - Optional filters: `patient_id`, `doctor_id`, `date`, `status`.
- `GET /appointments/:id` — Get appointment details and prescriptions.
- `POST /appointments` — Book an appointment.
  - Required: `patient_id`, `doctor_id`, `appointment_date`, `time_slot`, `symptoms`.
  - Optional: `onset_date`, `severity`.
- `POST /appointments/:id/cancel` — Cancel an appointment.
  - Optional: `reason`.
- `GET /appointments/:id/ical` — Download an `.ics` calendar event.
- `DELETE /appointments/:id` — Permanently delete an appointment.

### Prescriptions

- `POST /prescriptions/complete-visit` — Complete a visit, store notes and prescriptions, generate a post-visit summary, and schedule medication reminders.
  - Required: `appointment_id`, `clinical_notes`.
  - Optional: `prescriptions` array.
- `GET /prescriptions/patient/:patientId` — List patient prescriptions.

### Notifications

- `GET /notifications?user_id=<id>` — List notifications, optionally for one user.
- `DELETE /notifications/:userId` — Clear a user's notifications.

## Database Schema

The full database schema is available in `server/db/schema.sql`.

### Main tables

- **`users`** — Patients, doctors, and administrators with profile data.
- **`doctors`** — Doctor specialization, bio, experience, fees, working hours, and slot duration.
- **`doctor_leaves`** — Doctor leave dates and reasons. A unique `(doctor_id, leave_date)` constraint prevents duplicates.
- **`appointments`** — Patient/doctor relationship, date, slot, status, symptoms, severity, AI output, notes, summaries, and calendar data.
- **`prescriptions`** — Medication name, dosage, frequency, duration, instructions, and start date.
- **`medication_reminders`** — Scheduled reminders with `PENDING`, `SENT`, or `FAILED` status.
- **`notifications`** — Application notification events and delivery metadata.

### Double-booking constraint

```sql
CREATE UNIQUE INDEX idx_unique_active_appointment
ON appointments(doctor_id, appointment_date, time_slot)
WHERE status NOT IN ('CANCELLED', 'CANCELLED_DUE_TO_LEAVE');
```

### Relationships

```text
users (PATIENT) 1 ─── * appointments * ─── 1 doctors
users (DOCTOR)  1 ─── 1 doctors
users (PATIENT) 1 ─── * prescriptions
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

Expected JSON:

```json
{
  "urgencyLevel": "Low | Medium | High",
  "chiefComplaint": "string summary",
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}
```

The patient's reported severity and onset date are appended when available. If Gemini is unavailable, the application uses a rule-based fallback.

### Post-Visit Summary

The application sends:

> Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: `<notes>`

Prescription information is included with the notes. The generated response contains:

1. Diagnosis & What We Found
2. Your Medication & Care Schedule
3. Next Steps & Follow-Up

A fallback formatter is used if the Gemini request fails.

## Google Calendar Setup

The current implementation does not require Google Calendar OAuth or Google Cloud Console configuration.

After an appointment is booked, the backend generates a direct Google Calendar event URL containing the event title, description, location, start time, and end time. The user can open the URL in Google Calendar and confirm the event.

The application also supports calendar export through:

```text
GET /api/appointments/:id/ical
```

This downloads an `.ics` file that can be imported into compatible calendar applications.

## System Design Submission

The assignment-specific write-up is available in [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) and covers:

- Double-booking prevention
- Doctor leave conflict handling
- Slot-hold mechanism
- Notification failure handling

## Deployment

### Frontend — Vercel

The frontend is deployed on Vercel from the `client` directory. Configure:

```env
VITE_API_URL=https://pulse-care-backend-pz3p.onrender.com/api
```

### Backend — Render

The backend is deployed as a Node web service using the included `render.yaml`. Render automatically runs the service from the repository configuration.

## Submission Checklist

- [x] Complete frontend and backend source code in this repository
- [x] README with setup guide
- [x] `client/.env.example` and `server/.env.example`
- [x] API documentation
- [x] Database schema
- [x] LLM prompts/workflow documentation
- [x] Google Calendar setup/documentation
- [x] Hosted application URL
- [x] System design write-up

---

**Repository:** https://github.com/nehra3103/Pulse-Care
