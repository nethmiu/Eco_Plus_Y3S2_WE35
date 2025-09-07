import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';

<<<<<<< HEAD
import config from '../config';
const API_URL = `http://${config.IP}:${config.PORT}/api/users`; 
=======

const API_URL = 'http://192.168.8.132:5000/api/users'; 
>>>>>>> dev-karindra

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [householdMembers, setHouseholdMembers] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');

    const handleRegister = async () => {
        if (!name || !email || !password || !householdMembers || !address || !city) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/register`, {
                name,
                email,
                password,
                householdMembers: Number(householdMembers),
                address,
                city,
            });

            if (response.data.status === 'success') {
                Alert.alert('Success', 'Registration successful! Please login.');
                navigation.navigate('Login');
            }
        } catch (error) {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Number of Household Members" value={householdMembers} onChangeText={setHouseholdMembers} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
            <View style={styles.buttonContainer}>
                <Button title="Register" onPress={handleRegister} color="#28a745" />
            </View>
             <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingHorizontal: 10, borderRadius: 5 },
    buttonContainer: { marginTop: 10, marginBottom: 10 },
});