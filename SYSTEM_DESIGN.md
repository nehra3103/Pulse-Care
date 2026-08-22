# System Design Write-up

## Healthcare Appointment Booking System

The application follows a two-tier architecture with a React/Vite frontend and an Express backend. SQLite is used as the transactional database, while Gemini is used for optional AI-generated pre-visit and post-visit summaries. Supporting services handle email notifications, medication reminders, Google Calendar links, and iCalendar exports.

### 1. Double-Booking Prevention

The booking flow uses defence in depth. Before creating an appointment, the backend checks whether the doctor already has an active appointment for the same date and time. The actual insert is then executed inside an SQLite transaction started with `BEGIN IMMEDIATE`, which reduces race conditions by obtaining a write lock before the booking check and insert.

The database provides the final protection through a unique partial index on `(doctor_id, appointment_date, time_slot)` for appointments whose status is not `CANCELLED` or `CANCELLED_DUE_TO_LEAVE`. Therefore, even if two requests reach the application almost simultaneously, only one active booking can occupy a doctor/time/date combination. If the application-level check or database constraint detects a conflict, the API returns HTTP 409 with `SLOT_UNAVAILABLE`, allowing the patient UI to ask the user to choose another slot. Cancelled appointments do not block future bookings for that slot.

### 2. Doctor Leave Conflict Handling

Doctor availability is stored in the `doctor_leaves` table, with a unique constraint preventing duplicate leave entries for the same doctor and date. When a patient books an appointment, the backend checks the leave table before continuing. If the doctor is unavailable, the request is rejected before an appointment is inserted.

When an administrator or doctor marks leave after appointments already exist, the system finds all `SCHEDULED` appointments for that doctor and date. Each affected appointment is changed to `CANCELLED_DUE_TO_LEAVE`, which also releases the slot because cancelled appointments are excluded from the active-booking uniqueness rule. The affected patient receives a leave-alert notification asking them to reschedule. This approach handles both prospective conflicts and appointments that were already confirmed before leave was recorded.

### 3. Slot-Hold Mechanism

The current implementation uses a short-lived **selection hold in the booking flow rather than a persisted reservation table**. A slot remains merely available until the patient submits the booking request; the backend then immediately performs the transactional availability check and database insert. This avoids stale or abandoned holds permanently blocking inventory.

The trade-off is that two users may select the same slot in their browsers. The first request to complete the transaction wins, while the other receives `SLOT_UNAVAILABLE`. This is safe because the database constraint is authoritative. For a higher-scale production system, this could be extended with a dedicated `slot_holds` table containing doctor, date, slot, patient/session, and expiry time, followed by automatic expiry cleanup. However, the current design intentionally avoids making an unconfirmed slot unavailable and relies on the transactional booking boundary as the authoritative hold point.

### 4. Notification Failure Handling

The notification service first records a notification in the application's database so that the user-facing notification feed has an auditable event. Email delivery is then attempted asynchronously through Nodemailer. A transport error is caught and logged so a notification problem does not roll back a successfully created appointment or break the main booking workflow.

Medication reminders are persisted with `PENDING`, `SENT`, or `FAILED` status fields. A cron job checks pending reminders every minute and dispatches due reminders. Appointment reminders are checked every fifteen minutes, with the notifications table used to avoid creating duplicate reminder events for the same appointment.

This design prioritizes the core transaction: appointment booking and leave cancellation remain durable even if email delivery is temporarily unavailable. For a production-grade deployment, the next enhancement would be a retry queue with exponential backoff and explicit email delivery status updates. The current implementation still preserves the notification event and prevents the user workflow from failing because of an external mail-service problem.
