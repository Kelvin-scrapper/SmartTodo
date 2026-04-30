import {
  ScrollView, View, Text, TextInput,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import T from '../../theme/tokens';
import { SEED_GOALS } from '../../data/seed';

// ── Types ────────────────────────────────────────────────────

interface ParsedGoal {
  title: string;
  target: string;
  hours: number;
  theme: 'work' | 'health' | 'learning' | 'personal';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── API helpers ──────────────────────────────────────────────

const OPENROUTER_MODEL = 'google/gemini-2.0-flash-exp:free';
const GEMINI_MODEL     = 'gemini-2.0-flash';

const isOpenRouter = (key: string) => key.startsWith('sk-or-');

function providerLabel(key: string | null) {
  if (!key) return '';
  return isOpenRouter(key) ? 'OpenRouter · Free' : 'Gemini 2.0 Flash';
}

async function callAI(
  apiKey: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  if (isOpenRouter(apiKey)) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'http-referer': 'https://smarttodo.app',
        'x-title': 'SmartTodo',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 400,
        temperature: 0.6,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Error ${res.status}`);
    return data.choices?.[0]?.message?.content ?? '';
  } else {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 400, temperature: 0.6 },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Error ${res.status}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

async function parseGoalsAI(apiKey: string, intentions: string): Promise<ParsedGoal[]> {
  const sys = `Extract structured weekly goals from the user's free-form text.
Return ONLY a JSON array (no prose, no fences) of objects with keys:
  title (short, ≤6 words),
  target (concrete outcome, ≤8 words),
  hours (number, estimated time this week),
  theme (one of: work, health, learning, personal).
Aim for 1 entry per non-empty line. Don't invent goals.`;

  if (isOpenRouter(apiKey)) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'http-referer': 'https://smarttodo.app',
        'x-title': 'SmartTodo',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Goals:\n${intentions}` },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Error ${res.status}`);
    const raw = data.choices?.[0]?.message?.content ?? '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : raw);
  } else {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Goals:\n${intentions}` }] }],
          systemInstruction: { parts: [{ text: sys }] },
          generationConfig: { maxOutputTokens: 600, temperature: 0.3, responseMimeType: 'application/json' },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Error ${res.status}`);
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : raw);
  }
}

// ── Design constants ─────────────────────────────────────────

const THEME_COLOR: Record<string, string> = {
  work: T.sage, health: T.lavender, learning: T.terra, personal: T.ink3,
};

const ACCENT = {
  sage:     { bg: T.sageSoft,     ink: T.sageInk,     bar: T.sage     },
  terra:    { bg: T.terraSoft,    ink: T.terraInk,    bar: T.terra    },
  lavender: { bg: T.lavenderSoft, ink: T.lavenderInk, bar: T.lavender },
};

const WEEK_LABEL = (() => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
})();

const DEFAULT_INTENTIONS =
  'Finish design system v2 — ship to staging\n' +
  'Read 80 pages of Shape Up\n' +
  'Run 3x this week (easy pace)\n' +
  'Call mom on Sunday\n' +
  'Clear inbox to zero before Friday';

// ── Main screen ──────────────────────────────────────────────

export default function GoalsScreen() {
  const [intentions, setIntentions] = useState(DEFAULT_INTENTIONS);
  const [parsed,     setParsed]     = useState<ParsedGoal[]>([
    { title: 'Finish design system v2', target: 'Ship to staging', hours: 12, theme: 'work'     },
    { title: 'Read Shape Up',           target: '80 pages',        hours: 4,  theme: 'learning' },
    { title: 'Run 3x',                  target: 'Easy pace',       hours: 2,  theme: 'health'   },
  ]);
  const [parsing, setParsing] = useState(false);

  const [apiKey,    setApiKeyState] = useState<string | null>(null);
  const [keyInput,  setKeyInput]    = useState('');
  const [connecting, setConnecting] = useState(false);
  const [keyError,   setKeyError]   = useState('');

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError,   setChatError]   = useState('');

  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    SecureStore.getItemAsync('aiKey').then(k => { if (k) setApiKeyState(k); });
  }, []);

  // ── Plan with AI ────────────────────────────────────────────

  const planWithAI = async () => {
    if (!apiKey || parsing) return;
    setParsing(true);
    try {
      const result = await parseGoalsAI(apiKey, intentions);
      setParsed(result);
    } catch (e: any) {
      console.warn('parse failed', e);
    } finally {
      setParsing(false);
    }
  };

  // ── Connect API key ─────────────────────────────────────────

  const connectKey = async () => {
    const k = keyInput.trim();
    if (!k.startsWith('AIza') && !k.startsWith('sk-or-')) {
      setKeyError('Gemini keys start with "AIza", OpenRouter keys start with "sk-or-"');
      return;
    }
    setConnecting(true);
    setKeyError('');
    await SecureStore.setItemAsync('aiKey', k);
    setApiKeyState(k);
    setKeyInput('');
    setConnecting(false);
  };

  const disconnectKey = async () => {
    await SecureStore.deleteItemAsync('aiKey');
    setApiKeyState(null);
    setMessages([]);
  };

  // ── AI Coach chat ────────────────────────────────────────────

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading || !apiKey) return;
    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setChatInput('');
    setChatLoading(true);
    setChatError('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    const sys = `You are a calm, encouraging productivity coach. The user has these weekly goals:
${parsed.map(g => `- ${g.title}: ${g.target}`).join('\n')}
Reply in 2–4 sentences. No bullet points. No emoji.`;

    try {
      const reply = await callAI(apiKey, sys, next);
      if (!reply) {
        setChatError('AI returned an empty response. Try again.');
        return;
      }
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setChatError(e?.message ?? 'Could not reach AI. Check your connection.');
    } finally {
      setChatLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.heading}>Goals</Text>
          <Text style={s.sub}>Set this week's intentions, then watch them grow.</Text>

          {/* ── Week Goals Composer ── */}
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={s.weekPill}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: T.sageInk, letterSpacing: 0.4 }}>
                  WEEK OF {WEEK_LABEL}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: T.ink3 }}>
                {intentions.split('\n').filter(l => l.trim()).length} intentions
              </Text>
            </View>

            <Text style={s.composerTitle}>What matters this week?</Text>

            <TextInput
              value={intentions}
              onChangeText={setIntentions}
              multiline
              style={s.textarea}
              placeholder="e.g. Finish the report, run twice, call dad…"
              placeholderTextColor={T.ink4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={planWithAI}
              disabled={!intentions.trim() || !apiKey || parsing}
              style={[
                s.planBtn,
                { backgroundColor: intentions.trim() && apiKey ? T.sage : T.surfaceMuted },
              ]}
              activeOpacity={0.85}
            >
              {parsing
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Text style={{ fontSize: 14, marginRight: 4, color: intentions.trim() && apiKey ? T.sageSoft : T.ink4 }}>✦</Text>
                    <Text style={[s.planBtnText, { color: intentions.trim() && apiKey ? '#fff' : T.ink4 }]}>
                      Plan with AI
                    </Text>
                  </>
              }
            </TouchableOpacity>

            {!apiKey && (
              <Text style={{ fontSize: 12, color: T.ink3, textAlign: 'center', marginTop: 8 }}>
                Connect a key below to enable AI planning.
              </Text>
            )}

            {parsed.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={s.parsedLabel}>I READ THIS AS</Text>
                {parsed.map((g, i) => (
                  <View key={i} style={[s.parsedRow, i < parsed.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: T.line }]}>
                    <View style={[s.parsedDot, { backgroundColor: THEME_COLOR[g.theme] ?? T.ink3 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.parsedTitle}>{g.title}</Text>
                      <Text style={s.parsedMeta}>{g.target} · est. {g.hours}h</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── AI Coach ── */}
          <View style={[s.card, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: T.sageInk, fontSize: 14 }}>✦</Text>
                <Text style={s.coachLabel}>
                  AI COACH{apiKey ? ` · ${providerLabel(apiKey)}` : ''}
                </Text>
              </View>
              {apiKey && (
                <TouchableOpacity onPress={disconnectKey} activeOpacity={0.7}>
                  <Text style={{ fontSize: 13, color: T.ink3 }}>Disconnect</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* API key gate */}
            {!apiKey ? (
              <View>
                <Text style={s.gateTitle}>Connect your assistant</Text>
                <Text style={s.gateSub}>
                  Paste an OpenRouter key (free) or a Google Gemini key.
                  Stored securely on this device.
                </Text>
                <TextInput
                  value={keyInput}
                  onChangeText={t => { setKeyInput(t); setKeyError(''); }}
                  placeholder="sk-or-…  or  AIza…"
                  placeholderTextColor={T.ink4}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={s.keyInput}
                />
                {keyError ? (
                  <Text style={{ fontSize: 12, color: T.terraInk, marginBottom: 8 }}>{keyError}</Text>
                ) : null}
                <TouchableOpacity
                  onPress={connectKey}
                  disabled={!keyInput.trim() || connecting}
                  style={[s.connectBtn, { backgroundColor: keyInput.trim() ? T.ink : T.surfaceMuted }]}
                  activeOpacity={0.85}
                >
                  {connecting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={[s.connectBtnText, { color: keyInput.trim() ? '#fff' : T.ink4 }]}>Connect</Text>
                  }
                </TouchableOpacity>

                {/* Provider hints */}
                <View style={{ marginTop: 14, gap: 8 }}>
                  <View style={s.hintRow}>
                    <View style={[s.hintBadge, { backgroundColor: T.sageSoft }]}>
                      <Text style={{ fontSize: 11, color: T.sageInk, fontWeight: '600' }}>FREE</Text>
                    </View>
                    <Text style={s.hintText}>
                      <Text style={{ color: T.sageInk, fontWeight: '500' }}>OpenRouter</Text>
                      {'  '}openrouter.ai → Free key, no credit card
                    </Text>
                  </View>
                  <View style={s.hintRow}>
                    <View style={[s.hintBadge, { backgroundColor: T.surfaceMuted }]}>
                      <Text style={{ fontSize: 11, color: T.ink3, fontWeight: '600' }}>ALT</Text>
                    </View>
                    <Text style={s.hintText}>
                      <Text style={{ color: T.ink2, fontWeight: '500' }}>Gemini</Text>
                      {'  '}aistudio.google.com → personal Gmail only
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Chat interface */
              <View>
                {messages.length === 0 && !chatLoading && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: T.ink3, marginBottom: 10, lineHeight: 19 }}>
                      Ask me anything about your week — priorities, energy, what to drop.
                    </Text>
                    {['How should I prioritise this week?', 'Am I taking on too much?', 'What should I focus on first?'].map(p => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => { setChatInput(p); }}
                        style={s.preset}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 12, color: T.ink2 }}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <FlatList
                  ref={flatRef}
                  data={messages}
                  keyExtractor={(_, i) => String(i)}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={[
                      s.bubble,
                      item.role === 'user' ? s.bubbleUser : s.bubbleAssistant,
                    ]}>
                      <Text style={[
                        s.bubbleText,
                        { color: item.role === 'user' ? '#fff' : T.ink },
                      ]}>
                        {item.content}
                      </Text>
                    </View>
                  )}
                  style={{ marginBottom: 10 }}
                />

                {chatLoading && (
                  <View style={[s.bubble, s.bubbleAssistant, { paddingVertical: 12 }]}>
                    <ActivityIndicator size="small" color={T.sageInk} />
                  </View>
                )}

                {chatError ? (
                  <View style={[s.bubble, { backgroundColor: T.terraSoft, marginBottom: 8 }]}>
                    <Text style={{ fontSize: 13, color: T.terraInk }}>{chatError}</Text>
                  </View>
                ) : null}

                {/* Input row */}
                <View style={s.inputRow}>
                  <TextInput
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Ask your coach…"
                    placeholderTextColor={T.ink4}
                    style={s.chatInput}
                    returnKeyType="send"
                    onSubmitEditing={sendChat}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    onPress={sendChat}
                    disabled={!chatInput.trim() || chatLoading}
                    style={[s.sendBtn, { backgroundColor: chatInput.trim() ? T.sage : T.surfaceMuted }]}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-up" size={18} color={chatInput.trim() ? '#fff' : T.ink4} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ── Long-term goals ── */}
          <Text style={[s.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>
            LONG-TERM · THIS MONTH
          </Text>
          {SEED_GOALS.map(g => {
            const pct = Math.min(g.spentHours / g.targetHours, 1);
            const a   = ACCENT[g.accent];
            return (
              <View key={g.id} style={[s.card, { marginBottom: 12 }]}>
                <Text style={[s.goalPeriod, { color: a.ink }]}>
                  {g.period.toUpperCase()} · DUE IN {g.dueIn.toUpperCase()}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={s.goalTitle}>{g.title}</Text>
                  <Text style={[s.goalPct, { color: a.ink }]}>
                    {Math.round(pct * 100)}<Text style={s.goalPctSmall}>%</Text>
                  </Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct * 100}%` as any, backgroundColor: a.bar }]} />
                </View>
                <Text style={s.goalPace}>
                  {g.spentHours}h of {g.targetHours}h{'  '}
                  <Text style={{ color: pct >= 0.5 ? T.sageInk : T.terraInk, fontWeight: '500' }}>
                    {pct >= 0.5 ? '✓ on pace' : '· catch up gently'}
                  </Text>
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  heading:      { fontSize: 28, fontWeight: '600', color: T.ink, letterSpacing: -0.5, marginBottom: 4 },
  sub:          { fontSize: 15, color: T.ink3, marginBottom: 20, lineHeight: 22 },
  sectionLabel: { fontSize: 11, color: T.ink3, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },

  card: {
    backgroundColor: T.surface, borderRadius: 22,
    borderWidth: 0.5, borderColor: T.line,
    padding: 18, paddingHorizontal: 20,
  },

  // Composer
  weekPill:      { backgroundColor: T.sageSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  composerTitle: { fontSize: 18, fontWeight: '600', color: T.ink, letterSpacing: -0.4, marginBottom: 12 },
  textarea: {
    fontSize: 15, color: T.ink, lineHeight: 23, letterSpacing: -0.1,
    minHeight: 120, textAlignVertical: 'top',
    borderWidth: 0, padding: 0, marginBottom: 14,
  },
  planBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 16 },
  planBtnText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  parsedLabel: { fontSize: 11, color: T.ink3, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  parsedRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  parsedDot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  parsedTitle: { fontSize: 15, fontWeight: '500', color: T.ink, letterSpacing: -0.2 },
  parsedMeta:  { fontSize: 12, color: T.ink3, marginTop: 2 },

  // AI Coach
  coachLabel: { fontSize: 12, color: T.sageInk, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  gateTitle:  { fontSize: 16, fontWeight: '600', color: T.ink, letterSpacing: -0.3, marginBottom: 6 },
  gateSub:    { fontSize: 13, color: T.ink3, lineHeight: 19, marginBottom: 14 },
  keyInput: {
    backgroundColor: T.surfaceMuted, borderRadius: 14,
    borderWidth: 0.5, borderColor: T.line,
    padding: 14, fontSize: 15, color: T.ink,
    marginBottom: 10, fontFamily: 'monospace',
  },
  connectBtn:     { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  connectBtnText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  hintRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  hintText: { fontSize: 12, color: T.ink3, flex: 1 },
  preset: {
    borderWidth: 0.5, borderColor: T.line, borderRadius: 100,
    backgroundColor: T.surfaceMuted, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  bubble:          { maxWidth: '88%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  bubbleUser:      { backgroundColor: T.ink, alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: T.sageSoft, alignSelf: 'flex-start' },
  bubbleText:      { fontSize: 14, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.surfaceMuted, borderRadius: 16,
    borderWidth: 0.5, borderColor: T.line,
    paddingLeft: 14, paddingRight: 4, paddingVertical: 4,
    gap: 8,
  },
  chatInput: { flex: 1, fontSize: 14, color: T.ink, paddingVertical: 8 },
  sendBtn:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Long-term goals
  goalPeriod:   { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  goalTitle:    { fontSize: 18, fontWeight: '600', color: T.ink, letterSpacing: -0.4, flex: 1, marginRight: 8 },
  goalPct:      { fontSize: 22, fontWeight: '600' },
  goalPctSmall: { fontSize: 14, fontWeight: '500' },
  barTrack:     { height: 8, borderRadius: 99, backgroundColor: T.surfaceMuted, marginVertical: 10, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 99 },
  goalPace:     { fontSize: 13, color: T.ink3 },
});
