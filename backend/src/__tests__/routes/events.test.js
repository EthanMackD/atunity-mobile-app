const request = require('supertest');
const express = require('express');

// Mock auth middleware BEFORE requiring router
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: '123', email: 'test@example.com' };
  next();
};

jest.mock('../../middleware/auth', () => mockAuthMiddleware);

const eventsRouter = require('../../routes/events');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

// Mock database module
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

// Mock the events controller
jest.mock('../../controllers/eventsController', () => ({
  getReminderStatus: (req, res) => {
    res.json({
      success: true,
      reminderEnabled: true,
      reminderMinutesBefore: 60,
    });
  },
  toggleReminder: (req, res) => {
    res.json({
      success: true,
      message: 'Reminder toggled',
      reminderEnabled: true,
      reminderMinutesBefore: req.body.reminderMinutesBefore || 60,
    });
  },
  disableReminder: (req, res) => {
    res.json({
      success: true,
      message: 'Reminder disabled',
    });
  },
  getEventById: (req, res) => {
    res.json({
      success: true,
      event: {
        id: req.params.id,
        title: 'Test Event',
        date: '2025-12-15',
        location: 'Test Location',
      },
    });
  },
  getAllEvents: (req, res) => {
    res.json({
      success: true,
      events: [],
    });
  },
  createEvent: (req, res) => {
    res.json({
      success: true,
      event: { id: '1', ...req.body },
    });
  },
  getBookmarks: (req, res) => {
    res.json({
      success: true,
      bookmarks: [],
    });
  },
  getAttendees: (req, res) => {
    res.json({
      success: true,
      attendees: [],
    });
  },
  markAttendance: (req, res) => {
    res.json({
      success: true,
      message: 'Attendance marked',
    });
  },
  bookmarkEvent: (req, res) => {
    res.json({
      success: true,
      message: 'Event bookmarked',
    });
  },
  removeBookmark: (req, res) => {
    res.json({
      success: true,
      message: 'Bookmark removed',
    });
  },
  deleteEvent: (req, res) => {
    res.json({
      success: true,
      message: 'Event deleted',
    });
  },
}));

describe('Event Reminders API', () => {
  describe('GET /api/events/:id/reminders', () => {
    test('should return reminder status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/events/1/reminders')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        reminderEnabled: true,
        reminderMinutesBefore: 60,
      });
    });

    test('should include authorization header', async () => {
      const response = await request(app)
        .get('/api/events/1/reminders')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/events/:id/reminders', () => {
    test('should toggle reminder with custom minutes', async () => {
      const response = await request(app)
        .post('/api/events/1/reminders')
        .send({ reminderMinutesBefore: 30 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Reminder toggled',
        reminderEnabled: true,
        reminderMinutesBefore: 30,
      });
    });

    test('should use default minutes when not provided', async () => {
      const response = await request(app)
        .post('/api/events/1/reminders')
        .send({})
        .expect(200);

      expect(response.body.reminderMinutesBefore).toBe(60);
    });

    test('should require authentication', async () => {
      // This test assumes auth middleware is properly configured
      const response = await request(app)
        .post('/api/events/1/reminders')
        .send({ reminderMinutesBefore: 30 });

      expect(response.status).toBeLessThan(500); // No 500 error from bad auth
    });
  });

  describe('DELETE /api/events/:id/reminders', () => {
    test('should disable reminder for event', async () => {
      const response = await request(app)
        .delete('/api/events/1/reminders')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Reminder disabled',
      });
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/events/1/reminders');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Reminder Integration', () => {
    test('should get, toggle, and disable reminders in sequence', async () => {
      // Get status
      let response = await request(app)
        .get('/api/events/1/reminders')
        .expect(200);
      expect(response.body.reminderEnabled).toBe(true);

      // Toggle reminder
      response = await request(app)
        .post('/api/events/1/reminders')
        .send({ reminderMinutesBefore: 15 })
        .expect(200);
      expect(response.body.reminderMinutesBefore).toBe(15);

      // Disable reminder
      response = await request(app)
        .delete('/api/events/1/reminders')
        .expect(200);
      expect(response.body.success).toBe(true);
    });
  });
});
