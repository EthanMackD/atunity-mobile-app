const express = require('express');
const router = express.Router();
const eventMessagesController = require('../controllers/eventMessagesController');
const authMiddleware = require('../middleware/auth');

router.post('/:eventId/messages', authMiddleware, eventMessagesController.postMessage);
router.get('/:eventId/messages', authMiddleware, eventMessagesController.getMessages);

module.exports = router;