import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import T from '../../theme/tokens';

const ROWS = [
  { label: 'Quiet hours',        detail: '10pm – 7am'  },
  { label: 'AI scheduling',      detail: 'On'          },
  { label: 'Daily review',       detail: '8:00 pm'     },
  { label: 'Sync with Calendar', detail: 'Connected'   },
  { label: 'Weekly goal target', detail: '18h'         },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Settings</Text>

        {/* Avatar card */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarInitial}>A</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>Alex</Text>
            <Text style={s.nameSub}>Day 12 of practice · 92% accurate</Text>
          </View>
        </View>

        {/* Focus Guard entry */}
        <TouchableOpacity
          style={s.guardCard}
          onPress={() => router.push('/focus-guard')}
          activeOpacity={0.7}
        >
          <View style={s.guardIcon}>
            <Ionicons name="shield-checkmark" size={20} color={T.sageInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.guardTitle}>Focus Guard</Text>
            <Text style={s.guardSub}>App limits · site filter · super access</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={T.ink4} />
        </TouchableOpacity>

        {/* Settings list */}
        <View style={s.list}>
          {ROWS.map((r, i) => (
            <View
              key={i}
              style={[
                s.row,
                i === 0              && { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
                i === ROWS.length - 1 && { borderBottomLeftRadius: 18, borderBottomRightRadius: 18, borderBottomWidth: 0.5 },
              ]}
            >
              <Text style={s.rowLabel}>{r.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.rowDetail}>{r.detail}</Text>
                <Ionicons name="chevron-forward" size={11} color={T.ink4} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  heading:    { fontSize: 28, fontWeight: '600', color: T.ink, letterSpacing: -0.5, marginBottom: 16, paddingHorizontal: 4 },
  avatarCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, backgroundColor: T.surface, borderRadius: 22, borderWidth: 0.5, borderColor: T.line, marginBottom: 12 },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: T.sageSoft, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '600', color: T.ink2 },
  name:       { fontSize: 17, fontWeight: '600', color: T.ink, letterSpacing: -0.3 },
  nameSub:    { fontSize: 13, color: T.ink3, marginTop: 2 },

  guardCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: T.surface, borderRadius: 22, borderWidth: 0.5, borderColor: T.line, marginBottom: 12 },
  guardIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: T.sageSoft, alignItems: 'center', justifyContent: 'center' },
  guardTitle: { fontSize: 15, fontWeight: '600', color: T.ink, letterSpacing: -0.2 },
  guardSub:   { fontSize: 13, color: T.ink3, marginTop: 2 },

  list: { marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingHorizontal: 18,
    backgroundColor: T.surface,
    borderTopWidth: 0.5, borderLeftWidth: 0.5, borderRightWidth: 0.5,
    borderColor: T.line,
  },
  rowLabel:  { fontSize: 15, color: T.ink, letterSpacing: -0.2 },
  rowDetail: { fontSize: 14, color: T.ink3 },
});
