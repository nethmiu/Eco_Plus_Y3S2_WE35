// HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API URL එක ඔබේ පරිගණකයේ IP address එකට අනුව සකස් කරන්න
const API_URL = 'http://10.47.144.219:5000/api/users';
const TOKEN_KEY = 'userToken';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
                    // Token එකක් නොමැති නම්, Login page එකට යොමු කරන්න
                    navigation.replace('Login');
                    return;
                }

                // Protected '/me' route එකට request එකක් යවන්න
                const response = await axios.get(`${API_URL}/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUser(response.data.data.user);
            } catch (error) {
                console.error(error.response?.data || error.message);
                // Token එක වැරදි නම් හෝ කල් ඉකුත් වී ඇත්නම්, එය ඉවත් කර Login page එකට යන්න
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
        Alert.alert('Logged Out', 'ඔබ සාර්ථකව log out විය.');
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
            {/* Add Challenges බොත්තම මෙහි එකතු කර ඇත */}
            <View style={styles.buttonContainer}>
              <Button title="Add Challenges" onPress={() => navigation.navigate('AddChallenge')} color="#28a745" />
            </View>
            {/* View Challenges බොත්තම මෙහි එකතු කර ඇත */}
            <View style={styles.buttonContainer}>
              <Button title="View Challenges" onPress={() => navigation.navigate('ChallengeList')} color="#007bff" />
            </View>
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
    buttonContainer: { marginTop: 20, width: '80%' }, // බොත්තම් සඳහා වැඩි ඉඩක්
});
