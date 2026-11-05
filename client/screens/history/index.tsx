import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { SongRow } from '@/components/player/SongRow';
import { fetchHistory, type Track } from '@/utils/api';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useTheme, type ThemeColors } from '@/contexts/ThemeModeContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);

  const [history, setHistory] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { playQueue, current } = useMusicPlayer();

  const load = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (e) {
      console.error('加载播放历史失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePlay = useCallback(
    (track: Track) => {
      const index = history.findIndex((t) => t.id === track.id);
      playQueue(history, index >= 0 ? index : 0);
    },
    [history, playQueue]
  );

  return (
    <Screen backgroundColor={colors.background} statusBarStyle={colors.statusBarStyle}>
      <View style={s.header}>
        <Text style={s.brand}>播放历史</Text>
        <Text style={s.subtitle}>最近听过的曲目</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.refreshTint} size="large" />
        </View>
      ) : history.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <FontAwesome6 name="clock-rotate-left" size={28} color={colors.primary} />
          </View>
          <Text style={s.emptyTitle}>暂无播放记录</Text>
          <Text style={s.emptyDesc}>播放过的歌曲会出现在这里</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.refreshTint} />
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SongRow track={item} onPress={handlePlay} highlight={current?.id === item.id} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
        />
      )}

      <MiniPlayer />
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    brand: { color: c.textPrimary, fontSize: 28, fontWeight: '800' },
    subtitle: { color: c.textDim, fontSize: 13, marginTop: 4 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: c.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: { color: c.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 },
    emptyDesc: { color: c.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21 },
    listContent: { paddingHorizontal: 20, paddingBottom: 12 },
    sep: { height: 1, backgroundColor: c.divider, marginLeft: 64 },
  });