import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    StatusBar,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const TOKEN_KEY = 'userToken';
const { width } = Dimensions.get('window');

// ශ්‍රී ලංකාවේ ප්‍රධාන නගර ලැයිස්තුව
const srilankanCities = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Gampaha', 'Kurunegala', 
    'Anuradhapura', 'Trincomalee', 'Batticaloa', 'Matara', 'Negombo', 
    'Ratnapura', 'Badulla', 'Kalutara', 'Dehiwala-Mount Lavinia', 
    'Sri Jayewardenepura Kotte', 'Moratuwa', 'Hambantota', 'Polonnaruwa'
];

// Move InputField component outside the main component to prevent re-creation
const InputField = ({ icon, label, value, onChangeText, placeholder, keyboardType, secureTextEntry, showPasswordToggle, passwordField, togglePasswordVisibility, returnKeyType, onSubmitEditing }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>
            <Ionicons name={icon} size={16} color="#666" /> {label}
        </Text>
        <View style={styles.inputContainer}>
            <TextInput
                style={[styles.input, showPasswordToggle && styles.inputWithIcon]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
                autoCorrect={false}
                returnKeyType={returnKeyType}
                onSubmitEditing={onSubmitEditing}
                blurOnSubmit={false}
            />
            {showPasswordToggle && (
                <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => togglePasswordVisibility(passwordField)}
                >
                    <Ionicons 
                        name={secureTextEntry ? 'eye-off' : 'eye'} 
                        size={20} 
                        color="#666" 
                    />
                </TouchableOpacity>
            )}
        </View>
    </View>
);

// Move ActionButton component outside to prevent re-creation
const ActionButton = ({ title, onPress, disabled, color, icon, style, loading }) => (
    <TouchableOpacity 
        style={[styles.button, { backgroundColor: color }, disabled && styles.buttonDisabled, style]}
        onPress={onPress}
        disabled={disabled}
    >
        {loading ? (
            <ActivityIndicator color="#fff" size="small" />
        ) : (
            <View style={styles.buttonContent}>
                <Ionicons name={icon} size={20} color="#fff" />
                <Text style={styles.buttonText}>{title}</Text>
            </View>
        )}
    </TouchableOpacity>
);

export default function ProfileScreen({ route, navigation }) {
    const [formData, setFormData] = useState(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState({
        current: false,
        new: false,
        confirm: false
    });
    
    // Refs for password fields to manage focus
    const newPasswordRef = React.useRef();
    const confirmPasswordRef = React.useRef();

    // Screen එකට මුලින්ම එන විට user දත්ත state එකට ලබා දීම
    useEffect(() => {
        if (route.params?.user) {
            setFormData({
                name: route.params.user.name || '',
                email: route.params.user.email || '',
                address: route.params.user.address || '',
                city: route.params.user.city || srilankanCities[0],
                householdMembers: route.params.user.householdMembers?.toString() || '',
            });
        }
    }, [route.params?.user]);

    // Use useCallback to prevent function recreation on every render
    const handleInputChange = React.useCallback((field, value) => {
        setFormData(prevData => ({ ...prevData, [field]: value }));
    }, []);

    const togglePasswordVisibility = React.useCallback((field) => {
        setPasswordVisible(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const handleUpdateDetails = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const updatedData = {
                ...formData,
                householdMembers: Number(formData.householdMembers)
            };
            await axios.patch(`${API_URL}/updateMe`, updatedData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'Your details have been updated.');
        } catch (error) {
            Alert.alert('Update Failed', error.response?.data?.message || 'Could not update details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.patch(`${API_URL}/updatePassword`, {
                currentPassword,
                newPassword,
                confirmPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            Alert.alert('Success', 'Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            Alert.alert('Password Change Failed', error.response?.data?.message || 'Could not change password.');
        } finally {
            setLoading(false);
        }
    };

    // Function to focus on new password field
    const focusNewPassword = () => {
        newPasswordRef.current?.focus();
    };

    // Function to focus on confirm password field
    const focusConfirmPassword = () => {
        confirmPasswordRef.current?.focus();
    };

    if (!formData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView 
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.profileIcon}>
                            <Ionicons name="person" size={40} color="#4A90E2" />
                        </View>
                        <Text style={styles.title}>Edit Profile</Text>
                        <Text style={styles.subtitle}>Update your personal information</Text>
                    </View>

                    {/* Personal Details Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person-circle" size={24} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                        </View>
                        
                        <InputField
                            icon="person-outline"
                            label="Full Name"
                            value={formData.name}
                            onChangeText={(val) => handleInputChange('name', val)}
                            placeholder="Enter your full name"
                            togglePasswordVisibility={togglePasswordVisibility}
                        />
                        
                        <InputField
                            icon="mail-outline"
                            label="Email Address"
                            value={formData.email}
                            onChangeText={(val) => handleInputChange('email', val)}
                            placeholder="Enter your email address"
                            keyboardType="email-address"
                            togglePasswordVisibility={togglePasswordVisibility}
                        />

                        <InputField
                            icon="location-outline"
                            label="Address"
                            value={formData.address}
                            onChangeText={(val) => handleInputChange('address', val)}
                            placeholder="Enter your address"
                            togglePasswordVisibility={togglePasswordVisibility}
                        />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Ionicons name="business-outline" size={16} color="#666" /> City
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Ionicons name="chevron-down" size={20} color="#666" style={styles.pickerIcon} />
                                <Picker
                                    selectedValue={formData.city}
                                    onValueChange={(itemValue) => handleInputChange('city', itemValue)}
                                    style={styles.picker}
                                >
                                    {srilankanCities.map((cityName, index) => (
                                        <Picker.Item label={cityName} value={cityName} key={index} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <InputField
                            icon="people-outline"
                            label="Household Members"
                            value={formData.householdMembers}
                            onChangeText={(val) => handleInputChange('householdMembers', val)}
                            placeholder="Number of household members"
                            keyboardType="numeric"
                            togglePasswordVisibility={togglePasswordVisibility}
                        />
                        
                        <ActionButton
                            title="Update Details"
                            onPress={handleUpdateDetails}
                            disabled={loading}
                            color="#4A90E2"
                            icon="checkmark-circle"
                            style={styles.primaryButton}
                            loading={loading}
                        />
                    </View>

                    {/* Password Change Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="lock-closed" size={24} color="#28A745" />
                            <Text style={styles.sectionTitle}>Change Password</Text>
                        </View>
                        
                        <InputField
                            icon="lock-closed-outline"
                            label="Current Password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            secureTextEntry={!passwordVisible.current}
                            showPasswordToggle={true}
                            passwordField="current"
                            togglePasswordVisibility={togglePasswordVisibility}
                            returnKeyType="next"
                            onSubmitEditing={focusNewPassword}
                        />
                        
                        <InputField
                            icon="key-outline"
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            secureTextEntry={!passwordVisible.new}
                            showPasswordToggle={true}
                            passwordField="new"
                            togglePasswordVisibility={togglePasswordVisibility}
                            ref={newPasswordRef}
                            returnKeyType="next"
                            onSubmitEditing={focusConfirmPassword}
                        />
                        
                        <InputField
                            icon="checkmark-circle-outline"
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            secureTextEntry={!passwordVisible.confirm}
                            showPasswordToggle={true}
                            passwordField="confirm"
                            togglePasswordVisibility={togglePasswordVisibility}
                            ref={confirmPasswordRef}
                            returnKeyType="done"
                        />
                        
                        <ActionButton
                            title="Change Password"
                            onPress={handleChangePassword}
                            disabled={loading}
                            color="#28A745"
                            icon="shield-checkmark"
                            style={styles.secondaryButton}
                            loading={loading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

// Keep the same styles as before
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
    profileIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F4FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
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
});