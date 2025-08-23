const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  present: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);