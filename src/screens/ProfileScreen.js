import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savedEvents, setSavedEvents] = useState([]);

  useEffect(() => {
    loadUserProfile();
    loadSavedEvents();
  }, []);

  const loadSavedEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/events/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setSavedEvents(data.events || []);
    } catch (error) {
      console.log('Failed to load saved events:', error);
    }
  };

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

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled) return;
    const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
    setUploadingPhoto(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/profile/picture`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Success', 'Profile picture updated!');
      } else {
        Alert.alert('Error', data.error || 'Failed to upload picture');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload picture');
    } finally {
      setUploadingPhoto(false);
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
        <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto}>
          <View style={styles.avatar}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <View style={styles.cameraIcon}>
            <Text style={{ fontSize: 14 }}>{uploadingPhoto ? '⏳' : '📷'}</Text>
          </View>
        </TouchableOpacity>
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

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email Verified</Text>
          <Text style={[styles.value, { color: user?.email_verified ? '#10B981' : '#EF4444' }]}>
            {user?.email_verified ? '✓ Verified' : '✗ Not verified — check your email'}
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

      <View style={styles.savedCard}>
        <Text style={styles.preferenceTitle}>Saved Events</Text>
        {savedEvents.length === 0 ? (
          <Text style={styles.noSavedText}>No saved events yet</Text>
        ) : (
          savedEvents.map(event => (
            <TouchableOpacity
              key={event.id}
              style={styles.savedEventRow}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.savedEventTitle}>{event.title}</Text>
                <Text style={styles.savedEventMeta}>{event.location} · {new Date(event.date).toLocaleDateString('en-IE')}</Text>
              </View>
              <Text style={{ color: '#065A82', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('History')}
      >
        <Text style={styles.navButtonText}>My Event History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('MySessions')}
      >
        <Text style={styles.navButtonText}>My Tutoring Sessions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('Friends')}
      >
        <Text style={styles.navButtonText}>My Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('Conversations')}
      >
        <Text style={styles.navButtonText}>Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('Bookmarks')}
      >
        <Text style={styles.navButtonText}>Saved Events</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.navButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Text style={styles.navButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'auto' } : {}),
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
  savedCard: {
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
  noSavedText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
  savedEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  savedEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  savedEventMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  navButton: {
    backgroundColor: '#065A82',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
