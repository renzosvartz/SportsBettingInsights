// Server-side (predictionService.js)

const { getTopPredictions } = require('./database');

const getExpertPicks = async () => {
  // Fetch top expert picks from the database
  const topPredictions = getTopPredictions();

  return topPredictions;
};

module.exports = { getExpertPicks };
