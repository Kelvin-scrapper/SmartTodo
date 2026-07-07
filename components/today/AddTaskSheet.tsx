import { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Easing, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import T from '../../theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, opts: { estimate: number; goalId: string | null }) => void;
}

export default function AddTaskSheet({ visible, onClose, onAdd }: Props) {
  const [text, setText] = useState('');
  const [aiOn, setAiOn] = useState(true);
  const backdrop = useRef(new Animated.Value(0)).current;
  const slide    = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slide, {
          toValue: 0, duration: 300,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdrop.setValue(0);
      slide.setValue(400);
    }
  }, [visible]);

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 400, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), { estimate: 45, goalId: 'g1' });
    setText('');
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoider}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
          <View style={styles.handle} />
          <Text style={styles.header}>NEW TASK</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Draft API spec for 90 min tomorrow morning"
            placeholderTextColor={T.ink4}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />

          {text.trim().length > 0 && aiOn && (
            <View style={styles.aiHint}>
              <Text style={{ fontSize: 13, color: T.sageInk }}>✦</Text>
              <Text style={styles.aiHintText}>
                I'll schedule this for tomorrow 9:00–10:30, link it to Design system,
                and break it into 4 steps.
              </Text>
            </View>
          )}

          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={styles.chipText}>Today</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>45 min</Text></View>
            <View style={styles.chip}>
              <View style={styles.chipDot} />
              <Text style={styles.chipText}>Design system</Text>
            </View>
            <TouchableOpacity
              onPress={() => setAiOn(v => !v)}
              style={[styles.chip, aiOn && { backgroundColor: T.sageSoft, borderColor: T.sageSoft }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, aiOn && { color: T.sageInk, fontWeight: '600' }]}>
                ✦ AI assist
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={submit}
            disabled={!text.trim()}
            style={[styles.addBtn, { backgroundColor: text.trim() ? T.ink : T.surfaceMuted }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.addBtnText, { color: text.trim() ? '#fff' : T.ink4 }]}>
              Add task
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,15,0.35)',
  },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: T.line, alignSelf: 'center', marginBottom: 14,
  },
  header: {
    fontSize: 11, color: T.ink3, fontWeight: '600',
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10,
  },
  input: {
    fontSize: 19, color: T.ink, letterSpacing: -0.3,
    minHeight: 52, maxHeight: 120,
    paddingVertical: 4, textAlignVertical: 'top',
  },
  aiHint: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: T.sageSoft, borderRadius: 14,
    padding: 12, marginTop: 10,
  },
  aiHintText: { flex: 1, fontSize: 13, color: T.sageInk, lineHeight: 18 },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 14, marginBottom: 16,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 100, backgroundColor: T.surfaceMuted,
    borderWidth: 0.5, borderColor: T.line,
  },
  chipDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: T.sage },
  chipText: { fontSize: 12, color: T.ink2, fontWeight: '500' },
  addBtn: {
    height: 52, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
});
