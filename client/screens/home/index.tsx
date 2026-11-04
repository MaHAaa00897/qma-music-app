import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { ImportButton } from '@/components/player/ImportButton';
import { SongRow } from '@/components/player/SongRow';
import { deleteTrack, fetchTracks, type Track } from '@/utils/api';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { playQueue, current, removeTrackFromQueue } = useMusicPlayer();

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

  const confirmDelete = useCallback(
    (track: Track) => {
      if (deleting) return;
      Alert.alert('删除歌曲', `确定删除《${track.title}》吗？\n该歌曲将从音乐库、歌单与播放历史中移除。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setDeleting(true);
            deleteTrack(track.id)
              .then(() => {
                setTracks((prev) => prev.filter((t) => t.id !== track.id));
                removeTrackFromQueue(track.id); // 若正在播放该曲目则自动续播/停止
              })
              .catch((e) => Alert.alert('删除失败', (e as Error).message))
              .finally(() => setDeleting(false));
          },
        },
      ]);
    },
    [deleting, removeTrackFromQueue]
  );

  const renderTrailing = useCallback(
    (track: Track) => (
      <TouchableOpacity
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={(e) => {
          e.stopPropagation();
          confirmDelete(track);
        }}
      >
        <View style={styles.deleteWrap}>
          <FontAwesome6 name="trash-can" size={14} color="rgba(245,245,247,0.4)" />
        </View>
      </TouchableOpacity>
    ),
    [confirmDelete]
  );

  const renderItem = useCallback(
    ({ item }: { item: Track }) => {
      const isCurrent = current?.id === item.id;
      return (
        <SongRow
          track={item}
          onPress={handlePlay}
          highlight={isCurrent}
          renderTrailing={renderTrailing}
        />
      );
    },
    [handlePlay, current, renderTrailing]
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
          renderItem={renderItem}
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
  deleteWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});