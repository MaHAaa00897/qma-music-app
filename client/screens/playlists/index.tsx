import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import {
  fetchPlaylists,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  type Playlist,
} from '@/utils/api';
import { FontAwesome6 } from '@expo/vector-icons';

export default function PlaylistsScreen() {
  const router = useSafeRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchPlaylists();
      setPlaylists(data);
    } catch (e) {
      console.error('加载播放列表失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setModalVisible(true);
  };

  const openRename = (p: Playlist) => {
    setEditing(p);
    setName(p.name);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const val = name.trim();
    if (!val) {
      Alert.alert('提示', '请输入播放列表名称');
      return;
    }
    try {
      if (editing) {
        await renamePlaylist(editing.id, val);
      } else {
        await createPlaylist(val);
      }
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('操作失败', (e as Error).message);
    }
  };

  const handleDelete = (p: Playlist) => {
    Alert.alert('删除播放列表', `确定删除「${p.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlaylist(p.id);
            load();
          } catch (e) {
            Alert.alert('删除失败', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>播放列表</Text>
          <Text style={styles.subtitle}>创建并管理你的歌单</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} style={styles.addButton} onPress={openCreate}>
          <FontAwesome6 name="plus" size={16} color="#fff" />
          <Text style={styles.addButtonText}>新建</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#8A63FF" size="large" />
        </View>
      ) : playlists.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <FontAwesome6 name="list-ul" size={28} color="#8A63FF" />
          </View>
          <Text style={styles.emptyTitle}>还没有播放列表</Text>
          <Text style={styles.emptyDesc}>点击右上角「新建」，创建一个专属歌单</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.card}
              onPress={() => router.push('/playlist-detail', { id: item.id, name: item.name })}
            >
              <View style={styles.cardArt}>
                <FontAwesome6 name="music" size={20} color="#fff" />
              </View>
              <View style={styles.cardInfo}>
                <Text numberOfLines={1} style={styles.cardName}>
                  {item.name}
                </Text>
                <Text style={styles.cardCount}>{item.track_count} 首歌曲</Text>
              </View>
              <TouchableOpacity onPress={() => openRename(item)} style={styles.iconBtn}>
                <FontAwesome6 name="pen" size={15} color="rgba(245,245,247,0.5)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                <FontAwesome6 name="trash-can" size={15} color="rgba(245,245,247,0.5)" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      <MiniPlayer />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editing ? '重命名播放列表' : '新建播放列表'}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="请输入名称"
                placeholderTextColor="rgba(245,245,247,0.35)"
                autoFocus
              />
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.submit]} onPress={handleSave}>
                  <Text style={styles.submitText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
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
  brand: { color: '#F5F5F7', fontSize: 28, fontWeight: '800' },
  subtitle: { color: 'rgba(245,245,247,0.5)', fontSize: 13, marginTop: 4 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6D5CE8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  emptyDesc: { color: 'rgba(245,245,247,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardArt: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(138,99,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { color: '#F5F5F7', fontSize: 16, fontWeight: '600' },
  cardCount: { color: 'rgba(245,245,247,0.5)', fontSize: 13, marginTop: 3 },
  iconBtn: { padding: 8 },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#14141B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: { color: '#F5F5F7', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F5F5F7',
    fontSize: 15,
  },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 18 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14 },
  cancel: { backgroundColor: 'rgba(255,255,255,0.08)' },
  cancelText: { color: 'rgba(245,245,247,0.7)', fontSize: 15, fontWeight: '600' },
  submit: { backgroundColor: '#6D5CE8' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});