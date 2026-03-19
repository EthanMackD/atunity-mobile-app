import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();
 
export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
 
  useEffect(() => {
    fetchEventDetails();
    checkBookmark();
  }, []);
 
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
        setAttendeeCount(parseInt(data.event.attendee_count) || 0);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAttend = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to RSVP');
        return;
      }
      const response = await fetch(`${API_URL}/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAttending(data.attending);
        setAttendeeCount(data.attendeeCount);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };
 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };
 
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }
 
  if (!event) {
    return (
      <View style={styles.centered}>
        <Text>Event not found</Text>
      </View>
    );
  }
 
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.organiser}>Organised by {event.organizer}</Text>
 
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{event.time}</Text>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{event.location}</Text>
        </View>
 
        <Text style={styles.sectionTitle}>About This Event</Text>
        <Text style={styles.description}>{event.description}</Text>
 
        <View style={styles.attendanceSection}>
          <Text style={styles.attendeeCount}>
            {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
          </Text>
          <TouchableOpacity
            style={[styles.attendButton,
              attending && styles.attendingButton]}
            onPress={handleAttend}
          >
            <Text style={[styles.attendButtonText,
              attending && styles.attendingButtonText]}>
              {attending ? "You're Going!" : "I'm Going"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={[styles.bookmarkButton,
            bookmarked && styles.bookmarkedButton]}
          onPress={toggleBookmark}
        >
          <Text style={styles.bookmarkButtonText}>
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Text>
        </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: {
    fontSize: 28, fontWeight: 'bold',
    color: '#1E293B', marginBottom: 4,
  },
  organiser: {
    fontSize: 15, color: '#64748B', marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  infoLabel: {
    fontSize: 12, fontWeight: 'bold',
    color: '#065A82', textTransform: 'uppercase',
    marginTop: 8,
  },
  infoValue: { fontSize: 16, color: '#1E293B', marginBottom: 4 },
  sectionTitle: {
    fontSize: 20, fontWeight: 'bold',
    color: '#1E293B', marginBottom: 8,
  },
  description: {
    fontSize: 15, color: '#475569',
    lineHeight: 22, marginBottom: 24,
  },
  attendanceSection: { alignItems: 'center', marginBottom: 40 },
  attendeeCount: {
    fontSize: 16, color: '#64748B', marginBottom: 12,
  },
  attendButton: {
    backgroundColor: '#065A82', paddingVertical: 14,
    paddingHorizontal: 40, borderRadius: 25,
  },
  attendingButton: {
    backgroundColor: '#10B981',
  },
  attendButtonText: {
    color: '#FFFFFF', fontSize: 18, fontWeight: 'bold',
  },
  attendingButtonText: { color: '#FFFFFF'
  },
  bookmarkButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
  },
  bookmarkedButton: {
    backgroundColor: '#F59E0B',
  },
  bookmarkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
  },
});

const checkBookmark = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL.replace('/api', '')}/api/bookmarks/${eventId}/check`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setBookmarked(data.bookmarked);
    } catch (error) {
      console.error('Check bookmark error:', error);
    }
  };
 
  const toggleBookmark = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to bookmark');
        return;
      }
      const response = await fetch(`${API_URL.replace('/api', '')}/api/bookmarks/${eventId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setBookmarked(data.bookmarked);
    } catch (error) {
      Alert.alert('Error', 'Failed to bookmark event');
    }
  };
