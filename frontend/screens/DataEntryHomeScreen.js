import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DataEntryHomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Add Consumption Data</Text>
        <Text style={styles.subtitle}>Choose what you'd like to track</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('ElectricityData')}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={24} color="#fff" />
          <Text style={styles.buttonText}>Electricity Usage</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('WaterData')}
        >
          <MaterialCommunityIcons name="water" size={24} color="#fff" />
          <Text style={styles.buttonText}>Water Usage</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('WasteData')}
        >
          <MaterialCommunityIcons name="recycle" size={24} color="#fff" />
          <Text style={styles.buttonText}>Waste Management</Text>
        </TouchableOpacity>

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});