import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
<<<<<<< Updated upstream:frontend/screens/WasteDataScreen.js
import config from '../config';
=======
import DateTimePicker from '@react-native-community/datetimepicker';
import config from '../../config';
>>>>>>> Stashed changes:frontend/screens/Consumption Data - IT22129376/WasteDataScreen.js

const API_URL = `http://${config.IP}:${config.PORT}/api`;
const TOKEN_KEY = 'userToken';

export default function WasteDataScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        collectionDate: new Date(),
        plasticBags: '',
        paperBags: '',
        foodWasteBags: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, collectionDate: selectedDate }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.plasticBags || !formData.paperBags || !formData.foodWasteBags) {
            Alert.alert('Error', 'Please fill in all waste fields');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const payload = {
                collectionDate: formData.collectionDate.toISOString(),
                plasticBags: parseInt(formData.plasticBags),
                paperBags: parseInt(formData.paperBags),
                foodWasteBags: parseInt(formData.foodWasteBags)
            };

            await axios.post(`${API_URL}/data/waste`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Waste data saved successfully!');
            setFormData({
                collectionDate: new Date(),
                plasticBags: '',
                paperBags: '',
                foodWasteBags: ''
            });
            
        } catch (error) {
            console.error('Error saving data:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to save waste data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
        });
    };

<<<<<<< Updated upstream:frontend/screens/WasteDataScreen.js
=======
    const handleComplete = () => {
        navigation.navigate('ConsumptionScreen');
    };

>>>>>>> Stashed changes:frontend/screens/Consumption Data - IT22129376/WasteDataScreen.js
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Add Waste Data ♻️</Text>
            
            <View style={styles.formContainer}>
                <Text style={styles.label}>Collection Date *</Text>
                <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.dateText}>{formatDate(formData.collectionDate)}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={formData.collectionDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                <Text style={styles.label}>Plastic Bags *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 2"
                    keyboardType="numeric"
                    value={formData.plasticBags}
                    onChangeText={(value) => handleInputChange('plasticBags', value)}
                />

                <Text style={styles.label}>Paper Bags *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 1"
                    keyboardType="numeric"
                    value={formData.paperBags}
                    onChangeText={(value) => handleInputChange('paperBags', value)}
                />

                <Text style={styles.label}>Food Waste Bags *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 3"
                    keyboardType="numeric"
                    value={formData.foodWasteBags}
                    onChangeText={(value) => handleInputChange('foodWasteBags', value)}
                />
            </View>

            <TouchableOpacity 
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.submitButtonText}>Save Waste Data</Text>
                )}
            </TouchableOpacity>

            
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2c5530',
        textAlign: 'center'
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15
    },
    dateText: {
        fontSize: 16,
        color: '#333'
    },
    submitButton: {
        backgroundColor: '#4caf50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10
    },
    disabledButton: {
        backgroundColor: '#a5d6a7'
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    historyButton: {
        backgroundColor: '#2196f3',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    historyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});