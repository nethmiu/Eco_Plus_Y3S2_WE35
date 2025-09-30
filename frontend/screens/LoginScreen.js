import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import config from '../config';
const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const TOKEN_KEY = 'userToken';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (compatible && enrolled && token) {
                setCanUseBiometrics(true);
            }
        })();
    }, []);

    const navigateByUserRole = (user) => {
        if (!user || !user.role) {
            navigation.replace('Home');
            return;
        }

        switch (user.role) {
            case 'Admin':
                navigation.replace('AdminDashboard');
                break;
            case 'Environmentalist':
                navigation.replace('EnvironmentalistDashboard');
                break;
            default:
                navigation.replace('Home');
                break;
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password.');
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            if (response.data.status === 'success') {
                const { token, data } = response.data;
                const { user } = data;

                await SecureStore.setItemAsync(TOKEN_KEY, token);
                Alert.alert('Success', 'Login successful!');
                navigateByUserRole(user);
            }
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        setBiometricLoading(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Log in with your fingerprint',
                cancelLabel: 'Cancel',
                fallbackLabel: 'Use password instead'
            });

            if (result.success) {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (!token) {
                    Alert.alert('Error', 'Token not found. Please login with password first.');
                    return;
                }

                const response = await axios.get(`${API_URL}/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const { user } = response.data.data;
                navigateByUserRole(user);
            } else {
                Alert.alert('Authentication Failed', 'Fingerprint authentication was not successful.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Biometric login failed. Please try again.');
        } finally {
            setBiometricLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="leaf" size={60} color="#4CAF50" style={styles.logo} />
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Sign in to continue your eco-journey</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <MaterialIcons name="email" size={22} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialIcons name="lock-outline" size={22} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
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

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.loginButton, isLoading && styles.buttonDisabled]} 
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Login</Text>
                        </>
                    )}
                </TouchableOpacity>

                {canUseBiometrics && (
                    <TouchableOpacity 
                        style={[styles.biometricButton, biometricLoading && styles.buttonDisabled]} 
                        onPress={handleBiometricLogin}
                        disabled={biometricLoading}
                    >
                        {biometricLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="fingerprint" size={22} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Login with Fingerprint</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                    onPress={() => navigation.navigate('Register')}
                    style={styles.registerContainer}
                >
                    <Text style={styles.registerText}>
                        Don't have an account? <Text style={styles.registerLink}>Register Now</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        padding: 20, 
        backgroundColor: '#f8f9fa' 
    },
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    logo: {
        marginBottom: 16
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        textAlign: 'center', 
        color: '#2c3e50' 
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center'
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: { 
        flex: 1, 
        fontSize: 16, 
        color: '#333',
        height: '100%',
    },
    eyeIcon: {
        padding: 5,
    },
    forgotPassword: {
        textAlign: 'center',
        color: '#007bff',
        fontWeight: '600',
        marginBottom: 20,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '600',
        marginLeft: 8
    },
    buttonIcon: {
        marginRight: 8
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd'
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#7f8c8d',
        fontSize: 14
    },
    registerContainer: {
        alignItems: 'center',
    },
    registerText: { 
        fontSize: 15, 
        color: '#666' 
    },
    registerLink: { 
        color: '#007bff', 
        fontWeight: '600' 
    },
});
