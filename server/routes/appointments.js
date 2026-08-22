import express from 'express';
import db from '../db/database.js';
import { randomUUID } from 'crypto';
import { generatePreVisitSummary } from '../services/llmService.js';
import { sendNotificationEmail } from '../services/emailService.js';
import { generateGoogleCalendarUrl, generateICalFile } from '../services/calendarService.js';

const router = express.Router();

// Get list of appointments (filtered by patient_id or doctor_id)
router.get('/', (req, res) => {
  try {
    const { patient_id, doctor_id, date, status } = req.query;

    let sql = `
      SELECT a.*, 
             pu.name as patient_name, pu.email as patient_email, pu.phone as patient_phone, pu.avatar as patient_avatar,
             du.name as doctor_name, du.email as doctor_email, d.specialization as doctor_specialization, d.slot_duration_mins
      FROM appointments a
      JOIN users pu ON a.patient_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE 1=1
    `;
    const params = [];

    if (patient_id) {
      sql += ' AND a.patient_id = ?';
      params.push(patient_id);
    }
    if (doctor_id) {
      sql += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.time_slot ASC';

    const appointments = db.prepare(sql).all(...params);

    const formatted = appointments.map(appt => ({
      ...appt,
      suggested_questions: appt.suggested_questions ? JSON.parse(appt.suggested_questions) : []
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointment details by ID
router.get('/:id', (req, res) => {
  try {
    const appt = db.prepare(`
      SELECT a.*, 
             pu.name as patient_name, pu.email as patient_email, pu.phone as patient_phone, pu.avatar as patient_avatar,
             du.name as doctor_name, du.email as doctor_email, d.specialization as doctor_specialization
      FROM appointments a
      JOIN users pu ON a.patient_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Fetch associated prescriptions if any
    const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE appointment_id = ?').all(appt.id);

    res.json({
      ...appt,
      suggested_questions: appt.suggested_questions ? JSON.parse(appt.suggested_questions) : [],
      prescriptions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book New Appointment (Handles AI Pre-visit Summary & Double-Booking Prevention)
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, time_slot, symptoms, onset_date = '', severity = 5 } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !time_slot || !symptoms) {
      return res.status(400).json({ error: 'patient_id, doctor_id, appointment_date, time_slot, and symptoms are required' });
    }

    // 1. Verify Doctor & Patient exist
    const doctor = db.prepare(`
      SELECT d.*, u.name as doctor_name, u.email as doctor_email
      FROM doctors d JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(doctor_id);

    const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(patient_id);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 2. Check if doctor is on leave on this date
    const leave = db.prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?').get(doctor_id, appointment_date);
    if (leave) {
      return res.status(400).json({ error: `Dr. ${doctor.doctor_name} is on leave on ${appointment_date} (${leave.reason})` });
    }

    // 3. Generate AI Pre-Visit Symptom Summary
    console.log(`[AI LLM] Generating Pre-Visit Summary for symptoms: "${symptoms}"...`);
    const aiSummary = await generatePreVisitSummary(symptoms, severity, onset_date);
    console.log(`[AI LLM RESULT] Urgency: ${aiSummary.urgencyLevel} | Complaint: ${aiSummary.chiefComplaint}`);

    // 4. Generate Google Calendar link
    const title = `Medical Consultation: Dr. ${doctor.doctor_name} & ${patient.name}`;
    const description = `Doctor: Dr. ${doctor.doctor_name} (${doctor.specialization})\nPatient: ${patient.name}\nChief Complaint: ${aiSummary.chiefComplaint}\nUrgency: ${aiSummary.urgencyLevel}`;
    const gCalUrl = generateGoogleCalendarUrl({
      title,
      description,
      startDateStr: appointment_date,
      timeSlot: time_slot,
      durationMins: doctor.slot_duration_mins || 30
    });

    const appointmentId = randomUUID();

    // 5. Execute DB Transaction with Double-Booking Prevention
    const bookTransaction = db.transaction(() => {
      // Check existing active slot explicit double booking pre-guard
      const existing = db.prepare(`
        SELECT id FROM appointments 
        WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN ('CANCELLED', 'CANCELLED_DUE_TO_LEAVE')
      `).get(doctor_id, appointment_date, time_slot);

      if (existing) {
        const err = new Error('DOUBLE_BOOKING');
        err.code = 'DOUBLE_BOOKING';
        throw err;
      }

      db.prepare(`
        INSERT INTO appointments (
          id, patient_id, doctor_id, appointment_date, time_slot, status,
          symptoms, onset_date, severity, urgency_level, chief_complaint, suggested_questions, google_calendar_link
        ) VALUES (?, ?, ?, ?, ?, 'SCHEDULED', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        appointmentId,
        patient_id,
        doctor_id,
        appointment_date,
        time_slot,
        symptoms,
        onset_date,
        severity,
        aiSummary.urgencyLevel,
        aiSummary.chiefComplaint,
        JSON.stringify(aiSummary.suggestedQuestions),
        gCalUrl
      );
    });

    try {
      bookTransaction();
    } catch (txnError) {
      if (txnError.code === 'DOUBLE_BOOKING' || txnError.message.includes('UNIQUE') || txnError.message.includes('idx_unique_active_appointment')) {
        return res.status(409).json({
          error: 'SLOT_UNAVAILABLE',
          message: `The time slot ${time_slot} on ${appointment_date} was just booked by another patient. Please choose a different slot.`
        });
      }
      throw txnError;
    }

    // 6. Send Email Notifications to Patient and Doctor
    await sendNotificationEmail({
      userId: patient_id,
      recipientEmail: patient.email,
      subject: `✅ Appointment Confirmed with Dr. ${doctor.doctor_name}`,
      body: `Dear ${patient.name},\n\nYour appointment has been successfully booked!\n\n• Doctor: Dr. ${doctor.doctor_name} (${doctor.specialization})\n• Date: ${appointment_date}\n• Time: ${time_slot}\n• Urgency Level Assessed: ${aiSummary.urgencyLevel}\n\nAdd to Google Calendar: ${gCalUrl}\n\nThank you for choosing our healthcare clinic!`,
      type: 'BOOKING_CONFIRMATION',
      metadata: { appointmentId, doctorId: doctor_id }
    });

    await sendNotificationEmail({
      userId: doctor.user_id,
      recipientEmail: doctor.doctor_email,
      subject: `🩺 New Patient Appointment: ${patient.name} (${appointment_date} at ${time_slot})`,
      body: `Dr. ${doctor.doctor_name},\n\nA new patient appointment has been scheduled:\n\n• Patient Name: ${patient.name}\n• Date & Time: ${appointment_date} at ${time_slot}\n• Symptoms Reported: ${symptoms}\n• AI Triage Urgency: ${aiSummary.urgencyLevel}\n• Chief Complaint: ${aiSummary.chiefComplaint}\n\nPlease review the pre-visit AI summary on your doctor dashboard prior to the consultation.`,
      type: 'BOOKING_CONFIRMATION',
      metadata: { appointmentId, patientId: patient_id }
    });

    const newAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        ...newAppointment,
        suggested_questions: aiSummary.suggestedQuestions,
        doctor_name: doctor.doctor_name,
        patient_name: patient.name
      }
    });

  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel Appointment
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason = 'Cancelled by user' } = req.body;
    const appt = db.prepare(`
      SELECT a.*, pu.email as patient_email, pu.name as patient_name, du.email as doctor_email, du.name as doctor_name
      FROM appointments a
      JOIN users pu ON a.patient_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    db.prepare(`UPDATE appointments SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);

    // Send Cancellation emails
    await sendNotificationEmail({
      userId: appt.patient_id,
      recipientEmail: appt.patient_email,
      subject: `❌ Appointment Cancelled: Dr. ${appt.doctor_name}`,
      body: `Dear ${appt.patient_name},\n\nYour appointment scheduled for ${appt.appointment_date} at ${appt.time_slot} with Dr. ${appt.doctor_name} has been cancelled (${reason}).`,
      type: 'APPOINTMENT_CANCELLATION',
      metadata: { appointmentId: appt.id }
    });

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download iCal (.ics) file for an appointment
router.get('/:id/ical', (req, res) => {
  try {
    const appt = db.prepare(`
      SELECT a.*, pu.name as patient_name, du.name as doctor_name, d.specialization, d.slot_duration_mins
      FROM appointments a
      JOIN users pu ON a.patient_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!appt) {
      return res.status(404).send('Appointment not found');
    }

    const icsContent = generateICalFile({
      title: `Medical Appointment: Dr. ${appt.doctor_name}`,
      description: `Doctor: Dr. ${appt.doctor_name} (${appt.specialization})\nPatient: ${appt.patient_name}`,
      startDateStr: appt.appointment_date,
      timeSlot: appt.time_slot,
      durationMins: appt.slot_duration_mins || 30
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="appointment-${appt.appointment_date}.ics"`);
    res.send(icsContent);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete Appointment by ID
router.delete('/:id', (req, res) => {
  try {
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Appointment deleted successfully', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
