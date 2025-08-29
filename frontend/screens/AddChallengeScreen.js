// screens/AddChallengeScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ඔබේ පරිගණකයේ IP address එක
const API_URL = 'http://10.47.144.219:5000/api/challenges';
const TOKEN_KEY = 'userToken';

export default function AddChallengeScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [unit, setUnit] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
            navigation.goBack(); // නැවත Home screen එකට යන්න
        } catch (error) {
            Alert.alert('Failed to Add Challenge', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Add New Challenge</Text>
            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Goal (e.g., 10)" value={goal} onChangeText={setGoal} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Unit (e.g., kWh)" value={unit} onChangeText={setUnit} />
            <TextInput style={styles.input} placeholder="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
            <TextInput style={styles.input} placeholder="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
            <View style={styles.buttonContainer}>
                <Button title="Add Challenge" onPress={handleAddChallenge} color="#28a745" />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingHorizontal: 10, borderRadius: 5 },
    buttonContainer: { marginTop: 10, marginBottom: 10 },
});