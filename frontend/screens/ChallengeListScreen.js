// screens/ChallengeListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ඔබේ පරිගණකයේ IP address එක
const API_URL = 'http://10.47.144.219:5000/api/challenges'; // Challenges API endpoint එක
const TOKEN_KEY = 'userToken';

export default function ChallengeListScreen({ navigation }) {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                setLoading(true);
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
                    // Token එකක් නොමැති නම්, Login page එකට යොමු කරන්න
                    Alert.alert('Access Denied', 'Please log in to view challenges.');
                    navigation.replace('Login');
                    return;
                }

                const response = await axios.get(API_URL, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setChallenges(response.data.data.challenges);
            } catch (err) {
                console.error('Error fetching challenges:', err.response?.data || err.message);
                setError('Failed to load challenges. Please try again.');
                Alert.alert('Error', err.response?.data?.message || 'Failed to load challenges.');
                // Token invalid නම් Login page එකට යොමු කරන්න
                if (err.response?.status === 401) {
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    navigation.replace('Login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loadingContainer} />;
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const renderChallengeItem = ({ item }) => (
        <View style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>{item.title}</Text>
            <Text style={styles.challengeDescription}>{item.description}</Text>
            <Text style={styles.challengeDetail}>Goal: {item.goal} {item.unit}</Text>
            <Text style={styles.challengeDetail}>Start Date: {new Date(item.startDate).toLocaleDateString()}</Text>
            <Text style={styles.challengeDetail}>End Date: {new Date(item.endDate).toLocaleDateString()}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Available Challenges</Text>
            {challenges.length === 0 ? (
                <Text style={styles.noChallengesText}>No challenges available at the moment.</Text>
            ) : (
                <FlatList
                    data={challenges}
                    keyExtractor={(item) => item._id}
                    renderItem={renderChallengeItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 25,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    challengeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    challengeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 8,
    },
    challengeDescription: {
        fontSize: 16,
        color: '#495057',
        marginBottom: 5,
    },
    challengeDetail: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 3,
    },
    noChallengesText: {
        fontSize: 18,
        textAlign: 'center',
        color: '#6c757d',
        marginTop: 50,
    },
});
