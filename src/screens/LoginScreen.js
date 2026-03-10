import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Teammate 1 will add the real login code here later
    if (email && password) {
      Alert.alert('Success', 'Login button works! (Backend not connected yet)');
      // Later this will navigate to the Events List
    } else {
      Alert.alert('Error', 'Please fill in both fields');
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>ATUnity</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      {/* Email Input Box */}
      <TextInput
        style={styles.input}
        placeholder="Email (@atu.ie)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input Box */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Link to Sign Up */}
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

// This is what makes it look nice (colors, spacing, etc.)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#065A82',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#065A82',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#1C7293',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});