const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSMS } = require('../utils/smsService'); // Importă serviciul SMS

exports.register = async (req, res) => {
  const { name, phoneNumber, password, role } = req.body;
  try {
    let user = await User.findOne({ phoneNumber });
    if (user) {
      return res.status(400).json({ msg: 'Numărul de telefon este deja înregistrat.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // Aici se hash-uiește parola primită din frontend

    user = new User({
      name,
      phoneNumber,
      password: hashedPassword,
      role: role || 'client' // Rolul implicit este 'client'
    });

    await user.save();

    // Dacă ai Twilio configurat, poți trimite parola (sau o parolă generată) prin SMS
    // Recomandare: Generează o parolă complexă aici și trimite-o, nu folosi parola din req.body direct.
    // Exemplu de generare parolă:
    // const generatedPassword = Math.random().toString(36).slice(-8); // Generează o parolă simplă de 8 caractere
    // const hashedGeneratedPassword = await bcrypt.hash(generatedPassword, salt);
    // user.password = hashedGeneratedPassword;
    // await user.save();
    // await sendSMS(phoneNumber, `Contul tau AplicatieEvidenta a fost creat. Parola: ${generatedPassword}`);


    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Tokenul expiră într-o oră
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ msg: 'Utilizator înregistrat cu succes', token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};

exports.login = async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ msg: 'Credențiale invalide' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credențiale invalide' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ msg: 'Autentificare reușită', token, role: user.role });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare server');
  }
};