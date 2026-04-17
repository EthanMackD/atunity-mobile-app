const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');

router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/tutor-profile', authMiddleware, userController.updateTutorProfile);
router.get('/tutors', authMiddleware, userController.getAllTutors);
router.get('/tutors/:id', authMiddleware, userController.getTutorById);

router.post('/block/:id', authMiddleware, userController.blockUser);
router.delete('/block/:id', authMiddleware, userController.unblockUser);
router.get('/block-status/:id', authMiddleware, userController.getBlockStatus);

module.exports = router;