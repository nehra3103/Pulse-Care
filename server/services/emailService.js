import nodemailer from 'nodemailer';
import db from '../db/database.js';
import { randomUUID } from 'crypto';

// Setup Nodemailer transporter (Fallback to Ethereal / Test transport)
let transporter = null;

try {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Non-blocking ethereal creation
    nodemailer.createTestAccount().then(testAccount => {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }).catch(() => {
      console.log('Nodemailer test transport running in offline mode.');
    });
  }
} catch (err) {
  console.warn('Nodemailer init warning:', err.message);
}

/**
 * Send email and record notification log in database
 */
export async function sendNotificationEmail({ userId, recipientEmail, subject, body, type, metadata = {} }) {
  console.log(`[EMAIL DISPATCH] To: ${recipientEmail} | Subject: "${subject}" | Type: ${type}`);

  const notificationId = randomUUID();
  
  // 1. Synchronously Record in Database Notification Feed
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, channel, metadata, status)
      VALUES (?, ?, ?, ?, ?, 'EMAIL', ?, 'SENT')
    `);
    stmt.run(notificationId, userId, type, subject, body, JSON.stringify(metadata));
  } catch (err) {
    console.error('Failed to log notification to database:', err.message);
  }

  // 2. Dispatch via Nodemailer asynchronously without blocking response
  if (transporter && recipientEmail) {
    transporter.sendMail({
      from: '"HealthCare CareTeam" <noreply@healthcare-manager.com>',
      to: recipientEmail,
      subject: subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">🏥 Healthcare Platform Notification</h2>
        <h3 style="color: #1e293b;">${subject}</h3>
        <p style="color: #334155; line-height: 1.6; whitespace: pre-line;">${body.replace(/\n/g, '<br>')}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Automated notification from Healthcare Appointment Manager.</p>
      </div>`
    }).then(info => {
      console.log(`[EMAIL DELIVERED] Message ID: ${info.messageId}`);
    }).catch(err => {
      console.warn(`[EMAIL NOTICE] Delivered to in-app drawer feed.`);
    });
  }

  return notificationId;
}
