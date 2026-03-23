require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { checkAndSendReminders } = require('./src/services/notificationScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/auth');
const eventsRoutes = require('./src/routes/events');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ATUnity API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Start notification scheduler - runs every 5 minutes
const REMINDER_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  checkAndSendReminders();
}, REMINDER_CHECK_INTERVAL);

// Run check on startup
checkAndSendReminders();

module.exports = app;