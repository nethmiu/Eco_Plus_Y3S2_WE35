import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Animated,
    Dimensions,
    SafeAreaView,
    Image
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api`;
const TOKEN_KEY = 'userToken';
const { width, height } = Dimensions.get('window');

// Move ActionButton component outside to prevent re-creation
const ActionButton = React.memo(({ 
    title, 
    onPress, 
    icon, 
    iconLibrary = 'Ionicons', 
    variant = 'primary', 
    style 
}) => {
    const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : 
                       iconLibrary === 'Feather' ? Feather :
                       iconLibrary === 'FontAwesome5' ? FontAwesome5 : Ionicons;

    return (
        <TouchableOpacity 
            style={[
                styles.actionButton,
                variant === 'primary' ? styles.primaryButton : 
                variant === 'secondary' ? styles.secondaryButton :
                variant === 'danger' ? styles.dangerButton : styles.tertiaryButton,
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.buttonContent}>
                {icon && (
                    <IconComponent 
                        name={icon} 
                        size={20} 
                        color={
                            variant === 'primary' ? '#fff' : 
                            variant === 'secondary' ? '#fff' :
                            variant === 'danger' ? '#fff' : '#667EEA'
                        } 
                        style={styles.buttonIcon}
                    />
                )}
                <Text style={[
                    styles.buttonText,
                    variant === 'primary' ? styles.primaryButtonText : 
                    variant === 'secondary' ? styles.secondaryButtonText :
                    variant === 'danger' ? styles.dangerButtonText : styles.tertiaryButtonText
                ]}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

// Profile Avatar Component
const ProfileAvatar = React.memo(({ user }) => {
    const [imageError, setImageError] = useState(false);
    
    const getProfileImageUrl = () => {
        if (user?.photo && user.photo !== 'default.jpg') {
            return `http://${config.IP}:${config.PORT}/api/users/uploads/users/${user.photo}`;
        }
        return null;
    };

    const profileImageUrl = getProfileImageUrl();

    if (profileImageUrl && !imageError) {
        return (
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.profileImage}
                    onError={() => setImageError(true)}
                />
                <View style={styles.onlineIndicator} />
            </View>
        );
    }

    return (
        <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={48} color="#667EEA" />
        </View>
    );
});

// Info Card Component
const InfoCard = React.memo(({ user, onEditProfile }) => (
    <Animated.View style={styles.infoCard}>
        <View style={styles.cardHeader}>
            <ProfileAvatar user={user} />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                </View>
            </View>
        </View>
        
        <View style={styles.cardDivider} />
        
        <View style={styles.userDetails}>
            <InfoRow 
                icon="map-marker" 
                iconLibrary="MaterialCommunityIcons"
                label="City" 
                value={user?.city} 
            />
            <InfoRow 
                icon="home-account" 
                iconLibrary="MaterialCommunityIcons"
                label="Address" 
                value={user?.address} 
            />
            <InfoRow 
                icon="account-group" 
                iconLibrary="MaterialCommunityIcons"
                label="Household Members" 
                value={user?.householdMembers?.toString()} 
            />
        </View>

        <TouchableOpacity 
            style={styles.editProfileButton} 
            onPress={onEditProfile}
        >
            <MaterialCommunityIcons name="account-edit" size={18} color="#667EEA" />
            <Text style={styles.editProfileText}>Edit My Profile</Text>
        </TouchableOpacity>
    </Animated.View>
));

// Info Row Component
const InfoRow = React.memo(({ icon, iconLibrary, label, value }) => {
    const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : 
                       iconLibrary === 'Feather' ? Feather :
                       iconLibrary === 'FontAwesome5' ? FontAwesome5 : Ionicons;

    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
                <IconComponent name={icon} size={16} color="#8F9BB3" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
});

// Stats Card Component
const StatsCard = React.memo(() => (
    <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Impact</Text>
        <View style={styles.statsGrid}>
            <View style={styles.statItem}>
                <MaterialCommunityIcons name="leaf" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>Regularly</Text>
                <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
                <MaterialCommunityIcons name="recycle" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>Calculate</Text>
                <Text style={styles.statLabel}>Eco Score</Text>
            </View>
            
        </View>
    </View>
));

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    useEffect(() => {
        // navigation focus listener එකක් එකතු කිරීම
        const unsubscribe = navigation.addListener('focus', () => {
            fetchUserData(); // Screen එක focus වන සෑම විටම දත්ත නැවත ලබාගැනීම
        });

        fetchUserData(); // පළමු වරට දත්ත ලබාගැනීම

        return unsubscribe; // component unmount වන විට listener එක ඉවත් කිරීම
    }, [navigation]);

    useEffect(() => {
        if (!loading) {
            // Animate on data load
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [loading]);

    const fetchUserData = async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                navigation.replace('Login');
                return;
            }
            const response = await axios.get(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(response.data.data.user);
        } catch (error) {
            console.error(error.response?.data || error.message);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            navigation.replace('Login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = useCallback(async () => {
        Alert.alert(
            'Confirm Sign out',
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
                        Alert.alert('Logged Out', 'You logged out Successfully.');
                        navigation.replace('Login');
                    },
                },
            ]
        );
    }, [navigation]);

    const handleConsumptions = useCallback(() => {
        navigation.navigate('ElectricityData');
    }, [navigation]);

    const handleSustainabilityProfile = useCallback(() => {
        navigation.navigate('SustainabilityProfile');
    }, [navigation]);
    const navigateToDashboard = useCallback(() => {
        navigation.navigate('Dashboard'); 
    }, [navigation]);

    const navigateToProfile = useCallback(() => {
        navigation.navigate('Profile', { user: user });
    }, [navigation, user]);



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <MaterialCommunityIcons name="recycle" size={48} color="#667EEA" />
                    <ActivityIndicator size="large" color="#667EEA" style={styles.loadingSpinner} />
                    <Text style={styles.loadingText}>Loading your dashboard...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header */}
                <Animated.View 
                    style={[
                        styles.heroSection,
                        { 
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Welcome back, {user?.name}!</Text>
                        <Text style={styles.heroSubtitle}>Let's track your sustainability journey</Text>
                    </View>
                </Animated.View>

                {/* User Info Card */}
                <Animated.View 
                    style={[
                        { opacity: fadeAnim },
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <InfoCard user={user} onEditProfile={navigateToProfile} />
                </Animated.View>

                {/* Stats Card */}
                <Animated.View 
                    style={[
                        { opacity: fadeAnim },
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <StatsCard />
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View 
                    style={[
                        styles.actionsSection,
                        { 
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <ActionButton
                        title="Setup Profile"
                        onPress={handleSustainabilityProfile}
                        icon="leaf-circle"   
                        iconLibrary="MaterialCommunityIcons"
                        variant="primary"
                        style={styles.getStartedButton}
                    />

                    <ActionButton
                        title="Add Consumption Data"
                        onPress={handleConsumptions}
                        icon="chart-areaspline"  
                        iconLibrary="MaterialCommunityIcons"
                        variant="primary"
                        style={styles.getStartedButton}
                    />
                     <ActionButton
                        title="View My Eco Dashboard"
                        onPress={navigateToDashboard} 
                        icon="view-dashboard"
                        iconLibrary="MaterialCommunityIcons"
                        variant="secondary" 
                        style={styles.challengesButton} 
                    />
                    
                    {/* The "View Challenges" button is removed here. */}

                    <ActionButton
                        title="View Leaderboard"
                        onPress={navigateToLeaderboard}
                        icon="chart-bar"
                        iconLibrary="MaterialCommunityIcons"
                        variant="secondary"
                        style={[styles.challengesButton, { backgroundColor: '#FF9800' }]} 
                    />
                    
                    <ActionButton
                        title="Sing out"
                        onPress={handleLogout}
                        icon="logout"
                        iconLibrary="MaterialCommunityIcons"
                        variant="danger"
                        style={styles.logoutButton}
                    />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingSpinner: {
        marginTop: 16,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#718096',
        fontWeight: '500',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 30,
    },
    heroSection: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a202c',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f7fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
        borderWidth: 3,
        borderColor: '#667EEA',
    },
    profileImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        resizeMode: 'cover',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fff4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#2d7738',
        fontWeight: '600',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginBottom: 20,
    },
    userDetails: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f7fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#8F9BB3',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#2d3748',
        fontWeight: '600',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7fafc',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    editProfileText: {
        fontSize: 16,
        color: '#667EEA',
        fontWeight: '600',
        marginLeft: 8,
    },
    statsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 20,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a202c',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
        fontWeight: '500',
    },
    actionsSection: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 20,
        marginLeft: 4,
    },
    actionButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    secondaryButton: {
        backgroundColor: '#667EEA',
    },
    dangerButton: {
        backgroundColor: '#EF4444',
    },
    tertiaryButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#fff',
    },
    secondaryButtonText: {
        color: '#fff',
    },
    dangerButtonText: {
        color: '#fff',
    },
    tertiaryButtonText: {
        color: '#667EEA',
    },
    getStartedButton: {
        marginBottom: 12,
    },
    challengesButton: {
        marginBottom: 12,
    },
    logoutButton: {
        marginBottom: 0,
    },
});