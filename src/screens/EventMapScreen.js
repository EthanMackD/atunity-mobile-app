import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, ScrollView
} from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://192.168.1.143:5000/api';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return 'http://192.168.1.143:5000/api';
};

const API_URL = getApiUrl();

const LOCATION_COORDS = {
  'Main Hall': { lat: 53.2707, lng: -9.0568 },
  'Computer Lab A': { lat: 53.2710, lng: -9.0572 },
  'Sports Hall': { lat: 53.2703, lng: -9.0560 },
  'Exhibition Center': { lat: 53.2715, lng: -9.0580 },
  'Library Room 201': { lat: 53.2708, lng: -9.0575 },
  'Student Bar': { lat: 53.2705, lng: -9.0565 },
};

const getCategoryColor = (category) => {
  const colors = {
    academic: '#3B82F6',
    social: '#8B5CF6',
    sports: '#10B981',
    careers: '#F59E0B',
  };
  return colors[category] || '#64748B';
};

export default function EventMapScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Campus Event Map</Text>
      <Text style={styles.subtitle}>
        Showing {events.length} events across ATU Galway campus
      </Text>

      {events.map((event) => {
        const coords = LOCATION_COORDS[event.location];
        return (
          <TouchableOpacity
            key={event.id.toString()}
            style={styles.card}
            onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
          >
            <View style={styles.cardRow}>
              <View style={[styles.pin, { backgroundColor: getCategoryColor(event.category) }]}>
                <Text style={styles.pinText}>{event.location ? event.location.charAt(0) : '?'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardLocation}>{event.location}</Text>
                <Text style={styles.cardDate}>{formatDate(event.date)} at {event.time}</Text>
                {coords && (
                  <Text style={styles.cardCoords}>
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>Interactive Map</Text>
        <Text style={styles.noteText}>
          The full interactive map with pins and navigation is available on mobile devices via the Expo Go app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#065A82', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pinText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  cardLocation: { fontSize: 14, color: '#065A82', marginBottom: 2 },
  cardDate: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  cardCoords: { fontSize: 11, color: '#94A3B8' },
  noteBox: {
    backgroundColor: '#F0F7FB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#065A82',
  },
  noteTitle: { fontSize: 14, fontWeight: 'bold', color: '#065A82', marginBottom: 4 },
  noteText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});