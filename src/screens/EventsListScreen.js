import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  TextInput, Alert
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

export default function EventsListScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', date: '',
    time: '', location: '', category: '', organizer: ''
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Bookmarks')}
          style={{ marginRight: 16 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⭐ Saved</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

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
      setRefreshing(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/events/bookmarks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const ids = (data.events || []).map(e => e.id);
      setBookmarks(ids);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    }
  };

  const toggleBookmark = async (eventId) => {
    const token = await getToken();
    const isBookmarked = bookmarks.includes(eventId);
    const method = isBookmarked ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/bookmark`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        if (isBookmarked) {
          setBookmarks(bookmarks.filter(id => id !== eventId));
        } else {
          setBookmarks([...bookmarks, eventId]);
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date) return Alert.alert('Error', 'Title and date are required!');
    try {
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.success) {
        setEvents([...events, data.event]);
        setForm({ title: '', description: '', date: '', time: '', location: '', category: '', organizer: '' });
        setShowForm(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchBookmarks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge,
          { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>
            {item.category ? item.category.toUpperCase() : 'EVENT'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.attendeeCount}>
            {item.attendee_count || 0} going
          </Text>
          <TouchableOpacity onPress={() => toggleBookmark(item.id)}>
            <Text style={{ fontSize: 20 }}>
              {bookmarks.includes(item.id) ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventInfo}>
        {formatDate(item.date)} at {item.time}
      </Text>
      <Text style={styles.eventLocation}>{item.location}</Text>
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ Add Event'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Event title *" value={form.title} onChangeText={t => setForm({ ...form, title: t })} />
          <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={t => setForm({ ...form, description: t })} />
          <TextInput style={styles.input} placeholder="Date (e.g. 2026-03-20)" value={form.date} onChangeText={t => setForm({ ...form, date: t })} />
          <TextInput style={styles.input} placeholder="Time (e.g. 14:00)" value={form.time} onChangeText={t => setForm({ ...form, time: t })} />
          <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={t => setForm({ ...form, location: t })} />
          <TextInput style={styles.input} placeholder="Category (academic/social/sports)" value={form.category} onChangeText={t => setForm({ ...form, category: t })} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Post Event</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  addBtn: { backgroundColor: '#065A82', padding: 12, borderRadius: 8, margin: 16, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  form: { backgroundColor: 'white', padding: 16, marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, marginBottom: 12, color: '#1E293B', fontSize: 16 },
  submitBtn: { backgroundColor: '#1C7293', padding: 12, borderRadius: 8, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  attendeeCount: { fontSize: 13, color: '#64748B' },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  eventInfo: { fontSize: 14, color: '#065A82', marginBottom: 2 },
  eventLocation: { fontSize: 14, color: '#64748B' },
  emptyText: { textAlign: 'center', fontSize: 16, marginTop: 40 },
});