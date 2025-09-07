import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome } from '@expo/vector-icons';
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
    const [endDate, setEndDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

    const handleAddChallenge = async () => {
        if (!title || !description || !goal || !unit || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.post(
                API_URL,
                {
                    title,
                    description,
                    goal: Number(goal),
                    unit,
                    startDate,
                    endDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Alert.alert('Success', 'Challenge added successfully!');
            navigation.goBack(); 
        } catch (error) {
            Alert.alert('Failed to Add Challenge', error.response?.data?.message || 'Something went wrong');
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

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <FontAwesome name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Challenge</Text>
            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Goal (e.g., 10)" value={goal} onChangeText={setGoal} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Unit (e.g., kWh)" value={unit} onChangeText={setUnit} />
            
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

            <View style={styles.buttonContainer}>
                <Button title="Add Challenge" onPress={handleAddChallenge} color="#28a745" />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingHorizontal: 10, borderRadius: 5 },
    dateLabel: { marginTop: 15, marginBottom: 5, fontSize: 16 },
    buttonContainer: { marginTop: 10, marginBottom: 10 },
});
