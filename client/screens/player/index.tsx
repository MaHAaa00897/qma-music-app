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
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { trackTint } from '@/components/player/SongRow';
import { coverForTitle, formatDuration } from '@/utils/format';
import { FontAwesome6 } from '@expo/vector-icons';

interface BgTheme {
  name: string;
  colors: [string, string, string];
}

const BG_THEMES: BgTheme[] = [
  { name: '午夜紫', colors: ['#241245', '#3A1C71', '#0A0A0F'] },
  { name: '极光青', colors: ['#062A3A', '#0E5F6E', '#0A0A0F'] },
  { name: '烈焰橙', colors: ['#3A0B0B', '#B45309', '#140805'] },
  { name: '深海蓝', colors: ['#0A1533', '#1E3A8A', '#060B1A'] },
  { name: '霓虹粉', colors: ['#3A0E2E', '#9D174D', '#14050E'] },
  { name: '翡翠绿', colors: ['#042F2E', '#0F766E', '#04100F'] },
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
  const [dragMs, setDragMs] = useState<number | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [spin] = useState(() => new Animated.Value(0));
  const [themeIdx, setThemeIdx] = useState(0);
  const [themeVisible, setThemeVisible] = useState(false);

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
  const tint = current ? trackTint(current) : '#8A63FF';
  const bgTheme = BG_THEMES[themeIdx];

  const repeatIcon = useMemo(() => {
    if (repeatMode === 'one') {
      return (
        <View style={styles.modeBtn}>
          <FontAwesome6 name="repeat" size={18} color="#A78BFA" />
          <Text style={[styles.modeBadge, { color: '#A78BFA' }]}>1</Text>
        </View>
      );
    }
    return (
      <View style={styles.modeBtn}>
        <FontAwesome6 name="repeat" size={18} color={repeatMode === 'all' ? '#A78BFA' : 'rgba(245,245,247,0.5)'} />
      </View>
    );
  }, [repeatMode]);

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* 动态背景：主题色渐变 + 封面模糊 + 暗化 */}
        <LinearGradient colors={bgTheme.colors} style={styles.backdrop} />
        {cover ? (
          <Image source={{ uri: cover }} style={[styles.backdrop, styles.backdropImage]} blurRadius={78} />
        ) : null}
        <View style={styles.backdropDim} />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.5)', 'rgba(10,10,15,0.94)']}
          style={styles.backdropGradient}
        />

        {/* 顶部栏 */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
            <FontAwesome6 name="chevron-down" size={18} color="#F5F5F7" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>正在播放</Text>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => setThemeVisible(true)}>
              <FontAwesome6 name="palette" size={17} color="#F5F5F7" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn} onPress={() => setShowQueue((s) => !s)}>
              <FontAwesome6 name="list-ul" size={17} color={showQueue ? '#A78BFA' : '#F5F5F7'} />
            </TouchableOpacity>
          </View>
        </View>

        {!current ? (
          <View style={styles.noCurrent}>
            <Text style={styles.noCurrentText}>还没有选择歌曲</Text>
            <Text style={styles.noCurrentHint}>返回音乐库选择一首歌开始播放</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* 封面 */}
            <View style={styles.coverArea}>
              <Animated.View style={[styles.coverWrap, { transform: [{ rotate }], borderColor: `${tint}55` }]}>
                <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
              </Animated.View>
            </View>

            {/* 曲目信息 */}
            <View style={styles.infoArea}>
              <Text numberOfLines={1} style={styles.title}>
                {current.title}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {current.artist}
              </Text>
            </View>

            {/* 波形可视化 + 进度 */}
            <EqualizerBars playing={isPlaying} color="#A78BFA" barCount={24} />
            <Slider
              style={styles.progress}
              minimumValue={0}
              maximumValue={maxMs}
              value={Math.min(shownPos, maxMs)}
              onSlidingStart={() => setDragMs(positionMs)}
              onValueChange={(v) => setDragMs(v)}
              onSlidingComplete={(v) => {
                seekTo(Math.round(v));
                setDragMs(null);
              }}
              minimumTrackTintColor="#A78BFA"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#fff"
            />
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatDuration(shownPos)}</Text>
              <Text style={styles.time}>{formatDuration(durationMs)}</Text>
            </View>

            {/* 主控制 */}
            <View style={styles.controls}>
              <TouchableOpacity style={styles.modeBtn} onPress={toggleShuffle}>
                <FontAwesome6
                  name="shuffle"
                  size={18}
                  color={shuffle ? '#A78BFA' : 'rgba(245,245,247,0.5)'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bigBtn} onPress={prev}>
                <FontAwesome6 name="backward-step" size={26} color="#F5F5F7" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: tint }]}
                onPress={togglePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesome6 name="circle-notch" size={30} color="#fff" />
                ) : (
                  <FontAwesome6 name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.bigBtn} onPress={next}>
                <FontAwesome6 name="forward-step" size={26} color="#F5F5F7" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cycleRepeat}>{repeatIcon}</TouchableOpacity>
            </View>

            {/* 音量 */}
            <View style={styles.volumeRow}>
              <FontAwesome6 name="volume-low" size={16} color="rgba(245,245,247,0.6)" />
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="#A78BFA"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#fff"
              />
              <FontAwesome6 name="volume-high" size={16} color="rgba(245,245,247,0.6)" />
            </View>

            {/* 播放队列 */}
            {showQueue && (
              <View style={styles.queue}>
                <Text style={styles.queueTitle}>播放队列</Text>
                {queue.map((t, i) => (
                  <View key={t.id} style={styles.queueItem}>
                    <Text style={styles.queueIndex}>{i + 1}</Text>
                    <Text numberOfLines={1} style={styles.queueName}>
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
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback onPress={() => undefined}>
                <View style={styles.sheet}>
                  <Text style={styles.sheetTitle}>选择背景色</Text>
                  <View style={styles.swatchRow}>
                    {BG_THEMES.map((t, i) => (
                      <TouchableOpacity
                        key={t.name}
                        style={styles.swatchWrap}
                        onPress={() => {
                          setThemeIdx(i);
                          setThemeVisible(false);
                        }}
                      >
                        <View style={styles.swatchInner}>
                          <LinearGradient colors={t.colors} style={styles.swatch} />
                          {themeIdx === i ? (
                            <View style={styles.swatchCheck}>
                              <FontAwesome6 name="check" size={14} color="#ffffff" />
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.swatchName}>{t.name}</Text>
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

const styles = StyleSheet.create({
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
  backdropImage: { opacity: 0.5 },
  backdropDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,5,10,0.6)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { color: '#F5F5F7', fontSize: 15, fontWeight: '600' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noCurrent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noCurrentText: { color: '#F5F5F7', fontSize: 18, fontWeight: '700' },
  noCurrentHint: { color: 'rgba(245,245,247,0.5)', fontSize: 14, marginTop: 8 },
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
  title: { color: '#F5F5F7', fontSize: 24, fontWeight: '800' },
  artist: { color: 'rgba(245,245,247,0.6)', fontSize: 15, marginTop: 8 },
  progress: { width: '100%', height: 36, marginTop: 8 },
  timeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  time: { color: 'rgba(245,245,247,0.55)', fontSize: 12, fontVariant: ['tabular-nums'] },
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
  queueTitle: { color: 'rgba(245,245,247,0.6)', fontSize: 13, marginBottom: 10 },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  queueIndex: {
    width: 20,
    color: 'rgba(245,245,247,0.4)',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  queueName: { color: 'rgba(245,245,247,0.85)', fontSize: 14, flex: 1 },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#181420',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: '#F5F5F7',
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
  swatchName: { color: 'rgba(245,245,247,0.65)', fontSize: 12, marginTop: 8 },
});