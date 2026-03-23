import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();
 
export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(60);
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isEventPast, setIsEventPast] = useState(false);
 
  useEffect(() => {
    fetchEventDetails();
    loadUserToken();
  }, []);

  useEffect(() => {
    if (event) {
      checkIfEventPast();
    }
  }, [event]);

  useEffect(() => {
    if (userToken) {
      fetchReminderStatus();
    }
  }, [userToken]);
 
  const loadUserToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setUserToken(token);
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  };

  const checkIfEventPast = () => {
    if (!event) return;
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const isPast = eventDate < today;
    setIsEventPast(isPast);
    
    if (isPast) {
      Alert.alert(
        'Event No Longer Available',
        'This event is in the past and is no longer available.',
        [{ text: 'OK' }]
      );
    }
  };

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

  const fetchReminderStatus = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setReminderEnabled(data.reminderEnabled);
        setReminderMinutesBefore(data.reminderMinutesBefore);
      }
    } catch (error) {
      console.error('Failed to fetch reminder status:', error);
    }
  };

  const handleToggleReminder = async (value) => {
    if (!userToken) {
      Alert.alert('Error', 'Please log in to set reminders');
      return;
    }

    setLoadingReminder(true);
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          reminderEnabled: value,
          reminderMinutesBefore: reminderMinutesBefore,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReminderEnabled(value);
        Alert.alert('Success', 
          value 
            ? `Reminder set for ${reminderMinutesBefore} minutes before the event` 
            : 'Reminder disabled'
        );
      } else {
        Alert.alert('Error', 'Failed to update reminder');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
      console.error('Reminder toggle error:', error);
    } finally {
      setLoadingReminder(false);
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
              attending && styles.attendingButton,
              isEventPast && styles.disabledButton]}
            onPress={handleAttend}
            disabled={isEventPast}
          >
            <Text style={[styles.attendButtonText,
              attending && styles.attendingButtonText,
              isEventPast && styles.disabledText]}>
              {isEventPast ? 'Event Ended' : (attending ? "You're Going!" : "I'm Going")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <View>
              <Text style={styles.reminderTitle}>Event Reminder</Text>
              <Text style={styles.reminderDescription}>
                {reminderEnabled 
                  ? `Get notified ${reminderMinutesBefore} minutes before` 
                  : 'Enable to receive a reminder'}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              disabled={loadingReminder || isEventPast}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
              thumbColor={reminderEnabled ? '#10B981' : '#F8FAFC'}
            />
          </View>
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
  attendingButtonText: { color: '#FFFFFF' },
  reminderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 18, fontWeight: 'bold',
    color: '#1E293B', marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14, color: '#64748B',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  disabledText: {
    color: '#64748B',
  },
});
