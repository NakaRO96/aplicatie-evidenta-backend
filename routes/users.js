const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// === LINIA ESENȚIALĂ: Asigură că modelul este definit o singură dată și exportat corect ===
// Aceasta verifică dacă modelul 'User' a fost deja definit. Dacă da, îl refolosește.
// Altfel, îl definește. Acest lucru previne eroarea de a defini același model de două ori
// și asigură că 'User' este întotdeauna un obiect Mongoose valid.
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
