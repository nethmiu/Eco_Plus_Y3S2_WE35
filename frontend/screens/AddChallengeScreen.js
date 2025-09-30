import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";

import config from '../config';
const API_URL = `http://${config.IP}:${config.PORT}/api/challenges`;
const TOKEN_KEY = 'userToken';

export default function AddChallengeScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [unit, setUnit] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 7 days later
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddChallenge = async () => {
        if (!title.trim() || !description.trim() || !goal || !unit.trim() || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }
        if (isNaN(Number(goal)) || Number(goal) <= 0) {
            Alert.alert('Error', 'Goal must be a positive number.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.post(
                API_URL,
                {
                    title: title.trim(),
                    description: description.trim(),
                    goal: Number(goal),
                    unit: unit.trim(),
                    startDate,
                    endDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Alert.alert('Success', 'New Challenge added successfully!');
            navigation.goBack(); 
        } catch (error) {
            Alert.alert('Failed to Add Challenge', error.response?.data?.message || 'Something went wrong on the server.');
        } finally {
            setLoading(false);
        }
    };

    const showDatePicker = () => setDatePickerVisible(true);
    const hideDatePicker = () => setDatePickerVisible(false);
    const handleConfirmStartDate = (date) => {
        setStartDate(date);
        if (date >= endDate) { // Ensure end date is after start date
            setEndDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
        }
        hideDatePicker();
    };

    const showEndDatePicker = () => setEndDatePickerVisible(true);
    const hideEndDatePicker = () => setEndDatePickerVisible(false);
    const handleConfirmEndDate = (date) => {
        if (date <= startDate) {
            Alert.alert('Error', 'End Date must be after Start Date.');
            return;
        }
        setEndDate(date);
        hideEndDatePicker();
    };

    const InputGroup = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', isMultiline = false }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
                <Ionicons name={icon} size={16} color="#4A90E2" /> {placeholder} *
            </Text>
            <TextInput
                style={[styles.input, isMultiline && styles.inputMultiline]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={isMultiline}
                numberOfLines={isMultiline ? 4 : 1}
                textAlignVertical={isMultiline ? 'top' : 'center'}
                placeholderTextColor="#9ca3af"
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a202c" />
                </TouchableOpacity>
                
                <View style={styles.header}>
                    <MaterialCommunityIcons name="trophy-outline" size={48} color="#4A90E2" style={styles.headerIcon} />
                    <Text style={styles.title}>Create New Eco-Challenge</Text>
                    <Text style={styles.subtitle}>Define the parameters for a new challenge</Text>
                </View>

                <View style={styles.formCard}>
                    <InputGroup
                        icon="create-outline"
                        placeholder="Challenge Title"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <InputGroup
                        icon="document-text-outline"
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                        isMultiline={true}
                    />
                    
                    <View style={styles.splitInputRow}>
                        <View style={styles.splitInputContainer}>
                            <InputGroup
                                icon="stats-chart-outline"
                                placeholder="Goal Value"
                                value={goal}
                                onChangeText={setGoal}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.splitInputContainer}>
                            <InputGroup
                                icon="cube-outline"
                                placeholder="Unit (e.g., kWh)"
                                value={unit}
                                onChangeText={setUnit}
                            />
                        </View>
                    </View>

                    {/* Date Pickers */}
                    <View style={styles.datePickerContainer}>
                        <Text style={styles.inputLabel}><Ionicons name="calendar-outline" size={16} color="#4A90E2" /> Start Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={showDatePicker} disabled={loading}>
                            <Text style={styles.dateButtonText}>
                                {startDate.toLocaleDateString()}
                            </Text>
                            <Ionicons name="chevron-down-circle-outline" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                        
                        <Text style={styles.inputLabel}><Ionicons name="calendar-sharp" size={16} color="#4A90E2" /> End Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={showEndDatePicker} disabled={loading}>
                            <Text style={styles.dateButtonText}>
                                {endDate.toLocaleDateString()}
                            </Text>
                            <Ionicons name="chevron-down-circle-outline" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>

                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmStartDate}
                        onCancel={hideDatePicker}
                        date={startDate}
                    />
                    <DateTimePickerModal
                        isVisible={isEndDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmEndDate}
                        onCancel={hideEndDatePicker}
                        date={endDate}
                        minimumDate={startDate}
                    />

                    <TouchableOpacity 
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                        onPress={handleAddChallenge}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.submitButtonContent}>
                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Publish Challenge</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: { 
        flexGrow: 1, 
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    backButton: { 
        position: 'absolute', 
        top: 50, 
        left: 20, 
        zIndex: 10,
        padding: 5
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
        marginTop: 40,
    },
    headerIcon: {
        marginBottom: 10,
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#2c3e50', 
        marginBottom: 5, 
        textAlign: 'center' 
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
    },
    input: { 
        height: 50, 
        borderColor: '#E9ECEF', 
        borderWidth: 2, 
        paddingHorizontal: 15, 
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        color: '#2C3E50',
    },
    inputMultiline: {
        height: 100,
        paddingTop: 15,
    },
    splitInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 15,
    },
    splitInputContainer: {
        flex: 1,
    },
    datePickerContainer: {
        marginBottom: 20,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        borderColor: '#E9ECEF',
        borderWidth: 2,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: '#F8F9FA',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#2C3E50',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#a5d6a7',
    },
    submitButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitButtonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: '700',
        marginLeft: 10,
    },
});
