import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// GET feedbacks (public gets approved feedbacks, admin can pass ?all=true)
router.get('/', (req, res) => {
  const showAll = req.query.all === 'true' || req.query.admin === 'true';
  const itemType = (req.query.item_type || req.query.type || '').trim();
  const itemId = (req.query.item_id || req.query.property_id || req.query.project_id || req.query.land_id || req.query.id || '').trim();
  const altId = (req.query.alt_id || req.query.numeric_id || '').trim();
  const itemTitle = (req.query.item_title || req.query.title || '').trim();

  let sql = showAll
    ? 'SELECT * FROM feedback WHERE 1=1'
    : 'SELECT * FROM feedback WHERE approved = 1';
  const params = [];

  if (itemId || altId) {
    const idClauses = [];
    if (itemId) {
      idClauses.push('item_id = ?');
      params.push(String(itemId));
      idClauses.push('service LIKE ?');
      params.push(`%${itemId}%`);
    }
    if (altId && altId !== itemId) {
      idClauses.push('item_id = ?');
      params.push(String(altId));
    }
    if (itemTitle) {
      idClauses.push("(item_title != '' AND (item_title = ? OR item_title LIKE ?))");
      params.push(String(itemTitle), `%${itemTitle}%`);
    }

    const idClause = `(${idClauses.join(' OR ')})`;

    if (itemType && itemType !== 'all') {
      sql += ` AND (${idClause} AND (item_type = ? OR item_type = 'general' OR item_type = ''))`;
      params.push(itemType);
    } else {
      sql += ` AND ${idClause}`;
    }
  } else if (itemType && itemType !== 'all') {
    sql += ' AND item_type = ?';
    params.push(itemType);
  }

  sql += ' ORDER BY id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// POST new client feedback
router.post('/', (req, res) => {
  const { client_name, phone, location, service, rating, message, item_type, item_id, item_title } = req.body;

  if (!client_name || !message) {
    return res.status(400).json({ error: 'Client name and feedback message are required' });
  }

  const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
  const cleanItemType = (item_type || 'general').trim();
  const cleanItemId = item_id ? String(item_id).trim() : '';
  const cleanItemTitle = (item_title || '').trim();

  const sql = `
    INSERT INTO feedback (client_name, phone, location, service, rating, message, approved, item_type, item_id, item_title)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      client_name.trim(),
      phone ? phone.trim() : '',
      location ? location.trim() : '',
      service ? service.trim() : 'General Feedback',
      numericRating,
      message.trim(),
      cleanItemType,
      cleanItemId,
      cleanItemTitle
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        feedbackId: this.lastID,
        message: 'Thank you for your feedback! It has been submitted successfully.'
      });
    }
  );
});

// PUT update feedback / toggle approval
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { client_name, phone, location, service, rating, message, approved, item_type, item_id, item_title } = req.body;

  db.get('SELECT * FROM feedback WHERE id = ?', [id], (err, existing) => {
    if (err || !existing) {
      return res.status(404).json({ error: 'Feedback record not found' });
    }

    const updatedName = client_name !== undefined ? client_name : existing.client_name;
    const updatedPhone = phone !== undefined ? phone : existing.phone;
    const updatedLocation = location !== undefined ? location : existing.location;
    const updatedService = service !== undefined ? service : existing.service;
    const updatedRating = rating !== undefined ? Math.min(5, Math.max(1, parseInt(rating, 10) || 5)) : existing.rating;
    const updatedMessage = message !== undefined ? message : existing.message;
    const updatedApproved = approved !== undefined ? (approved ? 1 : 0) : existing.approved;
    const updatedItemType = item_type !== undefined ? item_type : (existing.item_type || 'general');
    const updatedItemId = item_id !== undefined ? String(item_id) : (existing.item_id || '');
    const updatedItemTitle = item_title !== undefined ? item_title : (existing.item_title || '');

    const sql = `
      UPDATE feedback
      SET client_name = ?, phone = ?, location = ?, service = ?, rating = ?, message = ?, approved = ?, item_type = ?, item_id = ?, item_title = ?
      WHERE id = ?
    `;

    db.run(
      sql,
      [updatedName, updatedPhone, updatedLocation, updatedService, updatedRating, updatedMessage, updatedApproved, updatedItemType, updatedItemId, updatedItemTitle, id],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        res.json({ success: true, message: 'Feedback updated successfully.' });
      }
    );
  });
});

// DELETE feedback
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM feedback WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Feedback deleted successfully.' });
  });
});

export default router;
