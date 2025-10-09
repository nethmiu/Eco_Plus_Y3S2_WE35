// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
<<<<<<< Updated upstream
import HomeScreen from './screens/HomeScreen'; // අලුතින් එකතු කළා
import ElectricityDataScreen from './screens/ElectricityDataScreen';
import WaterDataScreen from './screens/WaterDataScreen';
import WasteDataScreen from './screens/WasteDataScreen';
=======
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
>>>>>>> Stashed changes

import AddChallengeScreen from './screens/AddChallengeScreen'; 
import ChallengeListScreen from './screens/ChallengeListScreen';
import ManageChallengesScreen from './screens/ManageChallengesScreen';

import AdminDashboard from './screens/AdminDashboard';
import EnvironmentalistDashboard from './screens/EnvironmentalistDashboard';

// 🔹 DashboardScreen import කරන්න
import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
<<<<<<< Updated upstream
        <Stack.Screen name="Home" component={HomeScreen} />
=======
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        
        {/* Profile Screens */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
        {/* Main App with Bottom Tabs */}
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        
        {/* Other Screens that should be outside the tab navigator */}
>>>>>>> Stashed changes
        <Stack.Screen name="AddChallenge" component={AddChallengeScreen} />
        <Stack.Screen name="ChallengeList" component={ChallengeListScreen} />
        <Stack.Screen name="ManageChallenges" component={ManageChallengesScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="EnvironmentalistDashboard" component={EnvironmentalistDashboard} />
<<<<<<< Updated upstream

        <Stack.Screen name="ElectricityData" component={ElectricityDataScreen} />
        <Stack.Screen name="WaterData" component={WaterDataScreen} />
        <Stack.Screen name="WasteData" component={WasteDataScreen} />

=======
        <Stack.Screen name="MapScreen" component={MapScreen} />
        
        {/* Data Entry Screens */}
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} options={{ title: 'Add Consumption Data' }} />
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
            
>>>>>>> Stashed changes
      </Stack.Navigator>
    </NavigationContainer>
    
    // 👉 දැන් direct DashboardScreen render වෙයි
    //<DashboardScreen />
  );
}
<<<<<<< Updated upstream
=======





// Helper function for dynamic titles
const getUsageHistoryTitle = (type) => {
  const titles = {
    'ENERGY': 'Electricity Usage History',
    'WATER': 'Water Usage History', 
    'WASTE': 'Waste Management History'
  };
  return titles[type] || 'Usage History';
};
>>>>>>> Stashed changes
