export default defineAppConfig({
  pages: ['pages/login', 'pages/register', 'pages/home', 'pages/diet', 'pages/plan', 'pages/body', 'pages/me'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'T11 健康管理',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#6b7280',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home', text: '首页' },
      { pagePath: 'pages/diet', text: '饮食' },
      { pagePath: 'pages/plan', text: '计划' },
      { pagePath: 'pages/body', text: '身体' },
      { pagePath: 'pages/me', text: '我的' },
    ],
  },
})
