// database.js

const predictionsData = require('./predictionsData');

// Mock database methods
const getAllPredictions = () => {
  return predictionsData.getAllPredictions();
};

module.exports = { getAllPredictions };
