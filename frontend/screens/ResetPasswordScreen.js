import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;

export default function ResetPasswordScreen({ route, navigation }) {
    const { email } = route.params; 
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    
    // Validation states
    const [passwordValidation, setPasswordValidation] = useState({
        isValid: false,
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
    });
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [showPasswordHelp, setShowPasswordHelp] = useState(false);

    // Live validation for password strength
    useEffect(() => {
        if (password.length > 0) {
            const minLength = password.length >= 8;
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
            
            const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
            
            setPasswordValidation({
                isValid,
                minLength,
                hasUppercase,
                hasLowercase,
                hasNumber,
                hasSpecialChar
            });
            setShowPasswordHelp(!isValid);
        } else {
            setPasswordValidation({
                isValid: false,
                minLength: false,
                hasUppercase: false,
                hasLowercase: false,
                hasNumber: false,
                hasSpecialChar: false
            });
            setShowPasswordHelp(false);
        }
    }, [password]);

    // Live validation for password confirmation
    useEffect(() => {
        if (confirmPassword.length > 0) {
            setPasswordsMatch(password === confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [password, confirmPassword]);

    const handleResetPassword = async () => {
        if (!otp || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }
        if (!passwordValidation.isValid) {
            Alert.alert('Error', 'Please ensure your password meets all security requirements.');
            return;
        }
        if (!passwordsMatch) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        
        setLoading(true);
        try {
            await axios.patch(`${API_URL}/resetPassword`, {
                email,
                otp,
                password,
                confirmPassword
            });
            Alert.alert(
                'Success', 
                'Your password has been reset successfully. Please log in.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const ValidationItem = ({ isValid, text }) => (
        <View style={styles.validationItem}>
            <Ionicons 
                name={isValid ? 'checkmark-circle' : 'close-circle'} 
                size={16} 
                color={isValid ? '#4CAF50' : '#f44336'} 
            />
            <Text style={[styles.validationText, { color: isValid ? '#4CAF50' : '#f44336' }]}>
                {text}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-open-outline" size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>Reset Your Password</Text>
                        <Text style={styles.subtitle}>
                            Enter the OTP sent to {email} and your new password.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* OTP Input */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="vpn-key" size={22} color="#666" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Enter OTP" 
                                value={otp} 
                                onChangeText={setOtp} 
                                keyboardType="number-pad" 
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* New Password Input */}
                        <View style={[
                            styles.inputContainer, 
                            password.length > 0 && !passwordValidation.isValid && styles.inputError
                        ]}>
                            <MaterialIcons name="lock-outline" size={22} color="#666" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="New Password" 
                                value={password} 
                                onChangeText={setPassword} 
                                secureTextEntry={!passwordVisible} 
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                                onPress={() => setPasswordVisible(!passwordVisible)} 
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} 
                                    size={22} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Password Strength Indicator */}
                        {showPasswordHelp && (
                            <View style={styles.validationContainer}>
                                <Text style={styles.validationTitle}>Password Requirements:</Text>
                                <ValidationItem 
                                    isValid={passwordValidation.minLength} 
                                    text="At least 8 characters" 
                                />
                                <ValidationItem 
                                    isValid={passwordValidation.hasUppercase} 
                                    text="One uppercase letter" 
                                />
                                <ValidationItem 
                                    isValid={passwordValidation.hasLowercase} 
                                    text="One lowercase letter" 
                                />
                                <ValidationItem 
                                    isValid={passwordValidation.hasNumber} 
                                    text="One number" 
                                />
                                <ValidationItem 
                                    isValid={passwordValidation.hasSpecialChar} 
                                    text="One special character (!@#$%^&*)" 
                                />
                            </View>
                        )}

                        {/* Confirm Password Input */}
                        <View style={[
                            styles.inputContainer, 
                            confirmPassword.length > 0 && !passwordsMatch && styles.inputError
                        ]}>
                            <MaterialIcons name="lock" size={22} color="#666" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Confirm New Password" 
                                value={confirmPassword} 
                                onChangeText={setConfirmPassword} 
                                secureTextEntry={!confirmPasswordVisible} 
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} 
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                                    size={22} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Password Match Validation */}
                        {confirmPassword.length > 0 && (
                            <View style={styles.matchValidation}>
                                <Ionicons 
                                    name={passwordsMatch ? 'checkmark-circle' : 'close-circle'} 
                                    size={16} 
                                    color={passwordsMatch ? '#4CAF50' : '#f44336'} 
                                />
                                <Text style={[
                                    styles.matchText, 
                                    { color: passwordsMatch ? '#4CAF50' : '#f44336' }
                                ]}>
                                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                </Text>
                            </View>
                        )}

                        {/* Reset Button */}
                        <TouchableOpacity 
                            style={[
                                styles.button, 
                                (loading || !passwordValidation.isValid || !passwordsMatch) && styles.buttonDisabled
                            ]} 
                            onPress={handleResetPassword} 
                            disabled={loading || !passwordValidation.isValid || !passwordsMatch}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <View style={styles.buttonContent}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>Resetting...</Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Ionicons name="refresh" size={20} color="#fff" />
                                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>Reset Password & Login</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer spacing for keyboard */}
                    <View style={styles.footerSpacing} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
        backgroundColor: '#f8fafb',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 20,
    },
    container: { 
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#f8fafb',
    },
    headerContainer: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 30,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#4CAF50',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    title: { 
        fontSize: 28, 
        fontWeight: '700', 
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 12, 
    },
    subtitle: { 
        fontSize: 16, 
        color: '#666', 
        textAlign: 'center', 
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#e1e5e9',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#f9fafb',
        height: 56,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputError: {
        borderColor: '#f44336',
        backgroundColor: '#ffebee',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: { 
        flex: 1, 
        fontSize: 16, 
        color: '#1a1a1a',
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },
    validationContainer: {
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    validationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    validationText: {
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '500',
    },
    matchValidation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    matchText: {
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#a0a0a0',
        shadowOpacity: 0.1,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '600',
    },
    footerSpacing: {
        height: 40,
    },
});