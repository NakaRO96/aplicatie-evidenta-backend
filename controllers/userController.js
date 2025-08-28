const User = require('../models/User');
const SimulationResult = require('../models/SimulationResult');

// Definirea tuturor funcțiilor ca variabile constante
const getAllUsers = async (req, res) => {
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

const getLoggedInUser = async (req, res) => {
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

const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'client' }).select('-password');
    res.json(candidates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    const simulationResults = await SimulationResult.find({ user: req.params.id }).sort({ date: -1 });

    res.json({
      user,
      simulationResults,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }
    res.status(500).send('Eroare de server.');
  }
};

const updateUser = async (req, res) => {
  const { name, phoneNumber, subscriptionEndDate, attendance } = req.body;

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ msg: 'Acces neautorizat.' });
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (subscriptionEndDate) user.subscriptionEndDate = new Date(subscriptionEndDate);
    // Adaugăm posibilitatea de a actualiza lista de prezențe
    if (attendance) user.attendance = attendance;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

const deleteUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

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

const addAttendance = async (req, res) => {
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

const createUser = async (req, res) => {
  const { name, phoneNumber, password, subscriptionEndDate, role } = req.body;

  try {
    let user = await User.findOne({ phoneNumber });
    if (user) {
      return res.status(400).json({ msg: 'Numărul de telefon este deja înregistrat.' });
    }

    user = new User({
      name,
      phoneNumber,
      password,
      subscriptionEndDate,
      role: role || 'client'
    });

    await user.save();

    res.status(201).json({ msg: 'Contul a fost creat cu succes!' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server.');
  }
};

// Exportăm toate funcțiile ca un singur obiect
module.exports = {
  getAllUsers,
  getLoggedInUser,
  getCandidates,
  getUserById,
  updateUser,
  deleteUser,
  addAttendance,
  createUser
};