
const express = require('express');
const {
  createEvent, getAllEvents, getMyEvents,
  registerForEvent, deregisterFromEvent, cancelEvent, getMyRegisteredEvents,approveAttendee,rejectAttendee
} = require('../controllers/eventController');
const { verifyToken, requireOrganizer } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllEvents);
router.get('/my-events', verifyToken, requireOrganizer, getMyEvents);
router.post('/', verifyToken, requireOrganizer, createEvent);
router.post('/register/:id', verifyToken, registerForEvent);
router.delete('/deregister/:id', verifyToken, deregisterFromEvent);
router.put('/cancel/:id', verifyToken, requireOrganizer, cancelEvent);
router.get('/registrations', verifyToken, getMyRegisteredEvents);
router.post('/:eventId/approve/:userId', verifyToken, requireOrganizer, approveAttendee); 
router.post('/:eventId/reject/:userId', verifyToken, requireOrganizer, rejectAttendee); 
module.exports = router;
