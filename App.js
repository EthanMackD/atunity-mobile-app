import React from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import EventsListScreen from './src/screens/EventsListScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import TutorProfileScreen from './src/screens/TutorProfileScreen';
import TutorsListScreen from './src/screens/TutorsListScreen';
import TutorDetailsScreen from './src/screens/TutorDetailsScreen';
import EditProfileScreen from './src/screens/editProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import EventMapScreen from './src/screens/EventMapScreen';
import MySessionsScreen from './src/screens/MySessionsScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#065A82',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: { flex: 1, backgroundColor: '#F8FAFC' },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: 'Change Password' }}
        />

        <Stack.Screen
          name="EventsList"
          component={EventsListScreen}
          options={{ title: 'Events' }}
        />

        <Stack.Screen
          name="EventDetails"
          component={EventDetailsScreen}
          options={{ title: 'Event Details' }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'My Profile' }}
        />

        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreen}
          options={{ title: 'Saved Events' }}
        />

        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ title: 'Create Event' }}
        />

        <Stack.Screen
          name="TutorProfile"
          component={TutorProfileScreen}
          options={{ title: 'Tutor Profile' }}
        />

        <Stack.Screen
          name="TutorsList"
          component={TutorsListScreen}
          options={{ title: 'Tutors' }}
        />

        <Stack.Screen
          name="TutorDetails"
          component={TutorDetailsScreen}
          options={{ title: 'Tutor Details' }}
        />

        <Stack.Screen
          name="Conversations"
          component={ConversationsScreen}
          options={{ title: 'Messages' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ route }) => ({ title: route.params?.userName || 'Chat' })}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: 'Edit Profile' }}
        />

        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'My History' }}
        />

        <Stack.Screen
          name="EventMap"
          component={EventMapScreen}
          options={{ title: 'Event Map' }}
        />
        <Stack.Screen
          name="MySessions"
          component={MySessionsScreen}
          options={{ title: 'My Sessions' }}
        />
        <Stack.Screen
          name="Friends"
          component={FriendsScreen}
          options={{ title: 'My Friends' }}
        />
        <Stack.Screen
          name="Conversations"
          component={ConversationsScreen}
          options={{ title: 'Messages' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ route }) => ({ title: route.params.userName })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}