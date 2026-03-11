import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EventDetailsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Details</Text>
      <Text style={styles.subtitle}>
        📄 This is where Teammate 2 will add the event details
      </Text>
      <Text style={styles.note}>
        When someone clicks an event, this screen will show all the info!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  note: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});