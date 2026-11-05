/**
 * 全局主题色板定义（深色 / 亮色）
 * 语义化颜色令牌，供所有页面/组件按主题取用，保证亮色主题下的对比度与可读性。
 */

export type ThemeKind = 'light' | 'dark';

export interface ThemeColors {
  /** 主强调色（按钮、选中态、图标） */
  primary: string;
  /** 主色按钮上的文字/图标颜色 */
  onPrimary: string;
  /** 主色半透明底（选中、空态图标底、操作栏底） */
  primaryDim: string;
  /** 主色较强底（卡片艺术底） */
  primaryDimStrong: string;
  /** 危险色（删除） */
  danger: string;
  /** 危险色半透明底 */
  dangerDim: string;
  /** 页面根背景 */
  background: string;
  /** 表面（弹窗/卡片内容底） */
  surface: string;
  /** 底部弹出面板底 */
  sheet: string;
  /** 列表卡片底 */
  card: string;
  /** 卡片描边 */
  cardBorder: string;
  /** 分隔线 / 细线 */
  divider: string;
  /** 输入框底 */
  inputBg: string;
  /** 输入框文字 */
  inputText: string;
  /** 输入框占位文字 */
  placeholder: string;
  /** 一级文字 */
  textPrimary: string;
  /** 二级文字 */
  textSecondary: string;
  /** 三级文字 */
  textTertiary: string;
  /** 弱化文字 */
  textDim: string;
  /** 主图标 */
  iconPrimary: string;
  /** 激活态图标（主色系） */
  iconActive: string;
  /** 非激活图标 */
  iconInactive: string;
  /** 次级图标 */
  iconSub: string;
  /** 弹窗/下拉遮罩层 */
  mask: string;
  /** 下拉刷新指示色 */
  refreshTint: string;
  /** 滑块/指针圆点 */
  thumb: string;
  /** 滑块轨道 */
  trackTrack: string;
  /** 播放页强调高亮（循环/随机/波形） */
  badgeAccent: string;
  /** 状态栏文字：light=白字 light-content / dark=黑字 dark-content */
  statusBarStyle: 'light' | 'dark';
}

export const DARK: ThemeColors = {
  primary: '#8A63FF',
  onPrimary: '#0A0A0F',
  primaryDim: 'rgba(138,99,255,0.14)',
  primaryDimStrong: 'rgba(138,99,255,0.25)',
  danger: '#FF6B6B',
  dangerDim: 'rgba(255,107,107,0.12)',
  background: '#0A0A0F',
  surface: '#14141B',
  sheet: '#17141F',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputText: '#F5F5F7',
  placeholder: 'rgba(245,245,247,0.35)',
  textPrimary: '#F5F5F7',
  textSecondary: 'rgba(245,245,247,0.6)',
  textTertiary: 'rgba(245,245,247,0.4)',
  textDim: 'rgba(245,245,247,0.5)',
  iconPrimary: '#F5F5F7',
  iconActive: '#A78BFA',
  iconInactive: 'rgba(245,245,247,0.5)',
  iconSub: 'rgba(245,245,247,0.4)',
  mask: 'rgba(0,0,0,0.55)',
  refreshTint: '#8A63FF',
  thumb: '#FFFFFF',
  trackTrack: 'rgba(255,255,255,0.2)',
  badgeAccent: '#A78BFA',
  statusBarStyle: 'light',
};

export const LIGHT: ThemeColors = {
  primary: '#5B4DE0',
  onPrimary: '#FFFFFF',
  primaryDim: 'rgba(91,77,224,0.12)',
  primaryDimStrong: 'rgba(91,77,224,0.16)',
  danger: '#DC4C4C',
  dangerDim: 'rgba(220,76,76,0.1)',
  background: '#F4F4F8',
  surface: '#FFFFFF',
  sheet: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(17,17,24,0.08)',
  divider: 'rgba(17,17,24,0.08)',
  inputBg: 'rgba(17,17,24,0.06)',
  inputText: '#1C1C23',
  placeholder: 'rgba(28,28,35,0.35)',
  textPrimary: '#1C1C23',
  textSecondary: 'rgba(28,28,35,0.66)',
  textTertiary: 'rgba(28,28,35,0.42)',
  textDim: 'rgba(28,28,35,0.55)',
  iconPrimary: '#1C1C23',
  iconActive: '#5B4DE0',
  iconInactive: 'rgba(28,28,35,0.55)',
  iconSub: 'rgba(28,28,35,0.45)',
  mask: 'rgba(20,20,30,0.45)',
  refreshTint: '#5B4DE0',
  thumb: '#5B4DE0',
  trackTrack: 'rgba(20,20,30,0.16)',
  badgeAccent: '#5B4DE0',
  statusBarStyle: 'dark',
};