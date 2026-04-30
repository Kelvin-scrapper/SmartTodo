import { TouchableOpacity, View, StyleSheet } from 'react-native';
import T from '../../theme/tokens';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}

export default function Toggle({ value, onChange, color }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? (color ?? T.sage) : T.surfaceMuted,
          borderColor:      value ? (color ?? T.sage) : T.line },
      ]}
    >
      <View style={[styles.thumb, { left: value ? 21 : 3 }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44, height: 26, borderRadius: 13,
    borderWidth: 0.5, flexShrink: 0,
    position: 'relative',
  },
  thumb: {
    position: 'absolute', top: 3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18, shadowRadius: 3, elevation: 2,
  },
});
