import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import T from '../../theme/tokens';
import type { Task } from '../../data/seed';
import { useTasks } from '../../store/TasksContext';
import ScheduleRow from '../../components/today/ScheduleRow';
import ProgressRing from '../../components/today/ProgressRing';
import AddTaskSheet from '../../components/today/AddTaskSheet';

const USER_NAME = 'Alex';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
}

export default function TodayScreen() {
  const { tasks, toggleTask, toggleSubtask, addTask } = useTasks();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const LIMIT_SEC = 12 * 60;
  const remain    = Math.max(0, LIMIT_SEC - elapsed);
  const progress  = Math.min(elapsed / LIMIT_SEC, 1);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const upcoming  = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);
  const focus     = upcoming[0];
  const totalMins = upcoming.reduce((a, t) => a + t.estimate, 0);
  const hh        = Math.floor(totalMins / 60);
  const mm        = totalMins % 60;
  const timeStr   = hh > 0 ? `${hh}h ${mm > 0 ? mm + 'm' : ''}`.trim() : `${mm}m`;
  const mm_left   = Math.floor(remain / 60);
  const ss_left   = remain % 60;

  const handleAdd = (title: string, opts: { estimate: number; goalId: string | null }) => {
    const task: Task = {
      id: `t${Date.now()}`,
      title,
      estimate: opts.estimate,
      actual: 0,
      done: false,
      timeBlock: 'Later today',
      goalId: opts.goalId,
      priority: 'medium',
      aiNote: null,
    };
    addTask(task);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={s.greetBlock}>
          <Text style={s.dateLabel}>{todayLabel()}</Text>
          <Text style={s.greeting}>{greeting()}, {USER_NAME}.</Text>
          <Text style={s.subtitle}>
            {upcoming.length} gentle tasks ahead — about {timeStr} of focused work.
          </Text>
        </View>

        {/* ── Focus card ── */}
        {focus && (
          <View style={s.focusCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Text style={{ color: T.sageInk, fontSize: 14 }}>✦</Text>
              <Text style={s.focusEyebrow}>SUGGESTED FOCUS · NOW</Text>
            </View>

            <Text style={s.focusTitle}>{focus.title}</Text>
            <Text style={s.focusMeta}>{focus.timeBlock} · {focus.estimate} min</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <ProgressRing progress={progress} minutesLeft={mm_left} secondsLeft={ss_left} />

              {/* Start / Pause */}
              <TouchableOpacity
                onPress={() => setRunning(r => !r)}
                style={[s.startBtn, { backgroundColor: running ? T.ink : T.sage }]}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: -0.2 }}>
                  {running ? 'Pause focus' : 'Start focus'}
                </Text>
              </TouchableOpacity>

              {/* Complete */}
              <TouchableOpacity
                onPress={() => { toggleTask(focus.id); setRunning(false); setElapsed(0); }}
                style={s.completeBtn}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18, color: T.ink3 }}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Schedule ── */}
        <View style={s.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={s.sectionLabel}>TODAY'S PLAN</Text>
            <Text style={{ fontSize: 12, color: T.ink3 }}>{completed.length}/{tasks.length} done</Text>
          </View>

          {upcoming.map(t => (
            <ScheduleRow
              key={t.id}
              task={t}
              onToggle={() => toggleTask(t.id)}
              expanded={expanded === t.id}
              onExpand={() => setExpanded(e => (e === t.id ? null : t.id))}
              onToggleSubtask={subId => toggleSubtask(t.id, subId)}
            />
          ))}

          {completed.length > 0 && (
            <>
              <View style={s.divider} />
              <Text style={[s.sectionLabel, { marginBottom: 8 }]}>
                COMPLETED · {completed.length}
              </Text>
              {completed.map(t => (
                <ScheduleRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
              ))}
            </>
          )}

          {/* Evening reflection */}
          <View style={s.eveningCard}>
            <Text style={s.eveningEyebrow}>EVENING, 8:00 PM</Text>
            <Text style={{ fontSize: 13, color: T.ink2, lineHeight: 19 }}>
              A short check-in: what helped today, what got in the way?{' '}
              <Text style={{ color: T.sageInk, fontWeight: '500' }}>Open journal →</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Add Task FAB ── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={s.fabPlus}>＋</Text>
      </TouchableOpacity>

      <AddTaskSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  greetBlock:   { padding: 24, paddingTop: 14, paddingBottom: 18 },
  dateLabel:    { fontSize: 13, color: T.ink3, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  greeting:     { fontSize: 30, fontWeight: '600', color: T.ink, letterSpacing: -0.6, marginBottom: 6 },
  subtitle:     { fontSize: 17, color: T.ink2, lineHeight: 24 },

  focusCard: {
    marginHorizontal: 16, padding: 20, paddingBottom: 18,
    borderRadius: 26, backgroundColor: T.surface,
    borderWidth: 0.5, borderColor: T.line,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 8,
  },
  focusEyebrow: { fontSize: 12, color: T.sageInk, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  focusTitle:   { fontSize: 21, fontWeight: '600', color: T.ink, letterSpacing: -0.4 },
  focusMeta:    { fontSize: 14, color: T.ink2, marginTop: 4 },

  startBtn:    { flex: 1, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  completeBtn: { width: 52, height: 52, borderRadius: 18, borderWidth: 0.5, borderColor: T.line, alignItems: 'center', justifyContent: 'center', backgroundColor: T.surface },

  section:      { paddingHorizontal: 24, paddingTop: 6 },
  sectionLabel: { fontSize: 12, color: T.ink3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  divider:      { height: 0.5, backgroundColor: T.line, marginVertical: 14 },
  eveningCard:  { marginTop: 24, padding: 16, paddingHorizontal: 18, borderRadius: 20, backgroundColor: T.surfaceMuted },
  eveningEyebrow: { fontSize: 11, color: T.ink3, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },

  fab: {
    position: 'absolute', right: 20, bottom: 96,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: T.ink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 6,
  },
  fabPlus: { color: '#fff', fontSize: 24, lineHeight: 28, fontWeight: '400' },
});
