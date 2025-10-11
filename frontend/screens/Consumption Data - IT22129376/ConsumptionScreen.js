import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Animated
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import config from '../../config';

const theme = {
  primary: '#4CAF50',       
  secondary: '#1E88E5',     
  energy: '#4CAF50',        
  water: '#4CAF50',         
  waste: '#4CAF50',           
  background: '#f5f5f5',
  card: '#fff',
  text: '#000',
  textSecondary: '#666',
  textTertiary: '#999',
  border: '#e0e0e0',
  inputBackground: '#fafafa'
};

const ConsumptionScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [sustainabilityProfile, setSustainabilityProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasConsumptionData, setHasConsumptionData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ENERGY');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));

  // Check if user has any consumption data
  const checkConsumptionData = (dashboardData) => {
    if (!dashboardData) return false;
    
    const hasElectricity = dashboardData.totalEntries?.electricity > 0;
    const hasWater = dashboardData.totalEntries?.water > 0;
    const hasWaste = dashboardData.totalEntries?.waste > 0;
    
    return hasElectricity || hasWater || hasWaste;
  };

  // Fetch all required data
  const fetchDashboardData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setError("Authentication Token not found. Please login again.");
        setLoading(false);
        return;
      }

      const axiosConfig = { 
        headers: { Authorization: `Bearer ${token}` } 
      };

      // First, check if profile exists
      const profileCheckResponse = await axios.get(
        `http://${config.IP}:${config.PORT}/api/data/check-profile`,
        axiosConfig
      );
      
      const profileExists = profileCheckResponse.data.data?.sustainabilityProfile;
      setHasProfile(profileExists);

      if (profileExists) {
        // If profile exists, fetch dashboard data and profile details
        const [dashboardResponse, profileResponse] = await Promise.all([
          axios.get(`http://${config.IP}:${config.PORT}/api/data/dashboard`, axiosConfig),
          axios.get(`http://${config.IP}:${config.PORT}/api/data/get-profile`, axiosConfig)
        ]);

        setDashboardData(dashboardResponse.data);
        setSustainabilityProfile(profileResponse.data.data?.sustainabilityProfile);
        setHasConsumptionData(checkConsumptionData(dashboardResponse.data));
      } else {
        // If no profile, just set basic state and show setup modal
        setSustainabilityProfile(null);
        setDashboardData(null);
        setHasConsumptionData(false);
        
        // Show profile setup modal after a short delay
        setTimeout(() => {
          setShowProfileSetup(true);
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }, 1000);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error while fetching data:", err.response?.data || err.message);
      setError("Could not load your dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const closeProfileSetup = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowProfileSetup(false);
    });
  };

  // Profile Setup Modal
  const renderProfileSetupModal = () => (
    <Modal
      visible={showProfileSetup}
      transparent={true}
      animationType="fade"
      onRequestClose={closeProfileSetup}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="leaf" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Start Your Eco Journey! 🌱</Text>
            <Text style={styles.modalSubtitle}>
              Setup your profile to get personalized sustainability insights
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Track your consumptions</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Get personalized eco-tips</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="target" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Set achievable sustainability goals</Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.primaryModalButton]}
              onPress={() => {
                closeProfileSetup();
                navigation.navigate('SustainabilityProfile');
              }}
            >
             
              <Text style={styles.primaryModalButtonText}>Setup Profile</Text>
            </TouchableOpacity>
            

            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryModalButton]}
              onPress={closeProfileSetup}
            >
              <Text style={styles.secondaryModalButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderNoProfileState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <MaterialCommunityIcons name="account-question" size={64} color="#ccc" />
      </View>
      <Text style={styles.emptyStateTitle}>Setup Your Profile First</Text>
      <Text style={styles.emptyStateDescription}>
        Before you can track your consumption, we need to know about your sustainability preferences to provide accurate insights.
      </Text>
      
      <TouchableOpacity 
        style={styles.primaryEmptyStateButton}
        onPress={() => navigation.navigate('SustainabilityProfile')}
      >
        <MaterialCommunityIcons name="rocket-launch" size={20} color="#fff" />
        <Text style={styles.primaryEmptyStateButtonText}>Setup Sustainability Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryEmptyStateButton}
        onPress={closeProfileSetup}
      >
        <Text style={styles.secondaryEmptyStateButtonText}>I'll do it later</Text>
      </TouchableOpacity>
    </View>
  );

  // Profile exists but no consumption data - Ask to add data
  const renderNoDataState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <MaterialCommunityIcons name="chart-line" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.emptyStateTitle}>Start Tracking Your Consumption</Text>
      <Text style={styles.emptyStateDescription}>
        Your sustainability profile is all set! Now start tracking your energy, water, and waste consumption to see your environmental impact.
      </Text>
      
      <View style={styles.dataTypeButtons}>
        <TouchableOpacity 
          style={[styles.dataTypeButton, { backgroundColor: theme.energy }]}
          onPress={() => navigation.navigate('ElectricityData')}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />
          <Text style={styles.dataTypeButtonText}>Add Energy Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.dataTypeButton, { backgroundColor: theme.water }]}
          onPress={() => navigation.navigate('WaterData')}
        >
          <MaterialCommunityIcons name="water" size={20} color="#fff" />
          <Text style={styles.dataTypeButtonText}>Add Water Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.dataTypeButton, { backgroundColor: theme.waste }]}
          onPress={() => navigation.navigate('WasteData')}
        >
          <MaterialCommunityIcons name="recycle" size={20} color="#fff" />
          <Text style={styles.dataTypeButtonText}>Add Waste Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Normal consumption view with data
  const renderConsumptionView = () => {
    const tabData = {
      ENERGY: {
        icon: 'lightning-bolt',
        label: 'Energy Usage',
        value: `${dashboardData?.keyMetrics?.[0]?.value || '0'} `,
        subtitle: 'this month',
        color: theme.energy,
        buttonText: 'Add Energy Data',
        profileTitle: 'Energy Profile'
      },
      WATER: {
        icon: 'water',
        label: 'Water Consumption',
        value: `${dashboardData?.keyMetrics?.[1]?.value || '0'} `,
        subtitle: 'this month',
        color: theme.water,
        buttonText: 'Add Water Data',
        profileTitle: 'Water Profile'
      },
      WASTE: {
        icon: 'recycle',
        label: 'Waste Generated',
        value: `${dashboardData?.keyMetrics?.[2]?.value || '0'} `,
        subtitle: 'this month',
        color: theme.waste,
        buttonText: 'Add Waste Data',
        profileTitle: 'Waste Profile'
      }
    };

    const currentTabData = tabData[activeTab];

    // Handle navigation to usage history
  const handleViewUsageHistory = () => {
    navigation.navigate('UsageHistory', { type: activeTab });
  };
  
  // Handle navigation to add data
  const handleAddData = () => {
    const screenMap = {
      'ENERGY': 'ElectricityData',
      'WATER': 'WaterData', 
      'WASTE': 'WasteData'
    };
    navigation.navigate(screenMap[activeTab] || 'ElectricityData');
  };

    const renderProfileContent = () => {
      if (!sustainabilityProfile) return null;

      switch (activeTab) {
        case 'ENERGY':
          return (
            <View style={styles.profileContent}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Energy Sources:</Text>
                <View style={styles.sourcesContainer}>
                  {sustainabilityProfile.primaryEnergySources?.map((source, index) => (
                    <View key={index} style={styles.sourceItem}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={theme.energy} />
                      <Text style={styles.sourceText}>{source}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );

        case 'WATER':
          return (
            <View style={styles.profileContent}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Water Sources:</Text>
                <View style={styles.sourcesContainer}>
                  {sustainabilityProfile.primaryWaterSources?.map((source, index) => (
                    <View key={index} style={styles.sourceItem}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={theme.water} />
                      <Text style={styles.sourceText}>{source}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );

        case 'WASTE':
          return (
            <View style={styles.profileContent}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Waste Separated:</Text>
                <View style={styles.iconTextRow}>
                  {sustainabilityProfile.separateWaste ? (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={20} color={theme.waste} />
                      <Text style={[styles.statusText, { color: theme.waste }]}>Yes</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
                      <Text style={[styles.statusText, { color: '#f44336' }]}>No</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          );

        default:
          return null;
      }
    };

    return (
      <>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {Object.keys(tabData).map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText, 
                activeTab === tab && [styles.tabTextActive, { color: tabData[tab].color }]
              ]}>
                {tab}
              </Text>
              {activeTab === tab && (
                <View style={[styles.tabIndicator, { backgroundColor: tabData[tab].color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <MaterialCommunityIcons name="account-check" size={20} color={currentTabData.color} />
            <Text style={styles.profileTitle}>{currentTabData.profileTitle}</Text>
          </View>
          {renderProfileContent()}
        </View>

        {/* Main Consumption Card */}
        <View style={[styles.mainCard, { backgroundColor: currentTabData.color }]}>
          <View style={styles.cardTopSection}>
            <Text style={styles.cardLabel}>{currentTabData.label}</Text>
            <MaterialCommunityIcons name={currentTabData.icon} size={28} color="#fff" />
          </View>
          <View style={styles.cardValueSection}>
            <Text style={styles.cardValue}>{currentTabData.value}</Text>
            <Text style={styles.cardSubInfo}>{currentTabData.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.cardBottomSection} onPress={handleViewUsageHistory}>
            <Text style={styles.cardNote}>View Usage History</Text>
            <MaterialCommunityIcons name="chevron-right" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: currentTabData.color }]}
            onPress={() => navigation.navigate('SustainabilityProfile')}
          >
            <MaterialCommunityIcons name="account-edit" size={15} color={currentTabData.color} />
            <Text style={[styles.secondaryButtonText, { color: currentTabData.color }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: currentTabData.color }]}
            onPress={handleAddData}
          >
            <MaterialCommunityIcons name="plus" size={15} color="#fff" />
            <Text style={styles.primaryButtonText}>{currentTabData.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Main render logic
  const renderContent = () => {
    if (!hasProfile) {
      return renderNoProfileState();
    } else if (!hasConsumptionData) {
      return renderNoDataState();
    } else {
      return renderConsumptionView();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.textSecondary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderProfileSetupModal()}
      
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerInfo}>
            {hasProfile && hasConsumptionData 
              ? `Here's your consumption data as of ${new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}. Pull to refresh.`
              : 'Welcome to EcoTracker! Start your sustainability journey.'
            }
          </Text>
        </View>

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.textSecondary
  },
  errorText: {
    marginTop: 10,
    color: theme.textSecondary,
    textAlign: 'center',
    padding: 20,
    fontSize: 16
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  container: {
    paddingBottom: 30,
    paddingTop: 50
  },
  header: {
    backgroundColor: theme.card,
    padding: 16,
    paddingTop: 10,
    borderRadius: 25,
    marginBottom: 10,
  },
  headerInfo: {
    fontSize: 10,
    color: theme.textTertiary,
    textAlign: 'center',
  },
  // Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  primaryEmptyStateButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  primaryEmptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryEmptyStateButton: {
    paddingVertical: 12,
  },
  secondaryEmptyStateButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  dataTypeButtons: {
    width: '100%',
    gap: 12,
  },
  dataTypeButton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dataTypeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryModalButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryModalButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryModalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryModalButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  
  
  tabContainer: {
    backgroundColor: theme.card,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textTertiary,
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 3,
    borderRadius: 2,
  },
  mainCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  cardValueSection: {
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubInfo: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  cardBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNote: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
  },
  buttonContainer: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: theme.card,
    margin: 20,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  profileContent: {
    // alignItems: 'flex-start',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
  },
  sourcesContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConsumptionScreen;