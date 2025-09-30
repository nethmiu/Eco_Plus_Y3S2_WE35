import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const TOKEN_KEY = 'userToken';

export default function EnvironmentalistDashboard({ navigation }) {
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

                // Check if the user role is correct
                if (response.data.data.user.role !== 'Environmentalist') {
                    Alert.alert('Access Denied', 'You do not have permission to view this page.');
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    navigation.replace('Login');
                } else {
                    setUser(response.data.data.user);
                }

            } catch (error) {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [navigation]);

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        Alert.alert('Logged Out', 'You have been successfully logged out.');
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    const handleEditProfile = () => {
        navigation.navigate('EditEnvProfile', { user });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.profileSection}>
                        {user?.photo && user.photo !== 'default.jpg' ? (
                            <Image 
                                source={{ uri: `http://${config.IP}:${config.PORT}/api/users/uploads/users/${user.photo}` }} 
                                style={styles.profileImage} 
                            />
                        ) : (
                            <View style={styles.profileIcon}>
                                <Ionicons name="leaf" size={40} color="#4CAF50" />
                            </View>
                        )}
                        <View style={styles.welcomeSection}>
                            
                            <Text style={styles.userName}>{user?.name || 'Environmentalist'}</Text>
                            <Text style={styles.userRole}>Environmental Specialist</Text>
                        </View>
                    </View>
                </View>

                {/* Profile Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle-outline" size={24} color="#4CAF50" />
                        <Text style={styles.cardTitle}>Profile Overview</Text>
                    </View>
                    <View style={styles.profileDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="mail-outline" size={16} color="#666" />
                            <Text style={styles.detailText}>{user?.email}</Text>
                        </View>
                        {user?.city && (
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{user.city}</Text>
                            </View>
                        )}
                        {user?.expertise && (
                            <View style={styles.detailRow}>
                                <Ionicons name="school-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{user.expertise}</Text>
                            </View>
                        )}
                        {user?.organization && (
                            <View style={styles.detailRow}>
                                <Ionicons name="briefcase-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{user.organization}</Text>
                            </View>
                        )}
                        {user?.yearsOfExperience && (
                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{user.yearsOfExperience} years experience</Text>
                            </View>
                        )}
                    </View>
                </View>

                 {/* Professional Bio Card */}
                {user?.bio && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text-outline" size={24} color="#4CAF50" />
                            <Text style={styles.cardTitle}>Professional Bio</Text>
                        </View>
                        <Text style={styles.bioText}>{user.bio}</Text>
                    </View>
                )}

                {/* Quick Actions Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="settings-outline" size={24} color="#4CAF50" />
                        <Text style={styles.cardTitle}>Quick Actions</Text>
                    </View>
                    
                    {/* Edit Profile Button */}
                    <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
                        <View style={styles.actionButtonContent}>
                            <View style={styles.actionIconContainer}>
                                <Ionicons name="create-outline" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>Edit Profile</Text>
                                <Text style={styles.actionSubtitle}>Update your environmental profile information</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </View>
                    </TouchableOpacity>

                    {/* Placeholder for future actions */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Coming Soon', 'This feature will be available in future updates.')}>
                        <View style={styles.actionButtonContent}>
                            <View style={styles.actionIconContainer}>
                                <Ionicons name="bar-chart-outline" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>Environmental Reports</Text>
                                <Text style={styles.actionSubtitle}>View and manage your environmental reports</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </View>
                    </TouchableOpacity>

                    
                </View>

               

                {/* Logout Button */}
                <View style={styles.card}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                        <Text style={styles.logoutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
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
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#4CAF50',
        marginRight: 20,
    },
    profileIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#4CAF50',
        marginRight: 20,
    },
    welcomeSection: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
    },
    userRole: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 10,
    },
    profileDetails: {
        paddingTop: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 16,
        color: '#495057',
        marginLeft: 12,
        flex: 1,
    },
    actionButton: {
        marginBottom: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        overflow: 'hidden',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F8F9FA',
    },
    actionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E8F5E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    bioText: {
        fontSize: 16,
        color: '#495057',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc3545',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});