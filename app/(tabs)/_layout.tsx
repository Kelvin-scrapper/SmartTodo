import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/navigation/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Today'    }} />
      <Tabs.Screen name="goals"    options={{ title: 'Goals'    }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="profile"  options={{ title: 'You'      }} />
    </Tabs>
  );
}
