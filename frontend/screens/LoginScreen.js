import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.8.132:5000/api/users';
const TOKEN_KEY = 'userToken';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);

    // Check if biometric authentication is available and if a token exists
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

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password.');
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            if (response.data.status === 'success') {
                const { token } = response.data;
                await SecureStore.setItemAsync(TOKEN_KEY, token);
                Alert.alert('Success', 'Login successful!');
                navigation.replace('Home');
            }
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.message || 'An error occurred.');
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Log in with your fingerprint',
            });

            if (result.success) {
                // Biometric was successful, now we can navigate to home.
                // The token is already stored, HomeScreen will use it.
                navigation.replace('Home');
            } else {
                Alert.alert('Failure', 'Fingerprint authentication failed.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Biometric login failed.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back!</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <View style={styles.buttonContainer}>
                <Button title="Login" onPress={handleLogin} />
            </View>
            {canUseBiometrics && (
                <View style={styles.buttonContainer}>
                    <Button title="Login with Fingerprint" onPress={handleBiometricLogin} color="#007bff" />
                </View>
            )}
            <View style={styles.buttonContainer}>
                 <Button title="Don't have an account? Register" onPress={() => navigation.navigate('Register')} color="#6c757d" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingHorizontal: 10, borderRadius: 5 },
    buttonContainer: { marginTop: 10 },
});