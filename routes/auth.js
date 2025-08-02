const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); // De obicei, doar admin-ul creează conturi
router.post('/login', authController.login);

module.exports = router;