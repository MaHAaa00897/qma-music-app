import React, { useCallback, useMemo, useState } from 'react';
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
import { fetchPlaylistTracks, removeTrackFromPlaylist, type Track } from '@/utils/api';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useTheme, type ThemeColors } from '@/contexts/ThemeModeContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function PlaylistDetailScreen() {
  const { id, name } = useSafeSearchParams<{ id: string; name: string }>();
  const router = useSafeRouter();
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);

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
    <Screen backgroundColor={colors.background} statusBarStyle={colors.statusBarStyle} safeAreaEdges={['top', 'left', 'right']}>
      <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
      <View style={s.topBar}>
        <TouchableOpacity style={s.roundBtn} onPress={() => router.back()}>
          <FontAwesome6 name="chevron-left" size={18} color={colors.iconPrimary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={s.topTitle}>
          {name || '播放列表'}
        </Text>
        <View style={s.roundBtn} />
      </View>

      <View style={s.playHeader}>
        <Text style={s.title}>{name || '播放列表'}</Text>
        <Text style={s.count}>{tracks.length} 首歌曲</Text>
        <TouchableOpacity
          style={s.playAll}
          onPress={() => {
            if (tracks.length) playQueue(tracks, 0);
          }}
        >
          <FontAwesome6 name="play" size={14} color={colors.onPrimary} />
          <Text style={s.playAllText}>播放全部</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.refreshTint} size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>歌单还没有歌曲</Text>
          <Text style={s.emptyDesc}>回到音乐库，长按歌曲添加到歌单</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SongRow
              track={item}
              onPress={handlePlay}
              highlight={current?.id === item.id}
              renderTrailing={() => (
                <TouchableOpacity onPress={() => handleRemove(item)} style={s.removeBtn}>
                  <FontAwesome6 name="minus" size={14} color={colors.iconSub} />
                </TouchableOpacity>
              )}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider }} />}
        />
      )}
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 12,
    },
    playHeader: { paddingHorizontal: 20, paddingVertical: 14 },
    title: { color: c.textPrimary, fontSize: 26, fontWeight: '800' },
    count: { color: c.textDim, fontSize: 13, marginTop: 6 },
    playAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primary,
      alignSelf: 'flex-start',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 14,
      marginTop: 14,
    },
    playAllText: { color: c.onPrimary, fontSize: 14, fontWeight: '700' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
    emptyDesc: { color: c.textDim, fontSize: 14, marginTop: 6 },
    listContent: { paddingHorizontal: 20, paddingBottom: 24 },
    removeBtn: { padding: 8 },
  });