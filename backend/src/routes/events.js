const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const authMiddleware = require('../middleware/auth');

router.get('/', eventsController.getAllEvents);
router.post('/', eventsController.createEvent);

router.get('/bookmarks', authMiddleware, eventsController.getBookmarks);
router.get('/my/history', authMiddleware, eventsController.getMyEvents);

router.get('/:id/attendees', eventsController.getAttendees);
router.get('/:id/reminders', authMiddleware, eventsController.getReminderStatus);
router.post('/:id/reminders', authMiddleware, eventsController.toggleReminder);
router.delete('/:id/reminders', authMiddleware, eventsController.disableReminder);
router.post('/:id/attend', authMiddleware, eventsController.markAttendance);
router.post('/:id/bookmark', authMiddleware, eventsController.bookmarkEvent);
router.delete('/:id/bookmark', authMiddleware, eventsController.removeBookmark);
router.put('/:id', authMiddleware, eventsController.updateEvent);
router.delete('/:id', authMiddleware, eventsController.deleteEvent);

router.get('/:id', eventsController.getEventById);

module.exports = router;