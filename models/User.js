const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client'], default: 'client' },
  // Câmpuri pentru resetarea parolei - Acestea sunt deja incluse din cerința ta anterioară
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  subscriptionEndDate: { type: Date, default: null },
  attendance: [
    {
      date: { type: Date, required: true },
      present: { type: Boolean, default: true }
    }
  ],
  // Array-ul 'simulationResults' a fost ELIMINAT, deoarece simulările sunt gestionate
  // printr-o colecție separată ('SimulationResult') și un model dedicat.
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
