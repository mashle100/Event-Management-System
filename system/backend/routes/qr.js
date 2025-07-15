// routes/qr.js
const express = require('express');
const router = express.Router();
const qrcode = require('qrcode');
const Event = require('../models/Event');
const { verifyToken } = require('../middlewares/authMiddleware');

// POST /api/qr/generate
router.post('/generate', verifyToken, async (req, res) => {
  const { organizerId, userId, eventId } = req.body;
  
  if (!organizerId || !userId || !eventId) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }
  
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ msg: 'Invalid organizer ID' });
    }
    
    const isRegistered = event.attendees.some(id => id.toString() === userId);
    if (!isRegistered) {
      return res.status(403).json({ msg: 'User is not registered for this event' });
    }
    
    const qrText = `${organizerId}-${userId}-${eventId}`;
    const qrImage = await qrcode.toDataURL(qrText);

    return res.json({ qrImage });
  } catch (err) {
    console.error('❌ QR Generation Error:', err);
    return res.status(500).json({ msg: 'Internal server error', error: err.message });
  }
});

router.post('/verify', verifyToken, async (req, res) => {
  const { qrId, eventId, organizerId } = req.body;
  if (!qrId || !eventId || !organizerId) {
    return res.status(400).json({ msg: 'Missing qrId, eventId, or organizer' });
  }

  try {
    const event = await Event.findOne({ _id: eventId, organizer: organizerId });

    if (!event) {
      return res.status(404).json({ msg: 'Event not found or unauthorized' });
    }

    const registration = event.registeredInfo.find(
      (r) => r.registrationId === qrId
    );
    if (!registration) {
      return res.status(404).json({ msg: 'QR not found in registration info' });
    }

    if (registration.marked) {
      return res.status(400).json({ msg: 'QR already marked' });
    }

    registration.marked = true;
    await event.save();

    res.json({ msg: 'QR marked successfully' });
  } catch (err) {
    console.error('QR Verify Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
