import React from 'react';
import { render } from '@testing-library/react-native';
import EventDetailsScreen from '../../src/screens/EventDetailsScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('fake-token'),
}));

global.fetch = jest.fn((url) => {
  if (url.includes('/attendees')) {
    return Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          attendees: [],
        }),
    });
  }

  return Promise.resolve({
    json: () =>
      Promise.resolve({
        success: true,
        event: {
          title: 'Tech Meetup',
          organizer: 'ATUnity',
          date: '2026-03-25',
          time: '18:00',
          location: 'Galway',
          description: 'A networking event for students',
          attendee_count: 3,
        },
      }),
  });
});

describe('EventDetailsScreen', () => {
  const route = {
    params: {
      eventId: 1,
    },
  };

  const navigation = {
    navigate: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders event details after loading', async () => {
  const { findByText } = render(
    <EventDetailsScreen route={route} navigation={navigation} />
  );

  expect(await findByText(/Tech Meetup/, {}, { timeout: 10000 })).toBeTruthy();
  expect(await findByText(/Organised by/, {}, { timeout: 10000 })).toBeTruthy();
  expect(await findByText(/ATUnity/, {}, { timeout: 10000 })).toBeTruthy();
  expect(await findByText(/A networking event for students/, {}, { timeout: 10000 })).toBeTruthy();
  expect(await findByText(/I'm Going/, {}, { timeout: 10000 })).toBeTruthy();
}, 15000); // <-- jest test timeout
});