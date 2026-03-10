import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        👤 This is where Teammate 3 will add the profile info
      </Text>
      <Text style={styles.note}>
        This will show the user's name, email, course, year, etc.
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