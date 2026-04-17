import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
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

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EventsList')}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
              Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TutorsList')}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
              Tutors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={{ marginRight: 16 }}
            accessibilityLabel="Edit Profile"
          >
            <Ionicons name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('token');

      if (token) {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.user);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.log('Failed to load profile:', error);
    } finally {
      setLoading(false);
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
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>
            {user?.role ? user.role.toUpperCase() : 'Not set'}
          </Text>
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

      {user?.role === 'tutor' && (
        <TouchableOpacity
          style={styles.tutorButton}
          onPress={() => navigation.navigate('TutorDetails', { tutorId: user.id })}
        >
          <Text style={styles.tutorText}>View My Tutor Profile</Text>
        </TouchableOpacity>
      )}

      {user?.role === 'tutor' && (
        <TouchableOpacity
          style={styles.tutorButton}
          onPress={() => navigation.navigate('TutorProfile')}
        >
          <Text style={styles.tutorText}>Create / Edit Tutor Profile</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('History')}
      >
        <Text style={styles.historyButtonText}>My Event History</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('MySessions')}
      >
        <Text style={styles.historyButtonText}>My Tutoring Sessions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('Friends')}
      >
        <Text style={styles.historyButtonText}>My Friends</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('Conversations')}
      >
        <Text style={styles.historyButtonText}>Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Text style={styles.changePasswordText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 20, paddingBottom: 30 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#065A82',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoRow: { paddingVertical: 12 },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065A82',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  value: { fontSize: 16, color: '#1E293B' },
  tutorButton: {
    backgroundColor: '#065A82',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15
  },
  tutorText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  changePasswordButton: {
    backgroundColor: '#065A82',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  changePasswordText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#065A82',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});