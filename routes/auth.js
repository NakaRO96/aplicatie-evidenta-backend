const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword); // NOU: Rută pentru a iniția resetarea parolei
// NOU: Rută pentru a finaliza resetarea parolei (va fi implementată ulterior)
// router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;