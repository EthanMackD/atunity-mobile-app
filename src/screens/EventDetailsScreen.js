import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, TextInput, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return 'http://192.168.1.143:5000/api';
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

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(60);
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isEventPast, setIsEventPast] = useState(false);
  const [eventMessages, setEventMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    checkRsvpStatus();
    checkBookmark();
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
  };

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

  const fetchReminderStatus = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/reminders`, {
        headers: { Authorization: `Bearer ${userToken}` },
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
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          reminderEnabled: value,
          reminderMinutesBefore,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReminderEnabled(value);
        Alert.alert(
          'Success',
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
                headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setBookmarked(data.bookmarked);
    } catch (error) {
      Alert.alert('Error', 'Failed to bookmark event');
    }
  };

  const fetchEventMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/events/${eventId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEventMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch event messages:', error);
    }
  };

  const handleSendEventMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/events/${eventId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: chatMessage.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setChatMessage('');
        fetchEventMessages();
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
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
            style={[
              styles.attendButton,
              attending && styles.cancelButton,
              isEventPast && styles.disabledButton
            ]}
            onPress={handleAttend}
            disabled={rsvpLoading || isEventPast}
          >
            {rsvpLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.attendButtonText, isEventPast && styles.disabledText]}>
                {isEventPast ? 'Event Ended' : attending ? 'Cancel RSVP' : "I'm Going"}
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

        {attending && (
          <View style={styles.chatSection}>
            <TouchableOpacity
              style={styles.chatToggle}
              onPress={() => {
                setShowChat(!showChat);
                if (!showChat) fetchEventMessages();
              }}
            >
              <Text style={styles.chatToggleText}>
                {showChat ? 'Hide Event Chat' : 'Event Chat'}
              </Text>
            </TouchableOpacity>

            {showChat && (
              <View style={styles.chatContainer}>
                {eventMessages.length === 0 ? (
                  <Text style={styles.noChatMessages}>No messages yet. Start the conversation!</Text>
                ) : (
                  eventMessages.map((msg) => (
                    <View key={msg.id.toString()} style={styles.chatBubble}>
                      <Text style={styles.chatSender}>{msg.user_name}</Text>
                      <Text style={styles.chatContent}>{msg.content}</Text>
                      <Text style={styles.chatTime}>
                        {new Date(msg.created_at).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))
                )}
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={chatMessage}
                    onChangeText={setChatMessage}
                    placeholder="Say something to the group..."
                  />
                  <TouchableOpacity
                    style={styles.chatSendButton}
                    onPress={handleSendEventMessage}
                    disabled={!chatMessage.trim()}
                  >
                    <Text style={styles.chatSendText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
  },
  bookmarkedButton: { backgroundColor: '#F59E0B' },
  bookmarkButtonText: { fontSize: 18, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
  attendeesSection: { marginTop: 24, width: '100%' },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#065A82',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeAvatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  attendeeName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  attendeeCourse: { fontSize: 13, color: '#64748B' },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  disabledText: {
    color: '#64748B',
  },
  chatSection: { marginTop: 24, width: '100%' },
  chatToggle: {
    backgroundColor: '#065A82', padding: 12, borderRadius: 10,
    alignItems: 'center', marginBottom: 10,
  },
  chatToggleText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  chatContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  noChatMessages: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },
  chatBubble: {
    backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, marginBottom: 8,
  },
  chatSender: { fontSize: 12, fontWeight: 'bold', color: '#065A82', marginBottom: 2 },
  chatContent: { fontSize: 14, color: '#1E293B' },
  chatTime: { fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'right' },
  chatInputRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  chatInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8,
  },
  chatSendButton: { backgroundColor: '#065A82', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  chatSendText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});