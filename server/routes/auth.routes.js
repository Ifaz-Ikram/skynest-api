const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const { requireAuth } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
