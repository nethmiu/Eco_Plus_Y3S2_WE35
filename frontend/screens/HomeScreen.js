import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.8.132:5000/api/users';
const TOKEN_KEY = 'userToken';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
                    // If no token, redirect to login
                    navigation.replace('Login');
                    return;
                }

                // Make a request to the protected '/me' route
                const response = await axios.get(`${API_URL}/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUser(response.data.data.user);
            } catch (error) {
                console.error(error.response?.data || error.message);
                // If token is invalid or expired, clear it and go to login
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
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
            <Text style={styles.title}>Welcome, {user?.name}!</Text>
            <Text style={styles.text}>Email: {user?.email}</Text>
            <Text style={styles.text}>City: {user?.city}</Text>
            <Text style={styles.text}>Role: {user?.role}</Text>
            <View style={styles.buttonContainer}>
              <Button title="Logout" onPress={handleLogout} color="#dc3545" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 16, marginBottom: 8 },
    buttonContainer: { marginTop: 20 },
});