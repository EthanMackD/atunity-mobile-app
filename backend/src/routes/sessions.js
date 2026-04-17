const express = require('express');
const router = express.Router();
const sessionsController = require('../controllers/sessionsController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, sessionsController.bookSession);
router.get('/my', authMiddleware, sessionsController.getMySessions);
router.put('/:id/cancel', authMiddleware, sessionsController.cancelSession);
router.put('/:id/reschedule', authMiddleware, sessionsController.rescheduleSession);

module.exports = router;
