import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Platform.OS === 'web') return 'http://192.168.1.143:5000/api';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return 'http://192.168.1.143:5000/api';
};

const API_URL = getApiUrl();

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    fetchFriends();
    fetchPending();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/friends/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.friends);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/friends/pending`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/friends/${friendshipId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchFriends();
        fetchPending();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleDecline = async (friendshipId) => {
    const doDecline = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/friends/${friendshipId}/decline`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          fetchPending();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to decline request');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Decline this friend request?')) {
        await doDecline();
      }
    } else {
      Alert.alert('Decline Request', 'Are you sure?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: doDecline },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' && (
        <>
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>No friends yet. Visit tutor profiles to add friends!</Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.friendship_id.toString()} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {friend.friend_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.friend_name}</Text>
                  <Text style={styles.friendCourse}>{friend.friend_course || 'No course set'}</Text>
                  <Text style={styles.friendEmail}>{friend.friend_email}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {activeTab === 'pending' && (
        <>
          {pendingRequests.length === 0 ? (
            <Text style={styles.emptyText}>No pending friend requests.</Text>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.friendship_id.toString()} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {request.requester_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.friendName}>{request.requester_name}</Text>
                  <Text style={styles.friendCourse}>{request.requester_course || 'No course set'}</Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(request.friendship_id)}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDecline(request.friendship_id)}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#E2E8F0', alignItems: 'center',
  },
  tabActive: { backgroundColor: '#065A82' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#065A82',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 20 },
  friendInfo: { flex: 1 },
  requestInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  friendCourse: { fontSize: 13, color: '#64748B', marginTop: 2 },
  friendEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  acceptButton: {
    backgroundColor: '#10B981', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8,
  },
  acceptText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  declineButton: {
    backgroundColor: '#EF4444', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8,
  },
  declineText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  emptyText: { fontSize: 15, color: '#94A3B8', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});