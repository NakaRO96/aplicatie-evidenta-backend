const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const userController = require('../controllers/userController');

// @route   GET api/users
// @desc    Obține toți utilizatorii (doar pentru admin)
// @access  Privat (Admin)
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);

// @route   GET api/users/me
// @desc    Obține profilul utilizatorului autentificat
// @access  Privat
router.get('/me', authMiddleware, userController.getLoggedInUser);

// @route   GET api/users/candidates
// @desc    Obține toți utilizatorii cu rolul de 'client' pentru pagina de simulări
// @access  Privat (Admin)
router.get('/candidates', authMiddleware, adminMiddleware, userController.getCandidates);

// @route   GET api/users/:id
// @desc    Obține detaliile unui utilizator după ID
// @access  Privat (Admin sau utilizatorul însuși)
router.get('/:id', authMiddleware, userController.getUserById);

// @route   PUT api/users/:id
// @desc    Actualizează detaliile unui utilizator
// @access  Privat
router.put('/:id', authMiddleware, userController.updateUser);

// @route   DELETE api/users/:id
// @desc    Șterge un utilizator (doar pentru admin)
// @access  Privat (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

// @route   POST api/users/:id/attendance
// @desc    Adaugă o singură înregistrare de prezență pentru un utilizator
// @access  Privat
router.post('/:id/attendance', authMiddleware, userController.addAttendance);

module.exports = router;