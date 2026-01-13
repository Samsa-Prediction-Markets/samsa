async function getPrice(market) {
  return { price: null, implied_probability: null, source: 'none' };
}

async function getSeries(market, resolution) {
  return { points: [], resolution };
}

module.exports = {
  getPrice,
  getSeries
};

