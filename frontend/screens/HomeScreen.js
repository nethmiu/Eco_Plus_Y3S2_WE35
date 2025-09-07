// HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

<<<<<<< HEAD
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api`;
=======
// API URL එක ඔබේ පරිගණකයේ IP address එකට අනුව සකස් කරන්න
const API_URL = 'http://10.47.144.219:5000/api/users';
>>>>>>> origin/dev-shanuka
const TOKEN_KEY = 'userToken';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
<<<<<<< HEAD
=======
                    // Token එකක් නොමැති නම්, Login page එකට යොමු කරන්න
>>>>>>> origin/dev-shanuka
                    navigation.replace('Login');
                    return;
                }

<<<<<<< HEAD
                const response = await axios.get(`${API_URL}/users/me`, {
=======
                // Protected '/me' route එකට request එකක් යවන්න
                const response = await axios.get(`${API_URL}/me`, {
>>>>>>> origin/dev-shanuka
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUser(response.data.data.user);
            } catch (error) {
                console.error(error.response?.data || error.message);
<<<<<<< HEAD
=======
                // Token එක වැරදි නම් හෝ කල් ඉකුත් වී ඇත්නම්, එය ඉවත් කර Login page එකට යන්න
>>>>>>> origin/dev-shanuka
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

    const handleGetStarted = () => {
        navigation.navigate('ElectricityData');
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.container} />;
    }

    return (
        <View style={styles.container}>
<<<<<<< HEAD
            <Text style={styles.title}>Welcome, {user?.name}! 👋</Text>
            <Text style={styles.subtitle}>Let's track your sustainability journey</Text>
            
            <View style={styles.infoContainer}>
                <Text style={styles.text}>Email: {user?.email}</Text>
                <Text style={styles.text}>City: {user?.city}</Text>
                <Text style={styles.text}>Household Members: {user?.householdMembers}</Text>
            </View>

            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
                <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>

=======
            <Text style={styles.title}>Welcome, {user?.name}!</Text>
            <Text style={styles.text}>Email: {user?.email}</Text>
            <Text style={styles.text}>City: {user?.city}</Text>
            <Text style={styles.text}>Role: {user?.role}</Text>
            {/* View Challenges බොත්තම මෙහි එකතු කර ඇත */}
            <View style={styles.buttonContainer}>
              <Button title="View Challenges" onPress={() => navigation.navigate('ChallengeList')} color="#007bff" />
            </View>
>>>>>>> origin/dev-shanuka
            <View style={styles.buttonContainer}>
                <Button title="Logout" onPress={handleLogout} color="#dc3545" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        padding: 20, 
        backgroundColor: '#f5f5f5' 
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 10,
        textAlign: 'center',
        color: '#2c5530'
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
        color: '#666'
    },
    infoContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    text: { 
        fontSize: 16, 
        marginBottom: 8,
        color: '#333'
    },
    getStartedButton: {
        backgroundColor: '#4caf50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20
    },
    getStartedText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    buttonContainer: { 
        marginTop: 10 
    }
});
=======
    container: { flex: 1, justifyContent: 'center', padding: 20, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 16, marginBottom: 8 },
    buttonContainer: { marginTop: 20, width: '80%' }, // බොත්තම් සඳහා වැඩි ඉඩක්
});
>>>>>>> origin/dev-shanuka
