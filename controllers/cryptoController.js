import Crypto from '../models/cryptoModel.js';

export const getStats = async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Please provide a coin name in the query parameter.' });
  }

  const sanitizedCoin = coin.trim().toLowerCase();
  console.log(`Query received for /stats for coin: ${sanitizedCoin}`);

  try {
    const latestData = await Crypto.findOne({ coinId: sanitizedCoin }).sort({ timestamp: -1 });
    
    
    console.log(`Fetched data from DB for /stats:`, latestData);

    if (!latestData) {
      return res.status(404).json({ error: `No data found for the coin: ${sanitizedCoin}` });
    }

    res.json({
      price: latestData.price,
      marketCap: latestData.marketCap,
      '24hChange': latestData.change24h,
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Server error while fetching crypto stats');
  }
};


export const getDeviation = async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Please provide a coin name in the query parameter.' });
  }

  const sanitizedCoin = coin.trim().toLowerCase();
  console.log(`Query received for /deviation for coin: ${sanitizedCoin}`);

  try {
    const records = await Crypto.find({ coinId: sanitizedCoin }).sort({ timestamp: -1 }).limit(100);
    
    
    // console.log(`Fetched records from DB for /deviation:`, records);

    if (records.length === 0) {
      return res.status(404).json({ error: `No data found for the coin: ${sanitizedCoin}` });
    }

    const prices = records.map(record => record.price);
    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
    const standardDeviation = Math.sqrt(variance);

    res.json({ deviation: parseFloat(standardDeviation.toFixed(2)) });
  } catch (error) {
    console.error('Error calculating standard deviation:', error.message);
    res.status(500).send('Server error while calculating standard deviation');
  }
};
