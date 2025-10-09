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
  TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import config from '../../config';

const theme = {
  primary: '#4CAF50',       
  secondary: '#1E88E5',     
  energy: '#e36414',        
  water: '#0077b6',         
  waste: '#388e3c',           
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
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ENERGY');

  // Fetch dashboard data
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

      // Fetch dashboard data
      const dashboardResponse = await axios.get(
        `http://${config.IP}:${config.PORT}/api/data/dashboard`, 
        axiosConfig
      );
      setDashboardData(dashboardResponse.data);
      
      // Fetch sustainability profile
      const profileResponse = await axios.get(
        `http://${config.IP}:${config.PORT}/api/data/get-profile`,
        axiosConfig
      );
      setSustainabilityProfile(profileResponse.data.data?.sustainabilityProfile);
      
      setError(null);
    } catch (err) {
      console.error("Error while fetching data:", err.response?.data || err.message);
      setError("Could not load your dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  // Fetch sustainability profile separately
  const fetchSustainabilityProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      const axiosConfig = { 
        headers: { Authorization: `Bearer ${token}` } 
      };

      const response = await axios.get(
        `http://${config.IP}:${config.PORT}/api/data/get-profile`,
        axiosConfig
      );
      setSustainabilityProfile(response.data.data?.sustainabilityProfile);
    } catch (err) {
      console.error("Error fetching sustainability profile:", err.message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Render sustainability profile content based on active tab
  const renderProfileContent = () => {
    if (profileLoading) {
      return <ActivityIndicator size="small" color={currentTabData.color} />;
    }

    if (!sustainabilityProfile) {
      return (
        <View style={styles.profileContent}>
          <Text style={styles.profileDescription}>
            No sustainability profile set up yet
          </Text>
          <TouchableOpacity 
            style={[styles.setupProfileButton, { backgroundColor: currentTabData.color }]}
            onPress={() => navigation.navigate('SustainabilityProfile')}
          >
            <Text style={styles.setupProfileButtonText}>Setup Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'ENERGY':
        return (
          <View style={styles.profileContent}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Energy Sources:</Text>
              <View style={styles.sourcesContainer}>
                {sustainabilityProfile.primaryEnergySources?.map((source, index) => (
                  <View key={index} style={styles.sourceItem}>
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={16} 
                      color={theme.energy} 
                      style={styles.sourceIcon}
                    />
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
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={16} 
                      color={theme.water} 
                      style={styles.sourceIcon}
                    />
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
            {/* Waste Separation */}
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

            {/* Bag Sizes - Only show if waste separation is enabled */}
            {sustainabilityProfile.separateWaste && (
              <View style={styles.bagSizesContainer}>
                <Text style={styles.bagSizesTitle}>Waste Bag Sizes:</Text>
                <View style={styles.bagSizeRow}>
                  <MaterialCommunityIcons name="file-document" size={16} color={theme.waste} />
                  <Text style={styles.bagSizeLabel}>Paper Bag:</Text>
                  <Text style={styles.bagSizeValue}>{sustainabilityProfile.paperBagSize || 5}kg</Text>
                </View>
                <View style={styles.bagSizeRow}>
                  <MaterialCommunityIcons name="bag-personal" size={16} color={theme.waste} />
                  <Text style={styles.bagSizeLabel}>Plastic Bag:</Text>
                  <Text style={styles.bagSizeValue}>{sustainabilityProfile.plasticBagSize || 5}kg</Text>
                </View>
                <View style={styles.bagSizeRow}>
                  <MaterialCommunityIcons name="food-apple" size={16} color={theme.waste} />
                  <Text style={styles.bagSizeLabel}>Food Waste Bag:</Text>
                  <Text style={styles.bagSizeValue}>{sustainabilityProfile.foodWasteBagSize || 5}kg</Text>
                </View>
              </View>
            )}

            {/* Composting */}
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Composting:</Text>
              <View style={styles.iconTextRow}>
                {sustainabilityProfile.compostWaste ? (
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

  // Tab data configuration
  const tabData = {
    ENERGY: {
      icon: 'lightning-bolt',
      label: 'Energy Usage',
      value: dashboardData?.keyMetrics?.[0]?.value || '0 Units',
      subtitle: 'this month',
      color: theme.energy,
      buttonText: 'Add Energy Consumption',
      profileTitle: 'Energy Profile'
    },
    WATER: {
      icon: 'water',
      label: 'Water Consumption',
      value: dashboardData?.keyMetrics?.[1]?.value || '0 Units',
      subtitle: 'this month',
      color: theme.water,
      buttonText: 'Add Water Consumption',
      profileTitle: 'Water Profile'
    },
    WASTE: {
      icon: 'recycle',
      label: 'Waste Generated',
      value: dashboardData?.keyMetrics?.[2]?.value || '0 Bags',
      subtitle: 'this month',
      color: theme.waste,
      buttonText: 'Add Waste Consumption',
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
            Here's Info as at {new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            })}, Today. Pull to refresh
          </Text>
        </View>

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

        {/* Sustainability Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <MaterialCommunityIcons 
              name="account-details" 
              size={20} 
              color={currentTabData.color} 
            />
            <Text style={styles.profileTitle}>
              {currentTabData.profileTitle}
            </Text>
          </View>
          
          {renderProfileContent()}
          
          {sustainabilityProfile && (
            <Text style={styles.profileUpdateText}>
              Last updated: {new Date(sustainabilityProfile.lastUpdated).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Main Card - Changes based on active tab */}
        <View style={[styles.mainCard, { backgroundColor: currentTabData.color }]}>
          <View style={styles.cardTopSection}>
            <Text style={styles.cardLabel}>{currentTabData.label}</Text>
            <MaterialCommunityIcons 
              name={currentTabData.icon} 
              size={28} 
              color="#fff" 
            />
          </View>
          <View style={styles.cardValueSection}>
            <Text style={styles.cardValue}>{currentTabData.value}</Text>
            <Text style={styles.cardSubInfo}>{currentTabData.subtitle}</Text>
          </View>
          <TouchableOpacity 
            style={styles.cardBottomSection}
            onPress={handleViewUsageHistory}
          >
            <Text style={styles.cardNote}>View Usage History</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={25} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Setup Profile Button */}
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: currentTabData.color }]}
            onPress={() => navigation.navigate('SustainabilityProfile')}
          >
            <MaterialCommunityIcons 
              name="leaf-circle" 
              size={15} 
              color={currentTabData.color} 
              style={styles.buttonIcon}
            />
            <Text style={[styles.secondaryButtonText, { color: currentTabData.color }]}>
              Setup Profile
            </Text>
          </TouchableOpacity>

          {/* Add Consumption Data Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: currentTabData.color }]}
            onPress={handleAddData}
          >
            <MaterialCommunityIcons 
              name="plus" 
              size={15} 
              color="#fff" 
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>{currentTabData.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
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
    marginTop: 16,
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
  buttonIcon: {
    marginRight: 8,
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
  sourceIcon: {
    marginRight: 6,
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
  bagSizesContainer: {
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  bagSizesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  bagSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  bagSizeLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    flex: 1,
  },
  bagSizeValue: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text,
  },
  profileDescription: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  profileUpdateText: {
    fontSize: 12,
    color: theme.textTertiary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  setupProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  setupProfileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ConsumptionScreen;