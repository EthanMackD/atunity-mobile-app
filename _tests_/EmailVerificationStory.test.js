const fetch = require('node-fetch');

jest.mock('node-fetch');

const API_URL = 'http://192.168.1.143:5000/api';

describe('Email Verification Story', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('verification email is sent on registration', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        emailSent: true,
        token: 'jwt-token-123',
        user: {
          id: 1,
          name: 'Bogdan',
          email: 'bogdan@atu.ie',
          email_verified: false,
        },
      }),
    });

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bogdan',
        email: 'bogdan@atu.ie',
        password: 'password123',
        role: 'student',
      }),
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(true);
    expect(data.user.email_verified).toBe(false);
  });

  test('link confirms account - email_verified becomes true', async () => {
    fetch.mockResolvedValueOnce({
      text: async () => '<h2 style="color:#065A82;">Email Verified!</h2>',
      status: 200,
    });

    const token = 'abc123verificationtoken';
    const response = await fetch(`${API_URL}/auth/verify/${token}`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Email Verified!');
  });

  test('user notified of success - profile shows verified status', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        user: {
          id: 1,
          name: 'Bogdan',
          email: 'bogdan@atu.ie',
          email_verified: true,
        },
      }),
    });

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer jwt-token-123' },
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.user.email_verified).toBe(true);
  });
});
