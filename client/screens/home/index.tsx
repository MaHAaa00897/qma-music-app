import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { ImportButton } from '@/components/player/ImportButton';
import { SongRow } from '@/components/player/SongRow';
import { fetchTracks, type Track } from '@/utils/api';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { playQueue, current } = useMusicPlayer();

  const load = useCallback(async () => {
    try {
      const data = await fetchTracks();
      setTracks(data);
    } catch (e) {
      console.error('加载音乐库失败', e);
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
      const index = tracks.findIndex((t) => t.id === track.id);
      playQueue(tracks, index >= 0 ? index : 0);
    },
    [tracks, playQueue]
  );

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Q马音乐</Text>
          <Text style={styles.subtitle}>我的音乐库</Text>
        </View>
        <ImportButton onImported={load} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#8A63FF" size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <FontAwesome6 name="music" size={28} color="#8A63FF" />
          </View>
          <Text style={styles.emptyTitle}>还没有音乐</Text>
          <Text style={styles.emptyDesc}>点击右上角「导入音乐」，从本地选择音频文件开始你的音乐之旅</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A63FF" />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SongRow
              track={item}
              onPress={handlePlay}
              highlight={current?.id === item.id}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <MiniPlayer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  brand: { color: '#F5F5F7', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: 'rgba(245,245,247,0.5)', fontSize: 13, marginTop: 4 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(138,99,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: '#F5F5F7', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyDesc: {
    color: 'rgba(245,245,247,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 64 },
});