import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    Alert, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar, 
    ScrollView 
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import config from '../config';
const API_URL = `http://${config.IP}:${config.PORT}/api/challenges`; 
const TOKEN_KEY = 'userToken';

// Define available filters based on Challenge Units (must match backend units: kWh, m3, bags)
const CHALLENGE_UNITS = [
    { key: 'All', label: 'සියල්ල (All)', unit: 'All', icon: 'trophy-outline' }, // Custom key for all
    { key: 'Electricity', label: 'Electricity', unit: 'kWh', icon: 'flash-outline' },
    { key: 'Water', label: 'Water', unit: 'm3', icon: 'water-outline' },
    { key: 'Waste', label: 'Waste', unit: 'bags', icon: 'recycle-variant' },
];

// Helper function to get challenge icon based on unit (Remains unchanged)
const getChallengeIcon = (unit) => {
    switch (unit.toLowerCase()) {
        case 'kwh': return { name: 'flash-outline', color: '#FF9800' };
        case 'm3': return { name: 'water-outline', color: '#4A90E2' };
        case 'bags': return { name: 'recycle-variant', color: '#4CAF50' };
        case 'kg': return { name: 'weight-hanging', color: '#795548' };
        default: return { name: 'trophy-outline', color: '#607D8B' };
    }
};

export default function ChallengeListScreen({ navigation }) {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- STATE FOR FILTERING ---
    const [selectedUnitKey, setSelectedUnitKey] = useState('All'); 
    // -------------------------------

    // Function to get the actual unit value (kWh, m3, bags) from the selected key
    const getUnitValue = (key) => {
        const unit = CHALLENGE_UNITS.find(u => u.key === key);
        return unit ? unit.unit : 'All';
    };

    const fetchChallenges = useCallback(async (unitKey) => {
        const unitFilter = getUnitValue(unitKey); // Get the actual unit code
        
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                navigation.replace('Login');
                return;
            }

            // 1. Build the API URL with filter parameter (Step 1.3)
            const query = unitFilter && unitFilter !== 'All' ? `?unit=${unitFilter}` : '';
            const fetchURL = `${API_URL}${query}`;
            
            const response = await axios.get(fetchURL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setChallenges(response.data.data.challenges);
            setError('');
        } catch (err) {
            console.error('Error fetching challenges:', err.response?.data || err.message);
            setError('Failed to load challenges. Please check connectivity.');
            if (err.response?.status === 401) {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigation]); // Dependency array for useCallback

    // --- UPDATED useEffect for filtering (Step 1.3 - Integration Logic) ---
    useEffect(() => {
        // This useEffect runs once on mount, and then every time selectedUnitKey changes
        fetchChallenges(selectedUnitKey);
        
        const unsubscribe = navigation.addListener('focus', () => fetchChallenges(selectedUnitKey));
        return unsubscribe;
    }, [navigation, selectedUnitKey, fetchChallenges]); // fetchChallenges is now stable (used in useCallback)
    // ---------------------------------------------------------------------


    // --- Handle Join Challenge (Remains unchanged) ---
    const handleJoinChallenge = async (challengeId, challengeTitle) => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            
            const response = await axios.post(
                `${API_URL}/${challengeId}/join`, 
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success!', response.data.message);
            // After joining, refresh the list to reflect any changes (e.g., status updates)
            fetchChallenges(selectedUnitKey); 
        } catch (err) {
            const message = err.response?.data?.message || 'Could not join the challenge. Ensure you have submitted recent data for this challenge type.';
            Alert.alert('Failed to Join', message);
            console.error('Join Error:', message);
        } finally {
            setLoading(false);
        }
    };
    // --- END Handle Join Challenge ---

    // --- NEW Filter Component Renderer (Step 1.2 - Filter UI) ---
    const FilterBar = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBarContainer}
        >
            {CHALLENGE_UNITS.map((item) => (
                <TouchableOpacity
                    key={item.key}
                    style={[
                        styles.filterButton,
                        selectedUnitKey === item.key && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedUnitKey(item.key)}
                    disabled={loading}
                >
                    <MaterialCommunityIcons 
                        name={item.icon} 
                        size={18} 
                        color={selectedUnitKey === item.key ? styles.filterButtonActiveText.color : styles.filterButtonText.color}
                    />
                    <Text style={[
                        styles.filterButtonText, 
                        selectedUnitKey === item.key && styles.filterButtonActiveText
                    ]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
    // --- END NEW Filter Component ---

    const renderChallengeItem = ({ item }) => {
        const icon = getChallengeIcon(item.unit);
        return (
            <View style={styles.challengeCard}>
                <View style={styles.headerRow}>
                    <View style={[styles.iconCircle, { backgroundColor: icon.color + '15' }]}>
                        <MaterialCommunityIcons name={icon.name} size={30} color={icon.color} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.challengeTitle}>{item.title}</Text>
                        <Text style={styles.challengeUnit}>{item.unit.toUpperCase()} Reduction Challenge</Text>
                    </View>
                </View>

                <Text style={styles.challengeDescription}>{item.description}</Text>
                
                <View style={styles.detailBox}>
                    <View style={styles.detailRow}>
                        {/* MaterialCommunityIcons name="target-arrow" is not valid. Changed to target-variant */}
                        <MaterialCommunityIcons name="target-variant" size={16} color="#2c3e50" /> 
                        <Text style={styles.challengeDetailValue}>
                            Goal: <Text style={styles.goalText}>{item.goal} {item.unit}</Text>
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#2c3e50" />
                        <Text style={styles.challengeDetailValue}>
                            Ends: {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={styles.joinButton} 
                    onPress={() => handleJoinChallenge(item._id, item.title)}
                    disabled={loading}
                >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.joinButtonText}>Enroll Now</Text>
                </TouchableOpacity>

            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a202c" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Available Eco-Challenges</Text>
            </View>
            {/* --- END HEADER --- */}

            <FilterBar /> {/* NEW FILTER BAR */}

            {loading && !challenges.length ? (
                <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingContainer} />
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={30} color="red" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : challenges.length === 0 ? (
                <Text style={styles.noChallengesText}>
                    {selectedUnitKey === 'All' ? 
                        "No active challenges available right now." :
                        `No active challenges found for ${getUnitValue(selectedUnitKey).toUpperCase()}.`
                    }
                </Text>
            ) : (
                <FlatList
                    data={challenges}
                    keyExtractor={(item) => item._id}
                    renderItem={renderChallengeItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
    },
    // --- Header Styles (Adjusted for Clean Look) ---
    header: {
        paddingHorizontal: 16,
        paddingTop: 40, 
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        zIndex: 10,
        padding: 5,
        backgroundColor: '#f0f4f8', 
        borderRadius: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a202c',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    // --- NEW Filter Bar Styles ---
    filterBarContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    filterButtonActive: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    filterButtonText: {
        color: '#2c3e50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    filterButtonActiveText: {
        color: '#ffffff',
    },
    // --- End Filter Bar Styles ---
    
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    challengeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
        borderLeftWidth: 6,
        borderLeftColor: '#4CAF50',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    titleContainer: {
        flex: 1,
    },
    challengeTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2c3e50',
        marginBottom: 2,
    },
    challengeUnit: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    challengeDescription: {
        fontSize: 15,
        color: '#495057',
        marginBottom: 20,
        lineHeight: 22,
    },
    detailBox: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    challengeDetailValue: {
        fontSize: 14,
        color: '#2c3e50',
        marginLeft: 10,
        fontWeight: '500',
    },
    goalText: {
        fontWeight: '700',
        color: '#4CAF50',
    },
    noChallengesText: {
        fontSize: 18,
        textAlign: 'center',
        color: '#6c757d',
        marginTop: 50,
        paddingHorizontal: 30,
    },
    joinButton: {
        backgroundColor: '#4A90E2',
        padding: 14,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    joinButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        marginLeft: 10,
    },
});