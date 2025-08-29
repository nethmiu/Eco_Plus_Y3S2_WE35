import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'http://192.168.8.100:5001/api';
const TOKEN_KEY = 'userToken';

export default function ElectricityDataScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        billingMonth: new Date(),
        units: '',
        lastReading: '',
        latestReading: '',
        accountNo: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, billingMonth: selectedDate }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.units || !formData.billingMonth) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const payload = {
                billingMonth: formData.billingMonth.toISOString(),
                units: parseFloat(formData.units),
                lastReading: formData.lastReading ? parseFloat(formData.lastReading) : undefined,
                latestReading: formData.latestReading ? parseFloat(formData.latestReading) : undefined,
                accountNo: formData.accountNo || undefined
            };

            const response = await axios.post(`${API_URL}/data/electricity`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Electricity data saved successfully!');
            setFormData({
                billingMonth: new Date(),
                units: '',
                lastReading: '',
                latestReading: '',
                accountNo: ''
            });
            
        } catch (error) {
            console.error('Error saving data:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to save electricity data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Add Electricity Usage ⚡</Text>
            
            <View style={styles.formContainer}>
                <Text style={styles.label}>Billing Month *</Text>
                <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.dateText}>{formatDate(formData.billingMonth)}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={formData.billingMonth}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                <Text style={styles.label}>Units Consumed (kWh) *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 169"
                    keyboardType="numeric"
                    value={formData.units}
                    onChangeText={(value) => handleInputChange('units', value)}
                />

                <Text style={styles.label}>Last Meter Reading (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 14772"
                    keyboardType="numeric"
                    value={formData.lastReading}
                    onChangeText={(value) => handleInputChange('lastReading', value)}
                />

                <Text style={styles.label}>Latest Meter Reading (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 14941"
                    keyboardType="numeric"
                    value={formData.latestReading}
                    onChangeText={(value) => handleInputChange('latestReading', value)}
                />

                <Text style={styles.label}>Account Number (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 2004401400"
                    value={formData.accountNo}
                    onChangeText={(value) => handleInputChange('accountNo', value)}
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
                    <Text style={styles.submitButtonText}>Save Electricity Data</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.historyButton}
                onPress={() => navigation.navigate('WaterData')}
            >
                <Text style={styles.historyButtonText}>Next</Text>
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