import { defineConfig, type UserConfigExport } from '@tarojs/cli'

export default defineConfig<Partial<UserConfigExport>>(() => ({
  projectName: 'last-health-miniapp',
  date: '2026-05-27',
  designWidth: 750,
  deviceRatio: {
    640: 2.34,
    750: 1,
    828: 1.81,
  },
  framework: 'react',
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-framework-react'],
  defineConstants: {},
  alias: {
    '@': 'src',
  },
  progress: false,
  mini: {},
  h5: {},
}))
