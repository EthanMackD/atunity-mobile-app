const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const authMiddleware = require('../middleware/auth');

router.get('/', eventsController.getAllEvents);
router.post('/', eventsController.createEvent);
router.get('/my/history', authMiddleware, eventsController.getMyEvents);
router.get('/:id', eventsController.getEventById);
router.post('/:id/attend', authMiddleware, eventsController.markAttendance);
router.get('/:id/attendees', eventsController.getAttendees);
router.get('/:id/reminders', authMiddleware, eventsController.getReminderStatus);
router.post('/:id/reminders', authMiddleware, eventsController.toggleReminder);
router.delete('/:id/reminders', authMiddleware, eventsController.disableReminder);

module.exports = router;
