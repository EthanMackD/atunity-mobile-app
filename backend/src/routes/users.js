const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');

router.put('/tutor-profile', authMiddleware, userController.updateTutorProfile);
router.get('/tutors', authMiddleware, userController.getAllTutors);
router.get('/tutors/:id', authMiddleware, userController.getTutorById);

module.exports = router;