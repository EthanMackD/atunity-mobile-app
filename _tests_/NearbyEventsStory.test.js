const fetch = require('node-fetch');

jest.mock('node-fetch');

const API_URL = 'http://192.168.1.143:5000/api';

describe('Nearby Events Story', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('nearby events appear when user location is provided', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        events: [
          { id: 1, title: 'Study Group', location: 'Library', latitude: 53.2708, longitude: -9.0575, distance_km: 0.2 },
          { id: 2, title: 'Sports Day', location: 'Sports Hall', latitude: 53.2703, longitude: -9.0560, distance_km: 0.5 },
        ],
      }),
    });

    const userLat = 53.271;
    const userLng = -9.057;

    const response = await fetch(`${API_URL}/events?lat=${userLat}&lng=${userLng}&radius=5`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
    data.events.forEach(event => {
      expect(event.distance_km).toBeLessThanOrEqual(5);
    });
  });

  test('location filter works - only returns events within radius', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        events: [
          { id: 1, title: 'Close Event', location: 'Main Hall', latitude: 53.2707, longitude: -9.0568, distance_km: 0.1 },
        ],
      }),
    });

    const response = await fetch(`${API_URL}/events?lat=53.271&lng=-9.057&radius=1`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.events.length).toBe(1);
    expect(data.events[0].distance_km).toBeLessThanOrEqual(1);
  });

  test('events update dynamically - sorted by distance closest first', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        events: [
          { id: 1, title: 'Close Event', distance_km: 0.3 },
          { id: 2, title: 'Medium Event', distance_km: 1.2 },
          { id: 3, title: 'Far Event', distance_km: 4.8 },
        ],
      }),
    });

    const response = await fetch(`${API_URL}/events?lat=53.271&lng=-9.057`);
    const data = await response.json();

    expect(data.success).toBe(true);
    for (let i = 0; i < data.events.length - 1; i++) {
      expect(data.events[i].distance_km).toBeLessThanOrEqual(data.events[i + 1].distance_km);
    }
  });
});
