import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'; // TouchableOpacity import කරගන්න
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons'; 

export default function MapScreen({ navigation }) {
    const [markerCoordinate, setMarkerCoordinate] = useState(null);
    const [isFindingLocation, setIsFindingLocation] = useState(false);
    const mapRef = useRef(null);
    
    const [initialRegion, setInitialRegion] = useState({
        latitude: 7.8731, // middle of Sri Lanka
        longitude: 80.7718,
        latitudeDelta: 5,
        longitudeDelta: 5,
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is needed to use the map.');
                return;
            }
        })();
    }, []);

    const handleMapPress = (e) => {
        setMarkerCoordinate(e.nativeEvent.coordinate);
    };

    const handleFindMyLocation = async () => {
        setIsFindingLocation(true);
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const { latitude, longitude } = location.coords;
            const newCoordinate = { latitude, longitude };

            setMarkerCoordinate(newCoordinate);

            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...newCoordinate,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not find your location. Please make sure your GPS is enabled.');
        } finally {
            setIsFindingLocation(false);
        }
    };

    const handleConfirmLocation = async () => {
        if (!markerCoordinate) {
            Alert.alert('No location selected', 'Please tap on the map to select a location.');
            return;
        }
        try {
            const addresses = await Location.reverseGeocodeAsync(markerCoordinate);
            if (addresses && addresses.length > 0) {
                const city = addresses[0].city || addresses[0].subregion;
                if (city) {
                    navigation.navigate('Register', { selectedCity: city });
                } else {
                    Alert.alert('City not found', 'Could not determine the city for the selected location.');
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred while fetching the city name.');
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                onPress={handleMapPress}
            >
                {markerCoordinate && <Marker coordinate={markerCoordinate} />}
            </MapView>

            {/* --- "Find My Location Icon Button" --- */}
            <TouchableOpacity 
                style={styles.findMeButton} 
                onPress={handleFindMyLocation}
            >
                <MaterialIcons name="my-location" size={24} color="#333" />
            </TouchableOpacity>
            {/* ----------------------------------------------------------------- */}

            {isFindingLocation && <ActivityIndicator style={styles.activityIndicator} size="large" color="#0000ff" />}
            
            <View style={styles.confirmButtonContainer}>
                <Button
                    title="Confirm Selection"
                    onPress={handleConfirmLocation}
                    disabled={!markerCoordinate}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    
    findMeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#fff',
        width: 50,
        height: 50,
        borderRadius: 25, 
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow for Android
        elevation: 5,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    activityIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
    },
    confirmButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
});