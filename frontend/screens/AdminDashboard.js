import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Dimensions,
    StatusBar,
    ScrollView,
    Image
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import config from '../config';

const { width, height } = Dimensions.get('window');
const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const CHALLENGE_STATS_URL = `http://${config.IP}:${config.PORT}/api/challenges/stats/active/count`; // NEW ENDPOINT
const TOKEN_KEY = 'userToken';

// --- Helper Components ---

// Elegant Loading Component (Remains unchanged)
const ElegantLoader = () => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const spin = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 0.8,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        );

        spin.start();
        pulse.start();

        return () => {
            spin.stop();
            pulse.stop();
        };
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
                <Animated.View
                    style={[
                        styles.loaderCircle,
                        {
                            transform: [{ rotate: spin }, { scale: scaleValue }]
                        }
                    ]}
                >
                    <MaterialCommunityIcons name="shield-crown" size={32} color="#667EEA" />
                </Animated.View>
                <Text style={styles.loadingText}>Verifying Access...</Text>
            </View>
        </View>
    );
};

// User Avatar, Info Card, Action Button (Removed from response for brevity, assumed unchanged logic)
// ...

// Dashboard Stats Card Component (Now Clickable and Dynamic for Challenges)
const NavigableStatsCard = ({ title, subtitle, icon, color, delay, count, isCountLoading, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statsCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ width: '100%' }}>
                <View style={[styles.statsCardContent, { backgroundColor: color.bg }]}>
                    <View style={styles.dynamicCountContainer}>
                        {isCountLoading ? (
                            <ActivityIndicator size="small" color={color.icon} />
                        ) : (
                            <Text style={[styles.dynamicCountText, { color: color.icon }]}>{count}</Text>
                        )}
                    </View>
                    
                    <View style={[styles.statsIconContainer, { backgroundColor: color.iconBg }]}>
                        <MaterialCommunityIcons name={icon} size={24} color={color.icon} />
                    </View>
                    <View style={styles.statsTextContainer}>
                        <Text style={styles.statsTitle}>{title}</Text>
                        <Text style={styles.statsSubtitle}>{subtitle}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};


// Static StatsCard for comparison (renamed to avoid conflict)
const StandardStatsCard = ({ title, subtitle, icon, color, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statsCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={[styles.statsCardContent, { backgroundColor: color.bg }]}>
                <View style={[styles.statsIconContainer, { backgroundColor: color.iconBg }]}>
                    <MaterialCommunityIcons name={icon} size={24} color={color.icon} />
                </View>
                <View style={styles.statsTextContainer}>
                    <Text style={styles.statsTitle}>{title}</Text>
                    <Text style={styles.statsSubtitle}>{subtitle}</Text>
                </View>
            </View>
        </Animated.View>
    );
};


// Profile Avatar Component (Remains unchanged)
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
                <View style={styles.adminIndicator}>
                    <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.avatarContainer}>
            <View style={styles.defaultAvatar}>
                <MaterialCommunityIcons name="account-tie" size={32} color="#667EEA" />
            </View>
            <View style={styles.adminIndicator}>
                <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
            </View>
        </View>
    );
});

// Action Button Component (Remains unchanged)
const ActionButton = ({ title, icon, iconLibrary = 'MaterialCommunityIcons', onPress, variant = 'primary', delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const IconComponent = iconLibrary === 'Ionicons' ? Ionicons : 
                       iconLibrary === 'Feather' ? Feather : MaterialCommunityIcons;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 40,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    const getButtonConfig = () => {
        switch (variant) {
            case 'primary':
                return {
                    bg: '#4CAF50',
                    shadowColor: '#4CAF50'
                };
            case 'secondary':
                return {
                    bg: '#667EEA',
                    shadowColor: '#667EEA'
                };
            case 'profile':
                return {
                    bg: '#2196F3',
                    shadowColor: '#2196F3'
                };
            case 'danger':
                return {
                    bg: '#EF4444',
                    shadowColor: '#EF4444'
                };
            default:
                return {
                    bg: '#4CAF50',
                    shadowColor: '#4CAF50'
                };
        }
    };

    const buttonConfig = getButtonConfig();

    return (
        <Animated.View
            style={[
                styles.actionButtonContainer,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[
                    styles.actionButton,
                    {
                        backgroundColor: buttonConfig.bg,
                        shadowColor: buttonConfig.shadowColor,
                    }
                ]}
            >
                <View style={styles.actionButtonContent}>
                    <View style={styles.actionButtonIcon}>
                        <IconComponent name={icon} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionButtonText}>{title}</Text>
                    <View style={styles.actionButtonArrow}>
                        <Feather name="chevron-right" size={16} color="#FFFFFF" />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function AdminDashboard({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeChallengesCount, setActiveChallengesCount] = useState(0);
    const [isCountLoading, setIsCountLoading] = useState(true);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-50)).current;

    // --- New: Fetch Active Challenge Count ---
    const fetchActiveChallengesCount = useCallback(async () => {
        setIsCountLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) return;

            const response = await axios.get(CHALLENGE_STATS_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setActiveChallengesCount(response.data.data.activeCount);
        } catch (error) {
            // Log error but don't stop dashboard loading
            console.error('Error fetching active challenge count:', error.response?.data || error.message);
            setActiveChallengesCount('?');
        } finally {
            setIsCountLoading(false);
        }
    }, []);
    // ----------------------------------------

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
                    navigation.replace('Login');
                    return;
                }

                const response = await axios.get(`${API_URL}/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.data.user.role !== 'Admin') {
                    Alert.alert('Access Denied', 'You do not have permission to view this page.');
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    navigation.replace('Login');
                } else {
                    setUser(response.data.data.user);
                    // Start header animations after user is loaded
                    Animated.parallel([
                        Animated.timing(fadeAnim, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.spring(headerSlide, {
                            toValue: 0,
                            tension: 50,
                            friction: 8,
                            useNativeDriver: true,
                        })
                    ]).start();
                    
                    // Fetch challenge count immediately after successful authentication
                    fetchActiveChallengesCount();
                }
            } catch (error) {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
        
        // Polling to keep stats live (runs every 30 seconds)
        const intervalId = setInterval(fetchActiveChallengesCount, 30000); 
        return () => clearInterval(intervalId); // Cleanup interval
    }, [navigation, fetchActiveChallengesCount]);

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        Alert.alert('Success', 'You have been successfully logged out.');
                        navigation.replace('Login');
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        if (user) {
            navigation.navigate('EditAdminProfile', { 
                admin: user,
                onPasswordChangeSuccess: handlePasswordChangeSuccess 
            });
        }
    };

    const handlePasswordChangeSuccess = async () => {
        Alert.alert(
            'Password Changed Successfully',
            'Your password has been updated successfully. You will be logged out for security purposes.',
            [
                {
                    text: 'OK',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        navigation.replace('Login');
                    }
                }
            ],
            { cancelable: false }
        );
    };

    // --- Navigation Handler for Challenge Card ---
    const navigateToManageChallenges = useCallback(() => {
        navigation.navigate('ManageChallenges');
    }, [navigation]);
    // ------------------------------------------

    if (loading) {
        return <ElegantLoader />;
    }

    const currentHour = new Date().getHours();
    const getGreeting = () => {
        if (currentHour < 12) return 'Good Morning';
        if (currentHour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Header */}
                <Animated.View
                    style={[
                        styles.heroSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: headerSlide }]
                        }
                    ]}
                >
                    <View style={styles.heroContent}>
                        <Text style={styles.heroGreeting}>{getGreeting()}</Text>
                        <Text style={styles.heroTitle}>{user?.name || 'Administrator'}</Text>
                        <View style={styles.adminBadge}>
                            <MaterialCommunityIcons name="shield-crown" size={16} color="#667EEA" />
                            <Text style={styles.adminBadgeText}>Admin Dashboard</Text>
                        </View>
                    </View>
                    <ProfileAvatar user={user} />
                </Animated.View>

                {/* Admin Info Card */}
                <Animated.View
                    style={[
                        styles.infoCard,
                        { 
                            opacity: fadeAnim,
                            transform: [{ translateY: headerSlide }]
                        }
                    ]}
                >
                    <View style={styles.infoHeader}>
                        <MaterialCommunityIcons name="account-cog" size={24} color="#667EEA" />
                        <Text style={styles.infoTitle}>Administrator Profile</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="email" size={16} color="#8F9BB3" />
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{user?.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="shield-check" size={16} color="#8F9BB3" />
                            <Text style={styles.infoLabel}>Role</Text>
                            <Text style={styles.infoValue}>{user?.role}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="clock" size={16} color="#8F9BB3" />
                            <Text style={styles.infoLabel}>Status</Text>
                            <View style={styles.statusContainer}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Active</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Edit Profile Button in Info Card */}
                    <TouchableOpacity
                        onPress={handleEditProfile}
                        activeOpacity={0.8}
                        style={styles.editProfileButton}
                    >
                        <MaterialCommunityIcons name="account-edit" size={18} color="#FFFFFF" />
                        <Text style={styles.editProfileButtonText}>Edit Admin Profile</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Dashboard Overview</Text>
                    <View style={styles.statsGrid}>
                        {/* --- ACTIVE CHALLENGES CARD (Navigable) --- */}
                        <NavigableStatsCard
                            title="Active Challenges"
                            subtitle="Manage & Monitor"
                            icon="target"
                            color={{ 
                                bg: '#f0fff4', 
                                iconBg: '#c6f6d5', 
                                icon: '#4CAF50' 
                            }}
                            delay={200}
                            count={activeChallengesCount}
                            isCountLoading={isCountLoading}
                            onPress={navigateToManageChallenges}
                        />
                        {/* --- USER ENGAGEMENT CARD (Standard) --- */}
                        <StandardStatsCard
                            title="User Engagement"
                            subtitle="Track Progress"
                            icon="chart-bar"
                            color={{ 
                                bg: '#fef7e0', 
                                iconBg: '#fbd38d', 
                                icon: '#FF9800' 
                            }}
                            delay={400}
                        />
                    </View>
                </View>

                {/* Action Buttons Section */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Administrative Actions</Text>
                    
                    <ActionButton
                        title="Add New Challenge"
                        icon="plus-circle"
                        onPress={() => navigation.navigate('AddChallenge')}
                        variant="primary"
                        delay={500}
                    />
                    
                    <ActionButton
                        title="Manage Challenges"
                        icon="cog"
                        onPress={navigateToManageChallenges}
                        variant="secondary"
                        delay={600}
                    />

                    <ActionButton
                        title="Register New User"
                        icon="account-plus"
                        onPress={() => navigation.navigate('AdminRegistration')}
                        variant="secondary"
                        delay={700}
                    />

                    <ActionButton
                        title="Manage Users"
                        icon="account-group"
                        onPress={() => navigation.navigate('ManageUsers')}
                        variant="secondary"
                        delay={800}
                    />
                           
                    <ActionButton
                        title="Sign Out"
                        icon="logout"
                        onPress={handleLogout}
                        variant="danger"
                        delay={900}
                    />
                </View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <Text style={styles.footerText}>Eco Pulse Admin Panel</Text>
                    <Text style={styles.footerSubtext}>Powered by sustainable technology</Text>
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
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 30,
    },
    // Loading Styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loaderCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    loadingText: {
        fontSize: 16,
        color: '#718096',
        fontWeight: '500',
    },
    // Hero Section
    heroSection: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroContent: {
        flex: 1,
    },
    heroGreeting: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: 8,
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7fafc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    adminBadgeText: {
        color: '#667EEA',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    // Avatar Styles
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: '#667EEA',
    },
    defaultAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f7fafc',
        borderWidth: 3,
        borderColor: '#667EEA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f8fafc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    // Info Card
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
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a202c',
        marginLeft: 12,
    },
    infoContent: {
        gap: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
        marginLeft: 12,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#1a202c',
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    // Edit Profile Button in Info Card
    editProfileButton: {
        backgroundColor: '#667EEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    editProfileButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Stats Section
    statsSection: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 16,
        marginLeft: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statsCard: {
        flex: 1,
    },
    statsCardContent: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative', // For dynamic count
        minHeight: 140, // Ensure minimum size
    },
    statsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statsTextContainer: {
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a202c',
        textAlign: 'center',
        marginBottom: 4,
    },
    statsSubtitle: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
    },
    // --- New Dynamic Count Styles ---
    dynamicCountContainer: {
        position: 'absolute',
        top: 15,
        left: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 2,
        borderColor: '#c6f6d5',
    },
    dynamicCountText: {
        fontSize: 18,
        fontWeight: '900',
    },
    // --- End New Dynamic Count Styles ---

    // Actions Section
    actionsSection: {
        marginTop: 32,
        paddingHorizontal: 16,
    },
    actionButtonContainer: {
        marginBottom: 16,
    },
    actionButton: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    actionButtonIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    actionButtonArrow: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
        marginTop: 20,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#718096',
        opacity: 0.8,
    },
});
