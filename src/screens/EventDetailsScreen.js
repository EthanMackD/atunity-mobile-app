import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Switch,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.143:5000/api';

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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEventPast, setIsEventPast] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

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
      const userJson = await AsyncStorage.getItem('user');
      setUserToken(token);
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUserId(user.id);
      }
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

  const openEditModal = () => {
    // Strip time portion from date (e.g. "2026-04-15T00:00:00.000Z" -> "2026-04-15")
    const rawDate = event.date ? event.date.split('T')[0] : '';
    // Strip seconds from time (e.g. "14:00:00" -> "14:00")
    const rawTime = event.time ? event.time.substring(0, 5) : '';
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      date: rawDate,
      time: rawTime,
      location: event.location || '',
      category: event.category || '',
      organizer: event.organizer || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editForm.title || !editForm.date) {
      Alert.alert('Error', 'Title and date are required');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
        setShowEditModal(false);
        Alert.alert('Success', 'Event updated successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to update event');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (data.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error || 'Failed to delete event');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
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

  const isOwner = currentUserId && event.created_by === currentUserId;

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organiser}>Organised by {event.organizer}</Text>

          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                <Text style={styles.editButtonText}>Edit Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          )}

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

      {/* Edit Event Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Event</Text>
            <TouchableOpacity onPress={handleUpdate} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={editForm.title}
              onChangeText={t => setEditForm({ ...editForm, title: t })}
              placeholder="Event title"
            />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editForm.description}
              onChangeText={t => setEditForm({ ...editForm, description: t })}
              placeholder="Description"
              multiline
              numberOfLines={4}
            />
            <Text style={styles.fieldLabel}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={editForm.date}
              onChangeText={t => setEditForm({ ...editForm, date: t })}
              placeholder="e.g. 2026-06-15"
            />
            <Text style={styles.fieldLabel}>Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={editForm.time}
              onChangeText={t => setEditForm({ ...editForm, time: t })}
              placeholder="e.g. 14:00"
            />
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={editForm.location}
              onChangeText={t => setEditForm({ ...editForm, location: t })}
              placeholder="Location"
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={editForm.category}
              onChangeText={t => setEditForm({ ...editForm, category: t })}
              placeholder="academic / social / sports / careers"
            />
            <Text style={styles.fieldLabel}>Organiser</Text>
            <TextInput
              style={styles.input}
              value={editForm.organizer}
              onChangeText={t => setEditForm({ ...editForm, organizer: t })}
              placeholder="Organiser name"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
    fontSize: 15, color: '#64748B', marginBottom: 16,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#065A82',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF', fontWeight: '600', fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444', fontWeight: '600', fontSize: 15,
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
  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 17, fontWeight: 'bold', color: '#1E293B',
  },
  modalCancel: {
    fontSize: 16, color: '#64748B',
  },
  modalSave: {
    fontSize: 16, fontWeight: '600', color: '#065A82',
  },
  modalSaveDisabled: {
    color: '#94A3B8',
  },
  modalBody: {
    flex: 1, backgroundColor: '#F8FAFC', padding: 16,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: '600',
    color: '#475569', marginBottom: 4, marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
