
const express = require('express');
const {
  createEvent, getAllEvents, getMyEvents,
  registerForEvent, deregisterFromEvent, cancelEvent
} = require('../controllers/eventController');
const { verifyToken, requireOrganizer } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllEvents);
router.get('/my-events', verifyToken, requireOrganizer, getMyEvents);
router.post('/', verifyToken, requireOrganizer, createEvent);
router.post('/register/:id', verifyToken, registerForEvent);
router.delete('/deregister/:id', verifyToken, deregisterFromEvent);
router.put('/cancel/:id', verifyToken, requireOrganizer, cancelEvent);

module.exports = router;
