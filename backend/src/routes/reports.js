const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, reportsController.fileReport);
router.get('/check/:id', authMiddleware, reportsController.checkReport);

module.exports = router;
