import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput
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
  const [searchQuery, setSearchQuery] = useState('');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Conversations')}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
              Messages
            </Text>
          </TouchableOpacity>

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

  const loadTutors = async (query = '') => {
    try {
      const token = await AsyncStorage.getItem('token');
      const searchParam = query ? `?search=${encodeURIComponent(query)}` : '';
      const response = await fetch(`${API_URL}/users/tutors${searchParam}`, {
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
      loadTutors(searchQuery);
    }, [searchQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTutors(searchQuery);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    loadTutors(text);
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

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, subject, or course..."
        value={searchQuery}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />

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

            <View style={styles.sessionsRow}>
              <Text style={styles.sessionsText}>
                {parseInt(tutor.completed_sessions) || 0} sessions completed
              </Text>
            </View>
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  sessionsRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sessionsText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748B',
    marginTop: 40,
  },
});