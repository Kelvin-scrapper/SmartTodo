import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TasksProvider } from '../store/TasksContext';

export default function RootLayout() {
  return (
    <TasksProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="focus-guard"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </TasksProvider>
  );
}
