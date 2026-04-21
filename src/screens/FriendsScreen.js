import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');
  const [blockLoadingId, setBlockLoadingId] = useState(null);

  useEffect(() => {
    fetchAllData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchPending()]);
    setLoading(false);
  };

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/friends/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        const updatedFriends = await Promise.all(
          data.friends.map(async (friend) => {
            try {
              const blockResponse = await fetch(
                `${API_URL}/users/block-status/${friend.friend_id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              const blockData = await blockResponse.json();

              return {
                ...friend,
                isBlocked: blockData.success ? blockData.isBlocked : false,
                blockedByThem: blockData.success ? blockData.blockedByThem : false,
              };
            } catch (error) {
              return {
                ...friend,
                isBlocked: false,
                blockedByThem: false,
              };
            }
          })
        );

        setFriends(updatedFriends);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchPending = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/friends/pending`, {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        fetchAllData();
      } else {
        Alert.alert('Error', data.error || 'Failed to accept request');
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
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          fetchPending();
        } else {
          Alert.alert('Error', data.error || 'Failed to decline request');
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

  const blockUser = async (friendId) => {
    setBlockLoadingId(friendId);

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/block/${friendId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'User blocked successfully');
        fetchFriends();
      } else {
        Alert.alert('Error', data.error || 'Failed to block user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to block user');
    } finally {
      setBlockLoadingId(null);
    }
  };

  const unblockUser = async (friendId) => {
    setBlockLoadingId(friendId);

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/block/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'User unblocked successfully');
        fetchFriends();
      } else {
        Alert.alert('Error', data.error || 'Failed to unblock user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unblock user');
    } finally {
      setBlockLoadingId(null);
    }
  };

  const handleBlockPress = (friend) => {
    if (friend.isBlocked) {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Unblock ${friend.friend_name}?`);
        if (confirmed) {
          unblockUser(friend.friend_id);
        }
      } else {
        Alert.alert(
          'Unblock User',
          `Do you want to unblock ${friend.friend_name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unblock', onPress: () => unblockUser(friend.friend_id) },
          ]
        );
      }
    } else {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          `Block ${friend.friend_name}? They will no longer be able to message you.`
        );
        if (confirmed) {
          blockUser(friend.friend_id);
        }
      } else {
        Alert.alert(
          'Block User',
          `Do you want to block ${friend.friend_name}? They will no longer be able to message you.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () => blockUser(friend.friend_id),
            },
          ]
        );
      }
    }
  };

  const handleOpenChat = (friend) => {
    navigation.navigate('Chat', {
      userId: friend.friend_id,
      userName: friend.friend_name,
    });
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
            <Text style={styles.emptyText}>
              No friends yet. Visit tutor profiles to add friends!
            </Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.friendship_id.toString()} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {friend.friend_name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.friendInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.friendName}>{friend.friend_name}</Text>

                    {friend.isBlocked && (
                      <View style={styles.blockedBadge}>
                        <Text style={styles.blockedBadgeText}>Blocked</Text>
                      </View>
                    )}

                    {!friend.isBlocked && friend.blockedByThem && (
                      <View style={styles.blockedByBadge}>
                        <Text style={styles.blockedBadgeText}>Cannot message</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.friendCourse}>
                    {friend.friend_course || 'No course set'}
                  </Text>

                  <Text style={styles.friendEmail}>{friend.friend_email}</Text>

                  <View style={styles.friendActions}>
                    <TouchableOpacity
                      style={[
                        styles.messageButton,
                        friend.blockedByThem && styles.disabledButton,
                      ]}
                      onPress={() => handleOpenChat(friend)}
                    >
                      <Text style={styles.messageButtonText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        friend.isBlocked ? styles.unblockButton : styles.blockButton,
                        blockLoadingId === friend.friend_id && styles.disabledButton,
                      ]}
                      onPress={() => handleBlockPress(friend)}
                      disabled={blockLoadingId === friend.friend_id}
                    >
                      <Text style={styles.blockButtonText}>
                        {blockLoadingId === friend.friend_id
                          ? '...'
                          : friend.isBlocked
                          ? 'Unblock'
                          : 'Block'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                  <Text style={styles.friendCourse}>
                    {request.requester_course || 'No course set'}
                  </Text>

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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#065A82',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#065A82',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },

  friendInfo: {
    flex: 1,
  },
  requestInfo: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  friendCourse: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  friendEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  blockedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  blockedByBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  blockedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C2D12',
  },

  friendActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  messageButton: {
    backgroundColor: '#065A82',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  blockButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unblockButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  declineText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  disabledButton: {
    opacity: 0.6,
  },

  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
});