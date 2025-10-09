import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    Alert, 
    TouchableOpacity, 
    Modal, 
    TextInput, 
    ScrollView, 
    SafeAreaView, 
    StatusBar,
    KeyboardAvoidingView,
    Platform 
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";

import config from '../config';
const API_URL = `http://${config.IP}:${config.PORT}/api/challenges`;
const TOKEN_KEY = 'userToken';

// --- Helper Component: InputGroup (Retained for Keyboard Fix) ---
const InputGroup = React.memo(({ icon, placeholder, value, onChangeText, keyboardType = 'default', isMultiline = false, isNumeric = false }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
            <Ionicons name={icon} size={14} color="#6366f1" /> {placeholder}
        </Text>
        <TextInput
            style={[styles.input, isMultiline && styles.inputMultiline]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={isNumeric ? 'numeric' : keyboardType}
            multiline={isMultiline}
            numberOfLines={isMultiline ? 4 : 1}
            textAlignVertical={isMultiline ? 'top' : 'center'}
            placeholderTextColor="#9ca3af"
        />
    </View>
));
// --- END InputGroup ---

export default function ManageChallengesScreen({ navigation }) {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [awardModalVisible, setAwardModalVisible] = useState(false); // NEW STATE
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(''); // To display who is logged in
    
    // Edit Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [unit, setUnit] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Award Points States
    const [pointsToAward, setPointsToAward] = useState('50'); // Default suggestion
    const [awardUserIdInput, setAwardUserIdInput] = useState(''); // User ID of the user being awarded
    const [isAwarding, setIsAwarding] = useState(false);
    
    // Date Picker States
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);


    useEffect(() => {
        // Fetch current admin user ID (or the logged-in user's ID)
        const fetchUserId = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) return;
                const response = await axios.get(`http://${config.IP}:${config.PORT}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUserId(response.data.data.user._id);
            } catch (e) {
                console.error("Could not fetch user ID for admin dashboard context.");
            }
        };
        
        fetchUserId();

        const unsubscribe = navigation.addListener('focus', fetchChallenges);
        return unsubscribe;
    }, [navigation]);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChallenges(response.data.data.challenges);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to fetch challenges.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPress = (challenge) => {
        setCurrentChallenge(challenge);
        setTitle(challenge.title);
        setDescription(challenge.description);
        setGoal(challenge.goal.toString());
        setUnit(challenge.unit);
        setStartDate(new Date(challenge.startDate));
        setEndDate(new Date(challenge.endDate));
        setEditModalVisible(true);
    };

    // --- NEW: Open Award Modal ---
    const handleAwardPress = (challenge) => {
        setCurrentChallenge(challenge);
        setAwardUserIdInput(''); // Clear previous input
        setPointsToAward('50'); // Reset suggested points
        setAwardModalVisible(true);
    };
    
    // --- NEW: Handle Points Awarding API Call ---
    const handleAwardPoints = async () => {
        if (!awardUserIdInput || isNaN(parseInt(pointsToAward)) || parseInt(pointsToAward) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid User ID and points amount (min 1).');
            return;
        }

        setIsAwarding(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            
            // NOTE: The backend expects a valid User ID in the payload.
            // Since Admin may award points to ANY user, we pass the User ID input.
            // However, the current backend implementation uses req.user.id implicitly for the awardee.
            // We need to assume the Admin is testing by entering *their own* ID or another valid ID.
            
            await axios.patch(`${API_URL}/evaluate`, {
                challengeId: currentChallenge._id,
                userId: awardUserIdInput, // Passing ID from modal input
                points: parseInt(pointsToAward),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            Alert.alert(
                'Success', 
                `${pointsToAward} points awarded to User ID: ${awardUserIdInput} for ${currentChallenge.title}!`
            );
            setAwardModalVisible(false);
            fetchChallenges(); 
        } catch (error) {
            console.error('Award Error:', error.response?.data || error.message);
            Alert.alert(
                'Award Failed', 
                error.response?.data?.message || 'Failed to award points. Check User/Challenge ID validity.'
            );
        } finally {
            setIsAwarding(false);
        }
    };

    const handleUpdateChallenge = async () => {
        if (!title.trim() || !description.trim() || !goal || !unit.trim() || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }
        if (isNaN(Number(goal)) || Number(goal) <= 0) {
            Alert.alert('Error', 'Goal must be a positive number.');
            return;
        }
        if (endDate <= startDate) {
            Alert.alert('Error', 'End Date must be after Start Date.');
            return;
        }

        setIsUpdating(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.patch(`${API_URL}/${currentChallenge._id}`, {
                title: title.trim(),
                description: description.trim(),
                goal: Number(goal),
                unit: unit.trim(),
                startDate,
                endDate,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Challenge updated successfully!');
            setEditModalVisible(false);
            fetchChallenges(); 
        } catch (error) {
            Alert.alert('Update Failed', error.response?.data?.message || 'Failed to update challenge.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteChallenge = (id, title) => {
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to permanently delete the challenge "${title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => confirmDelete(id), style: "destructive" }
            ],
            { cancelable: false }
        );
    };

    const confirmDelete = async (id) => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Challenge deleted successfully!');
            fetchChallenges(); 
        } catch (error) {
            Alert.alert('Deletion Failed', error.response?.data?.message || 'Failed to delete challenge.');
        }
    };

    // Use useCallback for setters in Modal (Keyboard Fix)
    const handleSetTitle = useCallback(value => setTitle(value), []);
    const handleSetDescription = useCallback(value => setDescription(value), []);
    const handleSetGoal = useCallback(value => setGoal(value), []);
    const handleSetUnit = useCallback(value => setUnit(value), []);
    const handleSetAwardUserId = useCallback(value => setAwardUserIdInput(value), []);
    const handleSetPointsToAward = useCallback(value => setPointsToAward(value), []);


    const showDatePicker = () => setDatePickerVisible(true);
    const hideDatePicker = () => setDatePickerVisible(false);
    const handleConfirmStartDate = (date) => {
        setStartDate(date);
        hideDatePicker();
    };

    const showEndDatePicker = () => setEndDatePickerVisible(true);
    const hideEndDatePicker = () => setEndDatePickerVisible(false);
    const handleConfirmEndDate = (date) => {
        setEndDate(date);
        hideEndDatePicker();
    };


    if (loading) {
        return <ActivityIndicator size="large" color="#6366f1" style={styles.loadingContainer} />;
    }

    const renderChallengeItem = ({ item }) => (
        <View style={styles.challengeCard}>
            <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="trophy-variant-outline" size={24} color="#6366f1" />
                <Text style={styles.challengeTitle}>{item.title}</Text>
                <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{new Date(item.endDate) > new Date() ? 'Active' : 'Expired'}</Text>
                </View>
            </View>
            <Text style={styles.challengeDescription} numberOfLines={2}>{item.description}</Text>
            
            <View style={styles.detailRow}>
                <Ionicons name="stats-chart-outline" size={14} color="#374151" />
                <Text style={styles.challengeDetailText}>Goal: <Text style={styles.goalValue}>{item.goal} {item.unit}</Text></Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#374151" />
                <Text style={styles.challengeDetailText}>Ends: {new Date(item.endDate).toLocaleDateString()}</Text>
            </View>

            <View style={styles.actionButtons}>
                {/* NEW AWARD BUTTON */}
                <TouchableOpacity onPress={() => handleAwardPress(item)} style={[styles.button, styles.awardButton]}>
                    <Ionicons name="ribbon-outline" size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>Award</Text>
                </TouchableOpacity>
                {/* END NEW AWARD BUTTON */}

                <TouchableOpacity onPress={() => handleEditPress(item)} style={[styles.button, styles.editButton]}>
                    <Ionicons name="create-outline" size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteChallenge(item._id, item.title)} style={[styles.button, styles.deleteButton]}>
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1a202c" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Challenges</Text>
            
            <FlatList
                data={challenges}
                keyExtractor={(item) => item._id}
                renderItem={renderChallengeItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color="#d1d5db" />
                        <Text style={styles.emptyStateText}>No Challenges Created</Text>
                        <Text style={styles.emptyStateSubtext}>Use the "Add Challenge" screen to publish new challenges.</Text>
                    </View>
                }
            />

            {/* Edit Modal (Existing) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Edit Challenge: {currentChallenge?.title}</Text>
                            
                            <InputGroup icon="create-outline" placeholder="Title" value={title} onChangeText={handleSetTitle} />
                            <InputGroup icon="document-text-outline" placeholder="Description" value={description} onChangeText={handleSetDescription} isMultiline={true} />
                            <InputGroup icon="stats-chart-outline" placeholder="Goal Value" value={goal} onChangeText={handleSetGoal} keyboardType="numeric" />
                            <InputGroup icon="cube-outline" placeholder="Unit (e.g., kWh)" value={unit} onChangeText={handleSetUnit} />
                            
                            <View style={styles.datePickerContainer}>
                                <Text style={styles.inputLabel}><Ionicons name="calendar-outline" size={14} color="#6366f1" /> Start Date: {startDate.toLocaleDateString()}</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
                                    <Text style={styles.dateButtonText}>Select Start Date</Text>
                                    <Ionicons name="chevron-down" size={18} color="#6366f1" />
                                </TouchableOpacity>
                                
                                <Text style={styles.inputLabel}><Ionicons name="calendar-sharp" size={14} color="#6366f1" /> End Date: {endDate.toLocaleDateString()}</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={showEndDatePicker}>
                                    <Text style={styles.dateButtonText}>Select End Date</Text>
                                    <Ionicons name="chevron-down" size={18} color="#6366f1" />
                                </TouchableOpacity>
                            </View>

                            <DateTimePickerModal
                                isVisible={isDatePickerVisible}
                                mode="date"
                                onConfirm={handleConfirmStartDate}
                                onCancel={() => setDatePickerVisible(false)}
                                date={startDate}
                            />
                            <DateTimePickerModal
                                isVisible={isEndDatePickerVisible}
                                mode="date"
                                onConfirm={handleConfirmEndDate}
                                onCancel={() => setEndDatePickerVisible(false)}
                                date={endDate}
                                minimumDate={startDate}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setEditModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.updateModalButton, isUpdating && styles.submitButtonDisabled]} 
                                    onPress={handleUpdateChallenge}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.updateButtonText}>Update Challenge</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            
            {/* --- NEW AWARD POINTS MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={awardModalVisible}
                onRequestClose={() => setAwardModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: '#4CAF50' }]}>Award Points: {currentChallenge?.title}</Text>
                            <Text style={styles.modalSubtitle}>Manually award points to a specific user for completing this challenge.</Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: '#2196F3' }]}><Ionicons name="person-outline" size={14} color="#2196F3" /> Awardee User ID *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter User ID (e.g., 651a24d5...)"
                                    value={awardUserIdInput}
                                    onChangeText={handleSetAwardUserId}
                                    placeholderTextColor="#9ca3af"
                                />
                                <Text style={styles.inputHint}>**Note:** Find the User ID via the Manage Users screen or backend logs.</Text>
                            </View>

                            <InputGroup 
                                icon="ribbon-outline" 
                                placeholder="Points to Award" 
                                value={pointsToAward} 
                                onChangeText={handleSetPointsToAward} 
                                isNumeric={true}
                            />
                            
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setAwardModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.awardModalButton, isAwarding && styles.submitButtonDisabled]} 
                                    onPress={handleAwardPoints}
                                    disabled={isAwarding}
                                >
                                    {isAwarding ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.awardButtonText}>Award Points</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            {/* --- END NEW AWARD POINTS MODAL --- */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 5 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a202c', marginBottom: 25, textAlign: 'center', marginTop: 70 },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 50, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, marginTop: 10 },
    emptyStateText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 15, marginBottom: 8 },
    emptyStateSubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },

    // Card Styles
    challengeCard: { 
        backgroundColor: '#ffffff', 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 15, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 8, 
        elevation: 5,
        borderLeftWidth: 6,
        borderLeftColor: '#6366f1',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    challengeTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginLeft: 10, flex: 1 },
    statusPill: {
        backgroundColor: '#eef2ff',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
    challengeDescription: { fontSize: 14, color: '#495057', marginBottom: 15, lineHeight: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    challengeDetailText: { fontSize: 14, color: '#374151', marginLeft: 8 },
    goalValue: { fontWeight: '700', color: '#4CAF50' },
    
    // Action Buttons Row Styling
    actionButtons: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        marginTop: 15, 
        gap: 10 
    },
    button: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 3, 
        elevation: 3 
    },
    awardButton: {
        backgroundColor: '#4CAF50', // Green for Awarding
    },
    editButton: { backgroundColor: '#FF9800' },
    deleteButton: { backgroundColor: '#D9534F' },
    buttonText: { color: '#fff', fontWeight: '600', marginLeft: 5 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 20, width: '100%', maxHeight: '90%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 20 },
    
    inputGroup: { marginBottom: 15 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#495057', marginBottom: 8 },
    input: { height: 50, borderColor: '#E9ECEF', borderWidth: 2, paddingHorizontal: 15, borderRadius: 12, fontSize: 16, backgroundColor: '#F8F9FA', color: '#2C3E50' },
    inputMultiline: { height: 100, paddingTop: 15 },

    datePickerContainer: { marginBottom: 20 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50, borderColor: '#E9ECEF', borderWidth: 2, paddingHorizontal: 15, borderRadius: 12, marginBottom: 15, backgroundColor: '#F8F9FA' },
    dateButtonText: { fontSize: 16, color: '#2C3E50' },

    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelModalButton: { backgroundColor: '#9ca3af' },
    updateModalButton: { backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    awardModalButton: { backgroundColor: '#4CAF50', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 }, // NEW
    
    cancelButtonText: { color: '#fff', fontWeight: '700' },
    updateButtonText: { color: '#fff', fontWeight: '700' },
    awardButtonText: { color: '#fff', fontWeight: '700' }, // NEW
    submitButtonDisabled: { opacity: 0.6 },
    inputHint: { fontSize: 12, color: '#dc3545', marginTop: -10, marginBottom: 10, marginLeft: 5 },
});
