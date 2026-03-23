import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();
// If you need to target a fixed IP (e.g. for local device testing), uncomment below:
// const API_URL = 'http://192.168.1.143:5000/api';

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
};
