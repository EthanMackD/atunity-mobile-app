import React, { useState, useEffect, useCallback } from 'react';
import MapView, { Marker } from '../mocks/react-native-maps';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
 
const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};
 
const API_URL = getApiUrl();
 
const LOCATION_COORDS = {
  'Main Hall':         { lat: 53.2784, lng: -9.0103 },
  'Computer Lab A':    { lat: 53.2787, lng: -9.0098 },
  'Sports Hall':       { lat: 53.2779, lng: -9.0109 },
  'Exhibition Center': { lat: 53.2791, lng: -9.0095 },
  'Library Room 201':  { lat: 53.2782, lng: -9.0099 },
  'Student Bar':       { lat: 53.2780, lng: -9.0105 },
};
 
export default function EventsListScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
 
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={{ marginRight: 16 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Profile</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
 
  const fetchEvents = async (query = '') => {
    try {
      const searchParam = query ? `?search=${encodeURIComponent(query)}` : '';
      const response = await fetch(`${API_URL}/events${searchParam}`);
      const data = await response.json();
 
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
 
  useEffect(() => {
    fetchEvents();
  }, []);
 
  useFocusEffect(
    useCallback(() => {
      fetchEvents(searchQuery);
    }, [searchQuery])
  );
 
  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(searchQuery);
  };
 
  const handleSearch = (text) => {
    setSearchQuery(text);
    fetchEvents(text);
  };
 
  const renderMapView = () => (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 53.2785,
        longitude: -9.0102,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
    >
      {events.map((item) => {
        const coords = LOCATION_COORDS[item.location];
        if (!coords) return null;
        return (
          <Marker
            key={item.id.toString()}
            coordinate={{ latitude: coords.lat, longitude: coords.lng }}
            title={item.title}
            description={item.location}
            onCalloutPress={() =>
              navigation.navigate('EventDetails', { eventId: item.id })
            }
          />
        );
      })}
    </MapView>
  );
 
  const getCategoryColor = (category) => {
    const safeCategory = category ? category.toLowerCase().trim() : '';
    const colors = {
      academic: '#3B82F6',
      social: '#8B5CF6',
      sports: '#10B981',
      careers: '#F59E0B',
    };
    return colors[safeCategory] || '#64748B';
  };
 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
 
  const renderEvent = (item) => (
    <TouchableOpacity
      key={item.id.toString()}
      style={styles.card}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(item.category) }
          ]}
        >
          <Text style={styles.categoryText}>
            {item.category ? item.category.toUpperCase() : 'EVENT'}
          </Text>
        </View>
        <Text style={styles.attendeeCount}>
          {item.attendee_count || 0} going
        </Text>
      </View>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventInfo}>
        {formatDate(item.date)} at {item.time}
      </Text>
      <Text style={styles.eventLocation}>{item.location}</Text>
    </TouchableOpacity>
  );
 
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#065A82" />
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>
 
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
 
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'list' && styles.toggleButtonTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'map' && styles.toggleButtonTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>
 
      {viewMode === 'map' ? renderMapView() : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No events found</Text>
          ) : (
            events.map(renderEvent)
          )}
        </ScrollView>
      )}
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: 0, overflow: 'auto' } : {})
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  attendeeCount: {
    fontSize: 13,
    color: '#64748B'
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventInfo: {
    fontSize: 14,
    color: '#065A82',
    marginBottom: 2
  },
  eventLocation: {
    fontSize: 14,
    color: '#64748B'
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  createButton: {
    backgroundColor: '#065A82',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#065A82',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
});