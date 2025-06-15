
const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requestOrganizerRole, getProfile, getUserRegistrations } = require('../controllers/userController');

const router = express.Router();
router.use(verifyToken);

router.post('/request-organizer', requestOrganizerRole);
router.get('/profile', getProfile);
router.get('/registrations', getUserRegistrations);

module.exports = router;
