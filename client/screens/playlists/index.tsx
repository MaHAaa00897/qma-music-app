import React, { useCallback, useMemo, useState } from 'react';
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
import { useTheme, type ThemeColors } from '@/contexts/ThemeModeContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function PlaylistsScreen() {
  const router = useSafeRouter();
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);

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
    <Screen backgroundColor={colors.background} statusBarStyle={colors.statusBarStyle}>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>播放列表</Text>
          <Text style={s.subtitle}>创建并管理你的歌单</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} style={s.addButton} onPress={openCreate}>
          <FontAwesome6 name="plus" size={16} color={colors.onPrimary} />
          <Text style={s.addButtonText}>新建</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.refreshTint} size="large" />
        </View>
      ) : playlists.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <FontAwesome6 name="list-ul" size={28} color={colors.primary} />
          </View>
          <Text style={s.emptyTitle}>还没有播放列表</Text>
          <Text style={s.emptyDesc}>点击右上角「新建」，创建一个专属歌单</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={s.card}
              onPress={() => router.push('/playlist-detail', { id: item.id, name: item.name })}
            >
              <View style={s.cardArt}>
                <FontAwesome6 name="music" size={20} color={colors.onPrimary} />
              </View>
              <View style={s.cardInfo}>
                <Text numberOfLines={1} style={s.cardName}>
                  {item.name}
                </Text>
                <Text style={s.cardCount}>{item.track_count} 首歌曲</Text>
              </View>
              <TouchableOpacity onPress={() => openRename(item)} style={s.iconBtn}>
                <FontAwesome6 name="pen" size={15} color={colors.iconSub} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={s.iconBtn}>
                <FontAwesome6 name="trash-can" size={15} color={colors.iconSub} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      <MiniPlayer />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>{editing ? '重命名播放列表' : '新建播放列表'}</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="请输入名称"
                placeholderTextColor={colors.placeholder}
                autoFocus
              />
              <View style={s.modalFooter}>
                <TouchableOpacity style={[s.btn, s.cancel]} onPress={() => setModalVisible(false)}>
                  <Text style={s.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.submit]} onPress={handleSave}>
                  <Text style={s.submitText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    brand: { color: c.textPrimary, fontSize: 28, fontWeight: '800' },
    subtitle: { color: c.textDim, fontSize: 13, marginTop: 4 },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
    },
    addButtonText: { color: c.onPrimary, fontSize: 14, fontWeight: '700' },
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
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      gap: 14,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    cardArt: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: c.primaryDimStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardName: { color: c.textPrimary, fontSize: 16, fontWeight: '600' },
    cardCount: { color: c.textDim, fontSize: 13, marginTop: 3 },
    iconBtn: { padding: 8 },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: c.mask,
    },
    modalContent: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 14 },
    input: {
      backgroundColor: c.inputBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.inputText,
      fontSize: 15,
    },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 18 },
    btn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14 },
    cancel: { backgroundColor: c.inputBg },
    cancelText: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    submit: { backgroundColor: c.primary },
    submitText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  });