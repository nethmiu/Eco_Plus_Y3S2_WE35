// FILE: frontend/src/screens/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';


// --- MOCK DATA OBJECT ---
const mockDashboardData = {
    user: { name: 'Karindra' },
    ecoScore: 70, // <--- CHANGE THIS to 65 or 45 to test the theme!
    historicalData: [ { month: 'Mar', electricityUnits: 120 }, { month: 'Apr', electricityUnits: 115 }, { month: 'May', electricityUnits: 118 }, { month: 'Jun', electricityUnits: 105 }, { month: 'Jul', electricityUnits: 98 }, { month: 'Aug', electricityUnits: 95 } ],
    areaComparison: { yourUsage: 95, areaAverage: 110 },
    wasteData: { plasticBags: 10, paperBags: 5, foodWasteBags: 8 }
};
// ------------------------------------

// Professional Color Palette
const COLORS = {
    text: '#2c3e50',
    textLight: '#7f8c8d',
    backgroundGood: '#F0FFF4',
    backgroundMid: '#FFFACD',
    backgroundBad: '#F5E6D3',
    primaryGood: '#2ecc71',
    primaryMid: '#f1c40f',
    primaryBad: '#e74c3c',
    primaryNeutral: '#3498db',
    white: '#FFFFFF',
    border: '#EAEAEA',
};

const DashboardScreen = () => {
  const { ecoScore, user } = mockDashboardData;

  // --- Novelty Feature: Dynamic Eco-Theming ---
  const getTheme = () => {
    if (ecoScore >= 75) {
      return { background: COLORS.backgroundGood, primary: COLORS.primaryGood, barStyle: 'dark-content' };
    } else if (ecoScore >= 50) {
      return { background: COLORS.backgroundMid, primary: COLORS.primaryMid, barStyle: 'dark-content' };
    } else {
      return { background: COLORS.backgroundBad, primary: COLORS.primaryBad, barStyle: 'dark-content' };
    }
  };

  const theme = getTheme(); // Now 'theme' is defined before the return statement

  return ( // All UI elements go inside this return block
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.barStyle} />
      <ScrollView contentContainerStyle={styles.scrollView}>
        
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {user.name}!</Text>
        </View>

        {/* Eco Score Card */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Eco Score</Text>
            <Text style={[styles.score, { color: theme.primary }]}>{ecoScore}</Text>
        </View>

        {/* Monthly Usage Chart Card - NO LONGER A PLACEHOLDER */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Monthly Usage</Text>
            <LineChart
              data={{
                labels: mockDashboardData.historicalData.map(d => d.month),
                datasets: [{ data: mockDashboardData.historicalData.map(d => d.electricityUnits) }],
              }}
              width={Dimensions.get('window').width - 80} // Adjusted width to fit inside the card
              height={220}
              yAxisSuffix=" u"
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.primary, // Use dynamic theme color for the line
                labelColor: (opacity = 1) => COLORS.textLight,
                style: { borderRadius: 16 },
                propsForDots: { r: '6', strokeWidth: '2', stroke: theme.primary },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
        </View>
        
        {/* Area Comparison Card */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>You vs. Your Area (This Month)</Text>
            <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Your Usage</Text>
                <Text style={styles.comparisonValue}>{mockDashboardData.areaComparison.yourUsage} units</Text>
            </View>
            <View style={styles.barContainer}>
                <View style={[styles.bar, { backgroundColor: theme.primary, width: `${(mockDashboardData.areaComparison.yourUsage / 150) * 100}%` }]} />
            </View>

            <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Area Average</Text>
                <Text style={styles.comparisonValue}>{mockDashboardData.areaComparison.areaAverage} units</Text>
            </View>
            <View style={styles.barContainer}>
                <View style={[styles.bar, { backgroundColor: COLORS.primaryNeutral, width: `${(mockDashboardData.areaComparison.areaAverage / 150) * 100}%` }]} />
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ... (The styles StyleSheet.create code remains the same as before) ...
// Professional StyleSheet
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scrollView: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800', // Bolder
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20,
    // Professional Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center' // Center chart inside the card
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: COLORS.text, 
    marginBottom: 16,
    alignSelf: 'flex-start' // Align title to the left
  },
  score: { 
    fontSize: 72, 
    fontWeight: '800', 
    textAlign: 'center' 
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%' // Ensure row takes full width
  },
  comparisonLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  barContainer: { 
    width: '100%', 
    height: 10, 
    backgroundColor: COLORS.border, 
    borderRadius: 5, 
    marginTop: 6,
    marginBottom: 16,
    overflow: 'hidden'
  },
  bar: { 
    height: '100%', 
    borderRadius: 5 
  },
});


export default DashboardScreen;