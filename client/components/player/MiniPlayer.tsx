import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useTheme, type ThemeColors } from '@/contexts/ThemeModeContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { trackTint } from './SongRow';
import { coverForTitle } from '@/utils/format';
import { EqualizerBars } from './EqualizerBars';
import { FontAwesome6 } from '@expo/vector-icons';

export function MiniPlayer() {
  const { current, isPlaying, togglePlay, next } = useMusicPlayer();
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const c = useMemo(() => {
    const tint = trackTint(current ?? ({} as any));
    return { button: tint, bars: '#A78BFA' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);
  const router = useSafeRouter();

  if (!current) return null;

  const cover = current.cover_url || coverForTitle(current.title, current.artist);

  return (
    <View style={s.wrap}>
      <TouchableOpacity activeOpacity={0.8} style={s.inner} onPress={() => router.push('/player')}>
        <View style={[s.coverWrap, { backgroundColor: trackTint(current) }]}>
          <Image source={{ uri: cover }} style={s.cover} />
        </View>
        <View style={s.info}>
          <Text numberOfLines={1} style={s.title}>
            {current.title}
          </Text>
          <Text numberOfLines={1} style={s.artist}>
            {current.artist}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={s.control}>
        <EqualizerBars playing={isPlaying} color={c.bars} barCount={10} />
        <TouchableOpacity onPress={() => togglePlay()} style={s.btn}>
          <FontAwesome6 name={isPlaying ? 'pause' : 'play'} size={20} color={c.button} />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={s.btn}>
          <FontAwesome6 name="forward-step" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      marginHorizontal: 12,
      marginBottom: 8,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inner: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    coverWrap: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden' },
    cover: { width: '100%', height: '100%' },
    info: { flex: 1 },
    title: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    artist: { color: c.textDim, fontSize: 12, marginTop: 2 },
    control: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    btn: { padding: 6 },
  });