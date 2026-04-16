import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
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

export default function TutorDetailsScreen({ route, navigation }) {
  const { tutorId } = route.params;
  const [tutor, setTutor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutorDetails();
  }, []);

  const loadTutorDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }

      const response = await fetch(`${API_URL}/users/tutors/${tutorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTutor(data.tutor);
      }
    } catch (error) {
      console.log('Failed to load tutor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwnTutorProfile =
    currentUser &&
    currentUser.role === 'tutor' &&
    parseInt(currentUser.id) === parseInt(tutorId);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  if (!tutor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Tutor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.name}>{tutor.name}</Text>
        <Text style={styles.course}>
          {tutor.course || 'Course not set'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Subjects</Text>
          <Text style={styles.value}>{tutor.subjects || 'Not set'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Availability</Text>
          <Text style={styles.value}>{tutor.availability || 'Not set'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Experience</Text>
          <Text style={styles.value}>{tutor.experience || 'Not set'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{tutor.description || 'Not set'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>
            {tutor.price !== null && tutor.price !== undefined ? `€${tutor.price}` : 'Not set'}
          </Text>
        </View>
      </View>

      {isOwnTutorProfile && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('TutorProfile')}
        >
          <Text style={styles.editButtonText}>Edit Tutor Profile</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 16,
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065A82',
    marginBottom: 5,
  },
  course: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065A82',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#1E293B',
  },
  editButton: {
    backgroundColor: '#065A82',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});