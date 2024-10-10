import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import { schedule } from 'node-cron';
import fetchCryptoData from './jobs/cryptoJob.js';
import Crypto from './models/cryptoModel.js';

dotenv.config();
connectDB();

const app = express();

schedule('* * * * *', () => {
  console.log('Running scheduled job: Fetching crypto data...');
  fetchCryptoData();
});

app.get('/stats', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Please provide a coin name in the query parameter.' });
  }

  const sanitizedCoin = coin.trim().toLowerCase(); 
  console.log(`Query received for coin: ${sanitizedCoin}`);

  try {
    const latestData = await Crypto.findOne({ coinId: sanitizedCoin }).sort({ timestamp: -1 });

    if (!latestData) {
      console.log(`No data found for coinId: ${sanitizedCoin}`);
      return res.status(404).json({ error: `No data found for the coin: ${sanitizedCoin}` });
    }

    console.log(`Found data for ${sanitizedCoin}:`, latestData);

    res.json({
      price: latestData.price,
      marketCap: latestData.marketCap,
      '24hChange': latestData.change24h,
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Server error while fetching crypto stats');
  }
});

app.get('/deviation', async (req, res) => {
    const { coin } = req.query;
  
    if (!coin) {
      return res.status(400).json({ error: 'Please provide a coin name in the query parameter.' });
    }
  
    const sanitizedCoin = coin.trim().toLowerCase();
    console.log(`Query received for deviation calculation for coin: ${sanitizedCoin}`);
  
    try {
      const records = await Crypto.find({ coinId: sanitizedCoin }).sort({ timestamp: -1 }).limit(100);
  
      if (records.length === 0) {
        console.log(`No data found for coinId: ${sanitizedCoin}`);
        return res.status(404).json({ error: `No data found for the coin: ${sanitizedCoin}` });
      }

      const prices = records.map(record => record.price);
      console.log(`Prices for ${sanitizedCoin}:`, prices);

      const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;

      const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;

      const standardDeviation = Math.sqrt(variance);

      res.json({ deviation: parseFloat(standardDeviation.toFixed(2)) });
    } catch (error) {
      console.error('Error calculating standard deviation:', error.message);
      res.status(500).send('Server error while calculating standard deviation');
    }
  });
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

