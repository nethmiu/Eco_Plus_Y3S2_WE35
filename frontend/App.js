import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- Screen Imports ---
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen'; 
import ProfileScreen from './screens/ProfileScreen'; // මේක තමයි හරි file එක
import EditAdminProfile from './screens/EditAdminProfile';
import EditEnvProfile from './screens/EditEnvProfile';

import ElectricityDataScreen from './screens/ElectricityDataScreen';
import WaterDataScreen from './screens/WaterDataScreen';
import WasteDataScreen from './screens/WasteDataScreen';
// SustainabilityProfile කියන එක අයින් කලා

import AddChallengeScreen from './screens/AddChallengeScreen'; 
import ChallengeListScreen from './screens/ChallengeListScreen';
import ManageChallengesScreen from './screens/ManageChallengesScreen';

import AdminDashboard from './screens/AdminDashboard';
import AdminRegistrationScreen from './screens/AdminRegistrationScreen';
import ManageUsersScreen from './screens/ManageUsersScreen';
import EnvironmentalistDashboard from './screens/EnvironmentalistDashboard';
import MapScreen from './screens/MapScreen';

import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        
        {/* --- ඔක්කොම Screens ටික --- */}
        <Stack.Screen name="Landing" component={LandingScreen} /> 
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        
        <Stack.Screen name="AddChallenge" component={AddChallengeScreen} />
        <Stack.Screen name="ChallengeList" component={ChallengeListScreen} />
        <Stack.Screen name="ManageChallenges" component={ManageChallengesScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminRegistration" component={AdminRegistrationScreen} />
        <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
        <Stack.Screen name="EditAdminProfile" component={EditAdminProfile} />
        <Stack.Screen name="EditEnvProfile" component={EditEnvProfile} />
        <Stack.Screen name="EnvironmentalistDashboard" component={EnvironmentalistDashboard} />

        <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
        <Stack.Screen name="WaterData" component={WaterDataScreen} />
        <Stack.Screen name="WasteData" component={WasteDataScreen} />
        
        {/* SustainabilityProfile කියන එක මෙතනිනුත් අයින් කලා */}

        <Stack.Screen name="MapScreen" component={MapScreen} />
        
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}