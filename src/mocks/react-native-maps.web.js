import React from 'react';
import { View, Text } from 'react-native';
 
const MapView = ({ children, style }) => (
  <View style={[style, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ color: '#64748B', fontSize: 14 }}>
      Map view not available on web
    </Text>
  </View>
);
 
export const Marker = () => null;
export default MapView;
 