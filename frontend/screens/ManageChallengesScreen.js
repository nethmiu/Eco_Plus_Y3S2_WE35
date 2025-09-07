import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput, Button, ScrollView } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";

// Set the API URL to your computer's IP address
const API_URL = 'http://10.47.144.219:5000/api/challenges';
const TOKEN_KEY = 'userToken';

export default function ManageChallengesScreen({ navigation }) {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [unit, setUnit] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

    useEffect(() => {
        fetchChallenges();
    }, []);

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
        setModalVisible(true);
    };

    const handleUpdateChallenge = async () => {
        if (!title || !description || !goal || !unit || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.patch(`${API_URL}/${currentChallenge._id}`, {
                title,
                description,
                goal: Number(goal),
                unit,
                startDate,
                endDate,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Challenge updated successfully!');
            setModalVisible(false);
            fetchChallenges(); // Fetch updated list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update challenge.');
        }
    };

    const handleDeleteChallenge = (id) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this challenge?",
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
            fetchChallenges(); // Fetch updated list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete challenge.');
        }
    };

    const showDatePicker = () => {
        setDatePickerVisible(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisible(false);
    };

    const handleConfirmStartDate = (date) => {
        setStartDate(date);
        hideDatePicker();
    };

    const showEndDatePicker = () => {
        setEndDatePickerVisible(true);
    };

    const hideEndDatePicker = () => {
        setEndDatePickerVisible(false);
    };

    const handleConfirmEndDate = (date) => {
        setEndDate(date);
        hideEndDatePicker();
    };


    if (loading) {
        return <ActivityIndicator size="large" style={styles.loadingContainer} />;
    }

    const renderChallengeItem = ({ item }) => (
        <View style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>{item.title}</Text>
            <Text style={styles.challengeDescription}>{item.description}</Text>
            <Text style={styles.challengeDetail}>Goal: {item.goal} {item.unit}</Text>
            <Text style={styles.challengeDetail}>Start Date: {new Date(item.startDate).toLocaleDateString()}</Text>
            <Text style={styles.challengeDetail}>End Date: {new Date(item.endDate).toLocaleDateString()}</Text>
            <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleEditPress(item)} style={[styles.button, styles.editButton]}>
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteChallenge(item._id)} style={[styles.button, styles.deleteButton]}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <FontAwesome name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Challenges</Text>
            <FlatList
                data={challenges}
                keyExtractor={(item) => item._id}
                renderItem={renderChallengeItem}
                contentContainerStyle={styles.listContent}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Edit Challenge</Text>
                            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
                            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
                            <TextInput style={styles.input} placeholder="Goal" value={goal} onChangeText={setGoal} keyboardType="numeric" />
                            <TextInput style={styles.input} placeholder="Unit" value={unit} onChangeText={setUnit} />
                            
                            <Text style={styles.dateLabel}>Start Date: {startDate.toLocaleDateString()}</Text>
                            <Button title="Select Start Date" onPress={showDatePicker} />
                            <DateTimePickerModal
                                isVisible={isDatePickerVisible}
                                mode="date"
                                onConfirm={handleConfirmStartDate}
                                onCancel={hideDatePicker}
                                date={startDate}
                            />

                            <Text style={styles.dateLabel}>End Date: {endDate.toLocaleDateString()}</Text>
                            <Button title="Select End Date" onPress={showEndDatePicker} />
                            <DateTimePickerModal
                                isVisible={isEndDatePickerVisible}
                                mode="date"
                                onConfirm={handleConfirmEndDate}
                                onCancel={hideEndDatePicker}
                                date={endDate}
                            />

                            <View style={styles.modalButtons}>
                                <View style={styles.buttonContainer}>
                                  <Button title="Update" onPress={handleUpdateChallenge} color="#28a745" />
                                </View>
                                <View style={styles.buttonContainer}>
                                  <Button title="Cancel" onPress={() => setModalVisible(false)} color="#6c757d" />
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#212529', marginBottom: 25, textAlign: 'center' },
    listContent: { paddingBottom: 20 },
    challengeCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    challengeTitle: { fontSize: 20, fontWeight: 'bold', color: '#007bff', marginBottom: 8 },
    challengeDescription: { fontSize: 16, color: '#495057', marginBottom: 5 },
    challengeDetail: { fontSize: 14, color: '#6c757d', marginBottom: 3 },
    actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    button: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, marginLeft: 10 },
    editButton: { backgroundColor: '#ffc107' },
    deleteButton: { backgroundColor: '#dc3545' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingHorizontal: 10, borderRadius: 5 },
    dateLabel: { marginTop: 15, marginBottom: 5, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    buttonContainer: { flex: 1, marginHorizontal: 5 }
});
