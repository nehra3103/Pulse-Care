-- Healthcare Platform Database Schema

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    phone TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    bio TEXT,
    experience_years INTEGER DEFAULT 5,
    consultation_fee REAL DEFAULT 100,
    working_hours_start TEXT DEFAULT '09:00',
    working_hours_end TEXT DEFAULT '17:00',
    slot_duration_mins INTEGER DEFAULT 30,
    rating REAL DEFAULT 4.9,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_leaves (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    leave_date TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, leave_date)
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date TEXT NOT NULL, -- YYYY-MM-DD
    time_slot TEXT NOT NULL,        -- HH:MM
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'CANCELLED_DUE_TO_LEAVE')),
    symptoms TEXT NOT NULL,
    onset_date TEXT,
    severity INTEGER DEFAULT 5,
    urgency_level TEXT CHECK(urgency_level IN ('Low', 'Medium', 'High')),
    chief_complaint TEXT,
    suggested_questions TEXT,      -- JSON string array
    clinical_notes TEXT,
    post_visit_summary TEXT,
    google_event_id TEXT,
    google_calendar_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Strict database level unique constraint to prevent double-booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_appointment 
ON appointments(doctor_id, appointment_date, time_slot) 
WHERE status NOT IN ('CANCELLED', 'CANCELLED_DUE_TO_LEAVE');

CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,       -- e.g. "Every 8 hours", "Once daily morning", "Twice daily"
    duration_days INTEGER NOT NULL,
    instructions TEXT,
    start_date TEXT NOT NULL,       -- YYYY-MM-DD
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medication_reminders (
    id TEXT PRIMARY KEY,
    prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_time TEXT NOT NULL,    -- HH:MM
    scheduled_date TEXT NOT NULL,   -- YYYY-MM-DD
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SENT', 'FAILED')),
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('BOOKING_CONFIRMATION', 'APPOINTMENT_REMINDER', 'APPOINTMENT_CANCELLATION', 'LEAVE_ALERT', 'MEDICATION_REMINDER')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'EMAIL',
    metadata TEXT,                  -- JSON string
    status TEXT NOT NULL DEFAULT 'SENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
