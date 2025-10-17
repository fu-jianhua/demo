const baseUrl = 'http://127.0.0.1:8000/api';

// 添加一个变量标识是否正在刷新token，避免并发刷新
let isRefreshing = false;
// 存储等待刷新的请求队列
let requests = [];

export default function my_request(options) {
  return new Promise((resolve, reject) => {
    // 添加基础路径
    options.url = baseUrl + options.url;
    
    // 添加请求头
    options.header = {
      'Content-Type': 'application/json',
      ...options.header
    };
    
    // 判断是否需要跳过token（默认不跳过）
    const skipToken = options.skipToken || false;
    // 如果不需要跳过且有token，才添加到请求头
    if (!skipToken) {
      const token = uni.getStorageSync('token');
      console.log("token:", token);
      if (token) {
        options.header.Authorization = `Bearer ${token}`;
      }
    }
    
    // 保存原始请求的resolve和reject
    const originalRequest = { resolve, reject };
    
    uni.request(options).then(res => {
      // 直接使用res作为响应对象
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res.data);
      } else if (res.statusCode === 401) {
        // token失效，尝试刷新token
        handleTokenRefresh(options, originalRequest);
      } else {
        reject(new Error(`请求失败，状态码: ${res.statusCode}`));
      }
    }).catch(error => {
      reject(error);
    });
  });
}

// 处理token刷新逻辑
function handleTokenRefresh(options, originalRequest) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshToken().then(newToken => {
      // 刷新成功，更新存储的token
      uni.setStorageSync('token', newToken);
      // 重新设置请求头中的token
      options.header.Authorization = `Bearer ${newToken}`;
      // 重试队列中的所有请求
      requests.forEach(({ options, resolve, reject }) => {
        options.header.Authorization = `Bearer ${newToken}`;
        uni.request(options).then(res => {
          resolve(res.data);
        }).catch(err => {
          reject(err);
        });
      });
      // 清空队列
      requests = [];
      // 重试当前请求
      uni.request(options).then(res => {
        originalRequest.resolve(res.data);
      }).catch(err => {
        originalRequest.reject(err);
      }).finally(() => {
        isRefreshing = false;
      });
    }).catch(error => {
      // 刷新token失败，清空队列并跳转到登录页
      requests.forEach(({ reject }) => {
        reject(error);
      });
      requests = [];
      uni.showToast({ title: '登录已过期', icon: 'none' });
      uni.removeStorageSync('token');
      uni.removeStorageSync('conversations');
      uni.reLaunch({ url: '/pages/login/login' });
      originalRequest.reject(error);
      isRefreshing = false;
    });
  } else {
    // 如果正在刷新token，将请求加入队列等待
    requests.push(originalRequest);
  }
}

// 刷新token函数
function refreshToken() {
  const refreshToken = uni.getStorageSync('refreshToken');
  return new Promise((resolve, reject) => {
    uni.request({
      url: baseUrl + '/users/refresh/',
      method: 'POST',
      data: { refresh: refreshToken },
      header: { 'Content-Type': 'application/json' },
      // 刷新token的请求需要跳过token验证
      skipToken: true
    }).then(res => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("1111res1111:", res)
        console.log("res.data.access:", res.data.access)
        resolve(res.data.access);
      } else {
        reject(new Error('刷新token失败'));
      }
    }).catch(err => {
      reject(err);
    });
  });
}

export function streamRequest(url, data) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${uni.getStorageSync('token')}`);
    
    // 监听流式响应
    xhr.onprogress = function(e) {
      if (e.target.responseText) {
        // 解析SSE格式（data: ...\n\n）
        const chunks = e.target.responseText.split('\n\n').filter(c => c);
        const lastChunk = chunks[chunks.length - 1].replace('data: ', '');
        if (lastChunk) {
          resolve(JSON.parse(lastChunk));  // 实时返回解析后的片段
        }
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve({ done: true });
      } else {
        reject(new Error('请求失败'));
      }
    };
    
    xhr.send(JSON.stringify(data));
  });
}

