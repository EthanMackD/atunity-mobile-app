import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://192.168.1.143:5000/api';
  }

  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  return 'http://192.168.1.143:5000/api';
};

const API_URL = getApiUrl();

export const api = {
  async register(email, password, name, course, year, role) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, course, year, role }),
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
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

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
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async getReminderStatus(eventId, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async toggleReminder(eventId, reminderEnabled, reminderMinutesBefore = 60, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reminderEnabled, reminderMinutesBefore }),
    });
    return response.json();
  },

  async disableReminder(eventId, token) {
    const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};