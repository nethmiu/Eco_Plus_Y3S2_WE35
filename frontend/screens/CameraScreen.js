import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen({ navigation, route }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [processing, setProcessing] = useState(false);
    const cameraRef = useRef(null);
    
    const { formType } = route.params; // 'electricity' or 'water'

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: true,
                    exif: false
                });
                setCapturedPhoto(photo);
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to take picture');
            }
        }
    };

    // Simple text extraction without Tesseract.js
    const extractTextFromImage = async (base64Image) => {
        // For now, we'll use mock data based on formType
        // In a real app, you would use a cloud OCR service like:
        // - Google Cloud Vision API
        // - Microsoft Azure Computer Vision
        // - Amazon Textract
        
        setProcessing(true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock OCR data based on form type
            let mockOcrData = {};
            
            if (formType === 'electricity') {
                mockOcrData = {
                    units: '255',
                    lastReading: '22890',
                    latestReading: '23145',
                    accountNo: '5544332211'
                };
            } else if (formType === 'water') {
                mockOcrData = {
                    units: '75',
                    lastReading: '1450',
                    latestReading: '1525',
                    accountNo: '44-88-99-123-45'
                };
            }
            
            console.log('Mock OCR Data:', mockOcrData);
            
            // Navigate back with extracted data
            navigation.navigate({
                name: formType === 'electricity' ? 'ElectricityData' : 'WaterData',
                params: { ocrData: mockOcrData },
                merge: true
            });
            
        } catch (error) {
            console.error('OCR Error:', error);
            Alert.alert('Error', 'Failed to process image');
        } finally {
            setProcessing(false);
        }
    };

    const parseOCRText = (text, type) => {
        // This function would parse real OCR text
        // For now, we're using mock data
        const extractedData = {};
        
        if (type === 'electricity') {
            const lines = text.split('\n');
            
            lines.forEach(line => {
                const lowerLine = line.toLowerCase();
                
                // Look for units/kWh
                if (lowerLine.includes('kwh') || lowerLine.includes('units') || lowerLine.includes('consumption')) {
                    const numbers = line.match(/\d+\.?\d*/g);
                    if (numbers) {
                        extractedData.units = numbers[0];
                    }
                }
                
                // Look for account numbers
                if (lowerLine.includes('account') || lowerLine.includes('acc no') || lowerLine.includes('customer')) {
                    const accountMatch = line.match(/(\d+[\-\/\d]*)/);
                    if (accountMatch) {
                        extractedData.accountNo = accountMatch[0];
                    }
                }
                
                // Look for meter readings
                if ((lowerLine.includes('reading') || lowerLine.includes('meter')) && 
                    (lowerLine.includes('start') || lowerLine.includes('previous'))) {
                    const numbers = line.match(/\d+/g);
                    if (numbers) {
                        extractedData.lastReading = numbers[0];
                    }
                }
                
                if ((lowerLine.includes('reading') || lowerLine.includes('meter')) && 
                    (lowerLine.includes('end') || lowerLine.includes('current'))) {
                    const numbers = line.match(/\d+/g);
                    if (numbers) {
                        extractedData.latestReading = numbers[0];
                    }
                }
            });
        }
        
        return extractedData;
    };

    const retakePicture = () => {
        setCapturedPhoto(null);
    };

    const usePicture = () => {
        if (capturedPhoto?.base64) {
            extractTextFromImage(capturedPhoto.base64);
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>No access to camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Scan {formType === 'electricity' ? 'Electricity' : 'Water'} Bill
                </Text>
                <View style={{ width: 24 }} /> {/* Spacer for alignment */}
            </View>

            {processing ? (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.processingText}>Processing image with OCR...</Text>
                </View>
            ) : capturedPhoto ? (
                <View style={styles.previewContainer}>
                    <Image 
                        source={{ uri: capturedPhoto.uri }} 
                        style={styles.previewImage}
                    />
                    <View style={styles.previewButtons}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#6C757D' }]}
                            onPress={retakePicture}
                        >
                            <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#28A745' }]}
                            onPress={usePicture}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Use Photo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.cameraContainer}>
                    <CameraView 
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                    />
                    {/* Camera overlay with absolute positioning */}
                    <View style={styles.cameraOverlay}>
                        <View style={styles.captureButtonContainer}>
                            <TouchableOpacity 
                                style={styles.captureButton}
                                onPress={takePicture}
                            >
                                <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#000',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        paddingBottom: 30,
    },
    captureButtonContainer: {
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4A90E2',
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewImage: {
        flex: 1,
        resizeMode: 'contain',
    },
    previewButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    processingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});