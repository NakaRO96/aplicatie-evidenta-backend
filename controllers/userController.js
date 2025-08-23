const User = require('../models/User');

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