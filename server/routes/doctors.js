import express from 'express';
import db from '../db/database.js';
import { randomUUID } from 'crypto';
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

// Get all doctors with user info & leave dates
router.get('/', (req, res) => {
  try {
    const doctors = db.prepare(`
      SELECT d.*, u.name, u.email, u.phone, u.avatar
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY u.name ASC
    `).all();

    // Attach leave dates for each doctor
    const doctorsWithLeaves = doctors.map(doc => {
      const leaves = db.prepare('SELECT leave_date, reason FROM doctor_leaves WHERE doctor_id = ?').all(doc.id);
      return { ...doc, leaves };
    });

    res.json(doctorsWithLeaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single doctor by ID
router.get('/:id', (req, res) => {
  try {
    const doctor = db.prepare(`
      SELECT d.*, u.name, u.email, u.phone, u.avatar
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const leaves = db.prepare('SELECT leave_date, reason FROM doctor_leaves WHERE doctor_id = ?').all(doctor.id);
    res.json({ ...doctor, leaves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create new Doctor Profile
router.post('/', (req, res) => {
  try {
    const { name, email, specialization, bio = '', experience_years = 5, consultation_fee = 100, working_hours_start = '09:00', working_hours_end = '17:00', slot_duration_mins = 30 } = req.body;

    if (!name || !email || !specialization) {
      return res.status(400).json({ error: 'Name, email, and specialization are required' });
    }

    // 1. Create or find User
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const userId = randomUUID();
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
      db.prepare(`
        INSERT INTO users (id, name, email, role, avatar)
        VALUES (?, ?, ?, 'DOCTOR', ?)
      `).run(userId, name, email, avatar);
      user = { id: userId, name, email };
    }

    // 2. Create Doctor Profile
    const doctorId = randomUUID();
    db.prepare(`
      INSERT INTO doctors (id, user_id, specialization, bio, experience_years, consultation_fee, working_hours_start, working_hours_end, slot_duration_mins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doctorId, user.id, specialization, bio, experience_years, consultation_fee, working_hours_start, working_hours_end, slot_duration_mins);

    const createdDoctor = db.prepare(`
      SELECT d.*, u.name, u.email, u.avatar
      FROM doctors d JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(doctorId);

    res.status(201).json(createdDoctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update Doctor Profile (working hours, slot duration, etc.)
router.put('/:id', (req, res) => {
  try {
    const { specialization, bio, experience_years, consultation_fee, working_hours_start, working_hours_end, slot_duration_mins } = req.body;

    db.prepare(`
      UPDATE doctors 
      SET specialization = COALESCE(?, specialization),
          bio = COALESCE(?, bio),
          experience_years = COALESCE(?, experience_years),
          consultation_fee = COALESCE(?, consultation_fee),
          working_hours_start = COALESCE(?, working_hours_start),
          working_hours_end = COALESCE(?, working_hours_end),
          slot_duration_mins = COALESCE(?, slot_duration_mins)
      WHERE id = ?
    `).run(specialization, bio, experience_years, consultation_fee, working_hours_start, working_hours_end, slot_duration_mins, req.params.id);

    const updated = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Mark Doctor on Leave & Notify Affected Patients
router.post('/:id/leave', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { leave_date, reason = 'Doctor unavailable' } = req.body;

    if (!leave_date) {
      return res.status(400).json({ error: 'leave_date (YYYY-MM-DD) is required' });
    }

    const doctor = db.prepare(`
      SELECT d.*, u.name as doctor_name
      FROM doctors d JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(doctorId);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // 1. Add leave record
    const leaveId = randomUUID();
    try {
      db.prepare(`
        INSERT INTO doctor_leaves (id, doctor_id, leave_date, reason)
        VALUES (?, ?, ?, ?)
      `).run(leaveId, doctorId, leave_date, reason);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: `Doctor is already marked on leave for ${leave_date}` });
      }
      throw err;
    }

    // 2. Find affected active appointments
    const affectedAppointments = db.prepare(`
      SELECT a.id, a.appointment_date, a.time_slot, pu.id as patient_id, pu.name as patient_name, pu.email as patient_email
      FROM appointments a
      JOIN users pu ON a.patient_id = pu.id
      WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.status = 'SCHEDULED'
    `).all(doctorId, leave_date);

    // 3. Cancel affected appointments and send leave alert notifications
    const updatedCount = affectedAppointments.length;
    for (const appt of affectedAppointments) {
      db.prepare(`UPDATE appointments SET status = 'CANCELLED_DUE_TO_LEAVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(appt.id);

      await sendNotificationEmail({
        userId: appt.patient_id,
        recipientEmail: appt.patient_email,
        subject: `⚠️ Urgent: Appointment Reschedule Required for Dr. ${doctor.doctor_name}`,
        body: `Dear ${appt.patient_name},\n\nWe regret to inform you that Dr. ${doctor.doctor_name} has taken leave on ${appt.appointment_date} (${reason}).\n\nYour scheduled appointment at ${appt.time_slot} has been cancelled. Please log in to your patient portal to select an alternative available time slot.\n\nWe apologize for any inconvenience caused.`,
        type: 'LEAVE_ALERT',
        metadata: { appointmentId: appt.id, doctorId, leaveDate: leave_date }
      });
    }

    res.json({
      message: `Doctor marked on leave for ${leave_date}.`,
      affectedAppointmentsCount: updatedCount,
      affectedPatients: affectedAppointments.map(a => a.patient_name)
    });
  } catch (err) {
    console.error('Leave allocation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove Leave
router.delete('/:id/leave/:date', (req, res) => {
  try {
    db.prepare('DELETE FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?').run(req.params.id, req.params.date);
    res.json({ message: 'Leave date removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Available Slots for a Doctor on a specific date
router.get('/:id/available-slots', (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) {
      return res.status(400).json({ error: 'date query parameter (YYYY-MM-DD) is required' });
    }

    const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if doctor is on leave on this date
    const isLeave = db.prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?').get(doctor.id, date);
    if (isLeave) {
      return res.json({ date, isLeave: true, leaveReason: isLeave.reason, slots: [] });
    }

    // Calculate time slots based on working hours and slot duration
    const [startH, startM] = doctor.working_hours_start.split(':').map(Number);
    const [endH, endM] = doctor.working_hours_end.split(':').map(Number);
    const duration = doctor.slot_duration_mins || 30;

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const allSlots = [];
    while (current < end) {
      const hh = String(current.getHours()).padStart(2, '0');
      const mm = String(current.getMinutes()).padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
      current = new Date(current.getTime() + duration * 60000);
    }

    // Query existing booked slots for doctor on date
    const bookedRows = db.prepare(`
      SELECT time_slot FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('CANCELLED', 'CANCELLED_DUE_TO_LEAVE')
    `).all(doctor.id, date);

    const bookedSet = new Set(bookedRows.map(r => r.time_slot));

    const slotDetails = allSlots.map(slot => ({
      time: slot,
      available: !bookedSet.has(slot)
    }));

    res.json({ date, isLeave: false, slots: slotDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
