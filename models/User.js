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
  // Array-ul 'simulationResults' a fost ELIMINAT conform discuției anterioare,
  // deoarece simulările sunt gestionate printr-o colecție separată ('SimulationResult').
}, { timestamps: true });

// ACEASTA ESTE SECȚIUNEA CRUCIALĂ: Hook-ul pre('save')
// El va cripta parola DOAR dacă aceasta a fost modificată (ex: la crearea user-ului
// sau la schimbarea parolei manuală)
userSchema.pre('save', async function(next) {
  // Verifică dacă parola a fost modificată sau dacă este un document nou
  if (!this.isModified('password')) {
    return next(); // Dacă parola nu s-a schimbat, mergi mai departe fără să o recriptezi
  }

  // Criptează parola
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
