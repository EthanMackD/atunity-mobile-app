import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditProfileScreen from '../../src/screens/editProfileScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '127.0.0.1:8081',
  },
  manifest: {
    debuggerHost: '127.0.0.1:8081',
  },
}));

global.fetch = jest.fn();

describe('Edit Profile Story', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    fetch.mockReset();
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    navigation.goBack.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saves updated profile successfully', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce(JSON.stringify({
        name: 'Old Name',
        course: 'Old Course',
        year: 1
      }))
      .mockResolvedValueOnce('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            id: 1,
            email: 'test@atu.ie',
            name: 'New Name',
            course: 'Software Development',
            year: 3,
            role: 'student',
            created_at: '2026-04-01T10:00:00.000Z'
          }
        }),
    });

    const { findByPlaceholderText, getByText } = render(
      <EditProfileScreen navigation={navigation} />
    );

    const nameInput = await findByPlaceholderText('Name');
    const courseInput = await findByPlaceholderText('Course');
    const yearInput = await findByPlaceholderText('Year');

    fireEvent.changeText(nameInput, 'New Name');
    fireEvent.changeText(courseInput, 'Software Development');
    fireEvent.changeText(yearInput, '3');

    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/profile'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        }),
        body: JSON.stringify({
          name: 'New Name',
          course: 'Software Development',
          year: 3,
        }),
      })
    );

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({
        id: 1,
        email: 'test@atu.ie',
        name: 'New Name',
        course: 'Software Development',
        year: 3,
        role: 'student',
        created_at: '2026-04-01T10:00:00.000Z'
      })
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Profile updated successfully',
      expect.any(Array)
    );
  });

  it('shows updated profile values in inputs without data loss', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
      name: 'Qahraman',
      course: 'Software Development',
      year: 3
    }));

    const { findByDisplayValue } = render(
      <EditProfileScreen navigation={navigation} />
    );

    expect(await findByDisplayValue('Qahraman')).toBeTruthy();
    expect(await findByDisplayValue('Software Development')).toBeTruthy();
    expect(await findByDisplayValue('3')).toBeTruthy();
  });

  it('requires name before saving', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce(JSON.stringify({
        name: 'Old Name',
        course: 'Old Course',
        year: 1
      }));

    const { findByPlaceholderText, getByText } = render(
      <EditProfileScreen navigation={navigation} />
    );

    const nameInput = await findByPlaceholderText('Name');
    fireEvent.changeText(nameInput, '');

    fireEvent.press(getByText('Save Changes'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Name is required');
    expect(fetch).not.toHaveBeenCalled();
  });
});