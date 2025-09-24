import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, Alert, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, RefreshControl, ScrollView,
    KeyboardAvoidingView, Platform, Image
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const TOKEN_KEY = 'userToken';

// --- Helper Functions and Components (Moved Outside) ---

const getRoleColor = (role) => {
    switch (role) {
        case 'Admin': return '#ef4444';
        case 'Environmentalist': return '#10b981';
        case 'User': return '#3b82f6';
        default: return '#6b7280';
    }
};

// User Avatar Component to handle profile photos
const UserAvatar = ({ user, size = 44 }) => {
    const [imageError, setImageError] = useState(false);
    
    // Safety check for user object
    if (!user) {
        return (
            <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
                <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>?</Text>
            </View>
        );
    }
    
    const hasPhoto = user.photo && user.photo !== 'default.jpg' && !imageError;
    
    if (hasPhoto) {
        return (
            <Image 
                source={{ 
                    uri: `http://${config.IP}:${config.PORT}/api/users/uploads/users/${user.photo}` 
                }}
                style={[styles.profileImage, { width: size, height: size, borderRadius: size / 2 }]}
                onError={() => setImageError(true)}
            />
        );
    }
    
    // Fallback to icon with user's initial
    return (
        <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
        </View>
    );
};

const StatisticsCard = ({ icon, title, count, color, onPress }) => (
    <TouchableOpacity style={[styles.statsCard, { borderLeftColor: color }]} onPress={onPress}>
        <View style={styles.statsContent}>
            <View style={[styles.statsIconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statsText}>
                <Text style={styles.statsCount}>{count}</Text>
                <Text style={styles.statsTitle}>{title}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

// --- Memoized Header Component to Prevent Re-Renders ---
const UserListHeader = React.memo(({
    statistics, handleStatsCardPress, searchQuery, setSearchQuery,
    roleFilter, setRoleFilter, statusFilter, setStatusFilter, clearFilters,
    filteredUsersCount, totalUsersCount
}) => {
    return (
        <>
            <View style={styles.headerContainer}>
                <Ionicons name="people" size={32} color="#6366f1" style={styles.headerIcon} />
                <Text style={styles.header}>User Management</Text>
                <Text style={styles.subHeader}>Manage user accounts and permissions</Text>
            </View>
            <View style={styles.statsContainer}>
                <StatisticsCard icon="people-outline" title="Total Users" count={statistics.total} color="#6366f1" onPress={() => handleStatsCardPress('All')} />
                <StatisticsCard icon="person-outline" title="Users" count={statistics.users} color="#3b82f6" onPress={() => handleStatsCardPress('User')} />
                <StatisticsCard icon="leaf-outline" title="Environmentalists" count={statistics.environmentalists} color="#10b981" onPress={() => handleStatsCardPress('Environmentalist')} />
                <StatisticsCard icon="shield-checkmark-outline" title="Admins" count={statistics.admins} color="#ef4444" onPress={() => handleStatsCardPress('Admin')} />
            </View>
            <View style={styles.searchFilterContainer}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or email..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.filterRow}>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}><Ionicons name="filter" size={14} color="#6b7280" /> Role</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={roleFilter} onValueChange={setRoleFilter} style={styles.picker}>
                                <Picker.Item label="All Roles" value="All" />
                                <Picker.Item label="User" value="User" />
                                <Picker.Item label="Environmentalist" value="Environmentalist" />
                                <Picker.Item label="Admin" value="Admin" />
                            </Picker>
                        </View>
                    </View>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}><Ionicons name="pulse" size={14} color="#6b7280" /> Status</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={statusFilter} onValueChange={setStatusFilter} style={styles.picker}>
                                <Picker.Item label="All Status" value="All" />
                                <Picker.Item label="Active" value="active" />
                                <Picker.Item label="Inactive" value="inactive" />
                            </Picker>
                        </View>
                    </View>
                </View>
                {(roleFilter !== 'All' || statusFilter !== 'All' || searchQuery !== '') && (
                    <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                        <Ionicons name="close-circle-outline" size={16} color="#6366f1" />
                        <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.resultsCount}>
                    Showing {filteredUsersCount} of {totalUsersCount} users
                    {searchQuery && ` for "${searchQuery}"`}
                </Text>
            </View>
        </>
    );
});

// --- Main Component ---
export default function ManageUsersScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [editedUser, setEditedUser] = useState(null);
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const statistics = useMemo(() => {
        return {
            total: users.length,
            users: users.filter(u => u.role === 'User').length,
            environmentalists: users.filter(u => u.role === 'Environmentalist').length,
            admins: users.filter(u => u.role === 'Admin').length,
        };
    }, [users]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                navigation.replace('Login');
                return;
            }

            // Step 1: Verify if the current user is an Admin
            const meResponse = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (meResponse.data.data.user.role !== 'Admin') {
                Alert.alert('Access Denied', 'You do not have permission to view this page.');
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                navigation.replace('Login');
                return;
            }

            // Step 2: If Admin, fetch all users
            const usersResponse = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(usersResponse.data.data.users);

        } catch (error) {
            Alert.alert('Error', 'An error occurred. Please log in again.');
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            navigation.replace('Login');
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    useEffect(() => {
        let result = users;
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(user => 
                user.name.toLowerCase().startsWith(query) ||
                user.email.toLowerCase().startsWith(query)
            );
        }
        if (roleFilter !== 'All') { result = result.filter(user => user.role === roleFilter); }
        if (statusFilter !== 'All') { result = result.filter(user => user.status === statusFilter); }
        setFilteredUsers(result);
    }, [users, roleFilter, statusFilter, searchQuery]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchUsers);
        return unsubscribe;
    }, [navigation, fetchUsers]);

    const handleEdit = (user) => {
        setCurrentUser(user);
        setEditedUser({ ...user });
        setModalVisible(true);
    };
    
    const handleDelete = (userId, userName) => {
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync(TOKEN_KEY);
                            await axios.delete(`${API_URL}/admin/users/${userId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', `"${userName}" has been deleted.`);
                            fetchUsers();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete user.');
                        }
                    }
                }
            ]
        );
    };

    const handleUpdate = async () => {
        if (!editedUser) return;
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.patch(`${API_URL}/admin/users/${currentUser._id}`, editedUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'User details updated successfully.');
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', 'Failed to update user.');
        }
    };
    
    const clearFilters = () => {
        setRoleFilter('All');
        setStatusFilter('All');
        setSearchQuery('');
    };

    const handleStatsCardPress = (filter) => {
        setRoleFilter(filter === 'All' ? 'All' : filter);
        setStatusFilter('All');
    };

    const renderUserItem = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <UserAvatar user={item} size={44} />
                    <View style={[styles.statusIndicator, { backgroundColor: item.status === 'active' ? '#10b981' : '#ef4444' }]} />
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <View style={styles.userMeta}>
                        <Ionicons name="mail-outline" size={14} color="#6b7280" />
                        <Text style={styles.userEmail} ellipsizeMode='tail' numberOfLines={1}>{item.email}</Text>
                    </View>
                    <View style={styles.userMeta}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#6b7280" />
                        <Text style={[styles.userRole, { color: getRoleColor(item.role) }]}>{item.role}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(item)}>
                    <Ionicons name="create-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item._id, item.name)}>
                    <Ionicons name="trash-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366f1" /><Text style={styles.loadingText}>Verifying access and loading users...</Text></View> );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={item => item._id}
                ListHeaderComponent={
                    <UserListHeader
                        statistics={statistics}
                        handleStatsCardPress={handleStatsCardPress}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        roleFilter={roleFilter}
                        setRoleFilter={setRoleFilter}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        clearFilters={clearFilters}
                        filteredUsersCount={filteredUsers.length}
                        totalUsersCount={users.length}
                    />
                }
                contentContainerStyle={styles.flatListContent}
                refreshControl={ <RefreshControl refreshing={loading} onRefresh={fetchUsers} colors={["#6366f1"]} tintColor="#6366f1" /> }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyStateText}>No users found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            {roleFilter !== 'All' || statusFilter !== 'All' || searchQuery !== ''
                                ? "Try adjusting your search or filters"
                                : "No users available in the system"}
                        </Text>
                    </View>
                }
            />
            {editedUser && (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalAvatarContainer}>
                                    <UserAvatar user={currentUser} size={56} />
                                </View>
                                <Text style={styles.modalTitle}>Edit User</Text>
                            </View>
                            <Text style={styles.modalSubtitle}>{currentUser?.name}</Text>
                            <ScrollView
                                style={styles.modalScroll}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        <Ionicons name="person-outline" size={16} color="#6b7280" /> Full Name
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedUser.name}
                                        onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
                                        placeholder="Enter full name"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        <Ionicons name="mail-outline" size={16} color="#6b7280" /> Email Address
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedUser.email}
                                        onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder="Enter email address"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" /> Role
                                    </Text>
                                    <View style={styles.pickerWrapper}>
                                        <Picker
                                            selectedValue={editedUser.role}
                                            onValueChange={(value) => setEditedUser({ ...editedUser, role: value })}
                                        >
                                            <Picker.Item label="User" value="User" />
                                            <Picker.Item label="Environmentalist" value="Environmentalist" />
                                            <Picker.Item label="Admin" value="Admin" />
                                        </Picker>
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        <Ionicons name="pulse-outline" size={16} color="#6b7280" /> Status
                                    </Text>
                                    <View style={styles.pickerWrapper}>
                                        <Picker
                                            selectedValue={editedUser.status}
                                            onValueChange={(value) => setEditedUser({ ...editedUser, status: value })}
                                        >
                                            <Picker.Item label="Active" value="active" />
                                            <Picker.Item label="Inactive" value="inactive" />
                                        </Picker>
                                    </View>
                                </View>
                            </ScrollView>
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleUpdate}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    flatListContent: {
        flexGrow: 1,
        paddingBottom: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500'
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 4
    },
    headerIcon: {
        marginBottom: 12
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4
    },
    subHeader: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500'
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8
    },
    statsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderLeftWidth: 4,
        marginVertical: 4
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    statsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    statsText: {
        flex: 1
    },
    statsCount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 2
    },
    statsTitle: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    searchFilterContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        margin: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        marginBottom: 16,
        height: 50
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
        paddingVertical: 8
    },
    clearSearchButton: {
        padding: 4
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12
    },
    filterGroup: {
        flex: 1
    },
    filterLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        fontWeight: '600'
    },
    pickerContainer: {
        borderColor: '#e5e7eb',
        borderWidth: 1.5,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        overflow: 'hidden'
    },
    picker: {
        height: 50,
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#eef2ff',
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 12
    },
    clearFiltersText: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6
    },
    resultsCount: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        textAlign: 'center'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
        marginHorizontal: 16
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
        marginBottom: 8
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20
    },
    userCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginVertical: 6,
        marginHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#8b5cf6'
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        overflow: 'hidden',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16
    },
    // Profile Image Styles
    profileImage: {
        resizeMode: 'cover',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    avatarFallback: {
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    avatarInitial: {
        color: '#ffffff',
        fontWeight: '600',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
        bottom: 2,
        right: 2,
        borderWidth: 2,
        borderColor: '#ffffff'
    },
    userDetails: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 6
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2
    },
    userEmail: {
        color: '#6b7280',
        fontSize: 14,
        marginLeft: 6,
        flexShrink: 1,
    },
    userRole: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
        textTransform: 'capitalize'
    },
    actions: {
        flexDirection: 'row',
        marginLeft: 12
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    editButton: {
        backgroundColor: '#3b82f6'
    },
    deleteButton: {
        backgroundColor: '#ef4444'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 20
    },
    modalContainer: {
        width: '100%',
        maxHeight: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    modalAvatarContainer: {
        marginRight: 12
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24
    },
    modalScroll: {
        maxHeight: 400
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#374151',
        fontWeight: '600'
    },
    input: {
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#f9fafb'
    },
    pickerWrapper: {
        borderColor: '#d1d5db',
        borderWidth: 1.5,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        overflow: 'hidden'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db'
    },
    saveButton: {
        backgroundColor: '#6366f1'
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8
    }
});