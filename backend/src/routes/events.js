const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const authMiddleware = require('../middleware/auth');

router.get('/', eventsController.getAllEvents);
router.get('/bookmarks', authMiddleware, eventsController.getBookmarks); 
router.get('/:id', eventsController.getEventById);
router.post('/:id/attend', authMiddleware, eventsController.markAttendance);
router.get('/:id/attendees', eventsController.getAttendees);
router.post('/', eventsController.createEvent);
router.post('/:id/bookmark', authMiddleware, eventsController.bookmarkEvent);
router.delete('/:id/bookmark', authMiddleware, eventsController.removeBookmark);

module.exports = router;