const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const simulationController = require('../controllers/simulationController');

// Adaugă un nou rezultat de simulare (necesită autentificare și rol de admin)
router.post('/', authMiddleware, adminMiddleware, simulationController.addSimulationResult);

// Obține rezultatele simulărilor pentru un utilizator (accesibil și pentru clienți, pentru propriile rezultate)
router.get('/:userId', authMiddleware, simulationController.getSimulationResultsForUser);

// Editează un rezultat de simulare (necesită autentificare și rol de admin)
router.put('/:id', authMiddleware, adminMiddleware, simulationController.updateSimulationResult);

// Șterge un rezultat de simulare (necesită autentificare și rol de admin)
router.delete('/:id', authMiddleware, adminMiddleware, simulationController.deleteSimulationResult);

module.exports = router;