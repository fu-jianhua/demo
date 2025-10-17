<template>
  <view class="app">
    <router-view />
  </view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch');
  // 初始化检查登录状态
  const token = uni.getStorageSync('token');
  if (token && getCurrentPages().length === 0) {
    uni.navigateTo({ url: '/pages/chat/chat' });
  } else if (!token && getCurrentPages().length === 0) {
    uni.navigateTo({ url: '/pages/login/login' });
  }
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style>
@font-face {
  font-family: 'iconfont';
  src: url('@/static/iconfont.ttf') format('truetype');
}
.iconfont{
  font-family: 'iconfont' !important;
}
.icon-copy::before{ content: '\e63d'; }
.icon-edit::before{ content: '\e606'; }
.icon-create::before{ content: '\e66c'; }
.icon-conversation::before{ content: '\e619'; }
	
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f7fa;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}
</style>
