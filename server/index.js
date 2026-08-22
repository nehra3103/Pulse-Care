import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db/database.js';
import { randomUUID } from 'crypto';

import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import prescriptionRoutes from './routes/prescriptions.js';
import notificationRoutes from './routes/notifications.js';
import { initScheduler } from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Healthcare Platform Backend Operational', timestamp: new Date() });
});

// Seed & Restore Platform Data Safely
import { restoreAllEntries } from './restore-data.js';

function seedDatabase() {
  restoreAllEntries();
}

seedDatabase();
initScheduler();

app.listen(PORT, () => {
  console.log(`🚀 Healthcare API Backend listening on http://localhost:${PORT}`);
});
