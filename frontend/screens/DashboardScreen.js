// frontend/screens/DashboardScreen.js

import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Dimensions, 
    SafeAreaView, 
    ActivityIndicator, 
    RefreshControl 
} from 'react-native';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store'; 
import config from '../config';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // =================================================================
    //  DATA FETCHING LOGIC - useFocusEffect 
    // =================================================================
    const fetchDashboardData = useCallback(async () => {
        if (!refreshing) {
            setLoading(true);
        }

        try {
            const token = await SecureStore.getItemAsync('userToken'); 
            if (!token) {
                setError("Authentication Token not found. Please login again.");
                setLoading(false);
                return;
            }

            const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`http://${config.IP}:${config.PORT}/api/data/dashboard`, axiosConfig);
            console.log("Response from Backend:", JSON.stringify(response.data, null, 2));
            const data = response.data;

            if (!data.chartData || !data.chartData.labels?.length || data.chartData.datasets[0].data.length === 0) {
                data.chartData = {
                    labels: ['Start'], 
                    datasets: [{ data: [0] }],
                };
            }

            setDashboardData(data);
            setError(null);

        } catch (err) {
            console.error("Error while fetching dashboard data:", err.response?.data || err.message);
            setError("Could not load your dashboard data. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false); 
        }
    }, [refreshing]);

    // This hook runs every time the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    // Pull-to-refresh logic
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    // =================================================================
    //  DYNAMIC THEME LOGIC
    // =================================================================
    const getTheme = (score) => {
        if (score >= 50) return { background: '#E8F5E9', primary: '#4CAF50', text: '#1B5E20', scoreColor: '#2E7D32' };
        if (score >= 75) return { background: '#FFF3E0', primary: '#FF9800', text: '#E65100', scoreColor: '#F57C00' };
        return { background: '#FFEBEE', primary: '#F44336', text: '#B71C1C', scoreColor: '#D32F2F' };
    };

    // =================================================================
    //  UI RENDERING LOGIC
    // =================================================================

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Loading your Eco Dashboard...</Text>
            </SafeAreaView>
        );
    }
    
    if (error) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centerContainer, { backgroundColor: '#FFEBEE' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#B71C1C" />
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }
    
    const theme = getTheme(dashboardData.ecoScore);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
            >
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Your Eco Dashboard</Text>
                </View>

                <View style={[styles.scoreCard, { backgroundColor: 'white' }]}>
                    <Text style={[styles.scoreLabel, { color: theme.text }]}>ECO SCORE</Text>
                    <View style={[styles.scoreCircle, { borderColor: theme.primary }]}>
                        <Text style={[styles.scoreValue, { color: theme.scoreColor }]}>{dashboardData.ecoScore}</Text>
                    </View>
                    <Text style={[styles.scoreFeedback, { color: theme.primary }]}>
                        {dashboardData.ecoScore >= 75 ? "Excellent! Keep it up!" : "You're on the right track!"}
                    </Text>
                </View>

                <View style={styles.metricsContainer}>
                    {dashboardData.keyMetrics.map((metric) => (
                        <View key={metric.id} style={[styles.metricCard, { backgroundColor: 'white' }]}>
                            <MaterialCommunityIcons name={metric.icon} size={28} color={theme.primary} />
                            <Text style={styles.metricTitle}>{metric.title}</Text>
                            <Text style={[styles.metricValue, { color: theme.text }]}>{metric.value}</Text>
                        </View>
                    ))}
                </View>

                <View style={[styles.chartCard, { backgroundColor: 'white' }]}>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Monthly Progress</Text>
                    <LineChart
                        data={dashboardData.chartData}
                        width={screenWidth - 64}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => theme.primary,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    centerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333'
    },
    errorText: {
        marginTop: 10,
        color: '#B71C1C',
        textAlign: 'center',
        padding: 20,
        fontSize: 16
    },
    container: { 
        padding: 16, 
        paddingBottom: 40,
        paddingTop: 50

    },
    header: { 
        marginBottom: 24 
    },
    headerTitle: { 
        fontSize: 28, 
        fontWeight: 'bold' 
    },
    scoreCard: { 
        borderRadius: 20, 
        padding: 24, 
        alignItems: 'center', 
        marginBottom: 24, 
        elevation: 4, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 8 
    },
    scoreLabel: { 
        fontSize: 16, 
        fontWeight: '600', 
        marginBottom: 16 
    },
    scoreCircle: { 
        width: 150, 
        height: 150, 
        borderRadius: 75, 
        borderWidth: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    scoreValue: { 
        fontSize: 52, 
        fontWeight: 'bold' 
    },
    scoreFeedback: { 
        fontSize: 16, 
        fontStyle: 'italic' 
    },
    metricsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 24 
    },
    metricCard: { 
        flex: 1, 
        marginHorizontal: 6, 
        borderRadius: 16, 
        padding: 16, 
        alignItems: 'center', 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
    },
    metricTitle: { 
        fontSize: 12, 
        fontWeight: '600', 
        marginTop: 8, 
        color: '#666' 
    },
    metricValue: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginTop: 4 
    },
    chartCard: { 
        borderRadius: 20, 
        padding: 16, 
        elevation: 4, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 8 
    },
    chartTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 8,
        paddingLeft: 16, // To align with chart
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    }
});

export default DashboardScreen;