import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  View
} from 'react-native';
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

export default function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (
      title.trim() === '' ||
      date.trim() === '' ||
      time.trim() === '' ||
      location.trim() === '' ||
      description.trim() === '' ||
      category.trim() === ''
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          description: description,
          date: date,
          time: time,
          location: location,
          category: category
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Event published successfully');
        navigation.navigate('EventsList');
      } else {
        Alert.alert('Error', data.message || data.error || 'Failed to publish event');
      }
    } catch (error) {
      console.error('Failed to publish event:', error);
      Alert.alert('Error', 'Something went wrong while publishing the event');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryButton = (value, label) => (
    <TouchableOpacity
      style={[
        styles.categoryOption,
        category === value && styles.categoryOptionSelected
      ]}
      onPress={() => setCategory(value)}
    >
      <Text
        style={[
          styles.categoryOptionText,
          category === value && styles.categoryOptionTextSelected
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Event title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Time (e.g. 18:00)"
        value={time}
        onChangeText={setTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.categoryLabel}>Select Category</Text>

      <View style={styles.categoryContainer}>
        {renderCategoryButton('academic', 'Academic')}
        {renderCategoryButton('social', 'Social')}
        {renderCategoryButton('sports', 'Sports')}
        {renderCategoryButton('careers', 'Careers')}
      </View>

      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline={true}
      />

      <TouchableOpacity style={styles.button} onPress={handlePublish}>
        <Text style={styles.buttonText}>
          {loading ? 'Publishing...' : 'Publish Event'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 15,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryOptionSelected: {
    backgroundColor: '#065A82',
    borderColor: '#065A82',
  },
  categoryOptionText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#065A82',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});