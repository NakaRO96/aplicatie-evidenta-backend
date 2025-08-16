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

// ACEASTA ESTE SECȚIUNEA CRUCIALĂ ȘI VITALĂ PENTRU FUNCȚIONALITATE: Hook-ul pre('save')
// Această funcție se execută ÎNAINTE ca un document User să fie salvat în baza de date.
userSchema.pre('save', async function(next) {
  // Verifică DOAR dacă câmpul 'password' a fost modificat
  // (adică, dacă este o parolă nouă la crearea utilizatorului SAU dacă parola existentă a fost schimbată).
  // Dacă parola nu s-a schimbat, NU O RECIPTEAZĂ, ci trece mai departe.
  if (!this.isModified('password')) {
    return next(); // Nu face nimic, continuă la salvare
  }

  // Dacă parola a fost modificată, generează un salt și criptează parola
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Continuă procesul de salvare
});

module.exports = mongoose.model('User', userSchema);
