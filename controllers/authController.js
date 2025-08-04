const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // NOU: Adaugă crypto pentru a genera token-uri
const { sendSMS } = require('../utils/smsService');

exports.register = async (req, res) => {
  const { name, phoneNumber, password, role } = req.body;
  try {
    let user = await User.findOne({ phoneNumber });
    if (user) {
      return res.status(400).json({ msg: 'Numărul de telefon este deja înregistrat.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      phoneNumber,
      password: hashedPassword,
      role: role || 'client'
    });

    await user.save();

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

exports.forgotPassword = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(200).json({ message: 'Dacă numărul de telefon este înregistrat, vei primi un mesaj cu instrucțiuni.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpires = Date.now() + 3600000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendSMS(phoneNumber, `Link de resetare a parolei: ${resetURL}`);

    res.status(200).json({
      message: 'Un link de resetare a parolei a fost trimis la numărul de telefon asociat.',
    });
  } catch (error) {
    console.error('Eroare la forgot password:', error);
    res.status(500).json({ message: 'A apărut o eroare la procesarea cererii.' });
  }
};

// NOU: Funcția pentru a finaliza resetarea parolei
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token de resetare invalid sau expirat.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ message: 'Parola a fost resetată cu succes.' });
  } catch (error) {
    console.error('Eroare la reset password:', error);
    res.status(500).json({ message: 'A apărut o eroare la procesarea cererii.' });
  }
};