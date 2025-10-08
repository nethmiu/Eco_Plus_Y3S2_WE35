import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import config from '../config';

const API_URL = `http://${config.IP}:${config.PORT}/api/users`;
const TOKEN_KEY = 'userToken';

const srilankanCities = [
  'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Gampaha', 'Kurunegala',
  'Anuradhapura', 'Trincomalee', 'Batticaloa', 'Matara', 'Negombo',
  'Ratnapura', 'Badulla', 'Kalutara', 'Dehiwala-Mount Lavinia',
  'Sri Jayewardenepura Kotte', 'Moratuwa', 'Hambantota', 'Polonnaruwa'
];

export default function AdminRegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('User');
  const [householdMembers, setHouseholdMembers] = useState('1');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(srilankanCities[0]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (role === 'User') {
      if (!householdMembers || isNaN(householdMembers) || Number(householdMembers) < 1) {
        newErrors.householdMembers = 'Please enter a valid number of household members (minimum 1)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('User');
    setHouseholdMembers('1');
    setAddress('');
    setCity(srilankanCities[0]);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAdminRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        Alert.alert('Authentication Error', 'Admin token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const newUserdata = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        householdMembers: role === 'User' ? Number(householdMembers) : null,
        address: address.trim(),
        city
      };

      const response = await axios.post(
        `${API_URL}/admin-register`,
        newUserdata,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success', 
        `New user "${name}" with role "${role}" has been created successfully.`,
        [
          {
            text: 'Create Another',
            onPress: clearForm
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);
      let message = 'An error occurred during registration.';
      
      if (error.response?.status === 401) {
        message = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 409) {
        message = 'A user with this email already exists.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message.includes('Network Error')) {
        message = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#121212" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
  <View style={styles.logoCircle}>
    <Ionicons name="person-add" size={40} color="#23aeff" />
  </View>
  <Text style={styles.title}>Register New User</Text>
</View>

          <Text style={styles.subtitle}>Create and manage user accounts</Text>
        </View>

        {/* Full Name */}
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={22} color="#6c757d" style={styles.icon} />
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Full Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: null }));
              }
            }}
            autoCapitalize="words"
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={22} color="#6c757d" style={styles.icon} />
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: null }));
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={22} color="#6c757d" style={styles.icon} />
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Temporary Password (min. 6 characters)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: null }));
              }
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#6c757d" 
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {/* Confirm Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={22} color="#6c757d" style={styles.icon} />
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: null }));
              }
            }}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#6c757d" 
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        {/* Role */}
        <Text style={styles.label}>Assign Role</Text>
        <View style={styles.pickerContainer}>
          <Picker 
            selectedValue={role} 
            onValueChange={(itemValue) => {
              setRole(itemValue);
              // Reset household members when role changes
              if (itemValue !== 'User') {
                setHouseholdMembers('1');
              }
            }}
          >
            <Picker.Item label="👤 User" value="User" />
            <Picker.Item label="🌱 Environmentalist" value="Environmentalist" />
            <Picker.Item label="⚙️ Admin" value="Admin" />
          </Picker>
        </View>

        {/* City */}
        <Text style={styles.label}>City</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={city} onValueChange={(itemValue) => setCity(itemValue)}>
            {srilankanCities.map((cityName, index) => (
              <Picker.Item label={cityName} value={cityName} key={index} />
            ))}
          </Picker>
        </View>

        {/* Address */}
        <View style={styles.inputWrapper}>
          <Ionicons name="home-outline" size={22} color="#6c757d" style={styles.icon} />
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            placeholder="Address"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (errors.address) {
                setErrors(prev => ({ ...prev, address: null }));
              }
            }}
            multiline
            numberOfLines={2}
          />
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

        {/* Household Members (Only for User role) */}
        {role === 'User' && (
          <>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={22} color="#6c757d" style={styles.icon} />
              <TextInput
                style={[styles.input, errors.householdMembers && styles.inputError]}
                placeholder="Number of Household Members"
                value={householdMembers}
                onChangeText={(text) => {
                  setHouseholdMembers(text);
                  if (errors.householdMembers) {
                    setErrors(prev => ({ ...prev, householdMembers: null }));
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            {errors.householdMembers && <Text style={styles.errorText}>{errors.householdMembers}</Text>}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleAdminRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearForm}
            disabled={loading}
          >
            <Text style={styles.clearButtonText}>Clear Form</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#121212',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#495057',
    fontWeight: '500',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 56,
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#343a40',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 15,
    marginLeft: 4,
  },
  pickerContainer: {
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 22,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  clearButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
});