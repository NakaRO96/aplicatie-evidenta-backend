const User = require('../models/User');
const SimulationResult = require('../models/SimulationResult');
const bcrypt = require('bcryptjs');

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

exports.createUser = async (req, res) => {
    const { name, phoneNumber, password, role } = req.body;
    console.log('createUser: Încercare de creare utilizator. Număr:', phoneNumber); // Debugging
    try {
        let user = await User.findOne({ phoneNumber });
        if (user) {
            console.log('createUser: Număr de telefon existent.', phoneNumber); // Debugging
            return res.status(400).json({ msg: 'Un utilizator cu acest număr de telefon există deja.' });
        }

        user = new User({
            name,
            phoneNumber,
            password, // Parola este trimisă ca text simplu, va fi hashuită de hook-ul pre('save')
            role: role || 'client',
            subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });

        console.log('createUser: User creat în memorie. Încerc salvarea...'); // Debugging
        await user.save(); // Aici va rula hook-ul pre('save') și va hashui parola
        console.log('createUser: Utilizator salvat cu succes în DB.'); // Debugging

        res.status(201).json({ msg: 'Utilizator creat cu succes!', user: user.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; return ret; } }) });

    } catch (err) {
        // Logare detaliată pentru a vedea exact ce eroare apare
        console.error('Eroare la createUser (backend):', err.message);
        console.error('Detalii eroare (stack):', err.stack);
        res.status(500).send('Eroare server la crearea utilizatorului.');
    }
};

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

    user.password = newPassword; 
    await user.save(); 

    res.json({ msg: 'Parola a fost schimbată cu succes.' });
  } catch (err) {
    console.error('Eroare backend la schimbarea parolei:', err.message);
    console.error('Detalii eroare (stack):', err.stack);
    res.status(500).send('Eroare de server la schimbarea parolei. Te rugăm să încerci din nou.');
  }
};
