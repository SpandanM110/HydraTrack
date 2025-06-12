import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { handleGeneratePlan, logWater, getTodayTotalIntake } from '../lib/generatePlan';
import { fetchWeather } from '../lib/weather';
import ProgressBar from '../../components/ProgressBar';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [hydrationPlan, setHydrationPlan] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [totalIntake, setTotalIntake] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, redirect to setup
          router.push('/auth/profile-setup');
          return;
        }
        throw profileError;
      }
      
      setProfile(profileData);
      
      // Generate or fetch hydration plan
      const plan = await handleGeneratePlan(user.id, profileData);
      if (plan) {
        setHydrationPlan(plan);
      }
      
      // Fetch weather
      const weatherData = await fetchWeather();
      setWeather(weatherData);
      
      // Get today's water intake
      const intake = await getTodayTotalIntake(user.id);
      setTotalIntake(intake);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogWater = async (amount: number) => {
    try {
      await logWater(user!.id, amount);
      // Update total intake
      const intake = await getTodayTotalIntake(user!.id);
      setTotalIntake(intake);
      
      // Show success message with progress
      const target = hydrationPlan?.total_intake_ml || 2000;
      const percentage = Math.round((intake / target) * 100);
      
      Alert.alert(
        'Water Logged! 💧',
        `${amount}ml added. You're now at ${percentage}% of your daily goal!`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error logging water:', error);
      Alert.alert('Error', 'Failed to log water intake');
    }
  };

  const handleCustomWaterLog = () => {
    Alert.prompt(
      'Custom Amount',
      'Enter water amount in ml',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log',
          onPress: (amount) => {
            const ml = parseInt(amount || '0');
            if (ml > 0 && ml <= 2000) {
              handleLogWater(ml);
            } else {
              Alert.alert('Error', 'Please enter a valid amount (1-2000ml)');
            }
          }
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your hydration data...</Text>
      </View>
    );
  }

  const progressPercentage = hydrationPlan?.total_intake_ml 
    ? Math.round((totalIntake / hydrationPlan.total_intake_ml) * 100)
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.email?.split('@')[0] || 'User'}! 👋
          </Text>
          {weather && (
            <Text style={styles.weatherText}>
              {weather.city} • {weather.temperature}°C • {weather.description}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <ProgressBar 
          current={totalIntake} 
          target={hydrationPlan?.total_intake_ml || 2000} 
        />
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>
            {totalIntake}ml / {hydrationPlan?.total_intake_ml || 2000}ml
          </Text>
          <Text style={styles.progressPercentage}>
            {progressPercentage}%
          </Text>
        </View>
        
        {progressPercentage >= 100 && (
          <View style={styles.congratsContainer}>
            <Text style={styles.congratsText}>🎉 Goal achieved! Great job!</Text>
          </View>
        )}
      </View>

      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.waterButton}
            onPress={() => handleLogWater(250)}
          >
            <Text style={styles.waterButtonAmount}>250ml</Text>
            <Text style={styles.waterButtonLabel}>Glass</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.waterButton}
            onPress={() => handleLogWater(500)}
          >
            <Text style={styles.waterButtonAmount}>500ml</Text>
            <Text style={styles.waterButtonLabel}>Bottle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.waterButton, styles.customButton]}
            onPress={handleCustomWaterLog}
          >
            <Text style={styles.waterButtonAmount}>Custom</Text>
            <Text style={styles.waterButtonLabel}>Amount</Text>
          </TouchableOpacity>
        </View>
      </View>

      {hydrationPlan && (
        <TouchableOpacity 
          style={styles.planCard}
          onPress={() => router.push('/hydration-plan')}
        >
          <View style={styles.planCardHeader}>
            <Text style={styles.planCardTitle}>Your Hydration Plan</Text>
            <Text style={styles.viewPlanText}>View →</Text>
          </View>
          <Text style={styles.planCardSubtitle}>
            {hydrationPlan.schedule?.length || 0} reminders scheduled for today
          </Text>
          <Text style={styles.planCardTarget}>
            Daily target: {hydrationPlan.total_intake_ml}ml
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Today's Tip</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            {hydrationPlan?.suggestions || 
              "Stay consistent with your water intake throughout the day for optimal hydration. Small, frequent sips are better than large amounts at once."}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2196F3',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  weatherText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  progressSection: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  congratsContainer: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  congratsText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  quickActionsSection: {
    padding: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waterButtonAmount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  waterButtonLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  customButton: {
    backgroundColor: '#4CAF50',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewPlanText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  planCardSubtitle: {
    color: '#666',
    marginTop: 5,
    fontSize: 14,
  },
  planCardTarget: {
    color: '#2196F3',
    marginTop: 8,
    fontWeight: '500',
  },
  tipsSection: {
    padding: 15,
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
});