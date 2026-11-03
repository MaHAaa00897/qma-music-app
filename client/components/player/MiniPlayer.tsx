import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { trackTint } from './SongRow';
import { coverForTitle } from '@/utils/format';
import { EqualizerBars } from './EqualizerBars';
import { FontAwesome6 } from '@expo/vector-icons';

export function MiniPlayer() {
  const { current, isPlaying, togglePlay, next } = useMusicPlayer();
  const router = useSafeRouter();

  if (!current) return null;

  const cover = current.cover_url || coverForTitle(current.title, current.artist);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.8} style={styles.inner} onPress={() => router.push('/player')}>
        <View style={[styles.coverWrap, { backgroundColor: trackTint(current) }]}>
          <Image source={{ uri: cover }} style={styles.cover} />
        </View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>
            {current.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {current.artist}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.control}>
        <EqualizerBars playing={isPlaying} color="#A78BFA" barCount={10} />
        <TouchableOpacity onPress={() => togglePlay()} style={styles.btn}>
          <FontAwesome6 name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.btn}>
          <FontAwesome6 name="forward-step" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  coverWrap: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden' },
  cover: { width: '100%', height: '100%' },
  info: { flex: 1 },
  title: { color: '#F5F5F7', fontSize: 14, fontWeight: '600' },
  artist: { color: 'rgba(245,245,247,0.55)', fontSize: 12, marginTop: 2 },
  control: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { padding: 6 },
});