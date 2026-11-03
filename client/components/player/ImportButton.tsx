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
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { FontAwesome6 } from '@expo/vector-icons';

interface ImportButtonProps {
  onImported?: () => void;
  style?: object;
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

export function ImportButton({ onImported, style }: ImportButtonProps) {
  const { playQueue } = useMusicPlayer();
  const [modalVisible, setModalVisible] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<{ uri: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');

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

  const handleSave = async () => {
    if (!asset) return;
    const name = title.trim() || fileTitleFromName(asset.name);
    const art = artist.trim() || '未知艺术家';
    setSaving(true);
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
      onImported?.();
    } catch (e) {
      Alert.alert('导入失败', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.button, style]}
        onPress={pickFile}
        disabled={picking}
      >
        {picking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <FontAwesome6 name="plus" size={16} color="#fff" />
        )}
        <Text style={styles.buttonText}>导入音乐</Text>
      </TouchableOpacity>

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
});