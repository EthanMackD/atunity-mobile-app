import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChangePasswordScreen from '../../src/screens/ChangePasswordScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
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

describe('Change Password Story', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    fetch.mockReset();
    AsyncStorage.getItem.mockReset();
    navigation.goBack.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows user to change password successfully', async () => {
    AsyncStorage.getItem.mockResolvedValue('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          message: 'Password changed successfully',
        }),
    });

    const { getByPlaceholderText, getAllByText } = render(
      <ChangePasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Old Password'), 'oldpass123');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass123');
    fireEvent.changeText(getByPlaceholderText('Confirm New Password'), 'newpass123');

    fireEvent.press(getAllByText('Change Password')[1]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/change-password'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        }),
        body: JSON.stringify({
          oldPassword: 'oldpass123',
          newPassword: 'newpass123',
        }),
      })
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Password changed successfully',
      expect.any(Array)
    );
  });

  it('requires old password', () => {
    const { getByPlaceholderText, getAllByText } = render(
      <ChangePasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Old Password'), '');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass123');
    fireEvent.changeText(getByPlaceholderText('Confirm New Password'), 'newpass123');

    fireEvent.press(getAllByText('Change Password')[1]);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows confirmation message after password change', async () => {
    AsyncStorage.getItem.mockResolvedValue('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          message: 'Password changed successfully',
        }),
    });

    const { getByPlaceholderText, getAllByText } = render(
      <ChangePasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Old Password'), 'oldpass123');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass123');
    fireEvent.changeText(getByPlaceholderText('Confirm New Password'), 'newpass123');

    fireEvent.press(getAllByText('Change Password')[1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Password changed successfully',
        expect.any(Array)
      );
    });
  });
});