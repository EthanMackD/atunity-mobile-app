const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, messagesController.sendMessage);
router.get('/conversations', authMiddleware, messagesController.getConversations);
router.get('/unread', authMiddleware, messagesController.getUnreadCount);
router.get('/:id', authMiddleware, messagesController.getMessages);

module.exports = router;