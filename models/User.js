const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Asigură-te că bcrypt este importat și aici

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client'], default: 'client' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  subscriptionEndDate: { type: Date, default: null },
  attendance: [
    {
      date: { type: Date, required: true },
      present: { type: Boolean, default: true }
    }
  ],
}, { timestamps: true });

// Hook-ul pre('save') care criptează parola DOAR dacă a fost modificată
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// === MODIFICARE CRUCIALĂ ȘI DEFINITIVĂ PENTRU A PREVENI OverwriteModelError ===
// Aceasta verifică dacă modelul 'User' a fost deja definit.
// Dacă `mongoose.models.User` există (adică modelul e deja înregistrat), îl refolosește.
// Altfel, îl definește. Acest lucru previne eroarea de a defini același model de două ori.
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
