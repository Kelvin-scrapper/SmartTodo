import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import T from '../../theme/tokens';
import { SEED_INSIGHTS } from '../../data/seed';

export default function InsightsScreen() {
  const d   = SEED_INSIGHTS;
  const max = Math.max(...d.accuracy.map(a => Math.max(a.est, a.act)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Insights</Text>
        <Text style={s.sub}>Patterns from your last 7 days.</Text>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={[s.statCard, { flex: 1 }]}>
            <Text style={[s.statLabel, { color: T.terraInk }]}>🔥 STREAK</Text>
            <Text style={s.statNum}>{d.streak}</Text>
            <Text style={s.statSub}>days in a row</Text>
          </View>
          <View style={[s.statCard, { flex: 1 }]}>
            <Text style={[s.statLabel, { color: T.sageInk }]}>FOCUSED</Text>
            <Text style={s.statNum}>{d.weekHours}<Text style={s.statUnit}>h</Text></Text>
            <Text style={s.statSub}>of {d.weekTarget}h target</Text>
          </View>
        </View>

        {/* Estimate accuracy */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Time estimates</Text>
          <Text style={s.cardSub}>You're slightly underestimating focus tasks.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, marginTop: 16 }}>
            {d.accuracy.map((a, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 2, height: 60, alignItems: 'flex-end' }}>
                  <View style={{ width: 8, height: (a.est / max) * 60, borderRadius: 3, backgroundColor: T.surfaceMuted, borderWidth: 0.5, borderColor: T.line }} />
                  <View style={{ width: 8, height: (a.act / max) * 60, borderRadius: 3, backgroundColor: T.ink4 }} />
                </View>
                <Text style={{ fontSize: 11, color: T.ink3 }}>{a.day}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: T.surfaceMuted, borderWidth: 0.5, borderColor: T.line }} />
              <Text style={{ fontSize: 12, color: T.ink3 }}>Estimated</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: T.ink4 }} />
              <Text style={{ fontSize: 12, color: T.ink3 }}>Actual</Text>
            </View>
          </View>
        </View>

        {/* Focus rhythm */}
        <View style={[s.card, { marginTop: 10 }]}>
          <Text style={s.cardTitle}>Your focus rhythm</Text>
          <Text style={s.cardSub}>Best window: {d.bestWindow}. I'll protect it tomorrow.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 70, marginTop: 16 }}>
            {d.focusByHour.map((item, i) => {
              const isPeak = item.v === Math.max(...d.focusByHour.map(x => x.v));
              return (
                <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                  <View style={{
                    width: 18, height: item.v * 52, borderRadius: 5,
                    backgroundColor: isPeak ? T.sage : '#D8D5CF',
                  }} />
                  <Text style={{ fontSize: 10, color: T.ink3 }}>{item.h}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  heading:  { fontSize: 28, fontWeight: '600', color: T.ink, letterSpacing: -0.5, marginBottom: 4 },
  sub:      { fontSize: 15, color: T.ink3, marginBottom: 20, lineHeight: 22 },
  statCard: { backgroundColor: T.surface, borderRadius: 22, borderWidth: 0.5, borderColor: T.line, padding: 18 },
  statLabel:{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  statNum:  { fontSize: 32, fontWeight: '600', color: T.ink, letterSpacing: -1 },
  statUnit: { fontSize: 18, fontWeight: '500' },
  statSub:  { fontSize: 12, color: T.ink3, marginTop: 2 },
  card:     { backgroundColor: T.surface, borderRadius: 22, borderWidth: 0.5, borderColor: T.line, padding: 18 },
  cardTitle:{ fontSize: 16, fontWeight: '600', color: T.ink, letterSpacing: -0.3 },
  cardSub:  { fontSize: 13, color: T.ink3, marginTop: 3 },
});
