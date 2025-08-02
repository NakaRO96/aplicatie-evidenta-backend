const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client'], default: 'client' },
  subscriptionEndDate: { type: Date, default: null }, // Când expiră abonamentul
  attendance: [ // Array de obiecte pentru prezență
    {
      date: { type: Date, required: true },
      present: { type: Boolean, default: true } // Implicit e prezent
    }
  ],
  simulationResults: [ // NOU: Array de obiecte pentru rezultatele simulărilor
    {
      date: { type: Date, default: Date.now }, // Data la care a fost înregistrată simularea
      rawTime: { type: Number, required: true }, // Timpul brut în secunde
      penaltyTime: { type: Number, default: 0 }, // Total penalizări în secunde
      totalTime: { type: Number, required: true }, // Timpul total (brut + penalizări)
      penaltiesList: [{ type: String }], // Lista obstacolelor penalizate
      eliminatedObstacles: [{ type: String }], // NOU: Lista obstacolelor eliminate
      checkpointTimes: [{ type: Number }] // NOU: Timpii înregistrați la fiecare jalon
    }
  ]
}, { timestamps: true }); // Adaugă createdAt și updatedAt automat

module.exports = mongoose.model('User', userSchema);