import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput, Platform, ScrollView, Alert
} from 'react-native';


const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

// Approximate coordinates for ATU campus locations
const LOCATION_COORDS = {
  'Main Hall': { lat: 53.2707, lng: -9.0568 },
  'Computer Lab A': { lat: 53.2710, lng: -9.0572 },
  'Sports Hall': { lat: 53.2703, lng: -9.0560 },
  'Exhibition Center': { lat: 53.2715, lng: -9.0580 },
  'Library Room 201': { lat: 53.2708, lng: -9.0575 },
  'Student Bar': { lat: 53.2705, lng: -9.0565 },
};
 
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};


export default function EventsListScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userLocation, setUserLocation] = useState(null);



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

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

   const handleSearch = (text) => {
    setSearchQuery(text);
    fetchEvents(text);
  };

  const handleSortByLocation = async () => {
    if (sortByDistance) {
      setSortByDistance(false);
      fetchEvents(searchQuery);
      return;
    }
 
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable location to sort by distance.');
        return;
      }
 
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
 
      const sorted = [...events].sort((a, b) => {
        const coordsA = LOCATION_COORDS[a.location] || { lat: 53.2707, lng: -9.0568 };
        const coordsB = LOCATION_COORDS[b.location] || { lat: 53.2707, lng: -9.0568 };
        const distA = getDistance(location.coords.latitude, location.coords.longitude, coordsA.lat, coordsA.lng);
        const distB = getDistance(location.coords.latitude, location.coords.longitude, coordsB.lat, coordsB.lng);
        return distA - distB;
      });
 
      setEvents(sorted);
      setSortByDistance(true);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    }
  };


  const getCategoryColor = (category) => {
    const colors = {
      academic: '#3B82F6',
      social: '#8B5CF6',
      sports: '#10B981',
      careers: '#F59E0B',
    };
    return colors[category] || '#64748B';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const renderEvent = (item) => (
    <TouchableOpacity
      key={item.id.toString()}
      style={styles.card}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge,
          { backgroundColor: getCategoryColor(item.category) }]}>
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

      <TouchableOpacity
        style={[styles.locationButton, sortByDistance && styles.locationButtonActive]}
        onPress={handleSortByLocation}
      >
        <Text style={[styles.locationButtonText, sortByDistance && styles.locationButtonTextActive]}>
          {sortByDistance ? 'Sorted by Nearest' : 'Sort by Nearest'}
        </Text>
      </TouchableOpacity>


      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {events.length === 0
          ? <Text style={styles.emptyText}>No events found</Text>
          : events.map(renderEvent)
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1, ...(Platform.OS === 'web' ? { minHeight: 0, overflow: 'auto' } : {}) },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
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
  attendeeCount: { fontSize: 13, color: '#64748B' },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventInfo: { fontSize: 14, color: '#065A82', marginBottom: 2 },
  eventLocation: { fontSize: 14, color: '#64748B' },
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

  locationButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#10B981',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  locationButtonTextActive: {
    color: '#FFFFFF',
  },

});
