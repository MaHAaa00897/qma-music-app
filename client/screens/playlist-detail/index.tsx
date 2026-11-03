import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SongRow } from '@/components/player/SongRow';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import {
  fetchPlaylistTracks,
  removeTrackFromPlaylist,
  type Track,
} from '@/utils/api';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function PlaylistDetailScreen() {
  const { id, name } = useSafeSearchParams<{ id: string; name: string }>();
  const router = useSafeRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playQueue, current } = useMusicPlayer();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchPlaylistTracks(id);
      setTracks(data);
    } catch (e) {
      console.error('加载播放列表详情失败', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePlay = useCallback(
    (track: Track) => {
      const index = tracks.findIndex((t) => t.id === track.id);
      playQueue(tracks, index >= 0 ? index : 0);
    },
    [tracks, playQueue]
  );

  const handleRemove = (track: Track) => {
    if (!id) return;
    Alert.alert('移出播放列表', `确定将「${track.title}」移出该歌单吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '移出',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTrackFromPlaylist(id, track.id);
            load();
          } catch (e) {
            Alert.alert('操作失败', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
          <FontAwesome6 name="chevron-left" size={18} color="#F5F5F7" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.topTitle}>
          {name || '播放列表'}
        </Text>
        <View style={styles.roundBtn} />
      </View>

      <View style={styles.playHeader}>
        <Text style={styles.title}>{name || '播放列表'}</Text>
        <Text style={styles.count}>{tracks.length} 首歌曲</Text>
        <TouchableOpacity
          style={styles.playAll}
          onPress={() => {
            if (tracks.length) playQueue(tracks, 0);
          }}
        >
          <FontAwesome6 name="play" size={14} color="#fff" />
          <Text style={styles.playAllText}>播放全部</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#8A63FF" size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>歌单还没有歌曲</Text>
          <Text style={styles.emptyDesc}>回到音乐库，长按歌曲添加到歌单</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SongRow
              track={item}
              onPress={handlePlay}
              highlight={current?.id === item.id}
              renderTrailing={() => (
                <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeBtn}>
                  <FontAwesome6 name="minus" size={14} color="rgba(245,245,247,0.5)" />
                </TouchableOpacity>
              )}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#F5F5F7',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  playHeader: { paddingHorizontal: 20, paddingVertical: 14 },
  title: { color: '#F5F5F7', fontSize: 26, fontWeight: '800' },
  count: { color: 'rgba(245,245,247,0.5)', fontSize: 13, marginTop: 6 },
  playAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6D5CE8',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
  },
  playAllText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#F5F5F7', fontSize: 16, fontWeight: '700' },
  emptyDesc: { color: 'rgba(245,245,247,0.5)', fontSize: 14, marginTop: 6 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  removeBtn: { padding: 8 },
});