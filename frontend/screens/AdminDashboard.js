import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

<<<<<<< HEAD
const API_URL = 'http://192.168.8.132:5000/api/users'; // Ensure this IP is correct
=======
const API_URL = 'http://10.47.144.219:5000/api/users'; // Ensure this IP is correct
>>>>>>> origin/dev-shanuka
const TOKEN_KEY = 'userToken';

export default function AdminDashboard({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
                    navigation.replace('Login');
                    return;
                }

                // Verify token by fetching user data
                const response = await axios.get(`${API_URL}/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // Check if the user is actually an Admin
                if (response.data.data.user.role !== 'Admin') {
                    Alert.alert('Access Denied', 'You do not have permission to view this page.');
                    // Log out and redirect
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    navigation.replace('Login');
                } else {
                    setUser(response.data.data.user);
                }

            } catch (error) {
                // If token is invalid, clear it and redirect to login
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        Alert.alert('Logged Out', 'You have been successfully logged out.');
        navigation.replace('Login');
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.text}>Welcome, {user?.name || 'Administrator'}!</Text>
            {/* Add Challenges and Manage Challenges buttons here */}
            <View style={styles.buttonContainer}>
              <Button title="Add Challenges" onPress={() => navigation.navigate('AddChallenge')} color="#28a745" />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Manage Challenges" onPress={() => navigation.navigate('ManageChallenges')} color="#ffc107" />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Logout" onPress={handleLogout} color="#dc3545" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 18, marginBottom: 20 },
    buttonContainer: { marginTop: 20 },
});
