import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DataEntryHomeScreen from '../screens/DataEntryHomeScreen';
import ElectricityDataScreen from '../screens/ElectricityDataScreen';
import WaterDataScreen from '../screens/WaterDataScreen';
import WasteDataScreen from '../screens/WasteDataScreen';
import CameraScreen from '../screens/CameraScreen';

const Stack = createStackNavigator();

export default function DataEntryModalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DataEntryHome" component={DataEntryHomeScreen} />
      <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
      <Stack.Screen name="WaterData" component={WaterDataScreen} />
      <Stack.Screen name="WasteData" component={WasteDataScreen} />
      <Stack.Screen name="CameraScreen" component={CameraScreen} />
    </Stack.Navigator>
  );
}