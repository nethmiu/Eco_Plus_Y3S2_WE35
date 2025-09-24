import React, { useState } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/forgotPassword`, { email });
            Alert.alert('OTP Sent', 'An OTP has been sent to your email address. Please check your inbox.');
            navigation.navigate('ResetPassword', { email }); // Pass email to reset screen
        } catch (error) {
            const message = error.response?.data?.message || 'Could not send OTP. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Icon */}
            <Ionicons name="key-outline" size={70} color="#4CAF50" style={styles.icon} />
            
            {/* Titles */}
            <Text style={styles.title}>Forgot Your Password?</Text>
            <Text style={styles.subtitle}>
                Enter your email below and we'll send you an OTP to reset it.
            </Text>

            {/* Form Card */}
            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <MaterialIcons name="email" size={22} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleSendOTP} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="send" size={20} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Send OTP</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20, 
        backgroundColor: '#f8f9fa', 
    },
    icon: {
        marginBottom: 16,
    },
    title: { 
        fontSize: 26, 
        fontWeight: 'bold', 
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 8, 
    },
    subtitle: { 
        fontSize: 15, 
        color: '#7f8c8d', 
        textAlign: 'center', 
        marginBottom: 30, 
        paddingHorizontal: 10,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
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
        marginRight: 10,
    },
    input: { 
        flex: 1, 
        fontSize: 16, 
        color: '#333',
        height: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '600',
        marginLeft: 6,
    },
    buttonIcon: {
        marginRight: 6,
    },
});
