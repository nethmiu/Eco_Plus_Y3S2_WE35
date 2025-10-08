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

// Safe Text component to prevent errors
const SafeText = ({ children, style, ...props }) => {
    if (children === null || children === undefined) {
        return null;
    }
    
    // Ensure children is a string or number
    const textContent = typeof children === 'string' || typeof children === 'number' 
        ? children 
        : String(children);
    
    return (
        <Text style={style} {...props}>
            {textContent}
        </Text>
    );
};

export default function EnvironmentalistDashboard({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                setError(null);
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
                    // Ensure all user data is properly formatted
                    const userData = response.data.data.user;
                    const sanitizedUser = {
                        ...userData,
                        name: userData.name || 'Environmentalist',
                        email: userData.email || '',
                        city: userData.city || '',
                        expertise: userData.expertise || '',
                        organization: userData.organization || '',
                        bio: userData.bio || '',
                        yearsOfExperience: userData.yearsOfExperience || '',
                        photo: userData.photo || ''
                    };
                    setUser(sanitizedUser);
                }

            } catch (error) {
                console.error('Token verification error:', error);
                setError(error.message);
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
                <SafeText style={styles.loadingText}>Loading dashboard...</SafeText>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={50} color="#dc3545" />
                <SafeText style={styles.errorText}>Error loading dashboard</SafeText>
                <SafeText style={styles.errorSubtext}>{error}</SafeText>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.replace('Login')}>
                    <SafeText style={styles.retryButtonText}>Return to Login</SafeText>
                </TouchableOpacity>
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
                                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                            />
                        ) : (
                            <View style={styles.profileIcon}>
                                <Ionicons name="leaf" size={40} color="#4CAF50" />
                            </View>
                        )}
                        <View style={styles.welcomeSection}>
                            <SafeText style={styles.userName}>{user?.name}</SafeText>
                            <SafeText style={styles.userRole}>Environmental Specialist</SafeText>
                        </View>
                    </View>
                </View>

                {/* Profile Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle-outline" size={24} color="#4CAF50" />
                        <SafeText style={styles.cardTitle}>Profile Overview</SafeText>
                    </View>
                    <View style={styles.profileDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="mail-outline" size={16} color="#666" />
                            <SafeText style={styles.detailText}>{user?.email}</SafeText>
                        </View>
                        {user?.city ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={16} color="#666" />
                                <SafeText style={styles.detailText}>{user.city}</SafeText>
                            </View>
                        ) : null}
                        {user?.expertise ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="school-outline" size={16} color="#666" />
                                <SafeText style={styles.detailText}>{user.expertise}</SafeText>
                            </View>
                        ) : null}
                        {user?.organization ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="briefcase-outline" size={16} color="#666" />
                                <SafeText style={styles.detailText}>{user.organization}</SafeText>
                            </View>
                        ) : null}
                        {user?.yearsOfExperience ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={16} color="#666" />
                                <SafeText style={styles.detailText}>{user.yearsOfExperience} years experience</SafeText>
                            </View>
                        ) : null}
                    </View>
                </View>

                 {/* Professional Bio Card */}
                {user?.bio ? (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text-outline" size={24} color="#4CAF50" />
                            <SafeText style={styles.cardTitle}>Professional Bio</SafeText>
                        </View>
                        <SafeText style={styles.bioText}>{user.bio}</SafeText>
                    </View>
                ) : null}

                {/* Quick Actions Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="settings-outline" size={24} color="#4CAF50" />
                        <SafeText style={styles.cardTitle}>Quick Actions</SafeText>
                    </View>
                    
                    {/* Edit Profile Button */}
                    <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
                        <View style={styles.actionButtonContent}>
                            <View style={styles.actionIconContainer}>
                                <Ionicons name="create-outline" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <SafeText style={styles.actionTitle}>Edit Profile</SafeText>
                                <SafeText style={styles.actionSubtitle}>Update your environmental profile information</SafeText>
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
                                <SafeText style={styles.actionTitle}>Environmental Reports</SafeText>
                                <SafeText style={styles.actionSubtitle}>View and manage your environmental reports</SafeText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </View>
                    </TouchableOpacity>

                    {/* Another placeholder action */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Coming Soon', 'This feature will be available in future updates.')}>
                        <View style={styles.actionButtonContent}>
                            <View style={styles.actionIconContainer}>
                                <Ionicons name="people-outline" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <SafeText style={styles.actionTitle}>Community</SafeText>
                                <SafeText style={styles.actionSubtitle}>Connect with other environmentalists</SafeText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View style={styles.card}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                        <SafeText style={styles.logoutButtonText}>Sign Out</SafeText>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#dc3545',
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    bioText: {
        fontSize: 16,
        color: '#495057',
        lineHeight: 24,
        fontStyle: 'italic',
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