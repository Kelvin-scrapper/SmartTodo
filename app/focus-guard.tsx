import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import T from '../theme/tokens';
import Toggle from '../components/ui/Toggle';

// ── Seed data ────────────────────────────────────────────────

const GUARD_APPS = [
  { id: 'instagram', name: 'Instagram',   color: '#C13584', initial: 'IG', limitMin: 30, usedMin: 22, on: true  },
  { id: 'tiktok',    name: 'TikTok',      color: '#111111', initial: 'TK', limitMin: 20, usedMin: 20, on: true  },
  { id: 'youtube',   name: 'YouTube',     color: '#FF0000', initial: 'YT', limitMin: 45, usedMin: 18, on: true  },
  { id: 'twitter',   name: 'X / Twitter', color: '#1a8cd8', initial: 'X',  limitMin: 15, usedMin: 8,  on: false },
  { id: 'facebook',  name: 'Facebook',    color: '#1877F2', initial: 'FB', limitMin: 20, usedMin: 5,  on: false },
];

const BLOCK_CATS = [
  { id: 'adult',         label: 'Adult content', on: true,  pinned: true  },
  { id: 'social',        label: 'Social media',  on: true,  pinned: false },
  { id: 'entertainment', label: 'Entertainment', on: true,  pinned: false },
  { id: 'gaming',        label: 'Gaming',        on: true,  pinned: false },
  { id: 'news',          label: 'News',          on: false, pinned: false },
  { id: 'shopping',      label: 'Shopping',      on: false, pinned: false },
];

const CONTROLLED_SEED = [
  { id: 'instagram', name: 'Instagram', color: '#C13584', initial: 'IG', level: 'control' as const },
  { id: 'tiktok',    name: 'TikTok',    color: '#111111', initial: 'TK', level: 'control' as const },
  { id: 'youtube',   name: 'YouTube',   color: '#FF0000', initial: 'YT', level: 'monitor' as const },
];

const APP_CATALOG = [
  { id: 'snapchat', name: 'Snapchat',    color: '#FFFC00', initial: 'SC', cat: 'Social'        },
  { id: 'reddit',   name: 'Reddit',      color: '#FF4500', initial: 'Re', cat: 'Social'        },
  { id: 'twitter',  name: 'X / Twitter', color: '#1a8cd8', initial: 'X',  cat: 'Social'        },
  { id: 'facebook', name: 'Facebook',    color: '#1877F2', initial: 'FB', cat: 'Social'        },
  { id: 'netflix',  name: 'Netflix',     color: '#E50914', initial: 'NF', cat: 'Entertainment' },
  { id: 'twitch',   name: 'Twitch',      color: '#9146FF', initial: 'Tw', cat: 'Entertainment' },
  { id: 'chrome',   name: 'Chrome',      color: '#4285F4', initial: 'Ch', cat: 'Browser'       },
];

const PERMS = [
  { id: 'accessibility', label: 'Accessibility Service', detail: 'Enforces real-time blocks',    granted: false },
  { id: 'usage',         label: 'Usage Statistics',      detail: 'Reads time spent per app',     granted: true  },
  { id: 'admin',         label: 'Device Admin',          detail: 'Prevents app removal',         granted: false },
];

const EDU_DOMAINS = ['wikipedia.org', 'khanacademy.org', 'coursera.org', 'arxiv.org', 'scholar.google.com'];

function fmtMin(m: number) {
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`;
}

// ── Component ────────────────────────────────────────────────

export default function FocusGuardScreen() {
  const router = useRouter();

  const [apps,        setApps]        = useState(GUARD_APPS);
  const [cats,        setCats]        = useState(BLOCK_CATS);
  const [controlled,  setControlled]  = useState(CONTROLLED_SEED);
  const [perms,       setPerms]       = useState(PERMS);
  const [eduOnly,     setEduOnly]     = useState(false);
  const [focusOnly,   setFocusOnly]   = useState(true);
  const [override,    setOverride]    = useState(true);
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [adultWarn,   setAdultWarn]   = useState(false);

  const accessGranted = perms.find(p => p.id === 'accessibility')?.granted ?? false;
  const activeApps    = apps.filter(a => a.on).length;
  const activeCats    = cats.filter(c => c.on).length;
  const isActive      = activeApps > 0 || controlled.length > 0 || eduOnly;

  const grantAccess = () =>
    setPerms(prev => prev.map(p => p.id === 'accessibility' ? { ...p, granted: true } : p));

  const available = APP_CATALOG.filter(a => !controlled.find(c => c.id === a.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={T.ink2} />
          </TouchableOpacity>
          <Text style={s.heading}>Focus Guard</Text>
        </View>

        {/* Status banner */}
        <View style={[s.banner, { backgroundColor: isActive ? T.sageSoft : T.surfaceMuted }]}>
          <Ionicons name="shield-checkmark" size={20} color={isActive ? T.sageInk : T.ink3} />
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: isActive ? T.sageInk : T.ink2 }]}>
              {isActive ? 'Protection active' : 'No limits set'}
            </Text>
            <Text style={[s.bannerSub, { color: isActive ? T.sageInk : T.ink3 }]}>
              {activeApps} app limit{activeApps !== 1 ? 's' : ''} · {controlled.length} under control · {activeCats} categories blocked
            </Text>
          </View>
        </View>

        {/* ── SUPER ACCESS ── */}
        <SectionLabel label="Super access · app control" />

        {/* Permissions card */}
        <View style={[s.card, { backgroundColor: accessGranted ? T.sageSoft : T.terraSoft, borderColor: accessGranted ? T.sage + '50' : T.terra + '50', marginBottom: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Ionicons name="shield-checkmark" size={18} color={accessGranted ? T.sageInk : T.terraInk} />
            <View style={{ flex: 1 }}>
              <Text style={[s.permTitle, { color: accessGranted ? T.sageInk : T.terraInk }]}>
                {accessGranted ? 'Super access granted' : 'Super access required'}
              </Text>
              <Text style={[s.permSub, { color: accessGranted ? T.sageInk : T.terraInk }]}>
                {accessGranted ? 'Blocks enforce in real time.' : 'Grant permissions to enforce real-time blocks.'}
              </Text>
            </View>
          </View>

          {perms.map((p, i) => (
            <View key={p.id} style={[s.permRow, i < perms.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: accessGranted ? T.sage + '40' : T.terra + '40' }]}>
              <View style={[s.dot, { backgroundColor: p.granted ? T.sage : T.terra }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.permLabel}>{p.label}</Text>
                <Text style={s.permDetail}>{p.detail}</Text>
              </View>
              <View style={[s.permBadge, { backgroundColor: p.granted ? T.sageSoft : T.terraSoft }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: p.granted ? T.sageInk : T.terraInk }}>
                  {p.granted ? 'Granted' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}

          {!accessGranted && (
            <TouchableOpacity onPress={grantAccess} style={s.grantBtn} activeOpacity={0.85}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Grant super access →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Controlled apps */}
        <View style={[s.card, { marginBottom: 20 }]}>
          {controlled.length === 0 && (
            <Text style={{ color: T.ink3, fontSize: 14, textAlign: 'center', paddingVertical: 12 }}>
              No apps highlighted yet.
            </Text>
          )}
          {controlled.map((app, i) => {
            const isCtrl = app.level === 'control';
            return (
              <View key={app.id} style={[s.appRow, i < controlled.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: T.line }]}>
                <AppTile color={app.color} initial={app.initial} />
                <View style={{ flex: 1 }}>
                  <Text style={s.appName}>{app.name}</Text>
                  <Text style={{ fontSize: 12, color: isCtrl ? T.sageInk : T.ink3 }}>
                    {isCtrl ? '⬤ Active block when limit hit' : '◯ Monitor only'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setControlled(prev => prev.map(a => a.id === app.id ? { ...a, level: isCtrl ? 'monitor' : 'control' } : a))}
                  style={[s.levelPill, { backgroundColor: isCtrl ? T.sageSoft : T.surfaceMuted, borderColor: isCtrl ? T.sage + '70' : T.line }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isCtrl ? T.sageInk : T.ink3 }}>
                    {isCtrl ? 'Control' : 'Monitor'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setControlled(prev => prev.filter(a => a.id !== app.id))} style={{ padding: 4 }}>
                  <Ionicons name="close" size={15} color={T.ink4} />
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity onPress={() => setPickerOpen(true)} style={[s.addRow, controlled.length > 0 && { borderTopWidth: 0.5, borderTopColor: T.line }]}>
            <View style={s.addTile}>
              <Ionicons name="add" size={18} color={T.sage} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: T.sageInk }}>Highlight another app</Text>
          </TouchableOpacity>
        </View>

        {/* ── APP LIMITS ── */}
        <SectionLabel label="App limits · today" />
        <View style={[s.card, { marginBottom: 20 }]}>
          {apps.map((app, i) => {
            const pct  = Math.min(app.usedMin / app.limitMin, 1);
            const over = app.usedMin >= app.limitMin;
            const bar  = over || pct > 0.75 ? T.terra : T.sage;
            return (
              <View key={app.id} style={[s.appRow, { flexDirection: 'column', alignItems: 'stretch' }, i < apps.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: T.line }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: app.on ? 10 : 0 }}>
                  <AppTile color={app.color} initial={app.initial} opacity={app.on ? 1 : 0.35} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.appName, { color: app.on ? T.ink : T.ink3 }]}>{app.name}</Text>
                    {app.on && (
                      <Text style={{ fontSize: 12, color: over ? T.terraInk : T.ink3 }}>
                        {over ? '⚑ Limit reached · ' : ''}{fmtMin(app.usedMin)} of {fmtMin(app.limitMin)}
                      </Text>
                    )}
                  </View>
                  <Toggle value={app.on} onChange={() => setApps(prev => prev.map(a => a.id === app.id ? { ...a, on: !a.on } : a))} />
                </View>
                {app.on && (
                  <View style={{ height: 5, borderRadius: 99, backgroundColor: T.surfaceMuted, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 99, backgroundColor: bar }} />
                  </View>
                )}
              </View>
            );
          })}
          <View style={[s.addRow, { borderTopWidth: 0.5, borderTopColor: T.line }]}>
            <View style={s.addTile}><Ionicons name="add" size={18} color={T.sage} /></View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: T.sageInk }}>Add another app</Text>
          </View>
        </View>

        {/* ── SITE FILTER ── */}
        <SectionLabel label="Site filter" />

        {/* Adult content — pinned safety */}
        <View style={[s.card, { backgroundColor: T.lavenderSoft, borderColor: T.lavender + '50', marginBottom: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="lock-closed" size={18} color={T.lavenderInk} />
            <View style={{ flex: 1 }}>
              <Text style={[s.appName, { color: T.lavenderInk }]}>Adult content</Text>
              <Text style={{ fontSize: 12, color: T.lavenderInk, opacity: 0.75, marginTop: 1 }}>
                Safety block · pornographic sites always blocked
              </Text>
              {adultWarn && (
                <Text style={{ fontSize: 12, color: T.terraInk, marginTop: 6, lineHeight: 18 }}>
                  This removes all adult content filtering.{' '}
                  <Text
                    onPress={() => { setCats(p => p.map(c => c.id === 'adult' ? { ...c, on: false } : c)); setAdultWarn(false); }}
                    style={{ fontWeight: '700', textDecorationLine: 'underline' }}
                  >Yes, disable</Text>
                  {'  '}
                  <Text onPress={() => setAdultWarn(false)} style={{ fontWeight: '600' }}>Cancel</Text>
                </Text>
              )}
            </View>
            <Toggle
              value={cats.find(c => c.id === 'adult')?.on ?? true}
              color={T.lavender}
              onChange={() => {
                const adultOn = cats.find(c => c.id === 'adult')?.on;
                if (adultOn) setAdultWarn(true);
                else { setCats(p => p.map(c => c.id === 'adult' ? { ...c, on: true } : c)); setAdultWarn(false); }
              }}
            />
          </View>
        </View>

        {/* Educational only */}
        <View style={[s.card, { backgroundColor: eduOnly ? T.sageSoft : T.surface, borderColor: eduOnly ? T.sage + '70' : T.line, marginBottom: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="globe-outline" size={19} color={eduOnly ? T.sageInk : T.ink3} />
            <View style={{ flex: 1 }}>
              <Text style={[s.appName, { color: eduOnly ? T.sageInk : T.ink }]}>Educational only</Text>
              <Text style={{ fontSize: 12, color: eduOnly ? T.sageInk : T.ink3, marginTop: 1 }}>
                {eduOnly ? 'Only whitelisted domains pass.' : 'Allow only educational sites.'}
              </Text>
            </View>
            <Toggle value={eduOnly} onChange={setEduOnly} />
          </View>
        </View>

        {/* Block categories */}
        {!eduOnly && (
          <View style={[s.card, { marginBottom: 20 }]}>
            <Text style={s.catTitle}>Block categories</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {cats.filter(c => !c.pinned).map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCats(p => p.map(c => c.id === cat.id ? { ...c, on: !c.on } : c))}
                  style={[s.chip, { backgroundColor: cat.on ? T.terraSoft : T.surfaceMuted, borderColor: cat.on ? T.terra + '70' : T.line }]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, fontWeight: cat.on ? '600' : '500', color: cat.on ? T.terraInk : T.ink3 }}>
                    {cat.on ? '✕ ' : ''}{cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Allowed domains */}
        {eduOnly && (
          <View style={[s.card, { marginBottom: 20 }]}>
            <Text style={s.catTitle}>Always allowed</Text>
            {EDU_DOMAINS.map((d, i) => (
              <View key={d} style={[s.domainRow, i < EDU_DOMAINS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: T.line }]}>
                <Text style={{ fontSize: 14, color: T.ink }}>{d}</Text>
                <Text style={{ fontSize: 12, color: T.sageInk, fontWeight: '600' }}>Allowed</Text>
              </View>
            ))}
            <TouchableOpacity style={[s.addRow, { borderTopWidth: 0.5, borderTopColor: T.line, marginTop: 4 }]}>
              <Ionicons name="add" size={16} color={T.sageInk} />
              <Text style={{ fontSize: 14, color: T.sageInk, fontWeight: '500' }}>Add domain</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SCHEDULE ── */}
        <SectionLabel label="Schedule" />
        <View style={s.card}>
          {[
            { label: 'Active during focus hours', detail: '9:00 am – 5:00 pm', val: focusOnly,  set: setFocusOnly },
            { label: 'Override requires reason',  detail: 'Ask AI coach first', val: override,   set: setOverride  },
          ].map((row, i) => (
            <View key={i} style={[s.schedRow, i === 0 && { borderBottomWidth: 0.5, borderBottomColor: T.line }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.appName}>{row.label}</Text>
                <Text style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>{row.detail}</Text>
              </View>
              <Toggle value={row.val} onChange={row.set} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* App picker modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setPickerOpen(false)} />
        <View style={[s.sheet, { backgroundColor: T.bg }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>HIGHLIGHT AN APP</Text>
          <Text style={{ fontSize: 13, color: T.ink3, marginBottom: 16 }}>
            Focus Guard will monitor or actively control highlighted apps.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {available.map(app => (
              <TouchableOpacity
                key={app.id}
                onPress={() => { setControlled(p => [...p, { ...app, level: 'monitor' as const }]); setPickerOpen(false); }}
                style={s.pickerRow}
                activeOpacity={0.7}
              >
                <AppTile color={app.color} initial={app.initial} />
                <Text style={[s.appName, { flex: 1 }]}>{app.name}</Text>
                <Text style={{ fontSize: 13, color: T.sageInk, fontWeight: '600' }}>Add →</Text>
              </TouchableOpacity>
            ))}
            {available.length === 0 && (
              <Text style={{ textAlign: 'center', color: T.ink3, fontSize: 14, paddingVertical: 20 }}>
                All catalog apps are already highlighted.
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 12, color: T.ink3, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
      {label}
    </Text>
  );
}

function AppTile({ color, initial, opacity = 1 }: { color: string; initial: string; opacity?: number }) {
  return (
    <View style={[s.appTile, { backgroundColor: color, opacity }]}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: color === '#FFFC00' ? '#000' : '#fff', letterSpacing: -0.3 }}>
        {initial}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  heading:    { fontSize: 24, fontWeight: '600', color: T.ink, letterSpacing: -0.5 },
  backBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: T.surfaceMuted, borderWidth: 0.5, borderColor: T.line, alignItems: 'center', justifyContent: 'center' },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, marginBottom: 20 },
  bannerTitle:{ fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  bannerSub:  { fontSize: 12, marginTop: 1 },
  card:       { backgroundColor: T.surface, borderRadius: 22, borderWidth: 0.5, borderColor: T.line, padding: 14, paddingHorizontal: 16, marginBottom: 0, overflow: 'hidden' },
  permTitle:  { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  permSub:    { fontSize: 12, marginTop: 1, opacity: 0.8 },
  permRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  permLabel:  { fontSize: 13, fontWeight: '500', color: T.ink },
  permDetail: { fontSize: 11, color: T.ink3, marginTop: 1 },
  permBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  grantBtn:   { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: T.ink, alignItems: 'center' },
  appRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  appTile:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  appName:    { fontSize: 15, fontWeight: '500', color: T.ink, letterSpacing: -0.2 },
  levelPill:  { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, borderWidth: 0.5 },
  addRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  addTile:    { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: T.sage + '90', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  catTitle:   { fontSize: 13, fontWeight: '500', color: T.ink2 },
  chip:       { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, borderWidth: 0.5 },
  domainRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  schedRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  backdrop:   { flex: 1, backgroundColor: 'rgba(20,18,15,0.35)' },
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 40, maxHeight: '70%' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: T.line, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, color: T.ink3, textTransform: 'uppercase', marginBottom: 4 },
  pickerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: T.line },
});
