<template>
  <view class="reset-password-container">
    <view class="bg-decoration"></view>
    
    <view class="reset-password-box">
      <div class="logo">
        <view class="logo-icon">
          <image src="/static/logo-outline.ico" mode="aspectFit" class="logo-image"></image>
        </view>
        <h1>找回密码</h1>
        <p>重置您的账号密码，重新获取访问权限</p>
      </div>
      
      <form class="reset-password-form">
		<!-- 用户名 -->
		<view class="form-group">
		  <view class="input-wrapper" :class="{ 'input-error': usernameError }">
		    <text class="iconfont icon-user">用户名：</text>
		    <input 
		      type="text" 
		      v-model="form.username" 
		      placeholder="请输入用户名" 
		      required
		      autocomplete="username"
		      maxlength="20"
		      @input="validateUsername"
		      @blur="validateUsername"
		    />
		    <text v-if="!usernameError && form.username" class="input-status success">✓</text>
		  </view>
		  <view v-if="usernameError" class="error-message">{{ usernameError }}</view>
		</view>
		  
        <!-- 手机号输入 -->
        <view class="form-group">
          <view class="input-wrapper" :class="{ 'input-error': phoneError }">
            <text class="iconfont icon-phone">手机号：</text>
            <input 
              type="number" 
              v-model="form.phone" 
              placeholder="请输入手机号" 
              required
              autocomplete="tel"
              maxlength="11"
              @input="validatePhone"
              @blur="validatePhone"
            />
            <text v-if="!phoneError && form.phone && phoneRegex.test(form.phone)" class="input-status success">✓</text>
          </view>
          <view v-if="phoneError" class="error-message">{{ phoneError }}</view>
        </view>
        
        
        <!-- 新密码输入 -->
        <view class="form-group">
          <view class="input-wrapper" :class="{ 'input-error': passwordError && form.confirmPassword }">
            <text class="iconfont icon-lock">新密码：</text>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.newPassword" 
              placeholder="请设置新密码（至少6位）" 
              required
              autocomplete="new-password"
              maxlength="20"
              @input="validatePassword"
            />
            <text 
              class="toggle-pwd" 
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </text>
          </view>
        </view>
        
        <!-- 确认新密码输入 -->
        <view class="form-group">
          <view class="input-wrapper" :class="{ 'input-error': passwordError && form.confirmPassword }">
            <text class="iconfont icon-lock">确认密码：</text>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.confirmPassword" 
              placeholder="请确认新密码" 
              required
              maxlength="20"
              @input="validatePassword"
            />
          </view>
          <view v-if="passwordError" class="error-message">{{ passwordError }}</view>
        </view>
        
        <!-- 提交按钮 -->
        <button 
          type="submit" 
          class="reset-btn"
          :loading="loading"
          :disabled="loading || !isFormValid"
		  @click="handleResetPassword"
        >
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
        
        <!-- 登录链接 -->
        <view class="login-link">
          想起密码了? 
          <navigator url="/pages/login/login" class="link">立即登录</navigator>
        </view>
      </form>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import my_request from '@/utils/request';

// 表单数据
const form = ref({
  username: '',
  phone: '',
  newPassword: '',
  confirmPassword: ''
});

// 状态管理
const showPassword = ref(false);
const loading = ref(false);
const phoneError = ref('');
const passwordError = ref('');
const usernameError = ref('');

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

// 计算属性：表单是否有效
const isFormValid = computed(() => {
  return form.value.username && 
         form.value.phone && 
         form.value.newPassword && 
         form.value.confirmPassword &&
         !phoneError.value &&
         !passwordError.value &&
         !usernameError.value;
});

// 用户名验证
const validateUsername = () => {
  if (!form.value.username) {
    usernameError.value = '请输入用户名';
    return false;
  }
  
  usernameError.value = '';
  return true;
};

// 手机号验证
const validatePhone = () => {
  if (!form.value.phone) {
    phoneError.value = '请输入手机号';
    return false;
  }
  
  if (!phoneRegex.test(form.value.phone)) {
    phoneError.value = '请输入有效的手机号';
    return false;
  }
  
  phoneError.value = '';
  return true;
};

// 密码验证
const validatePassword = () => {
  if (!form.value.newPassword) {
    passwordError.value = '';
    return false;
  }
  
  if (form.value.newPassword.length < 6) {
    passwordError.value = '密码长度至少6位';
    return false;
  }
  
  if (form.value.confirmPassword && form.value.newPassword !== form.value.confirmPassword) {
    passwordError.value = '两次输入的密码不一致';
    return false;
  }
  
  passwordError.value = '';
  return true;
};

// 监听密码变化
watch(() => form.value.confirmPassword, (newVal) => {
  if (newVal && form.value.newPassword !== newVal) {
    passwordError.value = '两次输入的密码不一致';
  } else if (newVal && form.value.newPassword === newVal) {
    passwordError.value = '';
  }
});

// 监听手机号变化
watch(() => form.value.phone, (newVal) => {
  validatePhone();
});

// 监听用户名变化
watch(() => form.value.username, (newVal) => {
  if (newVal) {
    validateUsername();
  }
});

// 处理密码重置
const handleResetPassword = async () => {
  // 表单验证
  if (!validateUsername()) return;
  if (!validatePhone()) return;
  if (!validatePassword()) return;
  
  loading.value = true;
  
  try {
	console.log("form.value.username", form.value.username, form.value.phone, form.value.newPassword)
    const response = await my_request({
      url: '/users/password-reset/',
      method: 'POST',
      data: {
        username: form.value.username,
        phone_number: form.value.phone, 
        new_password: form.value.newPassword
      },
	  skipToken: true 
    });
    
    uni.showToast({ title: response.msg || '密码重置成功', icon: 'success' });
    
    // 重置成功后跳转到登录页
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/login' });
    }, 1500);
  } catch (error) {
    console.error('密码重置失败', error);
    uni.showToast({ 
      title: error.response?.data?.message || error.response?.data?.msg || '重置失败，请稍后重试', 
      icon: 'none' 
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-container {
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
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  z-index: -1;
  opacity: 0.1;
}

.reset-password-box {
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

.logo h1 {
  font-size: 36rpx;
  color: #333;
  margin-bottom: 10rpx;
  font-weight: 600;
}

.logo p {
  font-size: 26rpx;
  color: #999;
}

.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.form-group {
  width: 100%;
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
  border-color: #84fab0;
  box-shadow: 0 0 0 2px rgba(132, 250, 176, 0.2);
}

.input-wrapper.input-error {
  border-color: #ff4d4f;
}

.iconfont {
  color: #999;
  font-size: 30rpx;
  margin-right: 20rpx;
}

input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
}

input::placeholder {
  color: #ccc;
}

.toggle-pwd {
  color: #999;
  font-size: 30rpx;
  cursor: pointer;
}

.input-status {
  position: absolute;
  right: 20rpx;
  font-size: 28rpx;
}

.success {
  color: #52c41a;
}

.error-message {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 10rpx;
  display: block;
  padding-left: 20rpx;
}

.reset-btn {
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

.reset-btn:disabled {
  background: #eee;
  color: #999;
  cursor: not-allowed;
}

.reset-btn:not(:disabled):hover {
  opacity: 0.9;
  transform: translateY(-2rpx);
}

.reset-btn:not(:disabled):active {
  transform: translateY(0);
}

.login-link {
  text-align: center;
  font-size: 26rpx;
  color: #666;
  margin-top: 40rpx;
}

.link {
  color: #84fab0;
  text-decoration: none;
  margin-left: 5rpx;
}
</style>