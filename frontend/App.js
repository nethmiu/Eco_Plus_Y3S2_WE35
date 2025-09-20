
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen'; 
import ElectricityDataScreen from './screens/ElectricityDataScreen';
import WaterDataScreen from './screens/WaterDataScreen';
import WasteDataScreen from './screens/WasteDataScreen';

import AddChallengeScreen from './screens/AddChallengeScreen'; 
import ChallengeListScreen from './screens/ChallengeListScreen';
import ManageChallengesScreen from './screens/ManageChallengesScreen';

import AdminDashboard from './screens/AdminDashboard';
import EnvironmentalistDashboard from './screens/EnvironmentalistDashboard';
import MapScreen from './screens/MapScreen';

// 🔹 Import DashboardScreen
import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddChallenge" component={AddChallengeScreen} />
        <Stack.Screen name="ChallengeList" component={ChallengeListScreen} />
        <Stack.Screen name="ManageChallenges" component={ManageChallengesScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="EnvironmentalistDashboard" component={EnvironmentalistDashboard} />

        <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
        <Stack.Screen name="WaterData" component={WaterDataScreen} />
        <Stack.Screen name="WasteData" component={WasteDataScreen} />

      <Stack.Screen 
        name="MapScreen" 
        component={MapScreen} 
        options={{ presentation: 'modal', title: 'Select Location' }} 
      />
      </Stack.Navigator>
    </NavigationContainer>
    
    // 👉 Now direct DashboardScreen render 
    //<DashboardScreen />
  );
}
