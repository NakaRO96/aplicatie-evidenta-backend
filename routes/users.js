const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); // Încă îl importăm pentru alte rute
const userController = require('../controllers/userController');

// Ruta pentru a obține toți utilizatorii - necesită autentificare și rol de admin
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);

// Ruta pentru a obține detalii despre un utilizator specific
// Protejată doar de authMiddleware. Logica de rol (admin vs client care își vede propriul cont)
// este gestionată DEDICAT în userController.js.
router.get('/:id', authMiddleware, userController.getUserDetails);

// Rute pentru a edita și șterge utilizator - necesită autentificare și rol de admin
router.put('/:id', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

module.exports = router;