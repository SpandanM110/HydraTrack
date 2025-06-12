import { useEffect, useState } from 'react';
import { useRouter, useNavigationContainerRef } from 'expo-router';
import { useAuth } from '../app/context/AuthContext'; // adjust path if needed
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user } = useAuth();
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for router to be mounted before navigating
    const timeout = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (user) {
      router.replace('/tabs/home'); // Or /tabs/index if you're using that
    } else {
      router.replace('/auth/login');
    }
  }, [isReady, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
