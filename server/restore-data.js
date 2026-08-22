import db from './db/database.js';
import { randomUUID } from 'crypto';

export function restoreAllEntries() {
  console.log('[RESTORE] Restoring patient and doctor appointments dataset...');

  // Ensure Users exist
  const adminId = 'admin-user-01';
  const patient1Id = 'patient-01';
  const patient2Id = 'patient-02';

  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, role, phone, avatar) VALUES
    (?, 'Clinic Administrator', 'admin@healthclinic.in', 'ADMIN', '+91-98765-01000', 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshAdmin'),
    (?, 'Aarav Patel', 'aarav.patel@example.com', 'PATIENT', '+91-98200-12345', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav'),
    (?, 'Priya Sundaram', 'priya.sundaram@example.com', 'PATIENT', '+91-97110-67890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaS')
  `).run(adminId, patient1Id, patient2Id);

  // Ensure Doctors exist
  const doctorsData = [
    {
      userId: 'doc-user-01',
      docId: 'doc-01',
      name: 'Dr. Ananya Sharma',
      email: 'dr.ananya@healthclinic.in',
      specialization: 'Cardiology',
      bio: 'Senior Cardiologist with 14+ years experience in preventive heart care, hypertension, and echocardiography.',
      experience: 14,
      fee: 800,
      start: '09:00',
      end: '17:00',
      duration: 30,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaDoc'
    },
    {
      userId: 'doc-user-02',
      docId: 'doc-02',
      name: 'Dr. Rajesh Nair',
      email: 'dr.rajesh@healthclinic.in',
      specialization: 'Dermatology',
      bio: 'Consultant Dermatologist specializing in allergic skin disorders, trichology, and clinical acne therapy.',
      experience: 11,
      fee: 700,
      start: '10:00',
      end: '16:00',
      duration: 30,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshDoc'
    },
    {
      userId: 'doc-user-03',
      docId: 'doc-03',
      name: 'Dr. Sunita Kulkarni',
      email: 'dr.sunita@healthclinic.in',
      specialization: 'Pediatrics',
      bio: 'Lead Pediatrician focused on child immunizations, developmental milestones, and pediatric respiratory health.',
      experience: 12,
      fee: 650,
      start: '08:30',
      end: '15:30',
      duration: 30,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SunitaDoc'
    },
    {
      userId: 'doc-user-04',
      docId: 'doc-04',
      name: 'Dr. Vikramaditya Sen',
      email: 'dr.vikram@healthclinic.in',
      specialization: 'Neurology',
      bio: 'Experienced Neurologist specializing in chronic migraine management, neuropathy, and nerve disorder evaluation.',
      experience: 16,
      fee: 1000,
      start: '09:30',
      end: '17:30',
      duration: 45,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VikramDoc'
    }
  ];

  for (const d of doctorsData) {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, avatar)
      VALUES (?, ?, ?, 'DOCTOR', ?)
    `).run(d.userId, d.name, d.email, d.avatar);

    db.prepare(`
      INSERT OR IGNORE INTO doctors (id, user_id, specialization, bio, experience_years, consultation_fee, working_hours_start, working_hours_end, slot_duration_mins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(d.docId, d.userId, d.specialization, d.bio, d.experience, d.fee, d.start, d.end, d.duration);
  }

  // Today & Tomorrow Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  // Restored Appointments List
  const restoredAppointments = [
    {
      id: 'appt-01',
      patient_id: patient1Id,
      doctor_id: 'doc-01',
      appointment_date: tomorrowStr,
      time_slot: '10:00',
      status: 'SCHEDULED',
      symptoms: 'Experiencing tightness in chest when climbing stairs, shortness of breath, and mild dizziness for the past 3 days.',
      onset_date: tomorrowStr,
      severity: 7,
      urgency_level: 'High',
      chief_complaint: 'Patient reports exertional chest tightness, dyspnea, and dizziness over 3 days.',
      suggested_questions: JSON.stringify([
        'Does the chest tightness radiate down your left arm or up into your jaw?',
        'Have you noticed any lower limb swelling or fluid retention?',
        'What is your baseline blood pressure and family history of cardiovascular illness?'
      ]),
      clinical_notes: null,
      post_visit_summary: null,
      google_calendar_link: 'https://calendar.google.com'
    },
    {
      id: 'appt-02',
      patient_id: patient1Id,
      doctor_id: 'doc-02',
      appointment_date: todayStr,
      time_slot: '11:30',
      status: 'COMPLETED',
      symptoms: 'Persistent itchy skin rash on arms after contact with garden plants.',
      onset_date: todayStr,
      severity: 5,
      urgency_level: 'Medium',
      chief_complaint: 'Patient reports acute erythematous rash on bilateral upper limbs after plant exposure.',
      suggested_questions: JSON.stringify([
        'How long after plant exposure did the erythema and itching manifest?',
        'Have you taken any oral antihistamines prior to today’s consultation?',
        'Are there any signs of pustules, skin breakdown, or systemic fever?'
      ]),
      clinical_notes: 'Diagnosis: Acute contact dermatitis from plant toxins. Prescribed topical hydrocortisone 1% cream and oral Cetirizine 10mg.',
      post_visit_summary: `### 1. Diagnosis & What We Found
Diagnosis: Acute contact dermatitis caused by allergen exposure. Mild localized inflammation on bilateral arms.

### 2. Your Medication & Care Schedule
• **Hydrocortisone 1% Cream**: Apply thin layer twice daily after washing affected area for 7 days.
• **Cetirizine 10mg**: Take 1 tablet once daily before bedtime for 5 days.

### 3. Next Steps & Follow-Up
• Avoid scratching affected skin to prevent secondary bacterial infection.
• Wash hands thoroughly and avoid direct sun exposure on treated areas.`,
      google_calendar_link: 'https://calendar.google.com'
    },
    {
      id: 'appt-03',
      patient_id: patient2Id,
      doctor_id: 'doc-03',
      appointment_date: dayAfterStr,
      time_slot: '09:30',
      status: 'SCHEDULED',
      symptoms: 'Child experiencing persistent dry cough, low-grade fever 100.2°F, and loss of appetite for 2 days.',
      onset_date: dayAfterStr,
      severity: 6,
      urgency_level: 'Medium',
      chief_complaint: 'Pediatric low-grade pyrexia and dry cough over 48 hours.',
      suggested_questions: JSON.stringify([
        'Is the cough worse at night or after physical activity?',
        'Are there any signs of wheezing, nasal flaring, or labored breathing?',
        'Is the child remaining well-hydrated with fluids?'
      ]),
      clinical_notes: null,
      post_visit_summary: null,
      google_calendar_link: 'https://calendar.google.com'
    },
    {
      id: 'appt-04',
      patient_id: patient2Id,
      doctor_id: 'doc-04',
      appointment_date: todayStr,
      time_slot: '14:00',
      status: 'COMPLETED',
      symptoms: 'Throbbing migraine headaches on right temporal side accompanied by photophobia and nausea for 5 days.',
      onset_date: todayStr,
      severity: 8,
      urgency_level: 'High',
      chief_complaint: 'Right-sided episodic migraine headache with photophobia and severe nausea.',
      suggested_questions: JSON.stringify([
        'Do you experience visual aura, flashing lights, or scotoma preceding the headache onset?',
        'What specific analgesic medications have you attempted for symptomatic relief?',
        'Does resting in a quiet, dark room decrease headache intensity?'
      ]),
      clinical_notes: 'Diagnosis: Episodic migraine with visual aura. Prescribed Sumatriptan 50mg for acute attacks and recommended hydration and dark room rest.',
      post_visit_summary: `### 1. Diagnosis & What We Found
Diagnosis: Episodic migraine with visual aura. Neurological examination intact with no focal deficits.

### 2. Your Medication & Care Schedule
• **Sumatriptan 50mg**: Take 1 tablet at onset of migraine headache. Max 2 tablets in 24 hours.

### 3. Next Steps & Follow-Up
• Keep a daily headache diary tracking sleep, diet, and stress triggers.
• Maintain consistent hydration and sleep cycles.`,
      google_calendar_link: 'https://calendar.google.com'
    }
  ];

  for (const appt of restoredAppointments) {
    db.prepare(`
      INSERT OR REPLACE INTO appointments (
        id, patient_id, doctor_id, appointment_date, time_slot, status,
        symptoms, onset_date, severity, urgency_level, chief_complaint, suggested_questions, clinical_notes, post_visit_summary, google_calendar_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appt.id,
      appt.patient_id,
      appt.doctor_id,
      appt.appointment_date,
      appt.time_slot,
      appt.status,
      appt.symptoms,
      appt.onset_date,
      appt.severity,
      appt.urgency_level,
      appt.chief_complaint,
      appt.suggested_questions,
      appt.clinical_notes,
      appt.post_visit_summary,
      appt.google_calendar_link
    );
  }

  // Restore Prescriptions
  db.prepare(`
    INSERT OR REPLACE INTO prescriptions (id, appointment_id, patient_id, doctor_id, medication_name, dosage, frequency, duration_days, instructions, start_date)
    VALUES 
    ('rx-01', 'appt-02', ?, 'doc-02', 'Hydrocortisone 1% Cream', 'Apply thin layer', 'Twice Daily', 7, 'Apply after washing affected area', ?),
    ('rx-02', 'appt-02', ?, 'doc-02', 'Cetirizine', '10mg', 'Once Daily', 5, 'Take before bedtime', ?),
    ('rx-03', 'appt-04', ?, 'doc-04', 'Sumatriptan', '50mg', 'As Needed', 10, 'Take 1 tablet at onset of migraine attack', ?)
  `).run(patient1Id, todayStr, patient1Id, todayStr, patient2Id, todayStr);

  console.log('[RESTORE] All previous patient appointments, prescriptions, and AI summaries restored successfully!');
}

restoreAllEntries();
