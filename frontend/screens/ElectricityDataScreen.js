import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api`;
const TOKEN_KEY = 'userToken';

export default function ElectricityDataScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [formData, setFormData] = useState({
        billingMonth: new Date(),
        units: '',
        lastReading: '',
        latestReading: '',
        accountNo: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [step, setStep] = useState(3);
    const [totalSteps] = useState(4);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, billingMonth: selectedDate }));
        }
    };

    const handleOcrScan = async () => {
        setOcrLoading(true);
        try {
            // Simulate OCR processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock OCR data - replace this with actual OCR implementation
            const mockOcrData = {
                units: '169',
                lastReading: '14772',
                latestReading: '14941',
                accountNo: '2004401400'
            };
            
            // Auto-fill form with OCR data
            setFormData(prev => ({
                ...prev,
                units: mockOcrData.units,
                lastReading: mockOcrData.lastReading,
                latestReading: mockOcrData.latestReading,
                accountNo: mockOcrData.accountNo
            }));
            
            Alert.alert('Success', 'Electricity bill scanned successfully!');
        } catch (error) {
            console.error('OCR Error:', error);
            Alert.alert('Error', 'Failed to scan electricity bill');
        } finally {
            setOcrLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.units || !formData.billingMonth) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
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

    const handleNext = () => {
        if (!formData.units) {
            Alert.alert('Validation Error', 'Please fill in required fields before proceeding');
            return;
        }
        navigation.navigate('WaterData');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.subtitle}>Setting Up Your Profile</Text>
                <View style={{ marginTop: 15, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#4A90E2', fontWeight: '600' }}>
                        Step {step} of {totalSteps}
                    </Text>
                    <View style={{ 
                        flexDirection: 'row', 
                        marginTop: 10,
                        width: 200,
                        height: 6,
                        backgroundColor: '#E9ECEF',
                        borderRadius: 3
                    }}>
                        <View style={{ 
                            width: `${(step / totalSteps) * 100}%`, 
                            height: '100%', 
                            backgroundColor: '#4A90E2',
                            borderRadius: 3
                        }} />
                    </View>
                </View>
            </View>

            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="flash-outline" size={24} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>Electricity Usage</Text>
                        <TouchableOpacity 
                            style={[
                                styles.cameraButton,
                                ocrLoading && styles.cameraButtonDisabled
                            ]}
                            onPress={handleOcrScan}
                            disabled={ocrLoading}
                        >
                            {ocrLoading ? (
                                <ActivityIndicator size="small" color="#4A90E2" />
                            ) : (
                                <Ionicons name="camera-outline" size={20} color="#4A90E2" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.ocrHint}>
                        Tap the camera icon to scan your electricity bill automatically
                    </Text>

                    {/* Billing Month */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Billing Month *</Text>
                        <TouchableOpacity 
                            style={styles.pickerContainer}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.input, { color: formData.billingMonth ? '#2C3E50' : '#666' }]}>
                                {formatDate(formData.billingMonth)}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.pickerIcon} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.billingMonth}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Units Consumed */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Units Consumed (kWh) *</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 169"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={formData.units}
                                onChangeText={(value) => handleInputChange('units', value)}
                            />
                            <Text style={styles.unitText}>kWh</Text>
                        </View>
                    </View>

                    {/* Last Reading */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Meter Reading (Optional)</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 14772"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={formData.lastReading}
                                onChangeText={(value) => handleInputChange('lastReading', value)}
                            />
                        </View>
                    </View>

                    {/* Latest Reading */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Latest Meter Reading (Optional)</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 14941"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={formData.latestReading}
                                onChangeText={(value) => handleInputChange('latestReading', value)}
                            />
                        </View>
                    </View>

                    {/* Account Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Number (Optional)</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 2004401400"
                                placeholderTextColor="#999"
                                value={formData.accountNo}
                                onChangeText={(value) => handleInputChange('accountNo', value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={{ paddingHorizontal: 20, marginTop: 10, gap: 10 }}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.primaryButton,
                            { backgroundColor: '#4A90E2' },
                            (loading || !formData.units) && styles.buttonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={loading || !formData.units}
                    >
                        <View style={styles.buttonContent}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            )}
                            <Text style={styles.buttonText}>
                                {loading ? 'Saving...' : 'Save Data'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: '#28A745' },
                            (!formData.units) && styles.buttonDisabled
                        ]}
                        onPress={handleNext}
                        disabled={!formData.units || loading}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Next</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.secondaryButton,
                            { backgroundColor: '#6C757D' }
                        ]}
                        onPress={() => navigation.goBack()}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="arrow-back-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Back</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        paddingBottom: 30,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 10,
        flex: 1,
    },
    cameraButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F4FD',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4A90E2',
    },
    cameraButtonDisabled: {
        opacity: 0.6,
    },
    ocrHint: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 15,
        textAlign: 'center',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#495057',
        marginBottom: 8,
    },
    pickerContainer: {
        borderColor: '#E9ECEF',
        borderWidth: 2,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        position: 'relative',
        overflow: 'hidden',
    },
    input: {
        height: 50,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        color: '#2C3E50',
    },
    pickerIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
        zIndex: 1,
    },
    unitText: {
        position: 'absolute',
        right: 15,
        top: 15,
        color: '#666',
        fontSize: 16,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    primaryButton: {
        marginTop: 10,
    },
    secondaryButton: {
        marginTop: 10,
    },
});