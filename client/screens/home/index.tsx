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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { ImportButton } from '@/components/player/ImportButton';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import { SongRow } from '@/components/player/SongRow';
import {
  addTrackToPlaylist,
  createPlaylist,
  deleteTrack,
  fetchPlaylists,
  fetchPlaylistTracks,
  fetchTracks,
  type Playlist,
  type Track,
} from '@/utils/api';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 多选状态
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batching, setBatching] = useState(false);
  // 添加到歌单面板
  const [pickerVisible, setPickerVisible] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newListName, setNewListName] = useState('');

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

  // ---- 多选相关 ----
  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const enterSelection = useCallback((track: Track) => {
    setSelectionMode(true);
    setSelectedIds([track.id]);
  }, []);

  const toggleSelect = useCallback((track: Track) => {
    setSelectedIds((prev) => {
      if (prev.includes(track.id)) {
        const next = prev.filter((id) => id !== track.id);
        if (next.length === 0) setSelectionMode(false);
        return next;
      }
      return [...prev, track.id];
    });
  }, []);

  // 删除单曲
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

  // 批量删除
  const confirmBatchDelete = useCallback(() => {
    if (batching || selectedIds.length === 0) return;
    Alert.alert(
      '删除歌曲',
      `确定删除选中的 ${selectedIds.length} 首歌曲吗？\n它们将从音乐库、歌单与播放历史中移除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setBatching(true);
            try {
              for (const id of selectedIds) {
                await deleteTrack(id);
                removeTrackFromQueue(id);
              }
              setTracks((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
              exitSelection();
            } catch (e) {
              Alert.alert('删除失败', (e as Error).message);
            } finally {
              setBatching(false);
            }
          },
        },
      ]
    );
  }, [batching, selectedIds, exitSelection, removeTrackFromQueue]);

  // 打开“添加到歌单”面板
  const openPicker = useCallback(() => {
    fetchPlaylists()
      .then((list) => setPlaylists(list))
      .catch(() => setPlaylists([]));
    setNewListName('');
    setPickerVisible(true);
  }, []);

  // 批量添加选中的歌曲到指定歌单（自动去重）
  const addSelectedTo = useCallback(
    async (playlistId: string) => {
      if (selectedIds.length === 0) return;
      try {
        const existing = await fetchPlaylistTracks(playlistId);
        const existingIds = new Set(existing.map((t) => t.id));
        const toAdd = selectedIds.filter((id) => !existingIds.has(id));
        for (const id of toAdd) {
          await addTrackToPlaylist(playlistId, id);
        }
        setPickerVisible(false);
        Alert.alert(
          '已加入歌单',
          `共添加 ${toAdd.length} 首${toAdd.length === selectedIds.length ? '' : `（${selectedIds.length - toAdd.length} 首已存在）`}`
        );
        exitSelection();
      } catch (e) {
        Alert.alert('操作失败', (e as Error).message);
      }
    },
    [selectedIds, exitSelection]
  );

  // 新建歌单并加入
  const createAndAdd = useCallback(async () => {
    const name = newListName.trim();
    if (!name) {
      Alert.alert('请先输入歌单名称');
      return;
    }
    try {
      const pl = await createPlaylist(name);
      await addSelectedTo(pl.id);
    } catch (e) {
      Alert.alert('创建失败', (e as Error).message);
    }
  }, [newListName, addSelectedTo]);

  // 渲染列表行尾控件：多选时显示勾选框，单选时显示删除按钮
  const renderTrailing = useCallback(
    (track: Track) => {
      if (selectionMode) {
        const sel = selectedIds.includes(track.id);
        return (
          <View style={[styles.selectDot, sel && styles.selectDotOn]}>
            {sel && <FontAwesome6 name="check" size={12} color="#fff" />}
          </View>
        );
      }
      return (
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
      );
    },
    [selectionMode, selectedIds, confirmDelete]
  );

  const renderItem = useCallback(
    ({ item }: { item: Track }) => {
      const isCurrent = current?.id === item.id;
      return (
        <SongRow
          track={item}
          onPress={selectionMode ? () => toggleSelect(item) : handlePlay}
          onLongPress={enterSelection}
          highlight={isCurrent}
          renderTrailing={renderTrailing}
        />
      );
    },
    [handlePlay, current, renderTrailing, selectionMode, toggleSelect, enterSelection]
  );

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Q马音乐</Text>
          <Text style={styles.subtitle}>{selectionMode ? '选择要管理的歌曲' : '我的音乐库'}</Text>
        </View>
        {!selectionMode ? (
          <View style={styles.headerActions}>
            <ThemeModeToggle />
            <ImportButton onImported={load} />
          </View>
        ) : (
          <TouchableOpacity onPress={exitSelection} style={styles.headerClose}>
            <FontAwesome6 name="xmark" size={18} color="rgba(245,245,247,0.85)" />
          </TouchableOpacity>
        )}
      </View>

      {/* 多选操作栏 */}
      {selectionMode && (
        <View style={styles.selBar}>
          <Text style={styles.selCount}>已选 {selectedIds.length} 首</Text>
          <View style={styles.selActions}>
            <TouchableOpacity
              style={[styles.selBtn, styles.selBtnAdd]}
              disabled={selectedIds.length === 0}
              onPress={openPicker}
            >
              <FontAwesome6 name="plus" size={12} color="#0A0A0F" />
              <Text style={styles.selBtnAddText}>加入歌单</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selBtn, styles.selBtnDel]}
              disabled={selectedIds.length === 0 || batching}
              onPress={confirmBatchDelete}
            >
              <FontAwesome6 name="trash-can" size={12} color="#FF6B6B" />
              <Text style={styles.selBtnDelText}>{batching ? '删除中…' : '删除'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

      {/* 添加到歌单面板 */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setPickerVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>添加到歌单</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome6 name="xmark" size={16} color="rgba(245,245,247,0.6)" />
              </TouchableOpacity>
            </View>

            <View style={styles.createRow}>
              <TextInput
                style={styles.createInput}
                placeholder="新建歌单名称…"
                placeholderTextColor="rgba(245,245,247,0.35)"
                value={newListName}
                onChangeText={setNewListName}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.createBtn} onPress={createAndAdd}>
                <Text style={styles.createBtnText}>新建并添加</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>还没有歌单，请在「歌单」页创建或直接在上方新建</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickRow} onPress={() => addSelectedTo(item.id)}>
                  <View style={styles.pickIcon}>
                    <FontAwesome6 name="list-ul" size={15} color="#8A63FF" />
                  </View>
                  <Text style={styles.pickName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <FontAwesome6 name="chevron-right" size={13} color="rgba(245,245,247,0.35)" />
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#F5F5F7', fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: 'rgba(245,245,247,0.5)', fontSize: 13, marginTop: 4 },
  // 多选操作栏
  selBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(138,99,255,0.14)',
  },
  selCount: { color: '#E9E4FF', fontSize: 13, fontWeight: '600' },
  selActions: { flexDirection: 'row', gap: 8 },
  selBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  selBtnAdd: { backgroundColor: '#8A63FF' },
  selBtnAddText: { color: '#0A0A0F', fontSize: 12, fontWeight: '700' },
  selBtnDel: { backgroundColor: 'rgba(255,107,107,0.12)' },
  selBtnDelText: { color: '#FF6B6B', fontSize: 12, fontWeight: '700' },
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
  // 多选勾选指示
  selectDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(245,245,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDotOn: { backgroundColor: '#8A63FF', borderColor: '#8A63FF' },
  // 歌单面板
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalMask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: '#17141F',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: { color: '#F5F5F7', fontSize: 16, fontWeight: '700' },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  createInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F5F5F7',
    fontSize: 14,
  },
  createBtn: {
    backgroundColor: '#8A63FF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  createBtnText: { color: '#0A0A0F', fontSize: 13, fontWeight: '700' },
  pickerList: { marginTop: 4 },
  pickerEmpty: { color: 'rgba(245,245,247,0.4)', fontSize: 13, textAlign: 'center', marginVertical: 18 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  pickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(138,99,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickName: { flex: 1, color: '#F5F5F7', fontSize: 15, fontWeight: '600' },
});