import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SectionList,
  Alert,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
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
};

const UsageHistoryScreen = ({ route, navigation }) => {
  const { type = 'ENERGY' } = route.params || {};
  const [usageData, setUsageData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Sort states
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest'

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

        // Sort data by selected sort option
        const sortedData = sortData(data, sortOption, currentConfig.dateKey);
        
        // Create a single section with all data
        const sectionData = [{
          title: 'All Entries',
          data: sortedData
        }];

        setUsageData(sectionData);
        setFilteredData(sectionData);
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
  }, [type, refreshing, sortOption]);

  // Sort data based on selected option
  const sortData = (data, sortBy, dateKey) => {
    const sortedData = data.map(item => ({
      ...item,
      formattedDate: new Date(item[dateKey]).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      timestamp: new Date(item[dateKey]).getTime()
    }));

    switch (sortBy) {
      case 'newest':
        return sortedData.sort((a, b) => b.timestamp - a.timestamp);
      case 'oldest':
        return sortedData.sort((a, b) => a.timestamp - b.timestamp);
      default:
        return sortedData.sort((a, b) => b.timestamp - a.timestamp);
    }
  };

  // Apply sorting to existing data
  const applySorting = (sortBy) => {
    setSortOption(sortBy);
    
    const updatedData = usageData.map(section => ({
      ...section,
      data: sortData(section.data, sortBy, currentConfig.dateKey)
    }));

    setFilteredData(updatedData);
    setShowSortModal(false);
  };

  // Apply date range filter
  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredData(usageData);
      setIsFilterActive(false);
      setShowFilterModal(false);
      return;
    }

    const filtered = usageData.map(section => {
      const filteredSectionData = section.data.filter(item => {
        const itemDate = item.timestamp;
        const startTimestamp = startDate ? startDate.getTime() : 0;
        const endTimestamp = endDate ? endDate.getTime() : Date.now();

        if (startDate && endDate) {
          return itemDate >= startTimestamp && itemDate <= endTimestamp;
        } else if (startDate) {
          return itemDate >= startTimestamp;
        } else if (endDate) {
          return itemDate <= endTimestamp;
        }
        return true;
      });

      return {
        ...section,
        data: filteredSectionData
      };
    }).filter(section => section.data.length > 0);

    setFilteredData(filtered);
    setIsFilterActive(true);
    setShowFilterModal(false);
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredData(usageData);
    setIsFilterActive(false);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get sort icon based on current sort option
  const getSortIcon = () => {
    switch (sortOption) {
      case 'newest':
        return 'sort-descending';
      case 'oldest':
        return 'sort-ascending';
      default:
        return 'sort';
    }
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="clipboard-text-outline" 
        size={64} 
        color={theme.textTertiary} 
      />
      <Text style={styles.emptyStateTitle}>
        {isFilterActive ? 'No Data Found' : 'No Usage Data'}
      </Text>
      <Text style={styles.emptyStateText}>
        {isFilterActive ? 
          'No entries found for the selected date range. Try adjusting your filters.' :
          `You haven't added any ${type.toLowerCase()} consumption data yet.`
        }
      </Text>
      {isFilterActive ? (
        <TouchableOpacity 
          style={[styles.addDataButton, { backgroundColor: currentConfig.color }]}
          onPress={clearFilters}
        >
          <Text style={styles.addDataButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.addDataButton, { backgroundColor: currentConfig.color }]}
          onPress={() => navigation.navigate(`${type.charAt(0) + type.slice(1).toLowerCase()}Data`)}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          <Text style={styles.addDataButtonText}>Add Your First Entry</Text>
        </TouchableOpacity>
      )}
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <MaterialCommunityIcons 
            name={getSortIcon()} 
            size={24} 
            color={currentConfig.color} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialCommunityIcons 
            name={isFilterActive ? "filter-check" : "filter"} 
            size={24} 
            color={isFilterActive ? currentConfig.color : theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date Range</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>From Date</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateInputText}>{formatDate(startDate)}</Text>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>To Date</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateInputText}>{formatDate(endDate)}</Text>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
              />
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: currentConfig.color }]}
                onPress={applyDateFilter}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptionsContainer}>
              <TouchableOpacity 
                style={[
                  styles.sortOption,
                  sortOption === 'newest' && { backgroundColor: `${currentConfig.color}20` }
                ]}
                onPress={() => applySorting('newest')}
              >
                <MaterialCommunityIcons 
                  name="sort-descending" 
                  size={20} 
                  color={sortOption === 'newest' ? currentConfig.color : theme.textSecondary} 
                />
                <Text style={[
                  styles.sortOptionText,
                  sortOption === 'newest' && { color: currentConfig.color, fontWeight: '600' }
                ]}>
                  Newest First
                </Text>
                {sortOption === 'newest' && (
                  <MaterialCommunityIcons name="check" size={20} color={currentConfig.color} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.sortOption,
                  sortOption === 'oldest' && { backgroundColor: `${currentConfig.color}20` }
                ]}
                onPress={() => applySorting('oldest')}
              >
                <MaterialCommunityIcons 
                  name="sort-ascending" 
                  size={20} 
                  color={sortOption === 'oldest' ? currentConfig.color : theme.textSecondary} 
                />
                <Text style={[
                  styles.sortOptionText,
                  sortOption === 'oldest' && { color: currentConfig.color, fontWeight: '600' }
                ]}>
                  Oldest First
                </Text>
                {sortOption === 'oldest' && (
                  <MaterialCommunityIcons name="check" size={20} color={currentConfig.color} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Indicator */}
      {isFilterActive && (
        <View style={[styles.filterIndicator, { backgroundColor: currentConfig.color }]}>
          <MaterialCommunityIcons name="filter-check" size={16} color="#fff" />
          <Text style={styles.filterIndicatorText}>
            Showing filtered results {startDate && endDate ? 
              `from ${formatDate(startDate)} to ${formatDate(endDate)}` : 
              startDate ? `from ${formatDate(startDate)}` : 
              `until ${formatDate(endDate)}`
            }
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <MaterialCommunityIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Sort Indicator */}
      <View style={styles.sortIndicator}>
        <Text style={styles.sortIndicatorText}>
          Sorted by: {sortOption === 'newest' ? 'Newest First' : 'Oldest First'}
        </Text>
      </View>

      {/* Use SectionList directly instead of nesting in ScrollView */}
      <SectionList
        sections={filteredData}
        keyExtractor={(item) => item._id}
        renderItem={renderUsageItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmptyState}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[
          styles.sectionListContent,
          filteredData.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentConfig.color]}
          />
        }
        showsVerticalScrollIndicator={true}
      />
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
  sortButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  sortIndicator: {
    backgroundColor: theme.card,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sortIndicatorText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    gap: 8,
  },
  filterIndicatorText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
  },
  dateInputText: {
    fontSize: 16,
    color: theme.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  clearButtonText: {
    color: theme.text,
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sortOptionsContainer: {
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  sectionListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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