import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, 
    Alert, TouchableOpacity, SafeAreaView, Dimensions, Image, StatusBar
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/challenges/leaderboard`;
const TOKEN_KEY = 'userToken';
const { width } = Dimensions.get('window');

// --- Helper Components ---

// Medal Icon component
const Medal = React.memo(({ rank }) => {
    let iconName = 'trophy';
    let color = '#d1d5db'; 
    if (rank === 1) {
        iconName = 'trophy-variant';
        color = '#FFD700'; // Gold
    } else if (rank === 2) {
        iconName = 'trophy-variant';
        color = '#C0C0C0'; // Silver
    } else if (rank === 3) {
        iconName = 'trophy-variant';
        color = '#CD7F32'; // Bronze
    }

    return (
        <MaterialCommunityIcons 
            name={iconName} 
            size={24} 
            color={color} 
            style={{ marginLeft: 5 }}
        />
    );
});

// User Avatar component
const UserAvatar = React.memo(({ user, size = 48, isTop = false }) => {
    const [imageError, setImageError] = useState(false);
    
    const getProfileImageUrl = () => {
        if (user?.photo && user.photo !== 'default.jpg' && !imageError) {
            return `http://${config.IP}:${config.PORT}/api/users/uploads/users/${user.photo}`;
        }
        return null;
    };

    const profileImageUrl = getProfileImageUrl();

    if (profileImageUrl) {
        return (
            <Image
                source={{ uri: profileImageUrl }}
                style={[
                    styles.avatar, 
                    { width: size, height: size, borderRadius: size / 2 },
                    isTop && styles.topAvatarBorder
                ]}
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <View style={[
            styles.avatarFallback, 
            { 
                width: size, 
                height: size, 
                borderRadius: size / 2, 
                backgroundColor: isTop ? '#E8F5E8' : '#f0f4f8',
                borderColor: isTop ? '#FFD700' : '#d1d5db',
            }
        ]}>
            <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
        </View>
    );
});

// --- Main Component ---
export default function LeaderboardScreen({ navigation }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchLeaderboard);
        return unsubscribe;
    }, [navigation]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                navigation.replace('Login');
                return;
            }

            // Fetch current user ID (for highlighting self)
            const userResponse = await axios.get(`http://${config.IP}:${config.PORT}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUserId(userResponse.data.data.user._id);

            const response = await axios.get(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setLeaderboard(response.data.data.leaderboard);
            setError(null);

        } catch (err) {
            console.error('Error fetching leaderboard:', err.response?.data || err.message);
            setError('Failed to load leaderboard. Please check connectivity or token.');
        } finally {
            setLoading(false);
        }
    };

    const renderLeaderboardItem = ({ item, index }) => {
        const rank = index + 1;
        const isSelf = item.userId === currentUserId; 
        const isTopThree = rank <= 3;
        const rankColor = isTopThree ? '#FFD700' : isSelf ? '#4A90E2' : '#555';

        return (
            <View style={[
                styles.listItem, 
                isTopThree && styles.topListItem,
                isSelf && styles.selfListItem
            ]}>
                <View style={styles.rankContainer}>
                    <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
                    {isTopThree && <Medal rank={rank} />}
                </View>

                <UserAvatar user={item} size={48} isTop={isTopThree} />

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.name}
                        {isSelf && <Text style={styles.selfIndicator}> (You)</Text>}
                    </Text>
                    <Text style={styles.userCity}>{item.city || 'Eco User'}</Text>
                </View>

                <View style={styles.pointsContainer}>
                    <Text style={styles.points}>{item.totalPoints}</Text>
                    <Text style={styles.pointsLabel}>Points</Text>
                    <Text style={styles.challengesCompleted}>
                        {item.challengesCompleted} Challenges
                    </Text>
                </View>
            </View>
        );
    };

    if (loading && leaderboard.length === 0) {
        return <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingContainer} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a202c" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Global Eco-Leaderboard 🏆</Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={30} color="red" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : leaderboard.length === 0 ? (
                <Text style={styles.emptyText}>No users have earned points yet. Join a challenge to rank!</Text>
            ) : (
                <FlatList
                    data={leaderboard}
                    keyExtractor={(item) => item.userId.toString()}
                    renderItem={renderLeaderboardItem}
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
        backgroundColor: '#f8fafc',
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
    // --- Header Styles (Adjusted for better top spacing) ---
    header: {
        paddingHorizontal: 16,
        // Increased paddingTop for more space from the absolute top of the screen
        paddingTop: 50, 
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
        top: 50, // Adjusted to match new paddingTop
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
    // --- End Header Fix ---
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
        borderLeftWidth: 6,
        borderLeftColor: '#e2e8f0',
    },
    topListItem: {
        backgroundColor: '#fffbe6', // Light yellow for top 3
        borderLeftColor: '#FFD700',
    },
    selfListItem: {
        borderWidth: 2,
        borderColor: '#4A90E2', // Blue border for self
        backgroundColor: '#E6F0FF',
    },
    rankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 60, 
        justifyContent: 'flex-start',
        marginRight: 10,
    },
    rankText: {
        fontSize: 20,
        fontWeight: '900',
        width: 30,
        textAlign: 'center',
    },
    avatar: {
        resizeMode: 'cover',
    },
    topAvatarBorder: {
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#d1d5db',
    },
    avatarInitial: {
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2c3e50',
    },
    selfIndicator: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A90E2',
        marginLeft: 5,
    },
    userCity: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },
    pointsContainer: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    points: {
        fontSize: 26,
        fontWeight: '900',
        color: '#4CAF50',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    challengesCompleted: {
        fontSize: 12,
        color: '#495057',
        fontWeight: '600',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#7f8c8d',
        marginTop: 50,
        fontSize: 16
    },
});
