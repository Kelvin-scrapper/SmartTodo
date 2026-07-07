import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import T from '../../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE   = 64;
const STROKE = 5;
const R      = (SIZE - STROKE) / 2;
const CIRC   = 2 * Math.PI * R;

interface Props {
  progress: number;       // 0..1
  minutesLeft: number;
  secondsLeft: number;
}

export default function ProgressRing({ progress, minutesLeft, secondsLeft }: Props) {
  const anim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={T.line} strokeWidth={STROKE} fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={T.sage} strokeWidth={STROKE} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.num}>
          {minutesLeft}:{String(secondsLeft).padStart(2, '0')}
        </Text>
        <Text style={styles.sub}>left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  num:    { fontSize: 14, fontWeight: '600', color: T.ink, fontVariant: ['tabular-nums'] },
  sub:    { fontSize: 9, color: T.ink3, textTransform: 'uppercase', letterSpacing: 0.5 },
});
