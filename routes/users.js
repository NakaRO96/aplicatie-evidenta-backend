const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const userController = require('../controllers/userController');

// Ruta pentru a obține toți utilizatorii - necesită autentificare și rol de admin
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);

// Poți adăuga aici și alte rute pentru utilizatori
// router.get('/:id', ...);
// router.delete('/:id', ...);

module.exports = router;