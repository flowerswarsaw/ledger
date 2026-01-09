import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { getDatabase } from '@/db';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function initDatabase() {
      try {
        await getDatabase();
        setDbReady(true);
      } catch (e) {
        console.error('Failed to initialize database:', e);
      }
    }
    initDatabase();
  }, []);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="account/new"
          options={{ presentation: 'modal', title: 'New Account' }}
        />
        <Stack.Screen
          name="account/[id]"
          options={{ title: 'Account' }}
        />
        <Stack.Screen
          name="account/edit/[id]"
          options={{ presentation: 'modal', title: 'Edit Account' }}
        />
        <Stack.Screen
          name="transaction/new"
          options={{ presentation: 'modal', title: 'New Transaction' }}
        />
        <Stack.Screen
          name="transaction/edit/[id]"
          options={{ presentation: 'modal', title: 'Edit Transaction' }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{ title: 'Transaction' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
