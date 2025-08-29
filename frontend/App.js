import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen'; // අලුතින් එකතු කළා
import ElectricityDataScreen from './screens/ElectricityDataScreen';
import WaterDataScreen from './screens/WaterDataScreen';
import WasteDataScreen from './screens/WasteDataScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
        <Stack.Screen name="WaterData" component={WaterDataScreen} />
        <Stack.Screen name="WasteData" component={WasteDataScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}