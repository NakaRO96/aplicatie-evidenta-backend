const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rawTime: { type: Number, required: true },
  penaltyTime: { type: Number, required: true },
  totalTime: { type: Number, required: true },
  penaltiesList: [{ type: String }],
  javelinTime: { type: Number, default: null }, // ACEST CÂMP EXISTĂ DEJA ȘI ESTE CORECT
  eliminatedObstaclesList: [{ type: String }], // Asigură-te că folosești acest nume, conform discuției anterioare
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SimulationResult', simulationResultSchema);