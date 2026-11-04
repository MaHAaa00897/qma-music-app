import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Audio } from 'expo-av';
import { recordHistory } from '@/utils/api';
import type { Track } from '@/utils/api';

export type RepeatMode = 'off' | 'all' | 'one';

interface MusicPlayerContextValue {
  queue: Track[];
  currentIndex: number;
  current: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  playQueue: (tracks: Track[], index: number) => Promise<void>;
  removeTrackFromQueue: (trackId: string) => void;
  togglePlay: () => Promise<void>;
  next: () => void;
  prev: () => void;
  seekTo: (ms: number) => Promise<void>;
  setVolume: (v: number) => Promise<void>;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [shuffle, setShuffle] = useState(false);

  // 供异步状态回调读取最新的播放配置，避免闭包过期
  const playbackRef = useRef({ queue, currentIndex, repeatMode, shuffle });
  useEffect(() => {
    playbackRef.current = { queue, currentIndex, repeatMode, shuffle };
  }, [queue, currentIndex, repeatMode, shuffle]);

  const current = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true }).catch(
      () => undefined
    );
    return () => {
      soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  // 曲目播放结束时应触发的导航，通过 ref 避免与 loadAndPlay 的循环引用
  const finishRef = useRef<(() => void) | null>(null);

  const loadAndPlay = useCallback(async (uri: string, autoplay: boolean) => {
    setIsLoading(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: autoplay, isLooping: false, progressUpdateIntervalMillis: 500 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setPositionMs(status.positionMillis ?? 0);
        setDurationMs(status.durationMillis ?? 0);
        setIsPlaying(status.isPlaying ?? false);
        if (status.didJustFinish) {
          finishRef.current?.();
        }
      });
      soundRef.current = sound;
      setIsPlaying(autoplay);
    } catch (e) {
      console.error('加载音频失败', e);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 切换到指定曲目并播放
  const goTo = useCallback(
    async (tracks: Track[], index: number, autoplay: boolean) => {
      if (!tracks.length || index < 0 || index >= tracks.length) return;
      setQueue(tracks);
      setCurrentIndex(index);
      const track = tracks[index];
      await loadAndPlay(track.uri, autoplay);
      if (autoplay && track.id) {
        recordHistory(track.id).catch(() => undefined); // 异步记录播放历史，不影响播放
      }
    },
    [loadAndPlay]
  );

  // 曲目播放结束时的导航逻辑
  const handleFinish = useCallback(() => {
    const { queue: q, currentIndex: idx, repeatMode: rm, shuffle: sh } = playbackRef.current;
    if (!q.length) return;
    if (rm === 'one') {
      soundRef.current?.setPositionAsync(0).then(() => soundRef.current?.playAsync());
      return;
    }
    if (sh && q.length > 1) {
      let n = idx;
      while (n === idx) n = Math.floor(Math.random() * q.length);
      goTo(q, n, true);
      return;
    }
    if (idx < q.length - 1) {
      goTo(q, idx + 1, true);
    } else if (rm === 'all') {
      goTo(q, 0, true);
    } else {
      setPositionMs(0);
      setIsPlaying(false);
    }
  }, [goTo]);

  useEffect(() => {
    finishRef.current = handleFinish;
  }, [handleFinish]);

  const playQueue = useCallback(
    async (tracks: Track[], index: number) => {
      await goTo(tracks, index, true);
    },
    [goTo]
  );

  // 从当前队列中移除一首曲目（用于歌曲删除）：若删除的是正在播放的歌曲，则自动续播下一首，否则保持播放队列
  const removeTrackFromQueue = useCallback(
    (trackId: string) => {
      const { queue: q, currentIndex: idx } = playbackRef.current;
      if (!q.length || !q.some((t) => t.id === trackId)) return;
      const isCurrent = q[idx]?.id === trackId;
      const newQueue = q.filter((t) => t.id !== trackId);
      if (isCurrent) {
        if (newQueue.length) {
          const target = Math.min(idx, newQueue.length - 1);
          goTo(newQueue, target, true);
        } else {
          soundRef.current?.stopAsync().catch(() => undefined);
          soundRef.current?.unloadAsync().catch(() => undefined);
          soundRef.current = null;
          setQueue([]);
          setCurrentIndex(-1);
          setPositionMs(0);
          setDurationMs(0);
          setIsPlaying(false);
        }
      } else {
        setQueue(newQueue);
        if (idx > 0) {
          const removedBefore = q.slice(0, idx).filter((t) => t.id === trackId).length;
          if (removedBefore) setCurrentIndex(idx - removedBefore);
        }
      }
    },
    [goTo]
  );

  const togglePlay = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.positionMillis >= (status.durationMillis || 0)) {
        await sound.setPositionAsync(0);
      }
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('播放控制失败', e);
    }
  }, [isPlaying]);

  const next = useCallback(() => {
    const { queue: q, currentIndex: idx, repeatMode: rm, shuffle: sh } = playbackRef.current;
    if (!q.length) return;
    if (sh && q.length > 1) {
      let n = idx;
      while (n === idx) n = Math.floor(Math.random() * q.length);
      goTo(q, n, true);
      return;
    }
    if (idx < q.length - 1) {
      goTo(q, idx + 1, true);
    } else if (rm === 'all') {
      goTo(q, 0, true);
    }
  }, [goTo]);

  const prev = useCallback(() => {
    const { queue: q, currentIndex: idx, shuffle: sh } = playbackRef.current;
    if (!q.length) return;
    if (sh && q.length > 1) {
      let n = idx;
      while (n === idx) n = Math.floor(Math.random() * q.length);
      goTo(q, n, true);
      return;
    }
    if (idx > 0) {
      goTo(q, idx - 1, true);
    } else {
      soundRef.current?.setPositionAsync(0).then(() => soundRef.current?.playAsync());
    }
  }, [goTo]);

  const seekTo = useCallback(async (ms: number) => {
    setPositionMs(ms);
    try {
      await soundRef.current?.setPositionAsync(ms);
    } catch (e) {
      console.error('拖动进度失败', e);
    }
  }, []);

  const applyVolume = useCallback(async (v: number) => {
    setVolumeState(v);
    try {
      await soundRef.current?.setVolumeAsync(v);
    } catch (e) {
      console.error('调节音量失败', e);
    }
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
  }, []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      queue,
      currentIndex,
      current,
      isPlaying,
      isLoading,
      positionMs,
      durationMs,
      volume,
      repeatMode,
      shuffle,
      playQueue,
      removeTrackFromQueue,
      togglePlay,
      next,
      prev,
      seekTo,
      setVolume: applyVolume,
      cycleRepeat,
      toggleShuffle,
    }),
    [
      queue,
      currentIndex,
      current,
      isPlaying,
      isLoading,
      positionMs,
      durationMs,
      volume,
      repeatMode,
      shuffle,
      playQueue,
      removeTrackFromQueue,
      togglePlay,
      next,
      prev,
      seekTo,
      applyVolume,
      cycleRepeat,
      toggleShuffle,
    ]
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
};

export const useMusicPlayer = (): MusicPlayerContextValue => {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer 必须在 MusicPlayerProvider 内使用');
  return ctx;
};