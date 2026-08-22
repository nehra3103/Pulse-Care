import express from 'express';
import db from '../db/database.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Register User
router.post('/register', (req, res) => {
  try {
    const { name, email, role = 'PATIENT', phone = '', avatar = '' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.json({ message: 'User already exists', user: existing });
    }

    const id = randomUUID();
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    
    db.prepare(`
      INSERT INTO users (id, name, email, role, phone, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, email, role, phone, defaultAvatar);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Login User
router.post('/login', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // Attach doctor profile if user is a doctor
    let doctorProfile = null;
    if (user.role === 'DOCTOR') {
      doctorProfile = db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(user.id);
    }

    return res.json({ user, doctorProfile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get all users (filtered by role if provided)
router.get('/users', (req, res) => {
  const { role } = req.query;
  try {
    let sql = 'SELECT * FROM users';
    const params = [];
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    const users = db.prepare(sql).all(...params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
