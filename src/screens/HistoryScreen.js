import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

export default function HistoryScreen({ navigation }) {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/events/my/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUpcoming(data.upcoming);
        setPast(data.past);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const renderEventCard = (item) => (
    <TouchableOpacity
      key={item.id.toString()}
      style={styles.card}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardInfo}>{formatDate(item.date)} at {item.time}</Text>
      <Text style={styles.cardLocation}>{item.location}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {upcoming.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming events. Browse events and RSVP!</Text>
      ) : (
        upcoming.map(renderEventCard)
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Past Events</Text>
      {past.length === 0 ? (
        <Text style={styles.emptyText}>No past events yet.</Text>
      ) : (
        past.map(renderEventCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#065A82', marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  cardInfo: { fontSize: 14, color: '#065A82', marginBottom: 2 },
  cardLocation: { fontSize: 14, color: '#64748B' },
  emptyText: { fontSize: 15, color: '#94A3B8', fontStyle: 'italic', marginBottom: 16 },
});