import express from 'express';
import db from '../database/database.js';
import { deleteLeadsBlobFolder } from '../utils/blobStorage.js';

const router = express.Router();

// Clean up any existing leads/ folder or files on Vercel Blob storage (leads are stored ONLY in Neon DB)
if (process.env.BLOB_READ_WRITE_TOKEN) {
  deleteLeadsBlobFolder().catch((e) => {
    console.warn('Notice cleaning up leads blob folder:', e.message);
  });
}


let latestLeadEvent = null;
let leadEventSubscribers = [];

const notifyLeadSubscribers = (lead) => {
  latestLeadEvent = lead;
  leadEventSubscribers.forEach((send) => {
    try { send(lead); } catch (e) {}
  });
};

// GET all leads
router.get('/', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.warn('Notice querying leads table:', err.message);
      return res.json([]);
    }
    res.json(rows || []);
  });
});

// Real-time Server-Sent Events (SSE) stream for instant mobile notification bar alerts
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const subscriber = (lead) => {
    res.write(`data: ${JSON.stringify({ type: 'NEW_LEAD', lead })}\n\n`);
  };

  leadEventSubscribers.push(subscriber);

  req.on('close', () => {
    leadEventSubscribers = leadEventSubscribers.filter(s => s !== subscriber);
  });
});

// Fast lightweight polling endpoint for new leads
router.get('/latest', (req, res) => {
  if (latestLeadEvent) {
    return res.json({ lead: latestLeadEvent });
  }
  db.get('SELECT id, name, phone, service, message, created_at FROM leads ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (!err && row) {
      return res.json({ lead: { ...row, timestamp: Date.parse(row.created_at) || Date.now() } });
    }
    res.json({ lead: null });
  });
});

// POST new property lead / enquiry
router.post('/', (req, res) => {
  const { name, phone, email, service, property_id, message, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone number are required' });
  }

  const cleanName = String(name).trim();
  const cleanPhone = String(phone).trim();
  const cleanEmail = email ? String(email).trim() : '';
  const cleanService = service ? String(service).trim() : 'General Inquiry';
  const cleanPropId = property_id ? String(property_id).trim() : null;
  const cleanMsg = (message || notes || '').trim();

  const sql = 'INSERT INTO leads (name, phone, email, service, property_id, message) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [cleanName, cleanPhone, cleanEmail, cleanService, cleanPropId, cleanMsg], function (err) {
    if (err) {
      console.warn('Warning inserting full lead, trying legacy column format:', err.message);
      return db.run(
        'INSERT INTO leads (name, phone, service, message) VALUES (?, ?, ?, ?)',
        [cleanName, cleanPhone, cleanService, cleanMsg],
        function (err2) {
          if (err2) {
            console.error('Fatal error inserting lead:', err2.message);
            return res.status(500).json({ error: err2.message });
          }
          const leadId = this.lastID;
          notifyLeadSubscribers({
            id: leadId,
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            service: cleanService,
            message: cleanMsg,
            timestamp: Date.now()
          });
          res.json({ success: true, leadId, message: 'Enquiry received successfully.' });
        }
      );
    }
    const leadId = this.lastID;
    notifyLeadSubscribers({
      id: leadId,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      service: cleanService,
      message: cleanMsg,
      timestamp: Date.now()
    });
    res.json({ success: true, leadId, message: 'Enquiry received successfully.' });
  });
});

// DELETE lead
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM leads WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Lead enquiry deleted successfully.' });
  });
});

// PATCH update lead status / contact completion (Uses Neon DB / Database directly, no leads_backup.json needed)
router.patch('/:id/toggle-contact', (req, res) => {
  const { id } = req.params;
  const { contacted, status } = req.body;
  const isContacted = contacted ? 1 : 0;
  const leadStatus = status || (isContacted ? 'Contacted' : 'Pending');

  db.run(
    'UPDATE leads SET contacted = ?, status = ? WHERE id = ?',
    [isContacted, leadStatus, id],
    function (err) {
      if (err) {
        console.warn('Notice updating lead contacted status, trying contacted only:', err.message);
        return db.run(
          'UPDATE leads SET contacted = ? WHERE id = ?',
          [isContacted, id],
          function (err2) {
            if (err2) {
              return res.status(500).json({ error: err2.message });
            }
            res.json({ success: true, contacted: isContacted, status: leadStatus });
          }
        );
      }
      res.json({ success: true, contacted: isContacted, status: leadStatus });
    }
  );
});

export default router;

