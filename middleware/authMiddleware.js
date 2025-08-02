const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Ia token-ul din header
  const token = req.header('x-auth-token');

  // Verifică dacă există token
  if (!token) {
    return res.status(401).json({ msg: 'Nu există token, autorizare refuzată' });
  }

  // Verifică token-ul
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Adaugă user-ul decodificat (cu id și rol) la obiectul request
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Tokenul nu este valid' });
  }
};