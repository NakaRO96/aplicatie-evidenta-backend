const SimulationResult = require('../models/SimulationResult');
const User = require('../models/User');

// Adaugă un nou rezultat de simulare (doar admin)
exports.addSimulationResult = async (req, res) => {
  const {
    userId,
    rawTime,
    penaltyTime,
    totalTime,
    penaltiesList,
    javelinTime,
    eliminatedObstaclesList
  } = req.body;

  try {
    const newResult = new SimulationResult({
      userId,
      rawTime,
      penaltyTime,
      totalTime,
      penaltiesList,
      javelinTime,
      eliminatedObstaclesList
    });

    const result = await newResult.save();
    res.status(201).json({ msg: 'Rezultat simulare adăugat cu succes', result });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Obține toate rezultatele simulărilor pentru un utilizator (admin sau client propriu)
exports.getSimulationResultsForUser = async (req, res) => {
  try {
    if (req.user.role === 'client' && req.user.id !== req.params.userId) {
      return res.status(403).json({ msg: 'Acces interzis. Nu aveți permisiunea de a vedea aceste rezultate.' });
    }

    const results = await SimulationResult.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Editează un rezultat de simulare (doar admin)
exports.updateSimulationResult = async (req, res) => {
  const {
    rawTime,
    penaltyTime,
    totalTime,
    penaltiesList,
    javelinTime,
    eliminatedObstaclesList
  } = req.body;

  try {
    let result = await SimulationResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: 'Rezultat simulare negăsit' });
    }

    if (rawTime !== undefined) result.rawTime = rawTime;
    if (penaltyTime !== undefined) result.penaltyTime = penaltyTime;
    if (totalTime !== undefined) result.totalTime = totalTime;
    if (penaltiesList !== undefined) result.penaltiesList = penaltiesList;
    if (javelinTime !== undefined) result.javelinTime = javelinTime;
    if (eliminatedObstaclesList !== undefined) result.eliminatedObstaclesList = eliminatedObstaclesList;

    await result.save();
    res.json({ msg: 'Rezultat simulare actualizat', result });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Șterge un rezultat de simulare (doar admin)
exports.deleteSimulationResult = async (req, res) => {
  try {
    const result = await SimulationResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: 'Rezultat simulare negăsit' });
    }
    await result.deleteOne();
    res.json({ msg: 'Rezultat simulare șters cu succes' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Funcția pentru a obține top 3 rezultate ale simulărilor
exports.getTopSimulations = async (req, res) => {
  try {
    const topSimulations = await SimulationResult.find()
      .sort({ totalTime: 1 })
      .limit(3)
      .populate('userId', 'name');

    const formattedResults = topSimulations.map(sim => ({
      _id: sim._id,
      totalTime: sim.totalTime,
      date: sim.date,
      userName: sim.userId ? sim.userId.name : 'Utilizator necunoscut'
    }));

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Eroare la preluarea topului simulărilor:', error);
    res.status(500).json({ message: 'Eroare la preluarea datelor de top.' });
  }
};