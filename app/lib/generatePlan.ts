import { supabase } from './supabase';
import { fetchWeather } from './weather';
import { generateHydrationPlan, UserProfile, HydrationPlan, HydrationScheduleItem } from './gemini';
import * as Notifications from 'expo-notifications';

export const handleGeneratePlan = async (userId: string, profile: UserProfile): Promise<HydrationPlan | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if a plan already exists for today
    const { data: existing, error: fetchError } = await supabase
      .from("hydration_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no plan exists
      throw fetchError;
    }

    if (existing) {
      console.log('Using existing hydration plan for today');
      return {
        total_intake_ml: existing.total_intake_ml,
        schedule: existing.schedule,
        suggestions: existing.suggestions,
      };
    }

    console.log('Generating new hydration plan...');
    
    // Generate a new plan
    const weather = await fetchWeather();
    const plan = await generateHydrationPlan(profile, weather);

    // Save the plan to Supabase
    const { error: insertError } = await supabase.from("hydration_plans").insert({
      user_id: userId,
      date: today,
      total_intake_ml: plan.total_intake_ml,
      schedule: plan.schedule,
      suggestions: plan.suggestions
    });

    if (insertError) {
      throw insertError;
    }

    // Schedule notifications
    await scheduleHydrationNotifications(plan.schedule);

    console.log('Hydration plan generated and saved successfully');
    return plan;
  } catch (error) {
    console.error('Error generating hydration plan:', error);
    return null;
  }
};

export const scheduleHydrationNotifications = async (schedule: HydrationScheduleItem[]) => {
  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }

    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Schedule new notifications
    for (const item of schedule) {
      const [hours, minutes] = item.time.split(':').map(Number);
      
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Only schedule notifications for future times today
      if (scheduledTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💧 Time to hydrate!",
            body: `Drink ${item.amount}ml of water. ${item.description || ''}`,
            sound: true,
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: false,
          },
        });
      }
    }
    
    console.log(`Scheduled ${schedule.length} hydration notifications`);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

export const logWater = async (userId: string, amount: number) => {
  try {
    const { error } = await supabase.from("water_logs").insert({
      user_id: userId,
      amount
    });

    if (error) {
      throw error;
    }

    console.log(`Logged ${amount}ml of water for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error logging water:', error);
    throw error;
  }
};

export const getTodayWaterLogs = async (userId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("timestamp", today.toISOString())
      .order("timestamp", { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching water logs:', error);
    return [];
  }
};

export const getTodayTotalIntake = async (userId: string): Promise<number> => {
  try {
    const logs = await getTodayWaterLogs(userId);
    return logs.reduce((total, log) => total + log.amount, 0);
  } catch (error) {
    console.error('Error calculating total intake:', error);
    return 0;
  }
};

export const getWeeklyStats = async (userId: string) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from("water_logs")
      .select("amount, timestamp")
      .eq("user_id", userId)
      .gte("timestamp", weekAgo.toISOString())
      .order("timestamp", { ascending: true });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return [];
  }
};