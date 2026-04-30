import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import T from '../../theme/tokens';
import type { Task } from '../../data/seed';

interface Props {
  task: Task;
  onToggle: () => void;
}

export default function ScheduleRow({ task, onToggle }: Props) {
  const parts = task.timeBlock.split(' – ');
  const start = parts[0] ?? '';
  const end   = parts[1] ?? '';

  return (
    <View style={styles.row}>
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.timeStart}>{start}</Text>
        {end ? <Text style={styles.timeEnd}>{end}</Text> : null}
      </View>

      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        style={[styles.checkbox, task.done && styles.checkboxDone]}
        activeOpacity={0.7}
      >
        {task.done && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>⏱ {task.estimate} min</Text>
          {task.aiNote ? (
            <Text style={styles.aiNote} numberOfLines={1}> · {task.aiNote}</Text>
          ) : null}
          {task.subtasks ? (
            <Text style={styles.meta}> · {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} steps</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: T.line,
  },
  timeCol:   { width: 46 },
  timeStart: { fontSize: 12, fontWeight: '500', color: T.ink2 },
  timeEnd:   { fontSize: 11, color: T.ink4, marginTop: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: T.ink4,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: T.sage, borderColor: T.sage },
  checkmark:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  title:        { fontSize: 16, fontWeight: '500', color: T.ink, letterSpacing: -0.3 },
  titleDone:    { textDecorationLine: 'line-through', color: T.ink4 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'wrap' },
  meta:         { fontSize: 12, color: T.ink3 },
  aiNote:       { fontSize: 12, color: T.terraInk, flexShrink: 1 },
});
