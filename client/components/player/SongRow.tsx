import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import type { Track } from '@/utils/api';
import { coverForTitle, formatDuration, hashString } from '@/utils/format';
import { FontAwesome6 } from '@expo/vector-icons';

interface SongRowProps {
  track: Track;
  onPress?: (track: Track) => void;
  onLongPress?: (track: Track) => void;
  highlight?: boolean;
  renderTrailing?: (track: Track) => React.ReactNode;
}

// 根据曲目标题派生一个封面主色，用于占位底色（当天未指定封面时避免空白）
export function trackTint(track: Track): string {
  const palettes = [
    '#5B4ADE', '#0E9F8A', '#E0488E', '#D97706', '#0E9F9F', '#7C3AED', '#DC2626', '#0EA5E9',
  ];
  return palettes[hashString(track.title) % palettes.length];
}

export function SongRow({ track, onPress, onLongPress, highlight, renderTrailing }: SongRowProps) {
  const { current } = useMusicPlayer();
  const isCurrent = current?.id === track.id;
  const cover = track.cover_url || coverForTitle(track.title, track.artist);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(track)}
      onLongPress={() => onLongPress?.(track)}
      delayLongPress={350}
      style={styles.row}
    >
      <View style={[styles.coverWrap, { backgroundColor: trackTint(track) }]}>
        {isCurrent && (
          <View style={styles.playingBadge}>
            <View style={[styles.bar, styles.b1]} />
            <View style={[styles.bar, styles.b2]} />
            <View style={[styles.bar, styles.b3]} />
          </View>
        )}
        <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
      </View>
      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[styles.title, (highlight || isCurrent) && styles.titleActive]}
        >
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {track.artist}
        </Text>
      </View>
      {renderTrailing ? (
        renderTrailing(track)
      ) : (
        <View style={styles.meta}>
          <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
          {isCurrent && <FontAwesome6 name="play" size={12} color="#8A63FF" />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  coverWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  playingBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: 'rgba(10,10,15,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
  },
  bar: { width: 3, borderRadius: 2, backgroundColor: '#fff' },
  b1: { height: 8 },
  b2: { height: 13 },
  b3: { height: 6 },
  info: { flex: 1 },
  title: {
    color: 'rgba(245,245,247,0.92)',
    fontSize: 15,
    fontWeight: '600',
  },
  titleActive: { color: '#A78BFA' },
  artist: { color: 'rgba(245,245,247,0.5)', fontSize: 13, marginTop: 3 },
  meta: { alignItems: 'flex-end', gap: 4 },
  duration: { color: 'rgba(245,245,247,0.45)', fontSize: 12 },
});