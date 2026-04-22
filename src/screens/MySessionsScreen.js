import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function MySessionsScreen({ navigation }) {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/sessions/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUpcoming(data.upcoming);
        setPast(data.past);
        setCancelled(data.cancelled);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (sessionId) => {
    const doCancel = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/sessions/${sessionId}/cancel`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          fetchSessions();
        } else {
          Alert.alert('Error', data.error || 'Failed to cancel session');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to cancel session');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this session? The tutor will be notified.')) {
        await doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Session',
        'Are you sure you want to cancel this session? The tutor will be notified.',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  const handleReschedule = async (sessionId) => {
    if (!newDate || !newTime) {
      Alert.alert('Error', 'Please enter both a new date and time');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/sessions/${sessionId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });
      const data = await response.json();
      if (data.success) {
        setRescheduleId(null);
        setNewDate('');
        setNewTime('');
        fetchSessions();
        Alert.alert('Success', 'Session rescheduled successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to reschedule');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule session');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    if (status === 'confirmed') return '#10B981';
    if (status === 'cancelled') return '#EF4444';
    if (status === 'completed') return '#64748B';
    return '#F59E0B';
  };

  const renderSession = (session, showActions) => (
    <View key={session.id.toString()} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.subject}>{session.subject}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
          <Text style={styles.statusText}>{session.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.personInfo}>
        Tutor: {session.tutor_name}
      </Text>
      <Text style={styles.personInfo}>
        Student: {session.student_name}
      </Text>
      <Text style={styles.dateInfo}>
        {formatDate(session.date)} at {session.time}
      </Text>
      <Text style={styles.duration}>
        Duration: {session.duration_minutes} minutes
      </Text>
      {session.notes && (
        <Text style={styles.notes}>Notes: {session.notes}</Text>
      )}

      {showActions && session.status === 'confirmed' && (
        <View style={styles.actions}>
          {rescheduleId === session.id ? (
            <View style={styles.rescheduleForm}>
              <TextInput
                style={styles.input}
                placeholder="New date (YYYY-MM-DD)"
                value={newDate}
                onChangeText={setNewDate}
              />
              <TextInput
                style={styles.input}
                placeholder="New time (HH:MM)"
                value={newTime}
                onChangeText={setNewTime}
              />
              <View style={styles.rescheduleButtons}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => handleReschedule(session.id)}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelFormButton}
                  onPress={() => { setRescheduleId(null); setNewDate(''); setNewTime(''); }}
                >
                  <Text style={styles.cancelFormButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.rescheduleButton}
                onPress={() => setRescheduleId(session.id)}
              >
                <Text style={styles.rescheduleButtonText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(session.id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
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
      <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
      {upcoming.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming sessions. Book one from the Tutors page!</Text>
      ) : (
        upcoming.map(s => renderSession(s, true))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Past Sessions</Text>
      {past.length === 0 ? (
        <Text style={styles.emptyText}>No past sessions yet.</Text>
      ) : (
        past.map(s => renderSession(s, false))
      )}

      {cancelled.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Cancelled Sessions</Text>
          {cancelled.map(s => renderSession(s, false))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#065A82', marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  subject: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  personInfo: { fontSize: 14, color: '#065A82', marginBottom: 2 },
  dateInfo: { fontSize: 14, color: '#475569', marginTop: 4 },
  duration: { fontSize: 13, color: '#64748B', marginTop: 2 },
  notes: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 },
  actions: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  rescheduleButton: {
    flex: 1, backgroundColor: '#065A82', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  rescheduleButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  cancelButton: {
    flex: 1, backgroundColor: '#EF4444', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  cancelButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  rescheduleForm: { marginTop: 4 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 8,
  },
  rescheduleButtons: { flexDirection: 'row', gap: 10 },
  confirmButton: {
    flex: 1, backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  confirmButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  cancelFormButton: {
    flex: 1, backgroundColor: '#94A3B8', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  cancelFormButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  emptyText: { fontSize: 15, color: '#94A3B8', fontStyle: 'italic', marginBottom: 16 },
});