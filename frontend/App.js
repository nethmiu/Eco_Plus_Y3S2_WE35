import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
<<<<<<< HEAD
import HomeScreen from './screens/HomeScreen'; // අලුතින් එකතු කළා
import ElectricityDataScreen from './screens/ElectricityDataScreen';
import WaterDataScreen from './screens/WaterDataScreen';
import WasteDataScreen from './screens/WasteDataScreen';
=======
import HomeScreen from './screens/HomeScreen';

import AdminDashboard from './screens/AdminDashboard';
import EnvironmentalistDashboard from './screens/EnvironmentalistDashboard';
>>>>>>> origin/dev-nethmi

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
<<<<<<< HEAD
        <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
        <Stack.Screen name="WaterData" component={WaterDataScreen} />
        <Stack.Screen name="WasteData" component={WasteDataScreen} />
=======
        
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="EnvironmentalistDashboard" component={EnvironmentalistDashboard} />
>>>>>>> origin/dev-nethmi
      </Stack.Navigator>
    </NavigationContainer>
  );
}