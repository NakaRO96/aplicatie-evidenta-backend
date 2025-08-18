// routes/attendance.js

const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance'); 

router.post('/add', async (req, res) => {
    const { userId, date } = req.body; 

    try {
        const existingAttendance = await Attendance.findOne({
            user: userId,
            date: date
        });

        if (existingAttendance) {
            return res.status(409).json({ msg: 'Prezența pentru această zi a fost deja înregistrată.' });
        }

        const newAttendance = new Attendance({
            user: userId,
            date: date
        });

        await newAttendance.save();
        res.status(201).json({ msg: 'Prezență înregistrată cu succes!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Eroare de server.');
    }
});

module.exports = router;