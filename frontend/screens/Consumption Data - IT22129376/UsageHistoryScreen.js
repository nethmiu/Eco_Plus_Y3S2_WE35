import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SectionList,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
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
};

const UsageHistoryScreen = ({ route, navigation }) => {
  const { type = 'ENERGY' } = route.params || {};
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Map types to API endpoints and display data
  const typeConfig = {
    ENERGY: {
      title: 'Electricity Usage History',
      icon: 'lightning-bolt',
      color: theme.energy,
      apiEndpoint: 'electricity',
      unit: 'kWh',
      valueKey: 'units',
      dateKey: 'billingMonth'
    },
    WATER: {
      title: 'Water Usage History',
      icon: 'water',
      color: theme.water,
      apiEndpoint: 'water',
      unit: 'm³',
      valueKey: 'units',
      dateKey: 'billingMonth'
    },
    WASTE: {
      title: 'Waste Management History',
      icon: 'recycle',
      color: theme.waste,
      apiEndpoint: 'waste',
      unit: 'bags',
      valueKey: 'totalBags',
      dateKey: 'collectionDate'
    }
  };

  const currentConfig = typeConfig[type] || typeConfig.ENERGY;

  const fetchUsageHistory = useCallback(async () => {
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

      const response = await axios.get(
        `http://${config.IP}:${config.PORT}/api/data/${currentConfig.apiEndpoint}`,
        axiosConfig
      );

      if (response.data.status === 'success') {
        let data = response.data.data[`${currentConfig.apiEndpoint}Data`] || [];
        
        // Transform data for waste to include total bags
        if (type === 'WASTE') {
          data = data.map(item => ({
            ...item,
            totalBags: (item.plasticBags || 0) + (item.paperBags || 0) + (item.foodWasteBags || 0)
          }));
        }

        // Group data by month/year for section list
        const groupedData = groupDataByMonth(data, currentConfig.dateKey);
        setUsageData(groupedData);
        setError(null);
      } else {
        setError('Failed to load usage history');
      }
    } catch (err) {
      console.error("Error fetching usage history:", err.response?.data || err.message);
      setError("Could not load usage history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, refreshing]);

  // Group data by month for section list
  const groupDataByMonth = (data, dateKey) => {
    const groups = {};
    
    data.forEach(item => {
      const date = new Date(item[dateKey]);
      const monthYear = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      
      groups[monthYear].push({
        ...item,
        formattedDate: date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      });
    });

    // Convert to section list format and sort by date (newest first)
    return Object.entries(groups)
      .map(([title, data]) => ({
        title,
        data: data.sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]))
      }))
      .sort((a, b) => new Date(b.data[0][dateKey]) - new Date(a.data[0][dateKey]));
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsageHistory();
    }, [fetchUsageHistory])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsageHistory();
  }, [fetchUsageHistory]);

  const handleDeleteEntry = async (itemId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              if (!token) return;

              const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
              await axios.delete(`http://${config.IP}:${config.PORT}/api/data/${currentConfig.apiEndpoint}/${itemId}`, axiosConfig);
              

              // Note: You'll need to implement delete endpoints in your backend
              // For now, we'll just refetch the data
              await fetchUsageHistory();
              
              Alert.alert('Success', 'Entry deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const renderUsageItem = ({ item }) => (
    <View style={styles.usageItem}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemDate}>{item.formattedDate}</Text>
        {type === 'ENERGY' && (
          <Text style={styles.itemDetails}>
            Units: {item.units} {currentConfig.unit}
            {item.accountNo && ` • Account: ${item.accountNo}`}
          </Text>
        )}
        {type === 'WATER' && (
          <Text style={styles.itemDetails}>
            Units: {item.units} {currentConfig.unit}
            {item.accountNo && ` • Account: ${item.accountNo}`}
          </Text>
        )}
        {type === 'WASTE' && (
          <View style={styles.wasteDetails}>
            <Text style={styles.itemDetails}>
              Total: {item.totalBags} {currentConfig.unit}
            </Text>
            <Text style={styles.wasteBreakdown}>
              Plastic: {item.plasticBags || 0} • Paper: {item.paperBags || 0} • Food: {item.foodWasteBags || 0}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.itemRight}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteEntry(item._id)}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: currentConfig.color }]}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <ActivityIndicator size="large" color={currentConfig.color} />
        <Text style={styles.loadingText}>Loading {currentConfig.title}...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.textSecondary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: currentConfig.color }]}
          onPress={fetchUsageHistory}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
     

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentConfig.color]}
          />
        }
      >
        {usageData.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="clipboard-text-outline" 
              size={64} 
              color={theme.textTertiary} 
            />
            <Text style={styles.emptyStateTitle}>No Usage Data</Text>
            <Text style={styles.emptyStateText}>
              You haven't added any {type.toLowerCase()} consumption data yet.
            </Text>
            <TouchableOpacity 
              style={[styles.addDataButton, { backgroundColor: currentConfig.color }]}
              onPress={() => navigation.navigate(`${type.charAt(0) + type.slice(1).toLowerCase()}Data`)}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.addDataButtonText}>Add Your First Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={usageData}
            keyExtractor={(item) => item._id}
            renderItem={renderUsageItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.sectionListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  headerRight: {
    width: 40, // Balance the header layout
  },
  container: {
    flex: 1,
  },
  sectionListContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  usageItem: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemLeft: {
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  wasteDetails: {
    marginTop: 4,
  },
  wasteBreakdown: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 2,
  },
  itemRight: {
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  addDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  addDataButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default UsageHistoryScreen;