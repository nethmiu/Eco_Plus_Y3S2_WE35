import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    TouchableOpacity, 
    Text,
    StatusBar,
    Animated,
    Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation, route }) {
    const [markerCoordinate, setMarkerCoordinate] = useState(null);
    const [isFindingLocation, setIsFindingLocation] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const mapRef = useRef(null);
    const slideAnim = useRef(new Animated.Value(100)).current;
   
    const [initialRegion, setInitialRegion] = useState({
        latitude: 7.8731, // ශ්‍රී ලංකාවේ මධ්‍ය ලක්ෂ්‍යය
        longitude: 80.7718,
        latitudeDelta: 5,
        longitudeDelta: 5,
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is needed to use the map.',
                    [{ text: 'OK', style: 'default' }]
                );
                return;
            }
        })();

        // Animate bottom panel on mount
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    }, []);

    const handleMapPress = async (e) => {
        const coordinate = e.nativeEvent.coordinate;
        setMarkerCoordinate(coordinate);
        
        // Get address for the selected location
        try {
            const addresses = await Location.reverseGeocodeAsync(coordinate);
            if (addresses && addresses.length > 0) {
                const address = addresses[0];
                const fullAddress = [
                    address.name,
                    address.street,
                    address.city || address.subregion,
                    address.region
                ].filter(Boolean).join(', ');
                setSelectedAddress(fullAddress || 'Selected Location');
            }
        } catch (error) {
            console.log('Error getting address:', error);
            setSelectedAddress('Selected Location');
        }
    };

    const handleFindMyLocation = async () => {
        setIsFindingLocation(true);
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 10000,
            });
           
            const { latitude, longitude } = location.coords;
            const newCoordinate = { latitude, longitude };

            setMarkerCoordinate(newCoordinate);

            // Get current location address
            try {
                const addresses = await Location.reverseGeocodeAsync(newCoordinate);
                if (addresses && addresses.length > 0) {
                    const address = addresses[0];
                    const currentAddress = [
                        address.name,
                        address.street,
                        address.city || address.subregion,
                        address.region
                    ].filter(Boolean).join(', ');
                    setSelectedAddress(currentAddress || 'Current Location');
                }
            } catch (error) {
                setSelectedAddress('Current Location');
            }

            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...newCoordinate,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }
        } catch (error) {
            console.error(error);
            Alert.alert(
                'Location Error',
                'Could not find your location. Please make sure your GPS is enabled and try again.',
                [{ text: 'OK', style: 'default' }]
            );
        } finally {
            setIsFindingLocation(false);
        }
    };

    const handleConfirmLocation = async () => {
        if (!markerCoordinate) {
            Alert.alert(
                'No Location Selected',
                'Please tap on the map or use "Find My Location" to select a location first.',
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        try {
            const addresses = await Location.reverseGeocodeAsync(markerCoordinate);
            if (addresses && addresses.length > 0) {
                const city = addresses[0].city || addresses[0].subregion;
                if (city) {
                    const sourceScreen = route.params?.source || 'Register';
                    navigation.navigate(sourceScreen, { selectedCity: city });
                } else {
                    Alert.alert(
                        'City Not Found',
                        'Could not determine the city for the selected location. Please try selecting a different location.',
                        [{ text: 'OK', style: 'default' }]
                    );
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert(
                'Error',
                'An error occurred while processing the location. Please try again.',
                [{ text: 'OK', style: 'default' }]
            );
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Location</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                onPress={handleMapPress}
                showsUserLocation={true}
                showsMyLocationButton={false}
                toolbarEnabled={false}
            >
                {markerCoordinate && (
                    <Marker coordinate={markerCoordinate}>
                        <View style={styles.customMarker}>
                            <Ionicons name="location" size={30} color="#E74C3C" />
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Find My Location Button */}
            <TouchableOpacity
                style={styles.findMeButton}
                onPress={handleFindMyLocation}
                disabled={isFindingLocation}
            >
                {isFindingLocation ? (
                    <ActivityIndicator size="small" color="#4A90E2" />
                ) : (
                    <MaterialIcons name="my-location" size={24} color="#4A90E2" />
                )}
            </TouchableOpacity>

            {/* Map Instructions */}
            <View style={styles.instructionsContainer}>
                <View style={styles.instructionBubble}>
                    <Ionicons name="information-circle" size={16} color="#4A90E2" />
                    <Text style={styles.instructionText}>
                        Tap anywhere on the map to select a location
                    </Text>
                </View>
            </View>

            {/* Bottom Panel */}
            <Animated.View 
                style={[
                    styles.bottomPanel,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                {markerCoordinate && (
                    <View style={styles.selectedLocationContainer}>
                        <View style={styles.locationHeader}>
                            <Ionicons name="location-outline" size={20} color="#4A90E2" />
                            <Text style={styles.selectedLocationTitle}>Selected Location</Text>
                        </View>
                        <Text style={styles.selectedLocationText} numberOfLines={2}>
                            {selectedAddress}
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleFindMyLocation}
                        disabled={isFindingLocation}
                    >
                        <View style={styles.buttonContent}>
                            <MaterialIcons name="my-location" size={20} color="#4A90E2" />
                            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                                {isFindingLocation ? 'Finding...' : 'Find My Location'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button, 
                            styles.primaryButton,
                            !markerCoordinate && styles.buttonDisabled
                        ]}
                        onPress={handleConfirmLocation}
                        disabled={!markerCoordinate}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={[styles.buttonText, styles.primaryButtonText]}>
                                Confirm Location
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Loading Overlay */}
            {isFindingLocation && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={styles.loadingText}>Finding your location...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
    },
    headerSpacer: {
        width: 40,
    },
    map: {
        flex: 1,
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    findMeButton: {
        position: 'absolute',
        top: 100,
        right: 16,
        backgroundColor: '#fff',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    instructionsContainer: {
        position: 'absolute',
        top: 100,
        left: 16,
        right: 80,
    },
    instructionBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    instructionText: {
        fontSize: 14,
        color: '#495057',
        marginLeft: 6,
        flex: 1,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    selectedLocationContainer: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedLocationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 8,
    },
    selectedLocationText: {
        fontSize: 14,
        color: '#6C757D',
        lineHeight: 20,
    },
    buttonContainer: {
        gap: 12,
        marginBottom: 16,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    primaryButton: {
        backgroundColor: '#4A90E2',
        elevation: 3,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        marginBottom: 8,
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4A90E2',
    },
    buttonDisabled: {
        backgroundColor: '#E9ECEF',
        elevation: 0,
        shadowOpacity: 0,
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
        color: '#4A90E2',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContent: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#495057',
        fontWeight: '500',
    },
});