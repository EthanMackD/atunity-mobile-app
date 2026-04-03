import React from 'react';
import { render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorDetailsScreen from '../../src/screens/TutorDetailsScreen';

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

describe('TutorDetailsScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  };

  const route = {
    params: {
      tutorId: 1,
    },
  };

  beforeEach(() => {
    fetch.mockClear();
    AsyncStorage.getItem.mockClear();
    navigation.navigate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders tutor details for students', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('fake-token')
      .mockResolvedValueOnce(JSON.stringify({
        id: 2,
        role: 'student',
      }));

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          tutor: {
            id: 1,
            name: 'Sarah Kelly',
            course: 'Software Development',
            subjects: 'Java, SQL',
            availability: 'Mon-Wed',
            experience: '1 year',
            description: 'Helpful tutor',
          },
        }),
    });

    const { findByText, queryByText } = render(
      <TutorDetailsScreen route={route} navigation={navigation} />
    );

    expect(await findByText('Sarah Kelly')).toBeTruthy();
    expect(await findByText('Java, SQL')).toBeTruthy();
    expect(await findByText('Mon-Wed')).toBeTruthy();
    expect(await findByText('1 year')).toBeTruthy();
    expect(await findByText('Helpful tutor')).toBeTruthy();

    expect(queryByText('Edit Tutor Profile')).toBeNull();
  });

  it('shows edit button when tutor views own profile', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('fake-token')
      .mockResolvedValueOnce(JSON.stringify({
        id: 1,
        role: 'tutor',
      }));

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          tutor: {
            id: 1,
            name: 'Sarah Kelly',
            course: 'Software Development',
            subjects: 'Java, SQL',
            availability: 'Mon-Wed',
            experience: '1 year',
            description: 'Helpful tutor',
          },
        }),
    });

    const { findByText } = render(
      <TutorDetailsScreen route={route} navigation={navigation} />
    );

    expect(await findByText('Edit Tutor Profile')).toBeTruthy();
  });
});