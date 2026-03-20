import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Web browser: localhost works fine
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  // Mobile: try to auto-detect the computer's IP from Expo
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    console.log('Auto-detected API URL:', `http://${ip}:3000/api`);
    return `http://${ip}:3000/api`;
  }

  // Fallback
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

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
};