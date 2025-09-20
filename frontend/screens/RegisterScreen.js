import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; 


import config from '../config'; 
const API_URL = `http://${config.IP}:${config.PORT}/api/users`;

export default function RegisterScreen({ navigation, route }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [householdMembers, setHouseholdMembers] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');

    useEffect(() => {
        if (route.params?.selectedCity) {
            setCity(route.params.selectedCity);
            navigation.setParams({ selectedCity: undefined });
        }
    }, [route.params?.selectedCity]);

    const handleRegister = async () => {
        if (!city || !name || !email || !password || !householdMembers || !address) {
            Alert.alert('Error', 'Please fill all fields, including selecting a city from the map.');
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
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
            Alert.alert('Registration Failed', errorMessage);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            {/* --- City Selector --- */}
            <Text style={styles.label}>City</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MapScreen')} style={styles.mapSelector}>
                <Ionicons name="location-sharp" size={22} color={city ? '#1e90ff' : '#888'} style={styles.mapSelectorIcon} />
                <Text style={city ? styles.selectedCityText : styles.placeholderText}>
                    {city || 'Tap to select your city on the map'}
                </Text>
            </TouchableOpacity>
            {/* ------------------------------------------- */}

            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Number of Household Members" value={householdMembers} onChangeText={setHouseholdMembers} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
            
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
    input: { 
        height: 50, 
        borderColor: '#ddd', 
        borderWidth: 1, 
        marginBottom: 15, 
        paddingHorizontal: 15, 
        borderRadius: 8,
        fontSize: 16,
    },
    buttonContainer: { marginTop: 20, marginBottom: 10 },
    label: { 
        fontSize: 14, 
        marginBottom: 8, 
        color: '#555',
        fontWeight: '500',
        alignSelf: 'flex-start', 
        marginLeft: 2,
    },
    
    mapSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
    },
    mapSelectorIcon: {
        marginRight: 10,
    },
    placeholderText: {
        color: '#888',
        fontSize: 16,
    },
    selectedCityText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '500',
    },
});