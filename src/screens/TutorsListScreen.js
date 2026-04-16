import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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

export default function TutorsListScreen({ navigation }) {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
        headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
            onPress={() => navigation.navigate('EventsList')}
            style={{ marginRight: 16 }}
            >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                Events
            </Text>
            </TouchableOpacity>

            <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{ marginRight: 16 }}
            >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                Profile
            </Text>
            </TouchableOpacity>
        </View>
        ),
    });
    }, [navigation]);

  const loadTutors = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/tutors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTutors(data.tutors);
      }
    } catch (error) {
      console.log('Failed to load tutors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTutors();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTutors();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Tutors</Text>
      <Text style={styles.subtitle}>Find tutors and view the subjects they offer</Text>

      {tutors.length === 0 ? (
        <Text style={styles.emptyText}>No tutors found</Text>
      ) : (
        tutors.map((tutor) => (
          <TouchableOpacity
            key={tutor.id}
            style={styles.card}
            onPress={() => navigation.navigate('TutorDetails', { tutorId: tutor.id })}
          >
            <Text style={styles.name}>{tutor.name}</Text>
            <Text style={styles.course}>
              {tutor.course || 'Course not set'}
            </Text>
            <Text style={styles.subjects}>
              {tutor.subjects || 'No subjects added yet'}
            </Text>
          </TouchableOpacity>
        ))
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#065A82',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  course: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  subjects: {
    fontSize: 15,
    color: '#065A82',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748B',
    marginTop: 40,
  },
});