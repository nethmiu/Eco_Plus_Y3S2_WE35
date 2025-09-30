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

export default function WasteDataScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        collectionDate: new Date(),
        plasticBags: '',
        paperBags: '',
        foodWasteBags: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [step, setStep] = useState(4);
    const [totalSteps] = useState(4);

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
            Alert.alert('Validation Error', 'Please fill in all waste fields');
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

    const handleComplete = () => {
        if (!formData.plasticBags || !formData.paperBags || !formData.foodWasteBags) {
            Alert.alert('Validation Error', 'Please fill in all fields before completing');
            return;
        }
        // Navigate to dashboard or completion screen
        navigation.navigate('Home');
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
                        <Ionicons name="trash-outline" size={24} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>Waste Data</Text>
                    </View>

                {/* Collection Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Collection Date *</Text>
                        <TouchableOpacity 
                            style={styles.pickerContainer}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.input, { color: formData.collectionDate ? '#2C3E50' : '#666' }]}>
                                {formatDate(formData.collectionDate)}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.pickerIcon} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.collectionDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Plastic Bags */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Plastic Bags *</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 2"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={formData.plasticBags}
                                onChangeText={(value) => handleInputChange('plasticBags', value)}
                            />
                            <Text style={styles.unitText}>bags</Text>
                        </View>
                    </View>

                    {/* Paper Bags */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Paper Bags *</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 1"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={formData.paperBags}
                                onChangeText={(value) => handleInputChange('paperBags', value)}
                            />
                            <Text style={styles.unitText}>bags</Text>
                        </View>
                    </View>

                    {/* Food Waste Bags */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Food Waste Bags *</Text>
                        <View style={styles.pickerContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 3"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                value={formData.foodWasteBags}
                                onChangeText={(value) => handleInputChange('foodWasteBags', value)}
                            />
                            <Text style={styles.unitText}>bags</Text>
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
                            (loading || !formData.plasticBags || !formData.paperBags || !formData.foodWasteBags) && styles.buttonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={loading || !formData.plasticBags || !formData.paperBags || !formData.foodWasteBags}
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
                            (!formData.plasticBags || !formData.paperBags || !formData.foodWasteBags) && styles.buttonDisabled
                        ]}
                        onPress={handleComplete}
                        disabled={!formData.plasticBags || !formData.paperBags || !formData.foodWasteBags || loading}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Complete Setup</Text>
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