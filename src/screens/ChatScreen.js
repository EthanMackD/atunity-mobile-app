import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, Alert
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

export default function ChatScreen({ route, navigation }) {
  const { userId, userName } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByThem, setBlockedByThem] = useState(false);
  const [updatingBlock, setUpdatingBlock] = useState(false);

  const scrollViewRef = useRef();

  useEffect(() => {
    loadCurrentUser();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: userName,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleBlockButtonPress}
          disabled={updatingBlock}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, userName, isBlocked, updatingBlock]);

  const loadCurrentUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setCurrentUserId(JSON.parse(storedUser).id);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setIsBlocked(data.isBlocked || false);
        setBlockedByThem(data.blockedByThem || false);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    setUpdatingBlock(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/block/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setIsBlocked(true);
        Alert.alert('Success', 'User blocked successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Failed to block user:', error);
      Alert.alert('Error', 'Failed to block user');
    } finally {
      setUpdatingBlock(false);
    }
  };

  const handleUnblockUser = async () => {
    setUpdatingBlock(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/block/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setIsBlocked(false);
        Alert.alert('Success', 'User unblocked successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Failed to unblock user:', error);
      Alert.alert('Error', 'Failed to unblock user');
    } finally {
      setUpdatingBlock(false);
    }
  };

  const handleBlockButtonPress = () => {
    if (isBlocked) {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Unblock ${userName}?`);
        if (confirmed) {
          handleUnblockUser();
        }
      } else {
        Alert.alert(
          'Unblock User',
          `Do you want to unblock ${userName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unblock', onPress: handleUnblockUser },
          ]
        );
      }
    } else {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Block ${userName}? They will no longer be able to message you.`);
        if (confirmed) {
          handleBlockUser();
        }
      } else {
        Alert.alert(
          'Block User',
          `Do you want to block ${userName}? They will no longer be able to message you.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive', onPress: handleBlockUser },
          ]
        );
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (isBlocked || blockedByThem) return;

    setSending(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: userId,
          content: newMessage.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        fetchMessages();
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return date.toLocaleDateString('en-IE', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }

  let lastDate = '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {isBlocked && (
        <View style={styles.blockBanner}>
          <Text style={styles.blockBannerText}>
            You blocked this user. You cannot send messages until you unblock them.
          </Text>
        </View>
      )}

      {blockedByThem && (
        <View style={styles.blockedByBanner}>
          <Text style={styles.blockBannerText}>
            You cannot send messages to this user.
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          scrollViewRef.current && scrollViewRef.current.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>No messages yet.</Text>
            <Text style={styles.emptyChatSubtext}>Say hello to {userName}!</Text>
          </View>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const msgDate = formatDateHeader(msg.created_at);
            const showDate = msgDate !== lastDate;
            lastDate = msgDate;

            return (
              <View key={msg.id.toString()}>
                {showDate && (
                  <Text style={styles.dateHeader}>{msgDate}</Text>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.myMessageText : styles.theirMessageText,
                    ]}
                  >
                    {msg.content}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      isMe ? styles.myMessageTime : styles.theirMessageTime,
                    ]}
                  >
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={
            isBlocked
              ? 'Unblock user to send messages'
              : blockedByThem
              ? 'You cannot message this user'
              : 'Type a message...'
          }
          multiline
          editable={!isBlocked && !blockedByThem}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending || isBlocked || blockedByThem) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending || isBlocked || blockedByThem}
        >
          <Text style={styles.sendButtonText}>
            {sending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerButton: {
    marginRight: 12,
  },
  headerButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },

  blockBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  blockedByBanner: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  blockBannerText: {
    fontSize: 13,
    color: '#7C2D12',
    textAlign: 'center',
    fontWeight: '600',
  },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  emptyChat: { alignItems: 'center', marginTop: 60 },
  emptyChatText: { fontSize: 16, color: '#64748B' },
  emptyChatSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  dateHeader: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginVertical: 12,
    fontWeight: '600',
  },

  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 6,
  },
  myMessage: {
    backgroundColor: '#065A82',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: { color: '#FFFFFF' },
  theirMessageText: { color: '#1E293B' },

  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#94A3B8',
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },

  sendButton: {
    backgroundColor: '#065A82',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});