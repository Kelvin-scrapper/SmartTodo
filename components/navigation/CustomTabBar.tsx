import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import T from '../../theme/tokens';

const TABS = [
  { name: 'index',    label: 'Today',    active: 'radio-button-on',  inactive: 'radio-button-off-outline' },
  { name: 'goals',    label: 'Goals',    active: 'flag',             inactive: 'flag-outline'             },
  { name: 'insights', label: 'Insights', active: 'stats-chart',      inactive: 'stats-chart-outline'      },
  { name: 'profile',  label: 'You',      active: 'person',           inactive: 'person-outline'           },
] as const;

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.pill}>
        {state.routes.map((route: any, i: number) => {
          const tab = TABS[i];
          const isActive = state.index === i;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.active : tab.inactive}
                size={22}
                color={isActive ? T.sage : T.ink3}
              />
              <Text style={[
                styles.label,
                { color: isActive ? T.sageInk : T.ink3, fontWeight: isActive ? '600' : '500' },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 8,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row', height: 60, borderRadius: 26,
    backgroundColor: T.surface,
    borderWidth: 0.5, borderColor: T.line,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  label: {
    fontSize: 10, letterSpacing: 0.1,
  },
});
