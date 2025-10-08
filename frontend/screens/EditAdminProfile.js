import React, { useState, useEffect, useCallback } from 'react';
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
    Platform,
    Modal,
    Image
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

// Password validation function
const validatePassword = (password) => {
    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return validations;
};

// Password strength component
const PasswordStrength = ({ password }) => {
    const validations = validatePassword(password);
    const validCount = Object.values(validations).filter(Boolean).length;
    
    const getStrengthColor = () => {
        if (validCount <= 2) return '#D9534F';
        if (validCount <= 3) return '#F0AD4E';
        if (validCount <= 4) return '#5BC0DE';
        return '#28A745';
    };
    
    const getStrengthText = () => {
        if (validCount <= 2) return 'Weak';
        if (validCount <= 3) return 'Fair';
        if (validCount <= 4) return 'Good';
        return 'Strong';
    };

    if (!password) return null;

    return (
        <View style={styles.passwordStrengthContainer}>
            <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Password Strength: </Text>
                <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                    {getStrengthText()}
                </Text>
            </View>
            
            <View style={styles.strengthBar}>
                <View 
                    style={[
                        styles.strengthFill, 
                        { 
                            width: `${(validCount / 5) * 100}%`, 
                            backgroundColor: getStrengthColor() 
                        }
                    ]} 
                />
            </View>
            
            <View style={styles.validationList}>
                <ValidationItem 
                    isValid={validations.length} 
                    text="At least 8 characters" 
                />
                <ValidationItem 
                    isValid={validations.uppercase} 
                    text="One uppercase letter" 
                />
                <ValidationItem 
                    isValid={validations.lowercase} 
                    text="One lowercase letter" 
                />
                <ValidationItem 
                    isValid={validations.number} 
                    text="One number" 
                />
                <ValidationItem 
                    isValid={validations.special} 
                    text="One special character" 
                />
            </View>
        </View>
    );
};

// Validation item component
const ValidationItem = ({ isValid, text }) => (
    <View style={styles.validationItem}>
        <Ionicons 
            name={isValid ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={isValid ? '#28A745' : '#D9534F'} 
        />
        <Text style={[styles.validationText, { color: isValid ? '#28A745' : '#666' }]}>
            {text}
        </Text>
    </View>
);

// Move InputField component outside the main component to prevent re-creation
const InputField = ({ icon, label, value, onChangeText, placeholder, keyboardType, secureTextEntry, showPasswordToggle, passwordField, togglePasswordVisibility, returnKeyType, onSubmitEditing, inputRef }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>
            <Ionicons name={icon} size={16} color="#666" /> {label}
        </Text>
        <View style={styles.inputContainer}>
            <TextInput
                ref={inputRef}
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

// Email Confirmation Modal Component
const EmailConfirmationModal = ({ visible, onClose, onConfirm, loading, userEmail }) => {
    const [confirmationEmail, setConfirmationEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const handleConfirm = () => {
        // Reset error
        setEmailError('');
        
        // Validate email
        if (!confirmationEmail.trim()) {
            setEmailError('Please enter your email address');
            return;
        }

        // Check if emails match (case insensitive)
        if (confirmationEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
            setEmailError('Email does not match your account email');
            return;
        }

        // If validation passes, proceed with deletion
        onConfirm();
        setConfirmationEmail(''); // Clear the field after confirmation
    };

    const handleClose = () => {
        setConfirmationEmail('');
        setEmailError('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Ionicons name="warning" size={48} color="#D9534F" />
                        <Text style={styles.modalTitle}>Delete Admin Account</Text>
                        <Text style={styles.modalSubtitle}>
                            This action cannot be undone. All your admin data will be permanently deleted.
                        </Text>
                    </View>

                    <View style={styles.modalContent}>
                        <Text style={styles.confirmationText}>
                            To confirm deletion, please type your email address:
                        </Text>
                        <Text style={styles.userEmailDisplay}>
                            Your email: {userEmail}
                        </Text>
                        
                        <TextInput
                            style={[styles.confirmationInput, emailError && styles.inputError]}
                            value={confirmationEmail}
                            onChangeText={(text) => {
                                setConfirmationEmail(text);
                                setEmailError(''); // Clear error when user types
                            }}
                            placeholder="Type your email address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButton]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.deleteButtonText}>Delete Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function EditAdminProfile({ route, navigation }) {
    const [formData, setFormData] = useState(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordMatchError, setPasswordMatchError] = useState('');
    const [samePasswordError, setSamePasswordError] = useState('');
    
    // Refs for password fields to manage focus
    const newPasswordRef = React.useRef();
    const confirmPasswordRef = React.useRef();

    // Request camera permissions
    useEffect(() => {
        (async () => {
            const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
            const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (cameraResult.status !== 'granted' || mediaLibraryResult.status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera and photo library permissions to update your profile photo.');
            }
        })();
    }, []);

    // Screen එකට මුලින්ම එන විට admin දත්ත state එකට ලබා දීම
    useEffect(() => {
        if (route.params?.admin) {
            setFormData({
                name: route.params.admin.name || '',
                email: route.params.admin.email || '',
                address: route.params.admin.address || '',
                city: route.params.admin.city || srilankanCities[0],
                householdMembers: route.params.admin.householdMembers?.toString() || '',
            });

            // Set profile image if exists
            if (route.params.admin.photo && route.params.admin.photo !== 'default.jpg') {
                setProfileImage(`http://${config.IP}:${config.PORT}/api/users/uploads/users/${route.params.admin.photo}`);
            }
        }
    }, [route.params?.admin]);

    // Check password match when confirm password changes
    useEffect(() => {
        if (confirmPassword && newPassword) {
            if (newPassword !== confirmPassword) {
                setPasswordMatchError('Passwords do not match');
            } else {
                setPasswordMatchError('');
            }
        } else {
            setPasswordMatchError('');
        }
    }, [newPassword, confirmPassword]);

    // Check if new password is same as current password
    useEffect(() => {
        if (currentPassword && newPassword) {
            if (currentPassword === newPassword) {
                setSamePasswordError('New password must be different from current password');
            } else {
                setSamePasswordError('');
            }
        } else {
            setSamePasswordError('');
        }
    }, [currentPassword, newPassword]);

    // Logout function
    const handleLogout = useCallback(async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        Alert.alert('Logged Out', 'You logged out Successfully.');
                        navigation.replace('Login');
                    },
                },
            ]
        );
    }, [navigation]);

    // Use useCallback to prevent function recreation on every render
    const handleInputChange = React.useCallback((field, value) => {
        setFormData(prevData => ({ ...prevData, [field]: value }));
    }, []);

    const togglePasswordVisibility = React.useCallback((field) => {
        setPasswordVisible(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const pickImage = async () => {
        Alert.alert(
            "Select Photo",
            "Choose how you want to select a photo",
            [
                {
                    text: "Camera",
                    onPress: openCamera,
                },
                {
                    text: "Photo Library",
                    onPress: openImagePicker,
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    const openCamera = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const openImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleUpdateDetails = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            
            // Create FormData for file upload
            const formDataToSend = new FormData();
            
            // Add text fields
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('address', formData.address);
            formDataToSend.append('city', formData.city);
            formDataToSend.append('householdMembers', Number(formData.householdMembers));

            // Add photo if selected and it's a new local image
            if (profileImage && profileImage.startsWith('file://')) {
                formDataToSend.append('photo', {
                    uri: profileImage,
                    type: 'image/jpeg',
                    name: 'profile-photo.jpg',
                });
            }

            const response = await axios.patch(`${API_URL}/updateMe`, formDataToSend, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Update the profile image URL if a new photo was uploaded
            if (response.data.data.user.photo && profileImage && profileImage.startsWith('file://')) {
                setProfileImage(`http://${config.IP}:${config.PORT}/api/users/uploads/users/${response.data.data.user.photo}`);
            }

            // Show success message with navigation option
            Alert.alert(
                'Success', 
                'Your admin details have been updated successfully!',
                [
                    {
                        text: 'Stay Here',
                        style: 'cancel'
                    },
                    {
                        text: 'Go to Dashboard',
                        onPress: () => navigation.navigate('AdminDashboard')
                    }
                ]
            );
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Update Failed', error.response?.data?.message || 'Could not update admin details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }
        
        if (currentPassword === newPassword) {
            Alert.alert('Error', 'New password must be different from your current password.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        // Check password strength
        const validations = validatePassword(newPassword);
        const validCount = Object.values(validations).filter(Boolean).length;
        
        if (validCount < 4) {
            Alert.alert(
                'Weak Password', 
                'Your password should meet at least 4 out of 5 security requirements for better protection.',
                [
                    {
                        text: 'Improve Password',
                        style: 'cancel'
                    },
                    {
                        text: 'Continue Anyway',
                        onPress: () => performPasswordChange()
                    }
                ]
            );
            return;
        }

        await performPasswordChange();
    };

    const performPasswordChange = async () => {
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
            
            // Show success message and logout
            Alert.alert(
                'Password Changed Successfully', 
                'Your admin password has been changed successfully. You will be logged out for security reasons.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            // Clear password fields
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            
                            // Auto logout after password change
                            await SecureStore.deleteItemAsync(TOKEN_KEY);
                            navigation.replace('Login');
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Password Change Failed', error.response?.data?.message || 'Could not change admin password.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccountInitiate = () => {
        setDeleteModalVisible(true);
    };

    const handleDeleteAccountConfirm = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            await axios.delete(`${API_URL}/deleteMe`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Token එක ඉවත් කර Login screen එකට යැවීම
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setDeleteModalVisible(false);
            Alert.alert(
                'Admin Account Deleted', 
                'Your admin account has been successfully deleted.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.replace('Login')
                    }
                ]
            );

        } catch (error) {
            Alert.alert('Deletion Failed', error.response?.data?.message || 'Could not delete your admin account.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalVisible(false);
    };

    // Function to focus on new password field
    const focusNewPassword = () => {
        newPasswordRef.current?.focus();
    };

    // Function to focus on confirm password field
    const focusConfirmPassword = () => {
        confirmPasswordRef.current?.focus();
    };

    // Check if password change form is valid
    const isPasswordFormValid = () => {
        const validations = validatePassword(newPassword);
        const validCount = Object.values(validations).filter(Boolean).length;
        return currentPassword && newPassword && confirmPassword && 
               newPassword === confirmPassword && validCount >= 3 &&
               currentPassword !== newPassword; // New password must be different from current
    };

    if (!formData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>Loading admin profile...</Text>
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
                        <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.profileIcon}>
                                    <Ionicons name="shield-checkmark" size={40} color="#FF6B35" />
                                </View>
                            )}
                            <View style={styles.cameraIconContainer}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.profileImageText}>Tap to change admin profile picture</Text>
                        <Text style={styles.title}>Edit Admin Profile</Text>
                        <Text style={styles.subtitle}>Update your administrative information</Text>
                    </View>

                    {/* Personal Details Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="shield-checkmark-outline" size={24} color="#FF6B35" />
                            <Text style={styles.sectionTitle}>Admin Details</Text>
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

                        
                        
                        <ActionButton
                            title="Update Admin Details"
                            onPress={handleUpdateDetails}
                            disabled={loading}
                            color="#FF6B35"
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
                            inputRef={newPasswordRef}
                            returnKeyType="next"
                            onSubmitEditing={focusConfirmPassword}
                        />
                        
                        {/* Password Strength Indicator */}
                        <PasswordStrength password={newPassword} />
                        
                        {/* Same Password Error */}
                        {samePasswordError ? (
                            <View style={styles.passwordErrorContainer}>
                                <Ionicons name="alert-circle" size={16} color="#D9534F" />
                                <Text style={styles.passwordErrorText}>{samePasswordError}</Text>
                            </View>
                        ) : null}
                        
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
                            inputRef={confirmPasswordRef}
                            returnKeyType="done"
                        />
                        
                        {/* Password Match Error */}
                        {passwordMatchError ? (
                            <View style={styles.passwordErrorContainer}>
                                <Ionicons name="alert-circle" size={16} color="#D9534F" />
                                <Text style={styles.passwordErrorText}>{passwordMatchError}</Text>
                            </View>
                        ) : null}
                        
                        {/* Password Match Success */}
                        {confirmPassword && newPassword && newPassword === confirmPassword ? (
                            <View style={styles.passwordSuccessContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#28A745" />
                                <Text style={styles.passwordSuccessText}>Passwords match!</Text>
                            </View>
                        ) : null}
                        
                        <ActionButton
                            title="Change Password"
                            onPress={handleChangePassword}
                            disabled={loading || !isPasswordFormValid()}
                            color="#28A745"
                            icon="shield-checkmark"
                            style={styles.secondaryButton}
                            loading={loading}
                        />
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.dangerZone}>
                        <View style={styles.dangerZoneHeader}>
                            <Ionicons name="warning" size={24} color="#D9534F" />
                            <Text style={styles.dangerZoneTitle}>Admin Danger Zone</Text>
                        </View>
                        <Text style={styles.dangerZoneDescription}>
                            Once you delete your admin account, there is no going back. This will remove all administrative privileges. Please be certain.
                        </Text>
                        <ActionButton
                            title="Delete Admin Profile"
                            onPress={handleDeleteAccountInitiate}
                            disabled={loading}
                            color="#D9534F"
                            icon="trash"
                            loading={loading}
                        />
                    </View>
                </ScrollView>

                {/* Email Confirmation Modal */}
                <EmailConfirmationModal
                    visible={deleteModalVisible}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteAccountConfirm}
                    loading={loading}
                    userEmail={formData.email}
                />
            </KeyboardAvoidingView>
        </>
    );
}

// Complete styles (adapted for admin theme)
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
        borderColor: '#FF6B35',
    },
    profileIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF4F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FF6B35',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#FF6B35',
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

    // Password Strength Styles
    passwordStrengthContainer: {
        marginBottom: 15,
        marginTop: -5,
    },
    strengthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    strengthLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    strengthText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    strengthBar: {
        height: 4,
        backgroundColor: '#E9ECEF',
        borderRadius: 2,
        marginBottom: 10,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
        transition: 'width 0.3s ease',
    },
    validationList: {
        paddingLeft: 10,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    validationText: {
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '500',
    },

    // Password Error/Success Styles
    passwordErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -10,
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    passwordErrorText: {
        color: '#D9534F',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '500',
    },
    passwordSuccessContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -10,
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    passwordSuccessText: {
        color: '#28A745',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '500',
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D9534F',
        marginTop: 15,
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    confirmationText: {
        fontSize: 16,
        color: '#495057',
        marginBottom: 10,
        fontWeight: '500',
    },
    userEmailDisplay: {
        fontSize: 14,
        color: '#28A745',
        marginBottom: 15,
        fontWeight: '600',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#28A745',
    },
    confirmationInput: {
        height: 50,
        borderColor: '#E9ECEF',
        borderWidth: 2,
        paddingHorizontal: 15,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        color: '#2C3E50',
    },
    inputError: {
        borderColor: '#D9534F',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#D9534F',
        fontSize: 14,
        marginTop: 8,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 15,
    },
    modalButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6C757D',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#D9534F',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});