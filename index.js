const express = require('express');
const NodeCache = require('node-cache');
const yahooFinance = require('yahoo-finance2').default;


const app = express();
const PORT = 8001;
const cache = new NodeCache({ stdTTL: 60 });

app.use(express.json());

app.get('/api/stock/:ticker', async (req, res) => {
  const { ticker } = req.params;

  const cachedData = cache.get(ticker);
  if (cachedData) {
    return res.status(200).json({
      source: 'cache',
      data: cachedData
    });
  }

  try {
     const stock = await yahooFinance.quoteSummary(ticker, { modules: ['price'] });

     if (!stock || !stock.price || !stock.price.regularMarketPrice) {
       return res.status(404).json({ error: 'Stock not found or invalid ticker.' });
     }

     const result = {
       ticker: stock.price.symbol,
       name: stock.price.shortName,
       price: stock.price.regularMarketPrice,
       currency: stock.price.currency,
     };
 
     cache.set(ticker, result);
 
     res.status(200).json({ source: 'api', data: result });
   } catch (error) {
     console.error('Error fetching stock data:', error.message);
     res.status(500).json({ error: 'Failed to fetch stock data.' });
   }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
    } else {
      console.log(`Server running on http://localhost:${PORT}`);
    }
  });
