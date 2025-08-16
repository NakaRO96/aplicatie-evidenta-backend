const User = require('../models/User');
const SimulationResult = require('../models/SimulationResult');
const bcrypt = require('bcryptjs');

// NOU: Funcția pentru a obține utilizatorii cu paginare și filtre
exports.getUsersWithPagination = async (req, res) => {
    const { page = 1, limit = 10, filter = 'all' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

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
            .select('-password');
        
        const totalUsers = await User.countDocuments(query);
        
        res.json({
            users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: parseInt(page),
            totalUsers
        });
    } catch (err) {
        console.error('Eroare la getUsersWithPagination:', err.message);
        res.status(500).send('Eroare server la preluarea utilizatorilor.');
    }
};

// Obține detalii despre un utilizator specific
exports.getUserDetails = async (req, res) => {
  try {
    if (req.user.role === 'client' && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Acces interzis. Nu aveți permisiunea de a vedea detaliile altui utilizator.' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Utilizator negăsit' });
    }
    const simulationResults = await SimulationResult.find({ userId: req.params.id }).sort({ date: -1 });

    res.json({ user, simulationResults });
  } catch (err) {
    console.error('Eroare la getUserDetails:', err.message);
    res.status(500).send('Eroare server la preluarea detaliilor utilizatorului.');
  }
};

// Editează detalii utilizator (doar admin)
exports.updateUser = async (req, res) => {
  const { name, phoneNumber, subscriptionEndDate, attendance, role } = req.body;
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
    console.error('Eroare la updateUser:', err.message);
    res.status(500).send('Eroare server la actualizarea utilizatorului.');
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
    console.error('Eroare la deleteUser:', err.message);
    res.status(500).send('Eroare server la ștergerea utilizatorului.');
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

        // MODIFICAT: Nu mai hashui parola aici. Va fi hashuită de hook-ul pre('save') din model.
        user = new User({
            name,
            phoneNumber,
            password, // Trimitem parola ca text simplu
            role: role || 'client',
            subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });

        await user.save(); // Aici va rula hook-ul pre('save') și va hashui parola
        res.status(201).json({ msg: 'Utilizator creat cu succes!', user: user.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; return ret; } }) });

    } catch (err) {
        console.error('Eroare la createUser:', err.message);
        res.status(500).send('Eroare server la crearea utilizatorului.');
    }
};

// Funcția pentru schimbarea parolei - FĂRĂ HASHUIRE MANUALĂ AICI
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Parola curentă este incorectă.' });
    }

    // MODIFICAT: Atribuie parola nouă ca text simplu.
    // Hook-ul pre('save') din models/User.js o va hashui.
    user.password = newPassword; 

    // Salvează utilizatorul. Aici va fi executat hook-ul pre('save') din models/User.js
    await user.save(); 

    res.json({ msg: 'Parola a fost schimbată cu succes.' });
  } catch (err) {
    console.error('Eroare backend la schimbarea parolei:', err.message);
    console.error('Detalii eroare (stack):', err.stack);
    res.status(500).send('Eroare de server la schimbarea parolei. Te rugăm să încerci din nou.');
  }
};
