import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.143:5000/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (token) {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setSelectedLocation(data.user.preferred_meeting_location || null);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          return;
        }
      }

      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setSelectedLocation(parsed.preferred_meeting_location || null);
      }
    } catch (error) {
      console.log('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreference = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a meeting preference');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferred_meeting_location: selectedLocation }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Saved', 'Meeting preference updated successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to save preference');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save preference');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  const preferenceChanged = selectedLocation !== (user?.preferred_meeting_location || null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || 'Not set'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || 'Not set'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Course</Text>
          <Text style={styles.value}>{user?.course || 'Not set'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Year</Text>
          <Text style={styles.value}>
            {user?.year ? `Year ${user.year}` : 'Not set'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('en-IE')
              : 'Unknown'}
          </Text>
        </View>

      </View>

      {/* Meeting Preference */}
      <View style={styles.preferenceCard}>
        <Text style={styles.preferenceTitle}>Preferred Meeting Location</Text>
        <Text style={styles.preferenceSubtitle}>
          Choose how you prefer to meet for sessions
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedLocation === 'online' && styles.optionSelected,
            ]}
            onPress={() => setSelectedLocation('online')}
          >
            <Text style={[
              styles.optionIcon,
              selectedLocation === 'online' && styles.optionTextSelected,
            ]}>💻</Text>
            <Text style={[
              styles.optionLabel,
              selectedLocation === 'online' && styles.optionTextSelected,
            ]}>Online</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedLocation === 'on_campus' && styles.optionSelected,
            ]}
            onPress={() => setSelectedLocation('on_campus')}
          >
            <Text style={[
              styles.optionIcon,
              selectedLocation === 'on_campus' && styles.optionTextSelected,
            ]}>🏫</Text>
            <Text style={[
              styles.optionLabel,
              selectedLocation === 'on_campus' && styles.optionTextSelected,
            ]}>On Campus</Text>
          </TouchableOpacity>
        </View>

        {preferenceChanged && (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSavePreference}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : 'Save Preference'}
            </Text>
          </TouchableOpacity>
        )}

        {!preferenceChanged && selectedLocation && (
          <Text style={styles.savedIndicator}>
            ✓ Saved — {selectedLocation === 'online' ? 'Online' : 'On Campus'}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#065A82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
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
  infoRow: {
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065A82',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1E293B',
  },
  preferenceCard: {
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
  preferenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  optionSelected: {
    borderColor: '#065A82',
    backgroundColor: '#EFF6FF',
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  optionTextSelected: {
    color: '#065A82',
  },
  saveButton: {
    backgroundColor: '#065A82',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  savedIndicator: {
    marginTop: 12,
    textAlign: 'center',
    color: '#10B981',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
