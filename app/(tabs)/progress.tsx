import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getTodayWaterLogs, getWeeklyStats } from '../lib/generatePlan';
import WaterLogCard from '../../components/WaterLogCard';

export default function ProgressScreen() {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get today's logs
      const logs = await getTodayWaterLogs(user.id);
      setTodayLogs(logs);
      
      // Get weekly stats
      const stats = await getWeeklyStats(user.id);
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Total</Text>
        <Text style={styles.summaryValue}>{todayTotal} ml</Text>
        <Text style={styles.summarySubtitle}>{todayLogs.length} entries logged</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Water Logs</Text>
        {todayLogs.length > 0 ? (
          todayLogs.map((log, index) => (
            <WaterLogCard
              key={log.id || index}
              amount={log.amount}
              timestamp={log.timestamp}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No water logged today yet</Text>
            <Text style={styles.emptySubtext}>Start logging your water intake!</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyText}>
            Total entries this week: {weeklyStats.length}
          </Text>
          <Text style={styles.weeklyText}>
            Total water consumed: {weeklyStats.reduce((sum, stat) => sum + stat.amount, 0)} ml
          </Text>
          <Text style={styles.weeklyText}>
            Average per day: {Math.round(weeklyStats.reduce((sum, stat) => sum + stat.amount, 0) / 7)} ml
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 5,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  weeklyCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  weeklyText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
});