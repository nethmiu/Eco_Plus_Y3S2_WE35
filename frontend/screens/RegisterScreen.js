import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ScrollView, 
    TouchableOpacity, 
    StatusBar,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Animated
} from 'react-native';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

import config from '../config'; 
const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const { width, height } = Dimensions.get('window');

// Move InputField component outside to prevent re-creation on every render
const InputField = React.memo(({ 
    icon, 
    iconLibrary = 'Ionicons',
    placeholder, 
    value, 
    onChangeText, 
    keyboardType = 'default',
    secureTextEntry = false,
    showPasswordToggle = false,
    fieldName,
    passwordToggleState,
    onPasswordToggle,
    focusedField,
    setFocusedField,
    passwordsMatch
}) => {
    const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : 
                       iconLibrary === 'Feather' ? Feather :
                       iconLibrary === 'FontAwesome5' ? FontAwesome5 : Ionicons;

    const isFocused = focusedField === fieldName;
    const hasError = fieldName === 'confirmPassword' && passwordsMatch === false;

    return (
        <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            hasError && styles.inputContainerError
        ]}>
            <View style={styles.inputIconContainer}>
                <IconComponent 
                    name={icon} 
                    size={20} 
                    color={hasError ? '#FF6B6B' : isFocused ? '#667EEA' : '#8F9BB3'} 
                />
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry && !passwordToggleState}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                onFocus={() => setFocusedField(fieldName)}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#C5CEE0"
            />
            {showPasswordToggle && (
                <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={onPasswordToggle}
                >
                    <Ionicons 
                        name={passwordToggleState ? 'eye-off' : 'eye'} 
                        size={20} 
                        color="#8F9BB3" 
                    />
                </TouchableOpacity>
            )}
            {fieldName === 'confirmPassword' && passwordsMatch !== null && (
                <View style={styles.matchIndicator}>
                    <Ionicons 
                        name={passwordsMatch ? 'checkmark-circle' : 'close-circle'} 
                        size={20} 
                        color={passwordsMatch ? '#6BCF7F' : '#FF6B6B'} 
                    />
                </View>
            )}
        </View>
    );
});

// Move PasswordRequirement component outside
const PasswordRequirement = React.memo(({ met, text, icon }) => (
    <View style={styles.requirementItem}>
        <MaterialCommunityIcons 
            name={met ? 'check-circle' : 'circle-outline'} 
            size={16} 
            color={met ? '#6BCF7F' : '#C5CEE0'} 
        />
        <MaterialCommunityIcons 
            name={icon} 
            size={14} 
            color={met ? '#6BCF7F' : '#C5CEE0'} 
            style={styles.requirementIcon}
        />
        <Text style={[styles.requirementText, { color: met ? '#6BCF7F' : '#8F9BB3' }]}>
            {text}
        </Text>
    </View>
));

// Move GradientButton component outside
const GradientButton = React.memo(({ title, onPress, disabled, style, icon, iconLibrary = 'Ionicons', variant = 'primary', loading }) => {
    const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : 
                       iconLibrary === 'Feather' ? Feather :
                       iconLibrary === 'FontAwesome5' ? FontAwesome5 : Ionicons;

    return (
        <TouchableOpacity 
            style={[
                styles.gradientButton,
                variant === 'primary' ? styles.primaryGradient : styles.secondaryGradient,
                disabled && styles.buttonDisabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            {loading && variant === 'primary' ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Creating your account...</Text>
                </View>
            ) : (
                <View style={styles.buttonContent}>
                    {icon && (
                        <IconComponent 
                            name={icon} 
                            size={20} 
                            color={variant === 'primary' ? '#fff' : '#39a8e7ff'} 
                        />
                    )}
                    <Text style={[
                        styles.buttonText,
                        variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
                    ]}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
});

export default function RegisterScreen({ navigation, route }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        householdMembers: '',
        address: '',
        city: ''
    });
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
    });
    const [passwordsMatch, setPasswordsMatch] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (route.params?.selectedCity) {
            setFormData(prev => ({ ...prev, city: route.params.selectedCity }));
            navigation.setParams({ selectedCity: undefined });
        }
    }, [route.params?.selectedCity]);

    useEffect(() => {
        // Animate on mount
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        // Check password strength
        const password = formData.password;
        setPasswordStrength({
            hasMinLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        });

        // Check if passwords match
        if (formData.confirmPassword) {
            setPasswordsMatch(formData.password === formData.confirmPassword);
        } else {
            setPasswordsMatch(null);
        }
    }, [formData.password, formData.confirmPassword]);

    // Memoized input change handlers to prevent re-renders
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleNameChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, name: value }));
    }, []);

    const handleEmailChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, email: value }));
    }, []);

    const handlePasswordChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, password: value }));
    }, []);

    const handleConfirmPasswordChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, confirmPassword: value }));
    }, []);

    const handleHouseholdMembersChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, householdMembers: value }));
    }, []);

    const handleAddressChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, address: value }));
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setPasswordVisible(prev => !prev);
    }, []);

    const toggleConfirmPasswordVisibility = useCallback(() => {
        setConfirmPasswordVisible(prev => !prev);
    }, []);

    const getPasswordStrengthScore = useMemo(() => {
        return Object.values(passwordStrength).filter(Boolean).length;
    }, [passwordStrength]);

    const getPasswordStrengthText = useMemo(() => {
        const score = getPasswordStrengthScore;
        if (score < 2) return { text: 'Weak', color: '#FF6B6B' };
        if (score < 4) return { text: 'Medium', color: '#FFD93D' };
        return { text: 'Strong', color: '#6BCF7F' };
    }, [getPasswordStrengthScore]);

    const validateForm = () => {
        const { name, email, password, confirmPassword, householdMembers, address, city } = formData;
        
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Please enter your full name.');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Validation Error', 'Please enter your email address.');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Validation Error', 'Please enter a valid email address.');
            return false;
        }
        if (!password || password.length < 8) {
            Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match. Please check and try again.');
            return false;
        }
        if (!householdMembers || Number(householdMembers) < 1) {
            Alert.alert('Validation Error', 'Please enter a valid number of household members.');
            return false;
        }
        if (!address.trim()) {
            Alert.alert('Validation Error', 'Please enter your address.');
            return false;
        }
        if (!city) {
            Alert.alert('Validation Error', 'Please select your city from the map.');
            return false;
        }
        
        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/register`, {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                householdMembers: Number(formData.householdMembers),
                address: formData.address.trim(),
                city: formData.city,
            });

            if (response.data.status === 'success') {
                Alert.alert(
                    'Welcome to EcoWaste!', 
                    'Your account has been created successfully. Ready to make waste management smarter?',
                    [
                        { 
                            text: 'Get Started', 
                            onPress: () => navigation.navigate('Login'),
                            style: 'default'
                        }
                    ]
                );
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const PasswordStrengthIndicator = useMemo(() => {
        const strengthInfo = getPasswordStrengthText;
        const score = getPasswordStrengthScore;
        
        return (
            <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthHeader}>
                    <Text style={styles.strengthLabel}>Password Strength</Text>
                    <Text style={[styles.strengthText, { color: strengthInfo.color }]}>
                        {strengthInfo.text}
                    </Text>
                </View>
                <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((level) => (
                        <View
                            key={level}
                            style={[
                                styles.strengthBarSegment,
                                {
                                    backgroundColor: level <= score 
                                        ? strengthInfo.color 
                                        : '#E4E9F2'
                                }
                            ]}
                        />
                    ))}
                </View>
                <View style={styles.requirementsList}>
                    <PasswordRequirement
                        met={passwordStrength.hasMinLength}
                        text="At least 8 characters"
                        icon="text"
                    />
                    <PasswordRequirement
                        met={passwordStrength.hasUppercase}
                        text="One uppercase letter"
                        icon="format-letter-case-upper"
                    />
                    <PasswordRequirement
                        met={passwordStrength.hasLowercase}
                        text="One lowercase letter"
                        icon="format-letter-case-lower"
                    />
                    <PasswordRequirement
                        met={passwordStrength.hasNumber}
                        text="One number"
                        icon="numeric"
                    />
                    <PasswordRequirement
                        met={passwordStrength.hasSpecial}
                        text="One special character"
                        icon="asterisk"
                    />
                </View>
            </View>
        );
    }, [passwordStrength, getPasswordStrengthText, getPasswordStrengthScore]);

    const navigateToMapScreen = useCallback(() => {
        navigation.navigate('MapScreen', { source: 'Register' });
    }, [navigation]);

    const navigateToLogin = useCallback(() => {
        navigation.navigate('Login');
    }, [navigation]);

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header */}
                <Animated.View 
                    style={[
                        styles.heroSection,
                        { opacity: fadeAnim }
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <View style={styles.logoCircle}>
                                <MaterialCommunityIcons name="recycle" size={36} color="#0ac91aff" />
                            </View>
                            <View style={styles.logoGlow} />
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>Join Eco Pluse</Text>
                    <Text style={styles.heroSubtitle}>
                        Transform eco management with smart solutions for a sustainable future
                    </Text>
                </Animated.View>

                {/* Premium Form Card */}
                <Animated.View 
                    style={[
                        styles.premiumCard,
                        { opacity: fadeAnim }
                    ]}
                >
                    {/* Location Selection */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="map-marker-radius" size={22} color="#39a8e7ff" />
                            <Text style={styles.sectionTitle}>Your Location</Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={navigateToMapScreen} 
                            style={[
                                styles.locationSelector,
                                formData.city && styles.locationSelectorActive
                            ]}
                        >
                            <View style={styles.locationContent}>
                                <View style={[
                                    styles.locationIconContainer,
                                    formData.city && styles.locationIconContainerActive
                                ]}>
                                    <MaterialCommunityIcons 
                                        name="map-search" 
                                        size={24} 
                                        color={formData.city ? '#667EEA' : '#C5CEE0'} 
                                    />
                                </View>
                                <View style={styles.locationTextContainer}>
                                    <Text style={formData.city ? styles.selectedLocationText : styles.locationPlaceholder}>
                                        {formData.city || 'Select your city on the map'}
                                    </Text>
                                    {formData.city && (
                                        <Text style={styles.locationSubtext}>Tap to change location</Text>
                                    )}
                                </View>
                                <Feather name="chevron-right" size={20} color="#C5CEE0" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Personal Details */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome5 name="user-circle" size={20} color="#39a8e7ff" />
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                        </View>
                        
                        <InputField
                            icon="account-circle"
                            iconLibrary="MaterialCommunityIcons"
                            placeholder="Full Name"
                            value={formData.name}
                            onChangeText={handleNameChange}
                            fieldName="name"
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            passwordsMatch={passwordsMatch}
                        />
                        
                        <InputField
                            icon="email-variant"
                            iconLibrary="MaterialCommunityIcons"
                            placeholder="Email Address"
                            value={formData.email}
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            fieldName="email"
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            passwordsMatch={passwordsMatch}
                        />
                        
                        <InputField
                            icon="shield-lock"
                            iconLibrary="MaterialCommunityIcons"
                            placeholder="Create Password"
                            value={formData.password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry={true}
                            showPasswordToggle={true}
                            passwordToggleState={passwordVisible}
                            onPasswordToggle={togglePasswordVisibility}
                            fieldName="password"
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            passwordsMatch={passwordsMatch}
                        />

                        {formData.password.length > 0 && PasswordStrengthIndicator}
                        
                        <InputField
                            icon="shield-check"
                            iconLibrary="MaterialCommunityIcons"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            secureTextEntry={true}
                            showPasswordToggle={true}
                            passwordToggleState={confirmPasswordVisible}
                            onPasswordToggle={toggleConfirmPasswordVisibility}
                            fieldName="confirmPassword"
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            passwordsMatch={passwordsMatch}
                        />

                        {passwordsMatch === false && (
                            <View style={styles.errorMessage}>
                                <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                                <Text style={styles.errorText}>Passwords do not match</Text>
                            </View>
                        )}
                    </View>

                    {/* Household Information */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="home-heart" size={22} color="#39a8e7ff" />
                            <Text style={styles.sectionTitle}>Household Information</Text>
                        </View>
                        
                        <InputField
                            icon="account-group"
                            iconLibrary="MaterialCommunityIcons"
                            placeholder="Number of Household Members"
                            value={formData.householdMembers}
                            onChangeText={handleHouseholdMembersChange}
                            keyboardType="numeric"
                            fieldName="householdMembers"
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            passwordsMatch={passwordsMatch}
                        />
                        
                        <InputField
                            icon="home-map-marker"
                            iconLibrary="MaterialCommunityIcons"
                            placeholder="Street Address"
                            value={formData.address}
                            onChangeText={handleAddressChange}
                            fieldName="address"
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            passwordsMatch={passwordsMatch}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        <GradientButton
                            title="Create Account"
                            onPress={handleRegister}
                            disabled={loading}
                            icon="account-plus"
                            iconLibrary="MaterialCommunityIcons"
                            style={styles.createAccountButton}
                            loading={loading}
                        />
                        
                        <GradientButton
                            title="Already have an account? Sign In"
                            onPress={navigateToLogin}
                            icon="login"
                            iconLibrary="MaterialCommunityIcons"
                            variant="secondary"
                            style={styles.signInButton}
                        />
                    </View>
                </Animated.View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                       
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 30,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoWrapper: {
        position: 'relative',
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#319cf3ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    logoGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1abbe4ff',
        opacity: 0.1,
        top: 0,
        left: 0,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#102527ff',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    premiumCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2d3748',
        marginLeft: 12,
    },
    locationSelector: {
        backgroundColor: '#f7fafc',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        padding: 16,
    },
    locationSelectorActive: {
        borderColor: '#34e5f1ff',
        backgroundColor: '#fff',
    },
    locationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f7fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationIconContainerActive: {
        backgroundColor: '#edf2f7',
    },
    locationTextContainer: {
        flex: 1,
    },
    locationPlaceholder: {
        fontSize: 16,
        color: '#a0aec0',
    },
    selectedLocationText: {
        fontSize: 16,
        color: '#22d5ecff',
        fontWeight: '600',
    },
    locationSubtext: {
        fontSize: 12,
        color: '#718096',
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7fafc',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        marginBottom: 16,
        height: 56,
    },
    inputContainerFocused: {
        borderColor: '#31a5e9ff',
        backgroundColor: '#fff',
    },
    inputContainerError: {
        borderColor: '#FF6B6B',
        backgroundColor: '#fff5f5',
    },
    inputIconContainer: {
        paddingLeft: 16,
        paddingRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2d3748',
        height: '100%',
    },
    passwordToggle: {
        paddingHorizontal: 16,
    },
    matchIndicator: {
        paddingRight: 16,
    },
    passwordStrengthContainer: {
        backgroundColor: '#f7fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    strengthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    strengthLabel: {
        fontSize: 14,
        color: '#4a5568',
        fontWeight: '500',
    },
    strengthText: {
        fontSize: 14,
        fontWeight: '600',
    },
    strengthBar: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 4,
    },
    strengthBarSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    requirementsList: {
        gap: 8,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requirementIcon: {
        marginLeft: 8,
        marginRight: 8,
    },
    requirementText: {
        fontSize: 12,
        fontWeight: '500',
    },
    errorMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fed7d7',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#FF6B6B',
        marginLeft: 8,
        fontWeight: '500',
    },
    actionSection: {
        marginTop: 8,
    },
    gradientButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryGradient: {
        backgroundColor: '#23aeffff',
        shadowColor: '#23aeffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    secondaryGradient: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#0cb357ff',
    },
    buttonDisabled: {
        backgroundColor: '#e2e8f0',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    primaryButtonText: {
        color: '#fff',
    },
    secondaryButtonText: {
        color: '#030800ff',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    createAccountButton: {
        marginBottom: 8,
    },
    signInButton: {
        marginBottom: 0,
    },
    footer: {
        paddingHorizontal: 40,
        paddingTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#28c8f0ff',
        textAlign: 'center',
        lineHeight: 18,
    },
});