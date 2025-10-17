<template>
  <view class="register-container">
    <view class="bg-decoration"></view>
    
    <view class="register-box">
      <div class="logo">
        <view class="logo-icon">
          <image src="/static/logo-outline.ico" mode="aspectFit" class="logo-image"></image>
        </view>
        <h1>账号注册</h1>
        <p>创建账号，开始使用智能客服</p>
      </div>
      
      <form class="register-form">
        <view class="form-group">
          <view class="input-wrapper">
            <text class="iconfont icon-user">用户名：</text>
            <input 
              type="text" 
              v-model="form.username" 
              placeholder="请设置用户名" 
              required
              autocomplete="username"
              maxlength="20"
            />
          </view>
        </view>
        
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
        
        <view class="form-group">
          <view class="input-wrapper" :class="{ 'input-error': passwordError && form.confirmPassword }">
            <text class="iconfont icon-lock">密码：</text>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请设置密码（至少6位）" 
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
        
        <view class="form-group">
          <view class="input-wrapper" :class="{ 'input-error': passwordError && form.confirmPassword }">
            <text class="iconfont icon-lock">确认密码：</text>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.confirmPassword" 
              placeholder="请确认密码" 
              required
              maxlength="20"
              @input="validatePassword"
            />
          </view>
          <view v-if="passwordError" class="error-message">{{ passwordError }}</view>
        </view>
        
        <!-- 数值计算验证码 -->
        <view class="form-group">
          <view class="captcha-container" :class="{ 'input-error': captchaError && form.captcha }">
            <view class="captcha-display">
              <text class="captcha-question">验证码：{{ captchaQuestion }}</text>
              <text class="captcha-equals">= ?</text>
            </view>
            <view class="input-wrapper">
              <text class="iconfont icon-shield">计算结果：</text>
              <input 
                type="number" 
                v-model="form.captcha" 
                placeholder="请输入计算结果" 
                required
                @input="validateCaptcha"
                @blur="validateCaptcha"
              />
              <button 
                type="button" 
                class="refresh-captcha-btn"
                @click="generateCaptcha"
              >
                刷新
              </button>
            </view>
          </view>
          <view v-if="captchaError" class="error-message">{{ captchaError }}</view>
        </view>
        
        <button 
          type="submit" 
          class="register-btn"
          :loading="loading"          
		  @click="handleRegister"
        >
          {{ loading ? '注册中...' : '注册账号' }}
        </button>
        
        <view class="login-link">
          已有账号? 
          <navigator url="/pages/login/login" class="link">立即登录</navigator>
        </view>
      </form>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import my_request from '@/utils/request'

const form = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  captcha: ''
});
const showPassword = ref(false);
const loading = ref(false);
const passwordError = ref('');
const phoneError = ref('');
const captchaError = ref('');
// 验证码相关
const captchaQuestion = ref('');
const captchaAnswer = ref(0);

// 手机号验证正则表达式
const phoneRegex = /^1[3-9]\d{9}$/;

// 计算属性：表单是否有效
const isFormValid = computed(() => {
  return form.value.username && 
         form.value.phone && 
         form.value.password && 
         form.value.confirmPassword && 
         form.value.captcha &&
         !phoneError.value &&
         !passwordError.value &&
         !captchaError.value;
});

// 生成验证码问题
const generateCaptcha = () => {
  const operators = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1, num2;
  
  // 根据运算符生成不同范围的数字
  switch(operator) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1; // 1-50
      num2 = Math.floor(Math.random() * 50) + 1; // 1-50
      captchaAnswer.value = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 20; // 20-70
      num2 = Math.floor(Math.random() * 20) + 1;  // 1-20
      captchaAnswer.value = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 9) + 1;   // 1-9
      num2 = Math.floor(Math.random() * 9) + 1;   // 1-9
      captchaAnswer.value = num1 * num2;
      break;
  }
  
  captchaQuestion.value = `${num1} ${operator} ${num2}`;
  // 清空验证码输入和错误
  form.value.captcha = '';
  captchaError.value = '';
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
  if (!form.value.password) {
    passwordError.value = '';
    return false;
  }
  
  if (form.value.password.length < 6) {
    passwordError.value = '密码长度至少6位';
    return false;
  }
  
  if (form.value.confirmPassword && form.value.password !== form.value.confirmPassword) {
    passwordError.value = '两次输入的密码不一致';
    return false;
  }
  
  passwordError.value = '';
  return true;
};

// 验证码验证
const validateCaptcha = () => {
  if (!form.value.captcha) {
    captchaError.value = '请输入验证码';
    return false;
  }
  
  if (parseInt(form.value.captcha) !== captchaAnswer.value) {
    captchaError.value = '验证码错误';
    return false;
  }
  
  captchaError.value = '';
  return true;
};

// 监听密码变化，进行验证
watch(() => form.value.confirmPassword, (newVal) => {
  if (newVal && form.value.password !== newVal) {
    passwordError.value = '两次输入的密码不一致';
  } else if (newVal && form.value.password === newVal) {
    passwordError.value = '';
  }
});

// 监听手机号变化，进行验证
watch(() => form.value.phone, (newVal) => {
  if (newVal && !phoneRegex.test(newVal)) {
    phoneError.value = '请输入有效的手机号';
  } else if (newVal) {
    phoneError.value = '';
  }
});

// 页面加载时生成验证码
onMounted(() => {
  generateCaptcha();
});

const handleRegister = async () => {
  // 表单验证
  if (!form.value.username) {
    return uni.showToast({ title: '请设置用户名', icon: 'none' });
  }
  
  // 手机号验证
  if (!validatePhone()) {
    return;
  }
  
  if (!form.value.password || form.value.password.length < 6) {
    return uni.showToast({ title: '密码长度至少6位', icon: 'none' });
  }
  
  if (!validatePassword()) {
    return;
  }
  
  // 验证码验证
  if (!validateCaptcha()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await my_request({
          url: '/users/register/',
          method: 'POST',
          data: {
            username: form.value.username,
            password: form.value.password,
            phone_number: form.value.phone  // 注意参数名修改
          },
		  skipToken: true 
        });
    
    // 实际项目中这里应该是真实的注册接口调用
    uni.showToast({ title: response.msg || '注册成功', icon: 'success' });
    
    // 注册成功后跳转到登录页
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/login' });
    }, 1500);
  } catch (error) {
    console.error('注册失败', error);
    uni.showToast({ title: error.response?.data?.msg || '注册失败，请稍后重试',  icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
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

.register-box {
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
  border-color: #84fab0;
  box-shadow: 0 0 0 2px rgba(132, 250, 176, 0.2);
}

.input-wrapper.input-error {
  border-color: #ff4d4f;
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

.captcha-container {
  border: 1px solid #eee;
  border-radius: 8rpx;
  overflow: hidden;
}

.captcha-container.input-error {
  border-color: #ff4d4f;
}

.captcha-display {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.captcha-question {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.captcha-equals {
  font-size: 32rpx;
  color: #666;
  margin-left: 10rpx;
}

.refresh-captcha-btn {
  width: 25%;
  height: 60rpx;
  line-height: 60rpx;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6rpx;
  font-size: 24rpx;
  padding: 0;
  margin: 0;
}

.input-status {
  position: absolute;
  right: 20rpx;
  font-size: 28rpx;
}

.input-status.success {
  color: #52c41a;
}

.agreement {
  font-size: 24rpx;
  color: #666;
  margin: 20rpx 0 40rpx;
  line-height: 1.5;
}

.agreement input {
  width: 24rpx;
  height: 24rpx;
  margin-right: 10rpx;
  vertical-align: middle;
}

.agreement-link {
  color: #84fab0;
  text-decoration: none;
  margin: 0 5rpx;
}

.register-btn {
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

.register-btn:disabled {
  background: #eee;
  color: #999;
  cursor: not-allowed;
}

.register-btn:not(:disabled):hover {
  opacity: 0.9;
  transform: translateY(-2rpx);
}

.register-btn:not(:disabled):active {
  transform: translateY(0);
}

.login-link {
  text-align: center;
  font-size: 26rpx;
  color: #666;
}

.login-link .link {
  color: #84fab0;
  text-decoration: none;
  margin-left: 5rpx;
}

.error-message {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 10rpx;
  display: block;
}
</style>