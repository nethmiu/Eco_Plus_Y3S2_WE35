import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ConsumptionScreen from '../screens/Consumption Data - IT22129376/ConsumptionScreen';
import ElectricityDataScreen from '../screens/Consumption Data - IT22129376/ElectricityDataScreen';
import WaterDataScreen from '../screens/Consumption Data - IT22129376/WaterDataScreen';
import WasteDataScreen from '../screens/Consumption Data - IT22129376/WasteDataScreen';
import CameraScreen from '../screens/Consumption Data - IT22129376/CameraScreen';

const Stack = createStackNavigator();

export default function DataEntryModalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConsumptionScreen" component={ConsumptionScreen} />
      <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
      <Stack.Screen name="WaterData" component={WaterDataScreen} />
      <Stack.Screen name="WasteData" component={WasteDataScreen} />
      <Stack.Screen name="CameraScreen" component={CameraScreen} />
    </Stack.Navigator>
  );
}