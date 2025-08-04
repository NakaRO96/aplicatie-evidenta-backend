const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client'], default: 'client' },
  // NOU: Câmpuri pentru resetarea parolei
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  subscriptionEndDate: { type: Date, default: null },
  attendance: [
    {
      date: { type: Date, required: true },
      present: { type: Boolean, default: true }
    }
  ],
  simulationResults: [
    {
      date: { type: Date, default: Date.now },
      rawTime: { type: Number, required: true },
      penaltyTime: { type: Number, default: 0 },
      totalTime: { type: Number, required: true },
      penaltiesList: [{ type: String }],
      eliminatedObstacles: [{ type: String }],
      checkpointTimes: [{ type: Number }]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);