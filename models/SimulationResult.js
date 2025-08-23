const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  user: { // Am schimbat `userId` în `user`
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rawTime: {
    type: Number,
    required: true,
  },
  penaltyTime: {
    type: Number,
    required: true,
  },
  totalTime: {
    type: Number,
    required: true,
  },
  penaltiesList: [{
    type: String
  }],
  javelinTime: { // Confirmat că este corect
    type: Number,
    default: null,
  },
  eliminatedObstaclesList: [{ // Confirmat că este corect
    type: String
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('SimulationResult', simulationResultSchema);