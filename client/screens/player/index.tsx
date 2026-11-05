import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EqualizerBars } from '@/components/player/EqualizerBars';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useTheme, type ThemeColors } from '@/contexts/ThemeModeContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { trackTint } from '@/components/player/SongRow';
import { coverForTitle, formatDuration } from '@/utils/format';
import { FontAwesome6 } from '@expo/vector-icons';

interface BgTheme {
  name: string;
  colors: [string, string, string];
}

// 深色背景主题（保持原有沉浸感）
const BG_THEMES_DARK: BgTheme[] = [
  { name: '午夜紫', colors: ['#241245', '#3A1C71', '#0A0A0F'] },
  { name: '极光青', colors: ['#062A3A', '#0E5F6E', '#0A0A0F'] },
  { name: '烈焰橙', colors: ['#3A0B0B', '#B45309', '#140805'] },
  { name: '深海蓝', colors: ['#0A1533', '#1E3A8A', '#060B1A'] },
  { name: '霓虹粉', colors: ['#3A0E2E', '#9D174D', '#14050E'] },
  { name: '翡翠绿', colors: ['#042F2E', '#0F766E', '#04100F'] },
];

// 亮色背景主题（白天模式下使用，保证深色文字的对比度）
const BG_THEMES_LIGHT: BgTheme[] = [
  { name: '晨光紫', colors: ['#E4D9FF', '#CBB8FF', '#F2EDFF'] },
  { name: '极光青', colors: ['#C9F0F6', '#A5E3EA', '#EDFBFF'] },
  { name: '暖阳橙', colors: ['#FFE4C9', '#FFC590', '#FFF6EC'] },
  { name: '晴空蓝', colors: ['#D7E7FF', '#AACBFF', '#F0F6FF'] },
  { name: '樱花粉', colors: ['#FFDCE6', '#FFBFD0', '#FFF4F7'] },
  { name: '薄荷绿', colors: ['#D2F5E4', '#A6EBCB', '#F0FBF5'] },
];

export default function PlayerScreen() {
  const {
    current,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    volume,
    repeatMode,
    shuffle,
    queue,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    cycleRepeat,
    toggleShuffle,
  } = useMusicPlayer();
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [dragMs, setDragMs] = useState<number | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [spin] = useState(() => new Animated.Value(0));
  const [themeIdx, setThemeIdx] = useState(0);
  const [themeVisible, setThemeVisible] = useState(false);

  const s = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const cover = current?.cover_url || (current ? coverForTitle(current.title, current.artist) : '');

  useEffect(() => {
    if (isPlaying) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(spin, { toValue: 1, duration: 18000, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [isPlaying, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const shownPos = dragMs ?? positionMs;
  const maxMs = Math.max(durationMs, 1);
  const tint = current ? trackTint(current) : (isDark ? '#8A63FF' : '#5B4DE0');
  const accent = isDark ? '#A78BFA' : colors.primary;
  const inactiveIcon = isDark ? 'rgba(245,245,247,0.5)' : 'rgba(28,28,35,0.55)';
  const trackTone = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(28,28,35,0.16)';
  const thumb = isDark ? '#fff' : colors.primary;
  const bgThemes = isDark ? BG_THEMES_DARK : BG_THEMES_LIGHT;
  const bgTheme = bgThemes[themeIdx];
  const dimBg = isDark ? 'rgba(5,5,10,0.6)' : 'rgba(255,255,255,0.18)';
  const gradColors = isDark
    ? (['transparent', 'rgba(10,10,15,0.5)', 'rgba(10,10,15,0.94)'] as const)
    : (['transparent', 'rgba(255,255,255,0.35)', 'rgba(244,244,248,0.95)'] as const);

  const repeatIcon = useMemo(
    () => (
      <View style={s.modeBtn}>
        <FontAwesome6 name="repeat" size={18} color={repeatMode === 'all' ? accent : inactiveIcon} />
        {repeatMode === 'one' && <Text style={[s.modeBadge, { color: accent }]}>1</Text>}
      </View>
    ),
    [repeatMode, accent, inactiveIcon, s]
  );

  return (
    <Screen backgroundColor={colors.background} statusBarStyle={colors.statusBarStyle} safeAreaEdges={['top', 'left', 'right']}>
      <View style={s.container}>
        {/* 动态背景：主题色渐变 + 封面模糊 + 明暗化 */}
        <LinearGradient colors={bgTheme.colors} style={s.backdrop} />
        {cover ? <Image source={{ uri: cover }} style={[s.backdrop, s.backdropImage]} blurRadius={78} /> : null}
        <View style={[s.backdropDim, { backgroundColor: dimBg }]} />
        <LinearGradient colors={[...gradColors]} style={s.backdropGradient} />

        {/* 顶部栏 */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.roundBtn} onPress={() => router.back()}>
            <FontAwesome6 name="chevron-down" size={18} color={colors.iconPrimary} />
          </TouchableOpacity>
          <Text style={s.topTitle}>正在播放</Text>
          <View style={s.topRight}>
            <TouchableOpacity style={s.roundBtn} onPress={() => setThemeVisible(true)}>
              <FontAwesome6 name="palette" size={17} color={colors.iconPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.roundBtn} onPress={() => setShowQueue((q) => !q)}>
              <FontAwesome6 name="list-ul" size={17} color={showQueue ? accent : colors.iconPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {!current ? (
          <View style={s.noCurrent}>
            <Text style={s.noCurrentText}>还没有选择歌曲</Text>
            <Text style={s.noCurrentHint}>返回音乐库选择一首歌开始播放</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* 封面 */}
            <View style={s.coverArea}>
              <Animated.View style={[s.coverWrap, { transform: [{ rotate }], borderColor: `${tint}55` }]}>
                <Image source={{ uri: cover }} style={s.cover} resizeMode="cover" />
              </Animated.View>
            </View>

            {/* 曲目信息 */}
            <View style={s.infoArea}>
              <Text numberOfLines={1} style={s.title}>
                {current.title}
              </Text>
              <Text numberOfLines={1} style={s.artist}>
                {current.artist}
              </Text>
            </View>

            {/* 波形可视化 + 进度 */}
            <EqualizerBars playing={isPlaying} color={accent} barCount={24} />
            <Slider
              style={s.progress}
              minimumValue={0}
              maximumValue={maxMs}
              value={Math.min(shownPos, maxMs)}
              onSlidingStart={() => setDragMs(positionMs)}
              onValueChange={(v) => setDragMs(v)}
              onSlidingComplete={(v) => {
                seekTo(Math.round(v));
                setDragMs(null);
              }}
              minimumTrackTintColor={accent}
              maximumTrackTintColor={trackTone}
              thumbTintColor={thumb}
            />
            <View style={s.timeRow}>
              <Text style={s.time}>{formatDuration(shownPos)}</Text>
              <Text style={s.time}>{formatDuration(durationMs)}</Text>
            </View>

            {/* 主控制 */}
            <View style={s.controls}>
              <TouchableOpacity style={s.modeBtn} onPress={toggleShuffle}>
                <FontAwesome6 name="shuffle" size={18} color={shuffle ? accent : inactiveIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={s.bigBtn} onPress={prev}>
                <FontAwesome6 name="backward-step" size={26} color={colors.iconPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.playBtn, { backgroundColor: tint }]}
                onPress={togglePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesome6 name="circle-notch" size={30} color="#fff" />
                ) : (
                  <FontAwesome6 name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.bigBtn} onPress={next}>
                <FontAwesome6 name="forward-step" size={26} color={colors.iconPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={cycleRepeat}>{repeatIcon}</TouchableOpacity>
            </View>

            {/* 音量 */}
            <View style={s.volumeRow}>
              <FontAwesome6 name="volume-low" size={16} color={colors.iconSub} />
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor={accent}
                maximumTrackTintColor={trackTone}
                thumbTintColor={thumb}
              />
              <FontAwesome6 name="volume-high" size={16} color={colors.iconSub} />
            </View>

            {/* 播放队列 */}
            {showQueue && (
              <View style={s.queue}>
                <Text style={s.queueTitle}>播放队列</Text>
                {queue.map((t, i) => (
                  <View key={t.id} style={s.queueItem}>
                    <Text style={s.queueIndex}>{i + 1}</Text>
                    <Text numberOfLines={1} style={s.queueName}>
                      {t.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* 背景色选择面板 */}
        <Modal
          visible={themeVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setThemeVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setThemeVisible(false)}>
            <View style={s.sheetOverlay}>
              <TouchableWithoutFeedback onPress={() => undefined}>
                <View style={s.sheet}>
                  <Text style={s.sheetTitle}>选择背景色</Text>
                  <View style={s.swatchRow}>
                    {bgThemes.map((t, i) => (
                      <TouchableOpacity
                        key={t.name}
                        style={s.swatchWrap}
                        onPress={() => {
                          setThemeIdx(i);
                          setThemeVisible(false);
                        }}
                      >
                        <View style={s.swatchInner}>
                          <LinearGradient colors={t.colors} style={s.swatch} />
                          {themeIdx === i ? (
                            <View style={s.swatchCheck}>
                              <FontAwesome6 name="check" size={14} color="#ffffff" />
                            </View>
                          ) : null}
                        </View>
                        <Text style={s.swatchName}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </Screen>
  );
}

const createStyles = (c: ThemeColors, dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    backdropImage: { opacity: dark ? 0.5 : 0.35 },
    backdropDim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    backdropGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    roundBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(28,28,35,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    noCurrent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    noCurrentText: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    noCurrentHint: { color: c.textDim, fontSize: 14, marginTop: 8 },
    body: { alignItems: 'center', paddingHorizontal: 24 },
    coverArea: { marginTop: 12 },
    coverWrap: {
      width: 264,
      height: 264,
      borderRadius: 132,
      borderWidth: 5,
      overflow: 'hidden',
    },
    cover: { width: '100%', height: '100%' },
    infoArea: { marginTop: 26, alignItems: 'center' },
    title: { color: c.textPrimary, fontSize: 24, fontWeight: '800' },
    artist: { color: c.textDim, fontSize: 15, marginTop: 8 },
    progress: { width: '100%', height: 36, marginTop: 8 },
    timeRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: -6,
    },
    time: { color: c.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 18,
    },
    modeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    modeBadge: { position: 'absolute', fontSize: 9, fontWeight: '800', top: 20, right: 2 },
    bigBtn: { padding: 12 },
    playBtn: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    volumeRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 24, gap: 10 },
    queue: { width: '100%', marginTop: 24 },
    queueTitle: { color: c.textDim, fontSize: 13, marginBottom: 10 },
    queueItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    queueIndex: {
      width: 20,
      color: c.textTertiary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
      textAlign: 'right',
    },
    queueName: { color: c.textPrimary, fontSize: 14, flex: 1 },
    sheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: c.mask,
    },
    sheet: {
      backgroundColor: c.sheet,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 40,
    },
    sheetTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 18,
      textAlign: 'center',
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 16,
    },
    swatchWrap: { width: '30%', alignItems: 'center' },
    swatchInner: { position: 'relative' },
    swatch: {
      width: 72,
      height: 72,
      borderRadius: 22,
    },
    swatchCheck: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#2DD4BF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchName: { color: c.textSecondary, fontSize: 12, marginTop: 8 },
  });