const User = require('../models/User');
const SimulationResult = require('../models/SimulationResult');
const bcrypt = require('bcryptjs');

// NOU: Funcția pentru a obține utilizatorii cu paginare și filtre
// Aceasta înlocuiește vechea funcție getAllUsers
exports.getUsersWithPagination = async (req, res) => {
    // Extrage parametrii de paginare și filtrare din query
    const { page = 1, limit = 10, filter = 'all' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    // Adaugă logica de filtrare existentă
    if (filter === 'active') {
      const now = new Date();
      query.subscriptionEndDate = { $gte: now };
    } else if (filter === 'expired') {
      const now = new Date();
      query.subscriptionEndDate = { $lt: now };
    }
    
    try {
        const users = await User.find(query)
            .sort({ subscriptionEndDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password'); // Nu include parola în rezultat
        
        const totalUsers = await User.countDocuments(query);
        
        res.json({
            users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: parseInt(page),
            totalUsers
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Eroare server');
    }
};

// Obține detalii despre un utilizator specific
exports.getUserDetails = async (req, res) => {
  try {
    // req.user.id este ID-ul utilizatorului autentificat din token
    // req.params.id este ID-ul utilizatorului cerut în URL
    
    // Un administrator poate vedea detaliile oricărui utilizator.
    // Un client poate vedea doar detaliile propriului cont.
    if (req.user.role === 'client' && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Acces interzis. Nu aveți permisiunea de a vedea detaliile altui utilizator.' });
    }

    const user = await User.findById(req.params.id).select('-password'); // Exclude parola
    if (!user) {
      return res.status(404).json({ msg: 'Utilizator negăsit' });
    }
    const simulationResults = await SimulationResult.find({ userId: req.params.id }).sort({ date: -1 });

    res.json({ user, simulationResults });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Editează detalii utilizator (doar admin)
exports.updateUser = async (req, res) => {
  const { name, phoneNumber, subscriptionEndDate, attendance, role, password } = req.body;
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utilizator negăsit' });
    }

    if (name !== undefined) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (subscriptionEndDate !== undefined) user.subscriptionEndDate = subscriptionEndDate;
    if (role !== undefined) user.role = role;

    if (attendance && Array.isArray(attendance)) {
        user.attendance = attendance;
    }

    await user.save();
    res.json({ msg: 'Utilizator actualizat', user: user.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; return ret; } }) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Șterge utilizator (doar admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utilizator negăsit' });
    }

    await user.deleteOne();
    await SimulationResult.deleteMany({ userId: req.params.id });
    res.json({ msg: 'Utilizator șters cu succes și rezultatele asociate' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

// Creează un utilizator nou (doar admin)
exports.createUser = async (req, res) => {
    const { name, phoneNumber, password, role } = req.body;
    try {
        let user = await User.findOne({ phoneNumber });
        if (user) {
            return res.status(400).json({ msg: 'Un utilizator cu acest număr de telefon există deja.' });
        }

        user = new User({
            name,
            phoneNumber,
            password,
            role: role || 'client', // Rolul implicit este 'client'
            subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Abonament valabil 1 an implicit
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ msg: 'Utilizator creat cu succes!', user: user.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; return ret; } }) });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Eroare server');
    }
};