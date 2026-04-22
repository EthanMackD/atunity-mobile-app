import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorProfileScreen from '../../src/screens/TutorProfileScreen';

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

describe('TutorProfileScreen', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    fetch.mockClear();
    navigation.goBack.mockClear();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads tutor profile data and renders fields', async () => {
    AsyncStorage.getItem.mockResolvedValue('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            subjects: 'Java, SQL',
            availability: 'Mon-Wed 4pm to 7pm',
            experience: 'Peer tutor for 1 year',
            description: 'Friendly tutor',
          },
        }),
    });

    const { findByDisplayValue } = render(
      <TutorProfileScreen navigation={navigation} />
    );

    expect(await findByDisplayValue('Java, SQL')).toBeTruthy();
    expect(await findByDisplayValue('Mon-Wed 4pm to 7pm')).toBeTruthy();
    expect(await findByDisplayValue('Peer tutor for 1 year')).toBeTruthy();
    expect(await findByDisplayValue('Friendly tutor')).toBeTruthy();
  });

  it('shows validation error if fields are empty', async () => {
    AsyncStorage.getItem.mockResolvedValue('fake-token');

    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            subjects: '',
            availability: '',
            experience: '',
            description: '',
          },
        }),
    });

    const { findByText } = render(
      <TutorProfileScreen navigation={navigation} />
    );

    const button = await findByText('Save Tutor Profile');
    fireEvent.press(button);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
  });

  it('saves tutor profile successfully', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('fake-token')
      .mockResolvedValueOnce('fake-token')
      .mockResolvedValueOnce(JSON.stringify({
        id: 1,
        name: 'Sarah',
        role: 'tutor',
      }));

    fetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              subjects: '',
              availability: '',
              experience: '',
              description: '',
            },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              id: 1,
              name: 'Sarah',
              role: 'tutor',
              subjects: 'Java, SQL',
              availability: 'Mon-Wed',
              experience: '1 year',
              description: 'Helpful tutor',
            },
          }),
      });

    const { findByPlaceholderText, findByText } = render(
      <TutorProfileScreen navigation={navigation} />
    );

    const subjectsInput = await findByPlaceholderText('Subjects (e.g. Java, SQL, Databases)');
    const availabilityInput = await findByPlaceholderText('Availability (e.g. Mon-Wed 4pm to 7pm)');
    const experienceInput = await findByPlaceholderText('Experience');
    const descriptionInput = await findByPlaceholderText('Description');
    const button = await findByText('Save Tutor Profile');

    fireEvent.changeText(subjectsInput, 'Java, SQL');
    fireEvent.changeText(availabilityInput, 'Mon-Wed');
    fireEvent.changeText(experienceInput, '1 year');
    fireEvent.changeText(descriptionInput, 'Helpful tutor');

    fireEvent.press(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/users/tutor-profile'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        }),
        body: JSON.stringify({
          subjects: 'Java, SQL',
          availability: 'Mon-Wed',
          experience: '1 year',
          description: 'Helpful tutor',
        }),
      })
    );
  });
});