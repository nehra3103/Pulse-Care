import express from 'express';
import db from '../db/database.js';
import { randomUUID } from 'crypto';
import { generatePostVisitSummary } from '../services/llmService.js';
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

// Doctor submits Post-Visit Clinical Notes & Prescriptions
router.post('/complete-visit', async (req, res) => {
  try {
    const { appointment_id, clinical_notes, prescriptions = [] } = req.body;

    if (!appointment_id || !clinical_notes) {
      return res.status(400).json({ error: 'appointment_id and clinical_notes are required' });
    }

    const appt = db.prepare(`
      SELECT a.*, pu.name as patient_name, pu.email as patient_email, du.name as doctor_name
      FROM appointments a
      JOIN users pu ON a.patient_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.id = ?
    `).get(appointment_id);

    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // 1. Generate Patient-Friendly AI Post-Visit Summary
    console.log(`[AI LLM] Generating Post-Visit Summary for clinical notes...`);
    const postVisitSummary = await generatePostVisitSummary(clinical_notes, prescriptions);

    // 2. Update Appointment Record
    db.prepare(`
      UPDATE appointments 
      SET status = 'COMPLETED',
          clinical_notes = ?,
          post_visit_summary = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(clinical_notes, postVisitSummary, appointment_id);

    // 3. Save Prescriptions & Create Medication Reminders
    const savedPrescriptions = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const p of prescriptions) {
      const pId = randomUUID();
      const { medication_name, dosage, frequency = 'Once daily', duration_days = 7, instructions = 'Take after food' } = p;

      db.prepare(`
        INSERT INTO prescriptions (id, appointment_id, patient_id, doctor_id, medication_name, dosage, frequency, duration_days, instructions, start_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(pId, appointment_id, appt.patient_id, appt.doctor_id, medication_name, dosage, frequency, duration_days, instructions, todayStr);

      savedPrescriptions.push({ id: pId, medication_name, dosage, frequency, duration_days, instructions });

      // Generate Medication Reminders in background table based on duration
      for (let day = 0; day < Math.min(duration_days, 14); day++) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + day);
        const dateStr = dateObj.toISOString().split('T')[0];

        // Determine reminder times based on frequency text
        const times = [];
        const freqLower = frequency.toLowerCase();
        if (freqLower.includes('twice')) {
          times.push('09:00', '20:00');
        } else if (freqLower.includes('three') || freqLower.includes('thrice')) {
          times.push('08:00', '14:00', '20:00');
        } else {
          times.push('09:00');
        }

        for (const time of times) {
          const rId = randomUUID();
          db.prepare(`
            INSERT INTO medication_reminders (id, prescription_id, patient_id, reminder_time, scheduled_date, status)
            VALUES (?, ?, ?, ?, ?, 'PENDING')
          `).run(rId, pId, appt.patient_id, time, dateStr);
        }
      }
    }

    // 4. Send Email to Patient with Post-Visit Summary
    await sendNotificationEmail({
      userId: appt.patient_id,
      recipientEmail: appt.patient_email,
      subject: `📋 Your Post-Visit Summary & Care Plan from Dr. ${appt.doctor_name}`,
      body: `Dear ${appt.patient_name},\n\nDr. ${appt.doctor_name} has finalized your consultation notes and care plan.\n\n--- AI PATIENT-FRIENDLY SUMMARY ---\n${postVisitSummary}\n\nYou can access your complete prescription details and medication schedule anytime in your patient dashboard.`,
      type: 'BOOKING_CONFIRMATION',
      metadata: { appointmentId: appt.id }
    });

    res.json({
      message: 'Post-visit notes submitted successfully',
      post_visit_summary: postVisitSummary,
      prescriptions: savedPrescriptions
    });

  } catch (err) {
    console.error('Post-visit submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get prescriptions for patient
router.get('/patient/:patientId', (req, res) => {
  try {
    const prescriptions = db.prepare(`
      SELECT p.*, du.name as doctor_name, d.specialization
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `).all(req.params.patientId);

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
