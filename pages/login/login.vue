<template>
  <view class="login-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration"></view>
    
    <view class="login-box">
      <div class="logo">
        <view class="logo-icon">
          <image src="/static/logo-outline.ico" mode="aspectFit" class="logo-image"></image>
        </view>
        <h1>智能客服系统</h1>
        <p>高效沟通，智能服务</p>
      </div>
      
      <form class="login-form">
        <view class="form-group">
          <view class="input-wrapper">
            <text class="iconfont icon-user">用户名:</text>
            <input 
              type="text" 
              v-model="form.username" 
              placeholder="请输入用户名" 
              required
              autocomplete="username"
            />
          </view>
        </view>
        
        <view class="form-group">
          <view class="input-wrapper">       
            <text class="iconfont icon-lock">密  码:</text>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码" 
              required
              autocomplete="current-password"
            />
            <text 
              class="toggle-pwd" 
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </text>
          </view>
        </view>
        
        <view class="form-actions">
          <label class="remember-me">
            <checkbox 
              :checked="rememberMe" 
              @click="rememberMe = !rememberMe" 
              color="#4facfe"
            />
            <span>记住我</span>
          </label>
          <navigator url="/pages/forgot-password/forgot-password" class="forgot-pwd">忘记密码?</navigator>
        </view>
        
        <button 
          type="submit" 
          class="login-btn"
          :loading="loading"
          :disabled="loading"
		  @click="handleLogin"
        >
          登录
        </button>
        
        <view class="register-link">
          还没有账号? 
          <navigator url="/pages/register/register" class="link">立即注册</navigator>
        </view>
      </form>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import my_request from '@/utils/request'

const router = useRouter();
const form = ref({
  username: '',
  password: ''
});
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);

// 页面加载时检查是否有保存的登录信息
onMounted(() => {
  checkRememberedUser();
});

// 检查本地存储的记住的用户信息
const checkRememberedUser = () => {
  try {
    const rememberedUser = uni.getStorageSync('rememberedUser');
    if (rememberedUser) {
      form.value.username = rememberedUser.username;
      // 注意：为了安全，通常不建议存储密码
      // form.value.password = rememberedUser.password;
      rememberMe.value = true;
    }
  } catch (e) {
    console.error('读取存储的用户信息失败', e);
  }
};

// 保存用户信息到本地存储
const saveUserInfo = () => {
  if (rememberMe.value) {
    try {
      uni.setStorageSync('rememberedUser', {
        username: form.value.username,
        // 注意：实际项目中不建议存储密码，这里只是示例
        // password: form.value.password
      });
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
  } else {
    // 如果不记住，清除存储的信息
    try {
      uni.removeStorageSync('rememberedUser');
    } catch (e) {
      console.error('清除用户信息失败', e);
    }
  }
};

// 清除记住的用户信息
const clearRememberedUser = () => {
  try {
    uni.removeStorageSync('rememberedUser');
  } catch (e) {
    console.error('清除用户信息失败', e);
  }
};

const handleLogin = async () => {
  if (loading.value) return;
  
  // 表单验证
  if (!form.value.username.trim() || !form.value.password.trim()) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none'
    });
    return;
  }
  
  loading.value = true;
  try {
    const data = await my_request({
      url: '/users/login/',
      method: 'POST',
      data: { 
        username: form.value.username, 
		password: form.value.password 
      },
	  skipToken: true 
    });
    
    // 保存token
    uni.setStorageSync('token', data.access);
	uni.setStorageSync('refreshToken', data.refresh);
    
    // 根据"记住我"状态处理用户信息存储
    if (rememberMe.value) {
      saveUserInfo();
    } else {
      clearRememberedUser();
    }
    
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    });
    
    // 跳转到聊天页面
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/chat/chat' });
    }, 1500);
    
  } catch (err) {
    console.error('登录失败', err);
    uni.showToast({
      title: err.response?.data?.msg || '登录失败，请检查用户名和密码',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.login-container {
  min-height: 100vh;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  z-index: -1;
  opacity: 0.1;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 30rpx;
}

.logo-icon .iconfont {
  font-size: 60rpx;
  color: #fff;
}

.logo h1 {
  font-size: 36rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.logo p {
  font-size: 24rpx;
  color: #999;
}

.form-group {
  margin-bottom: 30rpx;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  height: 80rpx;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #4facfe;
  box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2);
}

.input-wrapper .iconfont {
  color: #999;
  font-size: 30rpx;
  margin-right: 20rpx;
}

.input-wrapper input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333;
  border: none;
  outline: none;
}

.input-wrapper input::placeholder {
  color: #ccc;
}

.toggle-pwd {
  color: #999;
  font-size: 30rpx;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  font-size: 26rpx;
}

.remember-me {
  display: flex;
  align-items: center;
  color: #666;
}

.remember-me checkbox {
  margin-right: 10rpx;
  transform: scale(0.8);
}

.forgot-pwd {
  color: #4facfe;
  text-decoration: none;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 30rpx;
  font-weight: 500;
  margin-bottom: 30rpx;
  transition: all 0.3s ease;
}

.login-btn:hover {
  opacity: 0.9;
  transform: translateY(-2rpx);
}

.login-btn:active {
  transform: translateY(0);
}

.register-link {
  text-align: center;
  font-size: 26rpx;
  color: #666;
}

.register-link .link {
  color: #4facfe;
  text-decoration: none;
  margin-left: 5rpx;
}
</style>