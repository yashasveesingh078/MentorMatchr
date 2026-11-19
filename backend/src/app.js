// Sets up Express: middleware and routes.
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const facultyRoutes = require('./routes/facultyRoutes');

const app = express();

app.use(cors());          // allow the React app to call this API
app.use(express.json());  // read JSON request bodies into req.body

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/faculty', facultyRoutes);

// Any other URL
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;