import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// Get all notifications (or filtered by user_id)
router.get('/', (req, res) => {
  try {
    const { user_id } = req.query;
    let sql = 'SELECT n.*, u.name as recipient_name, u.email as recipient_email FROM notifications n JOIN users u ON n.user_id = u.id';
    const params = [];

    if (user_id) {
      sql += ' WHERE n.user_id = ?';
      params.push(user_id);
    }

    sql += ' ORDER BY n.created_at DESC LIMIT 50';

    const notifications = db.prepare(sql).all(...params);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear notifications for a user
router.delete('/:userId', (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.params.userId);
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
