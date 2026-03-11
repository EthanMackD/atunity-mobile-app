import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';

export default function EventsListScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', organizer: '' });

  useEffect(() => {
    fetch('http://10.27.16.180:5000/api/events')
      .then(res => res.json())
      .then(data => { setEvents(data.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.date) return Alert.alert('Title and date are required!');
    const res = await fetch('http://YOUR_IP:5000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setEvents([...events, data.event]);
      setForm({ title: '', description: '', date: '', location: '', organizer: '' });
      setShowForm(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Events</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Event title *" value={form.title} onChangeText={t => setForm({ ...form, title: t })} />
          <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={t => setForm({ ...form, description: t })} />
          <TextInput style={styles.input} placeholder="Date (e.g. 2026-03-15)" value={form.date} onChangeText={t => setForm({ ...form, date: t })} />
          <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={t => setForm({ ...form, location: t })} />
          <TextInput style={styles.input} placeholder="Organizer" value={form.organizer} onChangeText={t => setForm({ ...form, organizer: t })} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Post Event</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <Text style={styles.status}>Loading events...</Text>}
      {!loading && events.length === 0 && <Text style={styles.status}>No events yet — add one!</Text>}

      <FlatList
        data={events}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.cardMeta}>📅 {item.date}  📍 {item.location}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#065A82' },
  addBtn: { backgroundColor: '#065A82', padding: 10, borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: '600' },
  form: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  submitBtn: { backgroundColor: '#1C7293', padding: 12, borderRadius: 8, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '600' },
  status: { textAlign: 'center', color: '#888', marginTop: 20 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#065A82', marginBottom: 4 },
  cardDesc: { color: '#555', marginBottom: 8 },
  cardMeta: { color: '#888', fontSize: 13 },
});