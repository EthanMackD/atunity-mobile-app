const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const authMiddleware = require('../middleware/auth');

router.post('/archive', authMiddleware, archiveController.archiveConversation);
router.post('/unarchive', authMiddleware, archiveController.unarchiveConversation);
router.get('/archived-ids', authMiddleware, archiveController.getArchivedIds);

module.exports = router;
