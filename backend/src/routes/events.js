const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const authMiddleware = require('../middleware/auth');

router.get('/', eventsController.getAllEvents);
router.get('/my/history', authMiddleware, eventsController.getMyEvents);
router.get('/:id', eventsController.getEventById);
router.post('/:id/attend', authMiddleware, eventsController.markAttendance);
router.get('/:id/attendees', eventsController.getAttendees);
router.post('/', eventsController.createEvent);

module.exports = router;