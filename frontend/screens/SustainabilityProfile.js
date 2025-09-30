import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api`;
const TOKEN_KEY = 'userToken';

const SustainabilityProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(2);
    const [totalSteps] = useState(4);

    // Form data
    const [formData, setFormData] = useState({
        primaryWaterSources: [],
        separateWaste: null,
        compostWaste: false,
        plasticBagSize: '5',
        foodWasteBagSize: '5',
        paperBagSize: '5'
    });

    // Water source options
    const waterSources = [
        'Municipal Water',
        'Well Water',
        'Bottled Water',
        'Filtered Water',
        'Spring Water',
        'Rainwater Harvesting'
    ];

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }

            // Try to fetch existing profile
            const response = await axios.get(`${API_URL}/data/get-profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                const profile = response.data.data.sustainabilityProfile;
                setFormData({
                    primaryWaterSources: profile.primaryWaterSources || [],
                    separateWaste: profile.separateWaste !== undefined ? profile.separateWaste : null,
                    compostWaste: profile.compostWaste || false,
                    plasticBagSize: profile.plasticBagSize ? profile.plasticBagSize.toString() : '5',
                    foodWasteBagSize: profile.foodWasteBagSize ? profile.foodWasteBagSize.toString() : '5',
                    paperBagSize: profile.paperBagSize ? profile.paperBagSize.toString() : '5'
                });
            }
        } catch (error) {
            // Profile might not exist yet, which is fine
            console.log('No existing profile found or error loading:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleWaterSource = (source) => {
        setFormData(prev => {
            const isSelected = prev.primaryWaterSources.includes(source);
            const updatedSources = isSelected
                ? prev.primaryWaterSources.filter(s => s !== source)
                : [...prev.primaryWaterSources, source];
            
            return { ...prev, primaryWaterSources: updatedSources };
        });
    };

    const handleSave = async () => {
        if (!formData.primaryWaterSources.length || formData.separateWaste === null) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
            }

            const payload = {
                primaryWaterSources: formData.primaryWaterSources,
                separateWaste: formData.separateWaste,
                compostWaste: formData.compostWaste,
                plasticBagSize: parseInt(formData.plasticBagSize) || 5,
                foodWasteBagSize: parseInt(formData.foodWasteBagSize) || 5,
                paperBagSize: parseInt(formData.paperBagSize) || 5
            };

            const response = await axios.post(`${API_URL}/data/set-profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert(
                'Success',
                'Sustainability profile saved successfully!',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            Alert.alert(
                'Error', 
                error.response?.data?.message || 'Failed to save profile'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!formData.primaryWaterSources.length || formData.separateWaste === null) {
            Alert.alert('Validation Error', 'Please fill in all required fields before proceeding');
            return;
        }

        setSaving(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
            }

            const payload = {
                primaryWaterSources: formData.primaryWaterSources,
                separateWaste: formData.separateWaste,
                compostWaste: formData.compostWaste,
                plasticBagSize: parseInt(formData.plasticBagSize) || 5,
                foodWasteBagSize: parseInt(formData.foodWasteBagSize) || 5,
                paperBagSize: parseInt(formData.paperBagSize) || 5
            };

            // Save profile before navigating
            await axios.post(`${API_URL}/data/set-profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Navigate to next screen
            navigation.navigate('ElectricityData');
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            Alert.alert(
                'Error', 
                error.response?.data?.message || 'Failed to save profile'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

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
                {/* Primary Water Sources Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="water-outline" size={24} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>Primary Water Sources</Text>
                    </View>

                    <Text style={[styles.label, { marginBottom: 15 }]}>
                        Select all that apply *
                    </Text>

                    <View style={{ gap: 12 }}>
                        {waterSources.map((source, index) => (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    backgroundColor: formData.primaryWaterSources.includes(source) 
                                        ? '#E8F4FD' 
                                        : '#F8F9FA',
                                    borderWidth: 2,
                                    borderColor: formData.primaryWaterSources.includes(source)
                                        ? '#4A90E2'
                                        : '#E9ECEF',
                                    borderRadius: 12,
                                }}
                                onPress={() => toggleWaterSource(source)}
                            >
                                <View style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    borderWidth: 2,
                                    borderColor: formData.primaryWaterSources.includes(source)
                                        ? '#4A90E2'
                                        : '#666',
                                    backgroundColor: formData.primaryWaterSources.includes(source)
                                        ? '#4A90E2'
                                        : 'transparent',
                                    marginRight: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    {formData.primaryWaterSources.includes(source) && (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    )}
                                </View>
                                <Text style={{
                                    fontSize: 16,
                                    color: formData.primaryWaterSources.includes(source)
                                        ? '#2C3E50'
                                        : '#666',
                                    fontWeight: formData.primaryWaterSources.includes(source)
                                        ? '500'
                                        : '400'
                                }}>
                                    {source}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Waste Management Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="trash-outline" size={24} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>Waste Management</Text>
                    </View>

                    {/* Waste Separation Question */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Do you separate your waste? *
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    padding: 15,
                                    backgroundColor: formData.separateWaste === true 
                                        ? '#E8F4FD' 
                                        : '#F8F9FA',
                                    borderWidth: 2,
                                    borderColor: formData.separateWaste === true
                                        ? '#4A90E2'
                                        : '#E9ECEF',
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                                onPress={() => setFormData(prev => ({ ...prev, separateWaste: true }))}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    color: formData.separateWaste === true ? '#2C3E50' : '#666',
                                    fontWeight: formData.separateWaste === true ? '600' : '400'
                                }}>
                                    Yes
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    padding: 15,
                                    backgroundColor: formData.separateWaste === false 
                                        ? '#E8F4FD' 
                                        : '#F8F9FA',
                                    borderWidth: 2,
                                    borderColor: formData.separateWaste === false
                                        ? '#4A90E2'
                                        : '#E9ECEF',
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                                onPress={() => setFormData(prev => ({ ...prev, separateWaste: false }))}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    color: formData.separateWaste === false ? '#2C3E50' : '#666',
                                    fontWeight: formData.separateWaste === false ? '600' : '400'
                                }}>
                                    No
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Composting Question */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Do you compost your waste?
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    padding: 15,
                                    backgroundColor: formData.compostWaste === true 
                                        ? '#E8F4FD' 
                                        : '#F8F9FA',
                                    borderWidth: 2,
                                    borderColor: formData.compostWaste === true
                                        ? '#4A90E2'
                                        : '#E9ECEF',
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                                onPress={() => setFormData(prev => ({ ...prev, compostWaste: true }))}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    color: formData.compostWaste === true ? '#2C3E50' : '#666',
                                    fontWeight: formData.compostWaste === true ? '600' : '400'
                                }}>
                                    Yes
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    padding: 15,
                                    backgroundColor: formData.compostWaste === false 
                                        ? '#E8F4FD' 
                                        : '#F8F9FA',
                                    borderWidth: 2,
                                    borderColor: formData.compostWaste === false
                                        ? '#4A90E2'
                                        : '#E9ECEF',
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                                onPress={() => setFormData(prev => ({ ...prev, compostWaste: false }))}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    color: formData.compostWaste === false ? '#2C3E50' : '#666',
                                    fontWeight: formData.compostWaste === false ? '600' : '400'
                                }}>
                                    No
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bag Sizes Section - Only show if user separates waste */}
                    {formData.separateWaste && (
                        <>
                            <View style={[styles.inputGroup, { marginTop: 10 }]}>
                                <Text style={[styles.label, { color: '#4A90E2' }]}>
                                    Waste Bag Sizes (kg)
                                </Text>
                                
                                {/* Plastic Waste */}
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={[styles.label, { fontSize: 14, marginBottom: 5 }]}>
                                        Plastic waste Bag Size
                                    </Text>
                                    <View style={styles.pickerContainer}>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.plasticBagSize}
                                            onChangeText={(text) => setFormData(prev => ({ 
                                                ...prev, 
                                                plasticBagSize: text 
                                            }))}
                                            keyboardType="numeric"
                                            placeholder="Enter bag size in kg"
                                        />
                                        <Text style={{
                                            position: 'absolute',
                                            right: 15,
                                            top: 15,
                                            color: '#666',
                                            fontSize: 16
                                        }}>kg</Text>
                                    </View>
                                </View>

                                {/* Food Waste */}
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={[styles.label, { fontSize: 14, marginBottom: 5 }]}>
                                        Food waste Bag Size
                                    </Text>
                                    <View style={styles.pickerContainer}>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.foodWasteBagSize}
                                            onChangeText={(text) => setFormData(prev => ({ 
                                                ...prev, 
                                                foodWasteBagSize: text 
                                            }))}
                                            keyboardType="numeric"
                                            placeholder="Enter bag size in kg"
                                        />
                                        <Text style={{
                                            position: 'absolute',
                                            right: 15,
                                            top: 15,
                                            color: '#666',
                                            fontSize: 16
                                        }}>kg</Text>
                                    </View>
                                </View>

                                {/* Paper Waste */}
                                <View style={{ marginBottom: 5 }}>
                                    <Text style={[styles.label, { fontSize: 14, marginBottom: 5 }]}>
                                        Paper waste Bag Size
                                    </Text>
                                    <View style={styles.pickerContainer}>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.paperBagSize}
                                            onChangeText={(text) => setFormData(prev => ({ 
                                                ...prev, 
                                                paperBagSize: text 
                                            }))}
                                            keyboardType="numeric"
                                            placeholder="Enter bag size in kg"
                                        />
                                        <Text style={{
                                            position: 'absolute',
                                            right: 15,
                                            top: 15,
                                            color: '#666',
                                            fontSize: 16
                                        }}>kg</Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={{ paddingHorizontal: 20, marginTop: 10, gap: 10 }}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.primaryButton,
                            { backgroundColor: '#4A90E2' },
                            (saving || !formData.primaryWaterSources.length || formData.separateWaste === null) && 
                            styles.buttonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={saving || !formData.primaryWaterSources.length || formData.separateWaste === null}
                    >
                        <View style={styles.buttonContent}>
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            )}
                            <Text style={styles.buttonText}>
                                {saving ? 'Saving...' : 'Save Profile'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: '#28A745' },
                            (!formData.primaryWaterSources.length || formData.separateWaste === null) && 
                            styles.buttonDisabled
                        ]}
                        onPress={handleNext}
                        disabled={!formData.primaryWaterSources.length || formData.separateWaste === null || saving}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>
                                {saving ? 'Saving...' : 'Next'}
                            </Text>
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
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
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
    profileImageContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#4A90E2',
    },
    profileIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F4FD',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#4A90E2',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileImageText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputContainer: {
        position: 'relative',
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
    inputWithIcon: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
        padding: 5,
    },
    pickerContainer: {
        borderColor: '#E9ECEF',
        borderWidth: 2,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        position: 'relative',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        paddingLeft: 10,
    },
    pickerIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
        zIndex: 1,
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
    dangerZone: {
        marginHorizontal: 20,
        marginTop: 10,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderTopWidth: 2,
        borderTopColor: '#FFE6E6',
        backgroundColor: '#FFF5F5',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFD6D6',
    },
    dangerZoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    dangerZoneTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#D9534F',
        marginLeft: 8,
    },
    dangerZoneDescription: {
        fontSize: 14,
        color: '#721C24',
        marginBottom: 15,
        lineHeight: 20,
    },
});

export default SustainabilityProfileScreen;