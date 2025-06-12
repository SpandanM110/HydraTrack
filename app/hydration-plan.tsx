import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { scheduleHydrationNotifications } from './lib/generatePlan';

interface ScheduleItem {
  time: string;
  amount: number;
  description?: string;
}

interface HydrationPlan {
  total_intake_ml: number;
  schedule: ScheduleItem[];
  suggestions: string;
  date: string;
}

export default function HydrationPlanScreen() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<HydrationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHydrationPlan = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('hydration_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No plan found for today
          setPlan(null);
        } else {
          throw error;
        }
      } else {
        setPlan({
          total_intake_ml: data.total_intake_ml,
          schedule: data.schedule,
          suggestions: data.suggestions,
          date: data.date,
        });
      }
    } catch (error) {
      console.error('Error fetching hydration plan:', error);
      Alert.alert('Error', 'Failed to load your hydration plan');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHydrationPlan();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHydrationPlan();
  }, [user]);

  const rescheduleNotifications = async () => {
    try {
      if (!plan || !plan.schedule) {
        Alert.alert('Error', 'No hydration plan available');
        return;
      }
      
      await scheduleHydrationNotifications(plan.schedule);
      Alert.alert('Success', 'Notifications have been rescheduled for today');
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
      Alert.alert('Error', 'Failed to reschedule notifications');
    }
  };

  const renderScheduleItem = ({ item, index }: { item: ScheduleItem; index: number }) => {
    const [hours, minutes] = item.time.split(':').map(Number);
    const timeObj = new Date();
    timeObj.setHours(hours, minutes, 0);
    
    const formattedTime = timeObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    const now = new Date();
    const isPast = timeObj < now;
    const isNext = !isPast && index === plan?.schedule.findIndex(s => {
      const [h, m] = s.time.split(':').map(Number);
      const t = new Date();
      t.setHours(h, m, 0);
      return t > now;
    });
    
    return (
      <View style={[
        styles.scheduleItem, 
        isPast && styles.pastScheduleItem,
        isNext && styles.nextScheduleItem
      ]}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, isPast && styles.pastText]}>
            {formattedTime}
          </Text>
          {isPast && <Text style={styles.pastLabel}>Completed</Text>}
          {isNext && <Text style={styles.nextLabel}>Next</Text>}
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, isPast && styles.pastText]}>
            {item.amount} ml
          </Text>
          {item.description && (
            <Text style={styles.descriptionText}>{item.description}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your hydration plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.noDataText}>No hydration plan available for today</Text>
        <Text style={styles.noDataSubtext}>
          Go back to the home screen to generate your plan
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Daily Target</Text>
              <Text style={styles.summaryValue}>{plan.total_intake_ml} ml</Text>
              <Text style={styles.summaryDate}>
                {new Date(plan.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.scheduleContainer}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <View style={styles.scheduleList}>
                <FlatList
                  data={plan.schedule}
                  renderItem={renderScheduleItem}
                  keyExtractor={(item, index) => `schedule-${index}`}
                  scrollEnabled={false}
                />
              </View>
            </View>
            
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionTitle}>💡 Personalized Tips</Text>
              <Text style={styles.suggestionsText}>{plan.suggestions}</Text>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.rescheduleButton}
            onPress={rescheduleNotifications}
          >
            <Text style={styles.rescheduleButtonText}>🔔 Reschedule Notifications</Text>
          </TouchableOpacity>
        }
      />
    </View>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#2196F3',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  summaryValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  summaryDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  scheduleContainer: {
    margin: 15,
  },
  scheduleList: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pastScheduleItem: {
    opacity: 0.6,
    backgroundColor: '#f8f8f8',
  },
  nextScheduleItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pastText: {
    color: '#888',
  },
  pastLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
  nextLabel: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  rescheduleButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    margin: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rescheduleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});