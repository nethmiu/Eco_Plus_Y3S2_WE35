import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- Screen Imports ---
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen'; 
import ProfileScreen from './screens/ProfileScreen'; 
import EditAdminProfile from './screens/EditAdminProfile';
import EditEnvProfile from './screens/EditEnvProfile';

import ElectricityDataScreen from './screens/Consumption Data - IT22129376/ElectricityDataScreen';
import WaterDataScreen from './screens/Consumption Data - IT22129376/WaterDataScreen';
import WasteDataScreen from './screens/Consumption Data - IT22129376/WasteDataScreen';
import ConsumptionScreen from './screens/Consumption Data - IT22129376/ConsumptionScreen';
import UsageHistoryScreen from './screens/Consumption Data - IT22129376/UsageHistoryScreen';
import SustainabilityProfileScreen from './screens/Consumption Data - IT22129376/SustainabilityProfile';
import CameraScreen from './screens/Consumption Data - IT22129376/CameraScreen';

import AddChallengeScreen from './screens/AddChallengeScreen'; 
import ChallengeListScreen from './screens/ChallengeListScreen';
import ManageChallengesScreen from './screens/ManageChallengesScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';

import AdminDashboard from './screens/AdminDashboard';
import AdminRegistrationScreen from './screens/AdminRegistrationScreen';
import ManageUsersScreen from './screens/ManageUsersScreen';
import EnvironmentalistDashboard from './screens/EnvironmentalistDashboard';
import MapScreen from './screens/MapScreen';

import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

import DashboardScreen from './screens/DashboardScreen';

// Navigation Imports
import DataEntryModalStack from './navigation/DataEntryModalStack';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


// Custom Plus Button Component for the middle tab
const CustomPlusButton = ({ onPress }) => (
  <MaterialCommunityIcons
    name="plus-circle"
    size={56}
    color="#4CAF50"
    style={{
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }}
    onPress={onPress}
  />
);

// Bottom Tab Navigator
function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 60,
          paddingBottom: 15,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="AddDataTab" 
        component={DataEntryModalStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons 
              name="chart-areaspline" 
              size={size} 
              color={color} 
            />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="ChallengesTab" 
        component={ChallengeListScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
          headerShown: true,
          title: 'Eco Challenges',
        }}
      />
      
      <Tab.Screen 
        name="MoreTab" 
        component={HomeScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
        {/* Auth Screens */}
        <Stack.Screen name="Landing" component={LandingScreen} /> 
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      
        {/* Main App with Bottom Tabs */}
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        
          {/* Other Screens that should be outside the tab navigator */}
        <Stack.Screen name="AddChallenge" component={AddChallengeScreen} />
        <Stack.Screen name="ManageChallenges" component={ManageChallengesScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminRegistration" component={AdminRegistrationScreen} />
        <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
        <Stack.Screen name="EditAdminProfile" component={EditAdminProfile} />
        <Stack.Screen name="EditEnvProfile" component={EditEnvProfile} />
        <Stack.Screen name="EnvironmentalistDashboard" component={EnvironmentalistDashboard} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        
        {/* Data Entry Screens */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} options={{ title: 'Add Electricity Data' }} />
        <Stack.Screen name="WaterData" component={WaterDataScreen} options={{ title: 'Add Water Data' }} />
        <Stack.Screen name="WasteData" component={WasteDataScreen} options={{ title: 'Add Waste Data' }} />
        <Stack.Screen name="SustainabilityProfile" component={SustainabilityProfileScreen} />
        <Stack.Screen name="ConsumptionScreen" component={ConsumptionScreen} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="UsageHistory" component={UsageHistoryScreen} options={({ route }) => ({ 
            title: getUsageHistoryTitle(route.params?.type),
            headerShown: true 
          })}
        />
            
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Helper function for dynamic titles
const getUsageHistoryTitle = (type) => {
  const titles = {
    'ENERGY': 'Electricity Usage History',
    'WATER': 'Water Usage History', 
    'WASTE': 'Waste Management History'
  };
  return titles[type] || 'Usage History';
};