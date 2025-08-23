const User = require('../models/User');

// @desc    Obține toți utilizatorii cu opțiuni de filtrare și căutare
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const { filter, searchQuery, page = 1, limit = 10 } = req.query;
    let query = {};

    if (filter === 'active') {
      query.subscriptionEndDate = { $gt: new Date() };
    } else if (filter === 'expired') {
      query.subscriptionEndDate = { $lte: new Date() };
    }

    if (searchQuery) {
      query.$or = [
        { name: new RegExp(searchQuery, 'i') },
        { phoneNumber: new RegExp(searchQuery, 'i') },
      ];
    }

    query.role = 'client';

    const count = await User.countDocuments(query);
    const users = await User.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.status(200).json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error('Eroare la preluarea utilizatorilor:', err);
    res.status(500).json({ msg: 'Eroare server la preluarea utilizatorilor.' });
  }
};

// @desc    Obține detaliile utilizatorului autentificat
// @route   GET /api/users/me
exports.getLoggedInUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

// @desc    Obține toți utilizatorii cu rol de 'client'
// @route   GET /api/users/candidates
exports.getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'client' }).select('-password');
    res.json(candidates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

// @desc    Obține un utilizator după ID
// @route   GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    // Populăm datele de la simulări, ca să le putem afișa pe frontend
    const user = await User.findById(req.params.id).populate('simulationResults');

    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    // Returnăm utilizatorul, simulările și prezența
    res.json({
      user,
      simulationResults: user.simulationResults,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }
    res.status(500).send('Eroare de server.');
  }
};

// @desc    Actualizează detaliile unui utilizator
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
  const { name, phoneNumber, subscriptionEndDate } = req.body;

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    // Prevenim modificarea de către un utilizator obișnuit a altor conturi
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ msg: 'Acces neautorizat.' });
    }

    // Actualizăm doar câmpurile care au fost trimise
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (subscriptionEndDate) user.subscriptionEndDate = new Date(subscriptionEndDate);

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

// @desc    Șterge un utilizator
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    // Prevenim ștergerea propriului cont de către un admin
    if (req.user.id === req.params.id) {
      return res.status(400).json({ msg: 'Nu poți șterge propriul cont.' });
    }

    await user.remove();
    res.json({ msg: 'Utilizatorul a fost șters cu succes.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

// @desc    Adaugă o înregistrare de prezență
// @route   POST /api/users/:id/attendance
exports.addAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ msg: 'Data prezenței este obligatorie.' });
    }

    const newAttendanceEntry = { date: new Date(date).toISOString(), present: true };
    user.attendance.push(newAttendanceEntry);

    await user.save();
    res.status(200).json({ msg: 'Prezență adăugată cu succes!', attendance: user.attendance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};


module.exports = {
  getAllUsers,
  getLoggedInUser,
  getCandidates,
  getUserById,
  updateUser,
  deleteUser,
  addAttendance
};