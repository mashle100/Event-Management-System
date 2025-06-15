const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/pending-organizers', adminController.getPendingOrganizers);
router.get('/organizers', adminController.getApprovedOrganizers);
router.get('/events', adminController.getAllEvents);

router.put('/approve-organizer/:id', adminController.approveOrganizer);
router.put('/reject-organizer/:id', adminController.rejectOrganizer);

module.exports = router;
