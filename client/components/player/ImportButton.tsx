import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { createTrack } from '@/utils/api';
import { coverForTitle, fileTitleFromName } from '@/utils/format';
import { FontAwesome6 } from '@expo/vector-icons';

interface ImportButtonProps {
  onImported?: () => void;
  style?: object;
}

interface Picked {
  uri: string;
  name: string;
}

// 读取本地音频时长（仅用于导入展示，不申请权限）
async function readDuration(uri: string): Promise<number> {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const status = await sound.getStatusAsync();
    const d = status.isLoaded ? status.durationMillis : 0;
    await sound.unloadAsync();
    return d || 0;
  } catch {
    return 0;
  }
}

// Web 端：通过 <input webkitdirectory> 选择整个文件夹，收集其中的音频文件
function pickFolderWeb(): Promise<Picked[]> {
  const g = globalThis as any;
  return new Promise((resolve) => {
    const input = g.document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('multiple', '');
    input.addEventListener('cancel', () => resolve([]));
    input.onchange = (e: any) => {
      const files: File[] = Array.from(e.target?.files || []);
      const items: Picked[] = files.map((f) => ({
        uri: g.URL.createObjectURL(f),
        name: f.name || '未命名曲目',
      }));
      resolve(items);
    };
    input.click();
  });
}

// 批量获取音频文件：Native 端多选，Web 端按文件夹获取
async function pickMany(): Promise<Picked[]> {
  if (Platform.OS === 'web') return pickFolderWeb();
  const res = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
    multiple: true,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return [];
  return res.assets.map((a) => ({ uri: a.uri, name: a.name || '未命名曲目' }));
}

export function ImportButton({ onImported, style }: ImportButtonProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [picking, setPicking] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState('');
  const [asset, setAsset] = useState<Picked | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');

  // 单个文件导入（经过编辑弹窗，可命名）
  const pickFile = async () => {
    setPicking(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        const name = a.name || '未命名曲目';
        setAsset({ uri: a.uri, name });
        setTitle(fileTitleFromName(name));
        setArtist('');
        setModalVisible(true);
      }
    } catch (e) {
      console.error('选择文件失败', e);
    } finally {
      setPicking(false);
    }
  };

  // 批量导入（多选文件 / 文件夹），自动命名写入
  const importBatch = async (items: Picked[]) => {
    if (!items.length) return;
    setSaving(true);
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      setSavingText(`正在导入 ${i + 1}/${items.length} 首…`);
      const it = items[i];
      try {
        const duration = await readDuration(it.uri);
        const name = fileTitleFromName(it.name);
        await createTrack({
          title: name,
          artist: '未知艺术家',
          duration_ms: duration,
          cover_url: coverForTitle(name, '未知艺术家'),
          uri: it.uri,
        });
        count++;
      } catch (e) {
        console.error('导入单曲失败', it.name, e);
      }
    }
    setSaving(false);
    if (count === 0) {
      Alert.alert('导入失败', '未能导入任何音频文件，请检查文件格式');
    } else if (count === items.length) {
      Alert.alert('导入完成', `成功导入 ${count} 首歌曲`);
    } else {
      Alert.alert('部分导入', `成功导入 ${count} / ${items.length} 首歌曲`);
    }
    onImported?.();
  };

  const handleBatchImport = async () => {
    setMenuVisible(false);
    setPicking(true);
    try {
      const items = await pickMany();
      if (items.length) await importBatch(items);
    } catch (e) {
      console.error('批量导入失败', e);
      Alert.alert('导入失败', (e as Error).message);
    } finally {
      setPicking(false);
    }
  };

  const handleSave = async () => {
    if (!asset) return;
    const name = title.trim() || fileTitleFromName(asset.name);
    const art = artist.trim() || '未知艺术家';
    setSaving(true);
    setSavingText('正在导入…');
    try {
      const duration = await readDuration(asset.uri);
      const cover = coverForTitle(name, art);
      await createTrack({
        title: name,
        artist: art,
        duration_ms: duration,
        cover_url: cover,
        uri: asset.uri,
      });
      setModalVisible(false);
      setAsset(null);
      Alert.alert('导入成功', `《${name}》已加入音乐库`);
      onImported?.();
    } catch (e) {
      Alert.alert('导入失败', (e as Error).message);
    } finally {
      setSaving(false);
      setSavingText('');
    }
  };

  const handleMenuFile = () => {
    setMenuVisible(false);
    pickFile();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.button, style]}
        onPress={() => setMenuVisible(true)}
        disabled={picking}
      >
        {picking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <FontAwesome6 name="plus" size={16} color="#fff" />
        )}
        <Text style={styles.buttonText}>导入音乐</Text>
      </TouchableOpacity>

      {/* 导入方式选择 */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBackdrop}>
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>导入音乐</Text>
              <TouchableOpacity style={styles.menuRow} onPress={handleMenuFile}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(138,99,255,0.16)' }]}>
                  <FontAwesome6 name="file-audio" size={18} color="#A78BFA" />
                </View>
                <View style={styles.menuRowText}>
                  <Text style={styles.menuRowTitle}>选择音频文件</Text>
                  <Text style={styles.menuRowDesc}>可自定义曲名与歌手后导入</Text>
                </View>
                <FontAwesome6 name="chevron-right" size={14} color="rgba(245,245,247,0.4)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuRow} onPress={handleBatchImport}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(14,159,138,0.16)' }]}>
                  <FontAwesome6 name="folder-open" size={18} color="#2DD4BF" />
                </View>
                <View style={styles.menuRowText}>
                  <Text style={styles.menuRowTitle}>从文件夹 / 批量导入</Text>
                  <Text style={styles.menuRowDesc}>
                    {Platform.OS === 'web' ? '选择整个文件夹，自动导入全部音频' : '一次选择多个音频文件批量导入'}
                  </Text>
                </View>
                <FontAwesome6 name="chevron-right" size={14} color="rgba(245,245,247,0.4)" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 单个文件编辑弹窗 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>导入曲目</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={18} color="rgba(245,245,247,0.7)" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.fileName}>{asset?.name}</Text>
                  <Text style={styles.label}>曲名</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="请输入曲名"
                    placeholderTextColor="rgba(245,245,247,0.35)"
                  />
                  <Text style={styles.label}>歌手</Text>
                  <TextInput
                    style={styles.input}
                    value={artist}
                    onChangeText={setArtist}
                    placeholder="请输入歌手（可选）"
                    placeholderTextColor="rgba(245,245,247,0.35)"
                  />
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>保存并导入</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 批量导入进度遮罩 */}
      <Modal visible={saving && !modalVisible} transparent animationType="fade">
        <View style={styles.progressBackdrop}>
          <View style={styles.progressCard}>
            <ActivityIndicator color="#8A63FF" size="large" />
            <Text style={styles.progressText}>{savingText}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6D5CE8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  menuCard: {
    backgroundColor: '#14141B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  menuTitle: { color: '#F5F5F7', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: { flex: 1 },
  menuRowTitle: { color: '#F5F5F7', fontSize: 15, fontWeight: '600' },
  menuRowDesc: { color: 'rgba(245,245,247,0.5)', fontSize: 12, marginTop: 3 },
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { color: '#F5F5F7', fontSize: 18, fontWeight: '700' },
  modalBody: { marginTop: 12, maxHeight: 320 },
  fileName: { color: 'rgba(245,245,247,0.45)', fontSize: 13, marginBottom: 14 },
  label: { color: 'rgba(245,245,247,0.6)', fontSize: 12, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F5F5F7',
    fontSize: 15,
  },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 18 },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  cancelButton: { backgroundColor: 'rgba(255,255,255,0.08)' },
  cancelButtonText: { color: 'rgba(245,245,247,0.7)', fontSize: 15, fontWeight: '600' },
  submitButton: { backgroundColor: '#6D5CE8' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  progressBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressCard: {
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#14141B',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
  },
  progressText: { color: 'rgba(245,245,247,0.8)', fontSize: 14 },
});