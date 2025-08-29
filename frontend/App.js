import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';

import AdminDashboard from './screens/AdminDashboard';
import EnvironmentalistDashboard from './screens/EnvironmentalistDashboard';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="EnvironmentalistDashboard" component={EnvironmentalistDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}