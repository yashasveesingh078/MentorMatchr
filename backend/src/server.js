// Starts the server. Run with: npm run dev
require('dotenv').config({ quiet: true }); // load values from .env

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 4000;

// Check the database connection first, then start listening
pool
  .query('SELECT 1')
  .then(() => {
    console.log('Connected to PostgreSQL');
    app.listen(PORT, () => {
      console.log('Server running on http://localhost:' + PORT);
    });
  })
  .catch((err) => {
    console.error('Could not connect to PostgreSQL:', err.message);
    process.exit(1);
  });