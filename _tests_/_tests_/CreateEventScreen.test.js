import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateEventScreen from '../../src/screens/CreateEventScreen';

jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '127.0.0.1:8081',
  },
  manifest: {
    debuggerHost: '127.0.0.1:8081',
  },
}));

global.fetch = jest.fn();

describe('CreateEventScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    fetch.mockClear();
    navigation.navigate.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields and publish button', () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateEventScreen navigation={navigation} />
    );

    expect(getByPlaceholderText('Event title')).toBeTruthy();
    expect(getByPlaceholderText('Date (YYYY-MM-DD)')).toBeTruthy();
    expect(getByPlaceholderText('Time (e.g. 18:00)')).toBeTruthy();
    expect(getByPlaceholderText('Location')).toBeTruthy();
    expect(getByPlaceholderText('Description')).toBeTruthy();
    expect(getByText('Select Category')).toBeTruthy();
    expect(getByText('Publish Event')).toBeTruthy();
  });

  it('shows error if required fields are empty', () => {
    const { getByText } = render(
      <CreateEventScreen navigation={navigation} />
    );

    fireEvent.press(getByText('Publish Event'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('publishes event successfully', async () => {
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          message: 'Event created successfully',
          event: {
            id: 1,
            title: 'Football Match',
            description: 'Students football event',
            date: '2026-03-26',
            time: '18:00',
            location: 'ATU Pitch',
            category: 'sports',
          },
        }),
    });

    const { getByPlaceholderText, getByText } = render(
      <CreateEventScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Event title'), 'Football Match');
    fireEvent.changeText(getByPlaceholderText('Date (YYYY-MM-DD)'), '2026-03-26');
    fireEvent.changeText(getByPlaceholderText('Time (e.g. 18:00)'), '18:00');
    fireEvent.changeText(getByPlaceholderText('Location'), 'ATU Pitch');
    fireEvent.changeText(getByPlaceholderText('Description'), 'Students football event');

    fireEvent.press(getByText('Sports'));
    fireEvent.press(getByText('Publish Event'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Football Match',
          description: 'Students football event',
          date: '2026-03-26',
          time: '18:00',
          location: 'ATU Pitch',
          category: 'sports',
        }),
      })
    );

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event published successfully');
      expect(navigation.navigate).toHaveBeenCalledWith('EventsList');
    });
  });
});