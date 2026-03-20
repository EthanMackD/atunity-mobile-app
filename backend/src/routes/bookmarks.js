const express = require('express');
const router = express.Router();
const bookmarksController = require('../controllers/bookmarksController');
const authMiddleware = require('../middleware/auth');
 
router.post('/:id/toggle', authMiddleware, bookmarksController.toggleBookmark);
router.get('/', authMiddleware, bookmarksController.getMyBookmarks);
router.get('/:id/check', authMiddleware, bookmarksController.checkBookmark);
 
module.exports = router;
