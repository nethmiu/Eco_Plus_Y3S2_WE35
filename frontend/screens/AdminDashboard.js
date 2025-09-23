import React, { useState, useEffect, useRef } from 'react';
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
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import config from '../config';

const { width, height } = Dimensions.get('window');
const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const TOKEN_KEY = 'userToken';

// Elegant Loading Component
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
        <View style={styles.loaderContainer}>
            <LinearGradient
                colors={['#E8F5E8', '#F0F8F0']}
                style={styles.loaderGradient}
            >
                <Animated.View
                    style={[
                        styles.loaderCircle,
                        {
                            transform: [{ rotate: spin }, { scale: scaleValue }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#388E3C', '#2E7D32']}
                        style={styles.loaderInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </Animated.View>
                <Text style={styles.loaderText}>Verifying Access...</Text>
            </LinearGradient>
        </View>
    );
};

// Dashboard Stats Card Component
const StatsCard = ({ title, subtitle, icon, color, delay }) => {
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
            <LinearGradient
                colors={[color.light, color.main]}
                style={styles.statsCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.statsIconContainer}>
                    <Text style={styles.statsIcon}>{icon}</Text>
                </View>
                <View style={styles.statsTextContainer}>
                    <Text style={styles.statsTitle}>{title}</Text>
                    <Text style={styles.statsSubtitle}>{subtitle}</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

// Action Button Component
const ActionButton = ({ title, icon, onPress, variant = 'primary', delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

    const getButtonStyle = () => {
        switch (variant) {
            case 'primary':
                return {
                    colors: ['#4CAF50', '#388E3C', '#2E7D32'],
                    shadowColor: '#4CAF50'
                };
            case 'secondary':
                return {
                    colors: ['#FF9800', '#F57C00', '#E65100'],
                    shadowColor: '#FF9800'
                };
            case 'danger':
                return {
                    colors: ['#F44336', '#D32F2F', '#C62828'],
                    shadowColor: '#F44336'
                };
            default:
                return {
                    colors: ['#4CAF50', '#388E3C', '#2E7D32'],
                    shadowColor: '#4CAF50'
                };
        }
    };

    const buttonConfig = getButtonStyle();

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
                        shadowColor: buttonConfig.shadowColor,
                    }
                ]}
            >
                <LinearGradient
                    colors={buttonConfig.colors}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.actionButtonIcon}>
                        <Text style={styles.actionButtonIconText}>{icon}</Text>
                    </View>
                    <Text style={styles.actionButtonText}>{title}</Text>
                    <View style={styles.actionButtonArrow}>
                        <Text style={styles.actionButtonArrowText}>→</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function AdminDashboard({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-50)).current;

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
                }
            } catch (error) {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

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
        <>
            <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
            <SafeAreaView style={styles.safeArea}>
                <LinearGradient
                    colors={['#E8F5E8', '#F1F8E9', '#F9FBE7']}
                    style={styles.container}
                >
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Header Section */}
                        <Animated.View
                            style={[
                                styles.header,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: headerSlide }]
                                }
                            ]}
                        >
                            <LinearGradient
                                colors={['#2E7D32', '#388E3C', '#4CAF50']}
                                style={styles.headerGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.headerContent}>
                                    <View style={styles.headerText}>
                                        <Text style={styles.greeting}>{getGreeting()}</Text>
                                        <Text style={styles.adminName}>{user?.name || 'Administrator'}</Text>
                                        <View style={styles.adminBadge}>
                                            <Text style={styles.adminBadgeText}>👑 Admin</Text>
                                        </View>
                                    </View>
                                    <View style={styles.headerIcon}>
                                        <View style={styles.avatarContainer}>
                                            <LinearGradient
                                                colors={['#66BB6A', '#4CAF50']}
                                                style={styles.avatar}
                                            >
                                                <Text style={styles.avatarText}>
                                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                                                </Text>
                                            </LinearGradient>
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>

                        {/* Stats Section */}
                        <View style={styles.statsSection}>
                            <Text style={styles.sectionTitle}>Dashboard Overview</Text>
                            <View style={styles.statsGrid}>
                                <StatsCard
                                    title="Active Challenges"
                                    subtitle="Manage & Monitor"
                                    icon="🎯"
                                    color={{ light: '#E8F5E8', main: '#C8E6C9' }}
                                    delay={200}
                                />
                                <StatsCard
                                    title="User Engagement"
                                    subtitle="Track Progress"
                                    icon="📊"
                                    color={{ light: '#FFF3E0', main: '#FFE0B2' }}
                                    delay={400}
                                />
                            </View>
                        </View>

                        {/* Action Buttons Section */}
                        <View style={styles.actionsSection}>
                            <Text style={styles.sectionTitle}>Administrative Actions</Text>
                            
                            <ActionButton
                                title="Add New Challenge"
                                icon="➕"
                                onPress={() => navigation.navigate('AddChallenge')}
                                variant="primary"
                                delay={600}
                            />
                            
                            <ActionButton
                                title="Manage Challenges"
                                icon="⚙️"
                                onPress={() => navigation.navigate('ManageChallenges')}
                                variant="secondary"
                                delay={800}
                            />

                            <ActionButton
                                title="Register New User"
                                icon="⚙️"
                                onPress={() => navigation.navigate('AdminRegistration')}
                                variant="secondary"
                                delay={800}
                            />
                            
                            <ActionButton
                                title="Sign Out"
                                icon="🚪"
                                onPress={handleLogout}
                                variant="danger"
                                delay={1000}
                            />
                        </View>

                        {/* Footer */}
                        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                            <Text style={styles.footerText}>Eco Pulse Admin Panel</Text>
                            <Text style={styles.footerSubtext}>Powered by sustainable technology</Text>
                        </Animated.View>
                    </ScrollView>
                </LinearGradient>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#2E7D32',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    // Loader Styles
    loaderContainer: {
        flex: 1,
    },
    loaderGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 20,
    },
    loaderInner: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        opacity: 0.8,
    },
    loaderText: {
        fontSize: 16,
        color: '#2E7D32',
        fontWeight: '500',
    },
    // Header Styles
    header: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    headerGradient: {
        padding: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerText: {
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    adminName: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '700',
        marginBottom: 8,
    },
    adminBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    adminBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    headerIcon: {
        marginLeft: 16,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Stats Section
    statsSection: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2E7D32',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statsCard: {
        flex: 1,
        marginHorizontal: 6,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    statsCardGradient: {
        padding: 20,
        alignItems: 'center',
    },
    statsIconContainer: {
        marginBottom: 12,
    },
    statsIcon: {
        fontSize: 32,
    },
    statsTextContainer: {
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 4,
    },
    statsSubtitle: {
        fontSize: 12,
        color: '#52796F',
        textAlign: 'center',
    },
    // Actions Section
    actionsSection: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    actionButtonContainer: {
        marginBottom: 16,
    },
    actionButton: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    actionButtonIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionButtonIconText: {
        fontSize: 18,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    actionButtonArrow: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonArrowText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
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
        color: '#2E7D32',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#52796F',
        opacity: 0.8,
    },
});