import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function EventsListScreen({ navigation }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={{ marginRight: 16 }}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>

      <Text style={styles.subtitle}>
        📋 This is where Teammate 1 will add the events list
      </Text>

      <View style={styles.attendeeBox}>
        <Text style={styles.attendeeLabel}>Attendees</Text>
        <Text style={styles.attendeeCount}>12</Text>
      </View>

      <Text style={styles.note}>
        // Temporary attendee UI until events list + RSVP is implemented
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 20,
  backgroundColor: '#F8FAFC',
  },
  
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#065A82',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#1C7293',
    textAlign: 'center',
    marginBottom: 20,
  },
  attendeeBox: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendeeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065A82',
    marginBottom: 8,
  },
  attendeeCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  note: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'left',
    fontStyle: 'italic',
  },
  profileButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});