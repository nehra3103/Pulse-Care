import cron from 'node-cron';
import db from '../db/database.js';
import { sendNotificationEmail } from './emailService.js';

export function initScheduler() {
  console.log('[SCHEDULER] Initializing background task jobs...');

  // 1. Run every 1 minute to check for medication reminders
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Query active prescriptions and matching reminders
      const pendingReminders = db.prepare(`
        SELECT r.id as reminder_id, r.prescription_id, r.patient_id, p.medication_name, p.dosage, p.frequency, p.instructions, u.email as patient_email, u.name as patient_name
        FROM medication_reminders r
        JOIN prescriptions p ON r.prescription_id = p.id
        JOIN users u ON r.patient_id = u.id
        WHERE r.status = 'PENDING' AND r.scheduled_date = ? AND r.reminder_time <= ?
      `).all(currentDateStr, currentHHMM);

      for (const rem of pendingReminders) {
        console.log(`[MEDICATION REMINDER] Sending reminder for ${rem.medication_name} to ${rem.patient_name}`);

        await sendNotificationEmail({
          userId: rem.patient_id,
          recipientEmail: rem.patient_email,
          subject: `⏰ Medication Reminder: ${rem.medication_name}`,
          body: `Hi ${rem.patient_name},\n\nIt is time to take your prescribed medication:\n\n• Medication: ${rem.medication_name} (${rem.dosage})\n• Instructions: ${rem.instructions || 'Take as directed'}\n\nPlease update your tracker after taking your dose!`,
          type: 'MEDICATION_REMINDER',
          metadata: { prescriptionId: rem.prescription_id, reminderId: rem.reminder_id }
        });

        // Mark as SENT
        db.prepare(`UPDATE medication_reminders SET status = 'SENT', sent_at = CURRENT_TIMESTAMP WHERE id = ?`).run(rem.reminder_id);
      }
    } catch (err) {
      console.error('[SCHEDULER ERROR] Medication reminders failed:', err.message);
    }
  });

  // 2. Run every 15 minutes for 24-hour appointment reminder check
  cron.schedule('*/15 * * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const targetDateStr = tomorrow.toISOString().split('T')[0];

      const upcomingAppointments = db.prepare(`
        SELECT a.id, a.appointment_date, a.time_slot, pu.name as patient_name, pu.email as patient_email, du.name as doctor_name, doc.specialization
        FROM appointments a
        JOIN users pu ON a.patient_id = pu.id
        JOIN doctors doc ON a.doctor_id = doc.id
        JOIN users du ON doc.user_id = du.id
        WHERE a.status = 'SCHEDULED' AND a.appointment_date = ?
      `).all(targetDateStr);

      for (const appt of upcomingAppointments) {
        // Check if reminder was already logged
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND type = 'APPOINTMENT_REMINDER' AND metadata LIKE ?
        `).get(appt.patient_id, `%${appt.id}%`);

        if (!existing) {
          await sendNotificationEmail({
            userId: appt.patient_id,
            recipientEmail: appt.patient_email,
            subject: `🔔 Upcoming Appointment Tomorrow with Dr. ${appt.doctor_name}`,
            body: `Hi ${appt.patient_name},\n\nThis is a friendly reminder for your upcoming medical appointment:\n\n• Doctor: Dr. ${appt.doctor_name} (${appt.specialization})\n• Date: ${appt.appointment_date}\n• Time: ${appt.time_slot}\n\nPlease ensure you have submitted your pre-visit symptom notes prior to the visit!`,
            type: 'APPOINTMENT_REMINDER',
            metadata: { appointmentId: appt.id }
          });
        }
      }
    } catch (err) {
      console.error('[SCHEDULER ERROR] Appointment reminders failed:', err.message);
    }
  });
}
