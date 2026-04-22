import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorProfileScreen from '../../src/screens/TutorProfileScreen';
import TutorDetailsScreen from '../../src/screens/TutorDetailsScreen';

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

describe('Tutor Pricing Story', () => {
  beforeEach(() => {
    fetch.mockReset();
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows tutor to enter and save a price successfully', async () => {
    const navigation = {
      goBack: jest.fn(),
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce('fake-token') // loadTutorProfile token
      .mockResolvedValueOnce('fake-token') // handleSave token
      .mockResolvedValueOnce(JSON.stringify({
        id: 1,
        name: 'Sarah Kelly',
        role: 'tutor',
      })); // stored user after save

    fetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              subjects: 'Java, SQL',
              availability: 'Mon-Wed',
              experience: '1 year',
              description: 'Helpful tutor',
              price: '',
            },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              id: 1,
              name: 'Sarah Kelly',
              role: 'tutor',
              subjects: 'Java, SQL',
              availability: 'Mon-Wed',
              experience: '1 year',
              description: 'Helpful tutor',
              price: 25,
            },
          }),
      });

    const { findByPlaceholderText, findByText } = render(
      <TutorProfileScreen navigation={navigation} />
    );

    const priceInput = await findByPlaceholderText('Price per session (€)');
    const saveButton = await findByText('Save Tutor Profile');

    fireEvent.changeText(priceInput, '25');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/users/tutor-profile'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          subjects: 'Java, SQL',
          availability: 'Mon-Wed',
          experience: '1 year',
          description: 'Helpful tutor',
          price: 25,
        }),
      })
    );
  });

  it('displays price on tutor profile for students', async () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const route = {
      params: {
        tutorId: 1,
      },
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce('fake-token') // token
      .mockResolvedValueOnce(JSON.stringify({
        id: 2,
        role: 'student',
      })); // stored user

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
            price: 25,
          },
        }),
    });

    const { findByText } = render(
      <TutorDetailsScreen route={route} navigation={navigation} />
    );

    expect(await findByText('€25')).toBeTruthy();
  });

  it('updates tutor price correctly when changed', async () => {
    const navigation = {
      goBack: jest.fn(),
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce('fake-token') // loadTutorProfile token
      .mockResolvedValueOnce('fake-token') // handleSave token
      .mockResolvedValueOnce(JSON.stringify({
        id: 1,
        name: 'Sarah Kelly',
        role: 'tutor',
      })); // stored user after save

    fetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              subjects: 'Java, SQL',
              availability: 'Mon-Wed',
              experience: '1 year',
              description: 'Helpful tutor',
              price: 20,
            },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              id: 1,
              name: 'Sarah Kelly',
              role: 'tutor',
              subjects: 'Java, SQL',
              availability: 'Mon-Wed',
              experience: '1 year',
              description: 'Helpful tutor',
              price: 30,
            },
          }),
      });

    const { findByPlaceholderText, findByDisplayValue, findByText } = render(
      <TutorProfileScreen navigation={navigation} />
    );

    await findByDisplayValue('20');

    const priceInput = await findByPlaceholderText('Price per session (€)');
    const saveButton = await findByText('Save Tutor Profile');

    fireEvent.changeText(priceInput, '30');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/users/tutor-profile'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          subjects: 'Java, SQL',
          availability: 'Mon-Wed',
          experience: '1 year',
          description: 'Helpful tutor',
          price: 30,
        }),
      })
    );
  });
});