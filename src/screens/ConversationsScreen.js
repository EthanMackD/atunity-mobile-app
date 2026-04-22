import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, Alert
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

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedIds, setArchivedIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchConversations();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedIds = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/conversations/archived-ids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setArchivedIds(data.archivedIds);
    } catch (error) {
      console.error('Failed to fetch archived IDs:', error);
    }
  };

  const handleLongPress = (conv) => {
    const isArchived = archivedIds.includes(conv.other_user_id);
    Alert.alert(
      isArchived ? 'Unarchive Conversation' : 'Archive Conversation',
      isArchived
        ? `Move your conversation with ${conv.other_user_name} back to your inbox?`
        : `Archive your conversation with ${conv.other_user_name}? You can unarchive it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchived ? 'Unarchive' : 'Archive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const endpoint = isArchived ? 'unarchive' : 'archive';
              await fetch(`${API_URL}/conversations/${endpoint}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otherUserId: conv.other_user_id }),
              });
              fetchArchivedIds();
            } catch (error) {
              Alert.alert('Error', 'Could not update archive. Try again.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IE', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getStatusText = (conv) => {
    if (conv.is_blocked) {
      return 'Blocked';
    }

    if (conv.blocked_by_them) {
      return 'Cannot message';
    }

    return '';
  };

  const getStatusStyle = (conv) => {
    if (conv.is_blocked) {
      return styles.blockedBadge;
    }

    if (conv.blocked_by_them) {
      return styles.blockedByBadge;
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  const filtered = conversations.filter(function(c) {
    return showArchived
      ? archivedIds.includes(c.other_user_id)
      : !archivedIds.includes(c.other_user_id);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Toggle Bar */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, !showArchived && styles.toggleButtonActive]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[styles.toggleText, !showArchived && styles.toggleTextActive]}>
            Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showArchived && styles.toggleButtonActive]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.toggleText, showArchived && styles.toggleTextActive]}>
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversation List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
          <Text style={styles.emptySubtext}>
            Visit a tutor profile and send a message to get started!
          </Text>
        </View>
      ) : (
        filtered.map((conv) => (
          <TouchableOpacity
            key={conv.other_user_id.toString()}
            style={styles.card}
            onPress={() =>
              navigation.navigate('Chat', {
                userId: conv.other_user_id,
                userName: conv.other_user_name,
              })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {conv.other_user_name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.convInfo}>
              <View style={styles.convHeader}>
                <Text style={styles.convName}>{conv.other_user_name}</Text>
                <Text style={styles.convTime}>{formatTime(conv.created_at)}</Text>
              </View>

              {(conv.is_blocked || conv.blocked_by_them) && (
                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, getStatusStyle(conv)]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(conv)}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.lastMessage} numberOfLines={1}>
                {conv.content}
              </Text>
            </View>

            {!conv.is_read && conv.receiver_id !== conv.other_user_id && !conv.is_blocked && !conv.blocked_by_them && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        ))
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  convInfo: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  convTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  badgeRow: {
    marginTop: 6,
    marginBottom: 2,
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  blockedBadge: {
    backgroundColor: '#FEF3C7',
  },
  blockedByBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C2D12',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#065A82',
  },
});
