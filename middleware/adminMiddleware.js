module.exports = function (req, res, next) {
  // Asigură-te că req.user există și are rolul 'admin'
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acces interzis. Doar pentru administratori.' });
  }
  next();
};