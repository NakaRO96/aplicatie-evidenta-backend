const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const userController = require('../controllers/userController');

// CORECTAT: Linia 'const User = require('./models/User');' a fost eliminată de aici.
// Modelul User este importat direct în controllere (userController.js) și middleware-uri (dacă e necesar).

// RUTA MODIFICATĂ pentru a obține toți utilizatorii cu paginare
router.get('/', authMiddleware, adminMiddleware, userController.getUsersWithPagination);

// RUTA NOUĂ PENTRU A CREA UN UTILIZATOR
router.post('/', authMiddleware, adminMiddleware, userController.createUser);

// RUTA PENTRU SCHIMBAREA PAROLEI - trebuie să fie înainte de rutele cu ID generic
router.put('/change-password', authMiddleware, userController.changePassword); // Fără adminMiddleware aici, permițând oricui să-și schimbe parola

// Ruta pentru a obține detalii despre un utilizator specific
router.get('/:id', authMiddleware, userController.getUserDetails);

// Rute pentru a edita și șterge utilizator
router.put('/:id', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

module.exports = router;
