const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const authMiddleware = require('../middleware/auth');

router.post('/request', authMiddleware, friendsController.sendRequest);
router.put('/:id/accept', authMiddleware, friendsController.acceptRequest);
router.put('/:id/decline', authMiddleware, friendsController.declineRequest);
router.get('/my', authMiddleware, friendsController.getMyFriends);
router.get('/pending', authMiddleware, friendsController.getPendingRequests);
router.get('/check/:id', authMiddleware, friendsController.checkFriendship);

module.exports = router;