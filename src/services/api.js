const API_URL = 'http://localhost:3000/api';

export const api = {
  async register(email, password, name, course, year) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, course, year }),
    });
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async getMe(token) {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  // Event-related methods
  async getAllEvents() {
    const response = await fetch(`${API_URL}/events`);
    return response.json();
  },
  async getEventById(eventId) {
    const response = await fetch(`${API_URL}/events/${eventId}`);
    return response.json();
  },
  async attendEvent(eventId, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/attend`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  // Reminder-related methods
  async getReminderStatus(eventId, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  async toggleReminder(eventId, reminderEnabled, reminderMinutesBefore = 60, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reminderEnabled, reminderMinutesBefore }),
    });
    return response.json();
  },
  async disableReminder(eventId, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  async updateEvent(eventId, eventData, token) {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });
    return response.json();
  },
  async deleteEvent(eventId, token) {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  async updateProfile(preferredMeetingLocation, token) {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ preferred_meeting_location: preferredMeetingLocation }),
    });
    return response.json();
  },
};
