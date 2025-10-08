import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen({ navigation, route }) {
    const { formType } = route.params;
    const [facing, setFacing] = useState('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [processing, setProcessing] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const cameraRef = useRef(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={64} color="#4A90E2" />
                <Text style={styles.permissionText}>
                    We need your permission to use the camera
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const extractDataFromText = (text, formType) => {
      const cleanText = text.toUpperCase();
      const data = {
          units: '',
          lastReading: '',
          latestReading: '',
          accountNo: '',
          // No billingMonth field
      };
  
      if (formType === 'electricity') {
          const unitsPatterns = [
              /(?:UNITS?|CONSUMPTION|KWH|ENERGY)\s*:?\s*(\d+(?:\.\d+)?)/i,
              /(\d+)\s*(?:KWH|UNITS?)/i,
              /TOTAL\s*UNITS?\s*:?\s*(\d+)/i,
          ];
  
          const lastReadingPatterns = [
              /(?:PREVIOUS|LAST|INITIAL)\s*(?:READING|METER)?\s*:?\s*(\d+)/i,
              /METER\s*READING\s*(?:PREVIOUS|LAST)\s*:?\s*(\d+)/i,
          ];
  
          const latestReadingPatterns = [
              /(?:CURRENT|PRESENT|LATEST)\s*(?:READING|METER)?\s*:?\s*(\d+)/i,
              /METER\s*READING\s*(?:CURRENT|LATEST)\s*:?\s*(\d+)/i,
          ];
  
          const accountPatterns = [
              /(?:ACCOUNT|ACC|A\/C)\s*(?:NO|NUMBER)?\s*:?\s*(\d+)/i,
              /CONSUMER\s*(?:NO|NUMBER)\s*:?\s*(\d+)/i,
          ];
  
          // Extract units
          for (const pattern of unitsPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.units = match[1].trim();
                  break;
              }
          }
  
          // Extract last reading
          for (const pattern of lastReadingPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.lastReading = match[1].trim();
                  break;
              }
          }
  
          // Extract latest reading
          for (const pattern of latestReadingPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.latestReading = match[1].trim();
                  break;
              }
          }
  
          // Extract account number
          for (const pattern of accountPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.accountNo = match[1].trim();
                  break;
              }
          }
  
          // Calculate units if we have both readings but no units
          if (!data.units && data.lastReading && data.latestReading) {
              const calculated = parseInt(data.latestReading) - parseInt(data.lastReading);
              if (calculated > 0 && calculated < 10000) {
                  data.units = calculated.toString();
              }
          }
      } else if (formType === 'water') {
          const unitsPatterns = [
              /(?:CONSUMPTION|USAGE|M3|CUBIC)\s*:?\s*(\d+(?:\.\d+)?)/i,
              /(\d+)\s*(?:M3|CUBIC\s*METERS?)/i,
              /TOTAL\s*(?:CONSUMPTION|USAGE)\s*:?\s*(\d+)/i,
          ];
  
          const lastReadingPatterns = [
              /(?:PREVIOUS|LAST|INITIAL)\s*(?:READING|METER)?\s*:?\s*(\d+)/i,
          ];
  
          const latestReadingPatterns = [
              /(?:CURRENT|PRESENT|LATEST)\s*(?:READING|METER)?\s*:?\s*(\d+)/i,
          ];
  
          const accountPatterns = [
              /(?:ACCOUNT|ACC)\s*(?:NO|NUMBER)?\s*:?\s*([\d\/]+)/i,
              /CONSUMER\s*(?:NO|NUMBER)\s*:?\s*([\d\/]+)/i,
          ];
  
          // Extract units
          for (const pattern of unitsPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.units = match[1].trim();
                  break;
              }
          }
  
          // Extract last reading
          for (const pattern of lastReadingPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.lastReading = match[1].trim();
                  break;
              }
          }
  
          // Extract latest reading
          for (const pattern of latestReadingPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.latestReading = match[1].trim();
                  break;
              }
          }
  
          // Extract account number
          for (const pattern of accountPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                  data.accountNo = match[1].trim();
                  break;
              }
          }
  
          // Calculate units for water bills
          if (!data.units && data.lastReading && data.latestReading) {
              const calculated = parseInt(data.latestReading) - parseInt(data.lastReading);
              if (calculated > 0 && calculated < 1000) {
                  data.units = calculated.toString();
              }
          }
      }
  
      return data;
  };

    const performOCR = async (imageUri) => {
        try {
            setProcessing(true);

            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'bill.jpg',
            });
            formData.append('apikey', 'K87581488388957');
            formData.append('language', 'eng');
            formData.append('isOverlayRequired', 'false');
            formData.append('detectOrientation', 'true');
            formData.append('scale', 'true');
            formData.append('OCREngine', '2');

            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.IsErroredOnProcessing) {
                throw new Error(result.ErrorMessage || 'OCR processing failed');
            }

            if (result.ParsedResults && result.ParsedResults.length > 0) {
                const text = result.ParsedResults[0].ParsedText;
                const extracted = extractDataFromText(text, formType);

                if (!extracted.units && !extracted.accountNo && !extracted.lastReading && !extracted.billingMonth) {
                    Alert.alert(
                        'No Data Found',
                        'Could not extract bill information. Please ensure the bill is clear and try again.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                setExtractedData(extracted);
                setCapturedImage(imageUri);
                setShowConfirmDialog(true);
            } else {
                throw new Error('No text found in image');
            }
        } catch (error) {
            console.error('OCR Error:', error);
            Alert.alert(
                'OCR Failed',
                'Failed to process the image. Please try again with better lighting and a clear image.',
                [{ text: 'OK' }]
            );
        } finally {
            setProcessing(false);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                setProcessing(true);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 1,
                    base64: false,
                    skipProcessing: false,
                });
                await performOCR(photo.uri);
            } catch (error) {
                console.error('Camera error:', error);
                Alert.alert('Error', 'Failed to take picture. Please try again.');
                setProcessing(false);
            }
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                await performOCR(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleConfirm = () => {
        setShowConfirmDialog(false);
        const targetScreen = formType === 'electricity' ? 'ElectricityData' : 'WaterData';
        navigation.navigate(targetScreen, { ocrData: extractedData });
    };

    const handleRetry = () => {
        setShowConfirmDialog(false);
        setExtractedData(null);
        setCapturedImage(null);
    };

    const toggleCameraFacing = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.overlay}>
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.topButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.topTitle}>
                            Scan {formType === 'electricity' ? 'Electricity' : 'Water'} Bill
                        </Text>
                        <TouchableOpacity
                            style={styles.topButton}
                            onPress={toggleCameraFacing}
                        >
                            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scanArea}>
                        <View style={styles.cornerTopLeft} />
                        <View style={styles.cornerTopRight} />
                        <View style={styles.cornerBottomLeft} />
                        <View style={styles.cornerBottomRight} />
                    </View>

                    <View style={styles.bottomBar}>
                        <Text style={styles.instructionText}>
                            Position the bill within the frame
                        </Text>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.galleryButton}
                                onPress={pickImage}
                                disabled={processing}
                            >
                                <Ionicons name="images-outline" size={28} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.captureButton, processing && styles.captureButtonDisabled]}
                                onPress={takePicture}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator size="large" color="#fff" />
                                ) : (
                                    <View style={styles.captureButtonInner} />
                                )}
                            </TouchableOpacity>

                            <View style={styles.galleryButton} />
                        </View>
                    </View>
                </View>
            </CameraView>

            <Modal
                visible={showConfirmDialog}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowConfirmDialog(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="checkmark-circle" size={32} color="#28A745" />
                            <Text style={styles.modalTitle}>Confirm Extracted Data</Text>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {capturedImage && (
                                <Image
                                    source={{ uri: capturedImage }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                            )}

                            <View style={styles.dataSection}>
                                <Text style={styles.dataSectionTitle}>Extracted Information:</Text>

                                {/* Billing Month - NEW */}
                                {extractedData?.billingMonth && (
                                    <View style={styles.dataRow}>
                                        <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
                                        <Text style={styles.dataLabel}>Billing Month:</Text>
                                        <Text style={styles.dataValue}>{extractedData.billingMonth}</Text>
                                    </View>
                                )}

                                {extractedData?.units && (
                                    <View style={styles.dataRow}>
                                        <Ionicons name="flash-outline" size={20} color="#4A90E2" />
                                        <Text style={styles.dataLabel}>Units Consumed:</Text>
                                        <Text style={styles.dataValue}>
                                            {extractedData.units} {formType === 'electricity' ? 'kWh' : 'm³'}
                                        </Text>
                                    </View>
                                )}

                                {extractedData?.lastReading && (
                                    <View style={styles.dataRow}>
                                        <Ionicons name="arrow-down-circle-outline" size={20} color="#4A90E2" />
                                        <Text style={styles.dataLabel}>Last Reading:</Text>
                                        <Text style={styles.dataValue}>{extractedData.lastReading}</Text>
                                    </View>
                                )}

                                {extractedData?.latestReading && (
                                    <View style={styles.dataRow}>
                                        <Ionicons name="arrow-up-circle-outline" size={20} color="#4A90E2" />
                                        <Text style={styles.dataLabel}>Latest Reading:</Text>
                                        <Text style={styles.dataValue}>{extractedData.latestReading}</Text>
                                    </View>
                                )}

                                {extractedData?.accountNo && (
                                    <View style={styles.dataRow}>
                                        <Ionicons name="card-outline" size={20} color="#4A90E2" />
                                        <Text style={styles.dataLabel}>Account Number:</Text>
                                        <Text style={styles.dataValue}>{extractedData.accountNo}</Text>
                                    </View>
                                )}

                                {!extractedData?.units &&
                                    !extractedData?.lastReading &&
                                    !extractedData?.latestReading &&
                                    !extractedData?.accountNo &&
                                    !extractedData?.billingMonth && (
                                        <Text style={styles.noDataText}>
                                            No data could be extracted from the bill.
                                        </Text>
                                    )}
                            </View>

                            <Text style={styles.noteText}>
                                Please verify the extracted data. You can edit it after confirmation.
                            </Text>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.retryButton]}
                                onPress={handleRetry}
                            >
                                <Ionicons name="camera-outline" size={20} color="#fff" />
                                <Text style={styles.modalButtonText}>Retry</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirm}
                            >
                                <Ionicons name="checkmark-outline" size={20} color="#fff" />
                                <Text style={styles.modalButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ... (styles remain the same)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    permissionText: {
        fontSize: 18,
        color: '#2C3E50',
        textAlign: 'center',
        marginVertical: 20,
    },
    permissionButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    topButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    scanArea: {
        flex: 1,
        marginHorizontal: 40,
        marginVertical: 100,
        position: 'relative',
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#4A90E2',
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#4A90E2',
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#4A90E2',
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#4A90E2',
    },
    bottomBar: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    galleryButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#4A90E2',
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4A90E2',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 10,
    },
    modalBody: {
        maxHeight: 400,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 10,
    },
    dataSection: {
        padding: 20,
    },
    dataSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 15,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 10,
    },
    dataLabel: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
    },
    dataValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    noDataText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
        padding: 20,
    },
    noteText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        gap: 8,
    },
    retryButton: {
        backgroundColor: '#6C757D',
    },
    confirmButton: {
        backgroundColor: '#28A745',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});