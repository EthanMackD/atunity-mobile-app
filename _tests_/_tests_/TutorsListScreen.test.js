import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import TutorsListScreen from '../../src/screens/TutorsListScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
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

describe('TutorsListScreen', () => {
  const navigation = {
    navigate: jest.fn(),
    setOptions: jest.fn(),
  };

  beforeEach(() => {
    fetch.mockClear();
    navigation.navigate.mockClear();
    navigation.setOptions.mockClear();
    AsyncStorage.getItem.mockClear();
    useFocusEffect.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders tutors from API', async () => {
    AsyncStorage.getItem.mockResolvedValue('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          tutors: [
            {
              id: 1,
              name: 'Sarah Kelly',
              course: 'Software Development',
              subjects: 'Java, SQL',
            },
          ],
        }),
    });

    const { findByText } = render(
      <TutorsListScreen navigation={navigation} />
    );

    expect(await findByText('Sarah Kelly')).toBeTruthy();
    expect(await findByText('Software Development')).toBeTruthy();
    expect(await findByText('Java, SQL')).toBeTruthy();
  });

  it('navigates to tutor details when tutor is pressed', async () => {
    AsyncStorage.getItem.mockResolvedValue('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          tutors: [
            {
              id: 1,
              name: 'Sarah Kelly',
              course: 'Software Development',
              subjects: 'Java, SQL',
            },
          ],
        }),
    });

    const { findByText } = render(
      <TutorsListScreen navigation={navigation} />
    );

    const tutorName = await findByText('Sarah Kelly');
    fireEvent.press(tutorName);

    expect(navigation.navigate).toHaveBeenCalledWith('TutorDetails', { tutorId: 1 });
  });
});