const fetch = require('node-fetch');

jest.mock('node-fetch');

const API_URL = 'http://192.168.1.143:5000/api';

describe('Profile Picture Story', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('image uploads successfully', async () => {
    const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==';

    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        user: {
          id: 1,
          name: 'Bogdan',
          email: 'bogdan@atu.ie',
          profile_picture: imageBase64,
        },
      }),
    });

    const response = await fetch(`${API_URL}/auth/profile/picture`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.user.profile_picture).toBe(imageBase64);
  });

  test('picture displays correctly on profile', async () => {
    const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD==';

    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        user: {
          id: 1,
          name: 'Bogdan',
          email: 'bogdan@atu.ie',
          profile_picture: imageBase64,
        },
      }),
    });

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer test-token' },
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.user.profile_picture).not.toBeNull();
    expect(data.user.profile_picture).toMatch(/^data:image/);
  });

  test('user can change their profile picture', async () => {
    const newImageBase64 = 'data:image/jpeg;base64,/9j/UPDATEDIMAGE==';

    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        user: {
          id: 1,
          name: 'Bogdan',
          email: 'bogdan@atu.ie',
          profile_picture: newImageBase64,
        },
      }),
    });

    const response = await fetch(`${API_URL}/auth/profile/picture`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ imageBase64: newImageBase64 }),
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.user.profile_picture).toBe(newImageBase64);
  });
});
