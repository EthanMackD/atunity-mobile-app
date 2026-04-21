import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }

  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        const user = JSON.parse(storedUser);
        setName(user.name || '');
        setCourse(user.course || '');
        setYear(user.year ? user.year.toString() : '');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          course: course.trim(),
          year: year ? parseInt(year) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#065A82" style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.subtitle}>Update your profile details</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name"
      />

      <TextInput
        style={styles.input}
        value={course}
        onChangeText={setCourse}
        placeholder="Course"
      />

      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        placeholder="Year"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#065A82',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#065A82',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});