import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
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
  const [attendees, setAttendees] = useState([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    checkRsvpStatus();
    checkBookmark();
    checkReminder();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
        setAttendeeCount(parseInt(data.event.attendee_count) || 0);
      } else {
        Alert.alert('Error', data.message || 'Failed to load event');
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
      Alert.alert('Error', 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const checkRsvpStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const response = await fetch(`${API_URL}/events/${eventId}/attendees`);
      const data = await response.json();
      if (data.success) {
        setAttendees(data.attendees);
        const isAttending = data.attendees.some((a) => a.id === user.id);
        setAttending(isAttending);
        setAttendeeCount(data.attendees.length);
      }
    } catch (error) {
      console.error('Check RSVP status error:', error);
    }
  };

  const handleAttend = async () => {
    const action = attending ? 'cancel this event' : 'go to this event';
    Alert.alert(
      attending ? 'Cancel RSVP' : 'RSVP',
      `Are you sure you want to ${action}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setRsvpLoading(true);
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
                await checkRsvpStatus();
                Alert.alert(
                  'Success',
                  data.attending
                    ? "You're going! See you there!"
                    : 'You are no longer going to this event.'
                );
              } else {
                Alert.alert('Error', data.message || 'Failed to update RSVP');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update RSVP');
            } finally {
              setRsvpLoading(false);
            }
          },
        },
      ]
    );
  };

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

  const checkReminder = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setReminderSet(data.reminderEnabled);
    } catch (error) {
      console.error('Check reminder error:', error);
    }
  };

  const toggleReminder = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to set reminders');
        return;
      }
      const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminderEnabled: !reminderSet }),
      });
      const data = await response.json();
      if (data.success) {
        setReminderSet(data.reminder.reminderEnabled);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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
          <Text style={styles.attendeeCountText}>
            {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
          </Text>

          <TouchableOpacity
            style={[styles.attendButton, attending && styles.cancelButton]}
            onPress={handleAttend}
            disabled={rsvpLoading}
          >
            {rsvpLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.attendButtonText}>
                {attending ? 'Cancel RSVP' : "I'm Going"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bookmarkButton, bookmarked && styles.bookmarkedButton]}
            onPress={toggleBookmark}
          >
            <Text style={styles.bookmarkButtonText}>
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reminderButton, reminderSet && styles.reminderSetButton]}
            onPress={toggleReminder}
          >
            <Text style={styles.reminderButtonText}>
              {reminderSet ? 'Reminder Set' : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
        </View>
        {attendees.length > 0 && (
          <View style={styles.attendeesSection}>
            <Text style={styles.sectionTitle}>Who's Going</Text>
            {attendees.map((person) => (
              <View key={person.id} style={styles.attendeeRow}>
                <View style={styles.attendeeAvatar}>
                  <Text style={styles.attendeeAvatarText}>
                    {person.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.attendeeName}>{person.name}</Text>
                  {person.course ? (
                    <Text style={styles.attendeeCourse}>{person.course}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  organiser: { fontSize: 15, color: '#64748B', marginBottom: 20 },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  infoLabel: { fontSize: 12, fontWeight: 'bold', color: '#065A82', textTransform: 'uppercase', marginTop: 8 },
  infoValue: { fontSize: 16, color: '#1E293B', marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  description: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 24 },
  attendanceSection: { alignItems: 'center', marginBottom: 24 },
  attendeeCountText: { fontSize: 16, color: '#64748B', marginBottom: 12 },
  attendButton: { backgroundColor: '#065A82', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  cancelButton: { backgroundColor: '#EF4444' },
  attendButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  bookmarkButton: {
    backgroundColor: '#E2E8F0', paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 25, marginTop: 10,
  },
  bookmarkedButton: { backgroundColor: '#F59E0B' },
  bookmarkButtonText: { fontSize: 18, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
  attendeesSection: { marginTop: 24, width: '100%' },
  attendeeRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    padding: 12, borderRadius: 8, marginBottom: 8,
  },
  attendeeAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#065A82',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  attendeeAvatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  attendeeName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  attendeeCourse: { fontSize: 13, color: '#64748B' 

  },
  reminderButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
  },
  reminderSetButton: {
    backgroundColor: '#3B82F6',
  },
  reminderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
  },
});
