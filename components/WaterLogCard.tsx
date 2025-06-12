import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WaterLogCardProps {
  amount: number;
  timestamp: string;
  onDelete?: () => void;
}

export default function WaterLogCard({ amount, timestamp, onDelete }: WaterLogCardProps) {
  const date = new Date(timestamp);
  const formattedTime = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  const isToday = date.toDateString() === new Date().toDateString();
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.unit}>ml</Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formattedTime}</Text>
          {!isToday && (
            <Text style={styles.date}>
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    color: '#666',
    fontSize: 14,
  },
  date: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    marginLeft: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});