<template>
  <view id="chatContainer" class="chat-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left">
        <button 
          class="menu-btn" 
          @click="toggleSidebar"
        >
          <text class="iconfont icon-menu"></text>
        </button>
      </view>
      <view class="nav-title">智能客服</view>
      <view class="nav-right">
        <button 
          class="report-btn" 
          @click="navigateToReports"
		  title="报告中心"
        >
          <image src="/static/report.png" mode="widthFix"></image>
        </button>
        <button 
          class="user-btn" 
          @click="showUserMenu = !showUserMenu"
		  title="用户菜单"
        >
          <image src="/static/user-avatar.png" mode="widthFix"></image>
        </button>
      </view>
      
      <!-- 用户菜单 -->
      <view 
        class="user-menu" 
        v-if="showUserMenu"
        @click="showUserMenu = false"
      >
        <!-- <view class="menu-item" @click="showUserInfo">
          <text class="iconfont icon-user"></text>
          <span>个人信息</span>
        </view> -->
        <view class="menu-item" @click="handleLogout">
          <text class="iconfont icon-sign-out"></text>
          <span>退出登录</span>
        </view>
      </view>
    </view>
    
    <view class="chat-content">
      <!-- 侧边栏会话列表 - 只在有会话时显示 -->
      <view 
        class="sidebar"
        :class="{ 
          'sidebar-show': sidebarVisible,
          'has-conversations': hasConversations 
        }"
        v-if="hasConversations"
      >
        <!-- ✅ 新建对话按钮（独立一行） -->
        <view class="new-chat-row" @click="startNewChat">
          <text class="iconfont icon-create"></text>
          <text class="new-chat-text">新建对话</text>
        </view>
        
        <!-- ✅ 历史会话标题 -->
        <view class="sidebar-section-title">历史会话</view>
        
        <view class="conversation-list">
          <view 
            class="conversation-item"
            :class="{ 'active': currentConversationId === conv.id }"
            v-for="conv in conversations"
            :key="conv.id"
            @click="switchConversation(conv.id)"
          >
            <view class="conv-avatar">
              <text class="iconfont icon-conversation"></text>
            </view>
            <view class="conv-info">
              <view class="conv-title">{{ conv.title }}</view>
              <view class="conv-last-message">
                <text 
                  class="sender"
                  v-if="conv.lastMessage && conv.lastMessage.sender === 'user'"
                >我: </text>
                {{ conv.lastMessage && conv.lastMessage.content 
                  ? (conv.lastMessage.content.length > 20 
                    ? conv.lastMessage.content.slice(0, 20) + '...' 
                    : conv.lastMessage.content)
                  : '新对话' }}
              </view>
            </view>
            <view class="conv-time">
              <text v-if="conv.lastMessage">{{ formatTime(conv.lastMessage.time) }}</text>
              <view 
                class="unread-count"
                v-if="conv.unreadCount > 0"
              >
                {{ conv.unreadCount }}
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 主聊天区域 -->
      <view class="main-chat-area" :class="{ 'has-sidebar': hasConversations }">
        <!-- 聊天消息区域 -->
        <view class="message-container" ref="messageContainer" :class="{ 'has-messages': hasMessages }">
          <!-- 欢迎消息 - 只在没有消息时显示 -->
          <view class="welcome-container" v-if="!hasMessages">
            <view class="welcome-message">
              <view class="welcome-icon">
                <image src="/static/logo-outline.ico" mode="aspectFit" class="logo-image"></image>
              </view>
              <h3>欢迎使用智能客服</h3>
              <p>有什么问题可以随时问我，我会尽力为您解答</p>
            </view>

            <!-- 移植的居中输入区域 -->
            <view>
              <view class="empty-center">
                <view class="tool-list">
                  <view
                    v-for="tool in tools"
                    :key="tool.key"
                    :class="['tool-btn', { active: tool.key === selectedTool }]"
                    @click="selectTool(tool.key)"
                  >{{ tool.label }}</view>
                </view>
                <view class="composer">
                  <textarea 
                    class="input-textarea" 
                    v-model.trim="draft" 
                    placeholder="有什么我能帮忙的吗？" 
                    @confirm="handleSend"
                    :style="{ height: textareaHeight }"
                    @input="autoResizeTextarea"
                    @keydown="handleKeydown"
                    :show-confirm-bar="false"
                    :adjust-position="false"
                    :maxlength="1000"
                    auto-height
                  />
                  <button class="send" :disabled="!canSend" @click="handleSend">发送</button>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 消息列表 -->
          <view 
            class="message-item"
            :class="msg.sender === 'user' ? 'user-message' : 'robot-message'"
            v-for="(msg, index) in messages"
            :key="index"
          >
            <view class="message-avatar">
              <image 
                src="/static/user-avatar.png" 
                mode="widthFix"
                v-if="msg.sender === 'user'"
              ></image>
              <view class="robot-avatar" v-else>
                <image
                  src="/static/robot-avatar.png" 
                  mode="widthFix"
                ></image>
              </view>
            </view>
            <view class="message-content">
              <view class="message-bubble">
				  <!-- 机器人：打字机 -->
                  <TypewriterMarkdown 
					v-if="msg.sender === 'robot' && msg.isTyping" 
					:content="msg.content === '▌' ? '' : msg.content" 
                    :speed="20"
                    :finished="msg.streamFinished === true"
					@finish="onTypingFinish(msg)"
				  />
				  <!-- 机器人：已渲染好的 HTML -->
				  <view v-else-if="msg.sender === 'robot' && msg.htmlContent" class="markdown-wrapper">
					  <rich-text :nodes="msg.htmlContent" />
				  </view>
				  <!-- 机器人：降级纯文本 -->
				  <text v-else-if="msg.sender === 'robot'">{{ msg.content }}</text>
				  <!-- 用户：纯文本 -->
				  <text v-else-if="msg.sender === 'user'">{{ msg.content }}</text>				
              </view>
              <!-- 时间与操作图标 -->
			  <view class="message-footer">
				  <text class="message-time">{{ formatTime(msg.time) }}</text>
				  <!-- 复制图标 -->
				  <text class="iconfont icon-copy message-op" @click="copyMessage(msg.content)" />
				  <!-- 编辑图标：仅自己发的消息显示 -->
				  <!-- <text v-if="msg.sender === 'user'" class="iconfont icon-edit message-op" @click="startEditMessage(index, msg.content)" /> -->
			  </view>
            </view>
          </view>
          
          <!-- 正在输入提示 -->
          <view class="typing-indicator" v-if="isTyping">
            <view class="robot-avatar small">
                <image src="/static/robot-avatar.png" mode="widthFix"></image>
              </view>
              <view class="typing-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </view>
              <text class="typing-text">AI正在思考中...</text>
          </view>
        </view>
        
        <!-- 底部输入区域 - 只在有消息时显示 -->
        <view class="input-area" v-if="hasMessages">
          <view class="footer">
            <view class="tool-list">
              <view
                v-for="tool in tools"
                :key="tool.key"
                :class="['tool-btn', { active: tool.key === selectedTool }]"
                @click="selectTool(tool.key)"
              >{{ tool.label }}</view>
            </view>
            <view class="composer">
              <textarea 
                class="input-textarea" 
                v-model.trim="draft" 
                placeholder="请输入消息" 
                @confirm="handleSend"
                :style="{ height: textareaHeight }"
                @input="autoResizeTextarea"
                @keydown="handleKeydown"
                :show-confirm-bar="false"
                :adjust-position="false"
                :maxlength="1000"
                auto-height
              />
              <button class="send" :disabled="!canSend" @click="handleSend">发送</button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import TypewriterMarkdown from '@/components/TypewriterMarkdown.vue';
import my_request from '@/utils/request';

const createSession = (name) =>
  my_request({ url: '/chat/sessions/new/', method: 'POST', data: {"name":name}});

const loadSessionList = () =>
  my_request({ url: '/chat/sessions/', method: 'GET' });

const loadHistoryMsg = (sessionId) =>
  my_request({ url: `/chat/messages/${sessionId}`, method: 'GET' });

const sendMsgToAPI = (sessionId, question, msgType = 0) =>
  my_request({
    url: '/chat/message/add/',
    method: 'POST',
    data: { session_id: sessionId, question, message_type: msgType }
  });
  

// 修改状态管理，增加临时会话标识
const isTemporarySession = ref(false); // 标识是否为临时会话（尚未创建）
// 状态管理
const sidebarVisible = ref(false);
const showUserMenu = ref(false);
const messages = ref([]);
const isTyping = ref(false);
const currentConversationId = ref(null);
const messageContainer = ref(null);
const textareaHeight = ref('80rpx'); // 初始高度
const editingMessageIndex = ref(null);

// 从 chat.vue 移植的数据
const draft = ref('');
const tools = ref([
  { key: 'chat', label: '闲聊' },
  { key: 'single', label: '单人分析' },
  { key: 'multiplayer', label: '多人分析' },
  { key: 'department', label: '部门分析' }
]);
// 添加msgType的映射关系
const toolToMsgType = {
  'chat': 0,         // 闲聊
  'single': 1,       // 单人分析
  'multiplayer': 3,  // 多人分析
  'department': 2    // 部门分析
};
const selectedTool = ref('chat');
const conversations = ref([]);
// 顶部 ref 区
const isWaitingAI = ref(false); 
const sessionMap = ref(new Map());

// 计算属性
const hasConversations = computed(() => {
  return conversations.value && conversations.value.length > 0;
});

const hasMessages = computed(() => {
  return messages.value && messages.value.length > 0;
});

// 从 chat.vue 移植的计算属性
const isEmptyState = computed(() => {
  return messages.value.length === 0;
});

const canSend = computed(() => {
  return draft.value.trim().length > 0 && !isWaitingAI.value;
});

const lastMsgAnchor = computed(() => {
  return `msg-${Math.max(messages.value.length - 1, 0)}`;
});

// 从 chat.vue 移植的方法
const selectTool = (key) => {
  selectedTool.value = key;
};

// 新增：复制消息内容
const copyMessage = (content) => {
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'success'
      });
    }
  });
};

// 新增：开始编辑消息
const startEditMessage = (index, content) => {
  // 退出编辑时需要将 draft 设为原内容，并切换到编辑模式
  editingMessageIndex.value = index;
  draft.value = content;
  
  // // 滚动到输入框或执行其他操作以聚焦输入框
  // uni.pageScrollTo({
  //   scrollTop: 999999,
  //   duration: 300
  // });
};


async function handleSend() {
  if (!canSend.value) return;
  const question = draft.value.trim();
  draft.value = '';
  textareaHeight.value = '80rpx';

  // 如果是临时会话（尚未创建），现在创建它
  if (isTemporarySession.value || !currentConversationId.value) {
    // 使用消息前10个字作为会话名称
	const sessionName = question.length > 10 ? question.substring(0, 10) + '...' : question;
	try {
		// 调用创建会话接口，传入消息前10字作为名称
		const { id, name } = await createSession(sessionName);
		const newId = String(id);
		
		// 添加到会话列表
		conversations.value.unshift({
			id: newId,
			title: name,
			lastMessage: null,
			unreadCount: 0,
		});
		
		sessionMap.value.set(id, { id, name });
		currentConversationId.value = newId;
		isTemporarySession.value = false; // 标记为已创建
		uni.setStorageSync('lastSessionId', newId);
	}catch (e) {
		uni.showToast({ title: '创建会话失败', icon: 'none' });
		return; // 创建失败则不发送消息
	}
  }
  const sessionId = currentConversationId.value;

  // 本地立即插入用户消息
  const now = Date.now();
  messages.value.push({
    content: question,
    sender: 'user',
    time: now,
    htmlContent: '',
    isTyping: false
  });

  // 更新会话列表 lastMessage
  const idx = conversations.value.findIndex(c => c.id === sessionId);
  if (idx !== -1) {
    conversations.value[idx].lastMessage = {
      content: question,
      sender: 'user',
      time: now
    };
  }

  scrollToBottom();
  
  // 创建并插入AI消息（初始为空）
  const aiMessageIndex = messages.value.length;
  messages.value.push({
      content: '▌',
      sender: 'robot',
      time: Date.now(),
      htmlContent: '',
      isTyping: true,  // 开始显示打字机效果
      streamFinished: false
    });
  isWaitingAI.value = true;
  scrollToBottom();
  
  try {
	  const msgType = toolToMsgType[selectedTool.value];
	  // 使用 EventSource 或 fetch 进行流式接收
	  await streamAIResponse(sessionId, question, msgType, aiMessageIndex);
	  
  } catch (e) {
	  // 错误处理
	  if (messages.value.length > 0 && messages.value[messages.value.length - 1].sender === 'user') {
		  messages.value.pop();
	  }
	  draft.value = question;
	  uni.showToast({
		  title: e.message || '发送失败，请重试', 
		  icon: 'none',
		  duration: 2000
	  });
	  
	  // 移除空的AI消息
	  messages.value.splice(aiMessageIndex, 1);
  } finally {
	  isWaitingAI.value = false;
  }
  
  

  // 调接口
 //  isWaitingAI.value = true;
 //  try {
	// // 从映射中获取当前选中工具对应的msgType
	// const msgType = toolToMsgType[selectedTool.value];
 //    const { reply } = await sendMsgToAPI(sessionId, question, msgType);
	
	// // #ifdef H5
	// const { default: MarkdownIt } = await import('markdown-it');
	// const md = new MarkdownIt();
	// const htmlContent = md.render(reply)
	//   .replace(/<ul>/g, '<ul style="margin-left: 20rpx; padding-left: 20rpx;">')
	//   .replace(/<ol>/g, '<ol style="margin-left: 20rpx; padding-left: 20rpx;">')
	//   .replace(/<table>/g, '<table style="margin-left: 20rpx;">');
	// // #endif
	
 //    // 插入机器人消息（打字机效果）
 //    messages.value.push({
 //      content: reply,
 //      sender: 'robot',
 //      time: Date.now(),
 //      htmlContent: '',
 //      isTyping: true
 //    });
 //    scrollToBottom();
 //  } catch (e) {
	// // 发送失败时，将用户消息从消息列表中移除
	// if (messages.value.length > 0 && messages.value[messages.value.length - 1].sender === 'user') {
	// 	messages.value.pop();
	// }
	// // 恢复输入框内容，方便用户重试
	// draft.value = question;
 //    // 显示错误信息
	// uni.showToast({ 
	//   title: e.message || '发送失败，请重试', 
	//   icon: 'none',
	//   duration: 2000
	// });
 //  } finally {
 //    isWaitingAI.value = false;
 //  }
 
}

async function streamAIResponse(sessionId, question, msgType, messageIndex) {
	// 在 streamAIResponse 中添加调试
	console.log('Starting stream request...');
	console.log('Message index:', messageIndex);
	console.log('Initial message content:', messages.value[messageIndex].content);
  return new Promise((resolve, reject) => {
    // 初始化AI消息内容为空白，而不是光标
    messages.value[messageIndex].content = '';
    
    fetch(`http://127.0.0.1:8000/api/chat/message/add/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${uni.getStorageSync('token')}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        question: question,
        message_type: msgType
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedFirstChunk = false;
      
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            console.log('Stream completed');
            messages.value[messageIndex].streamFinished = true;
            resolve();
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // 保留最后一行不完整的数据
          buffer = lines.pop() || '';
          
          let hasNewContent = false;
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6);
              
              if (dataStr === '[DONE]') {
                console.log('Received DONE signal');
                messages.value[messageIndex].streamFinished = true;
                continue;
              }
              
              try {
                const data = JSON.parse(dataStr);
                console.log('Received chunk:', data);
                
                if (data.chunk && data.chunk.length > 0) {
                  // 标记已收到第一个chunk
                  if (!receivedFirstChunk) {
                    receivedFirstChunk = true;
                    console.log('First chunk received');
                  }
                  
                  // 逐步更新AI消息内容
                  messages.value[messageIndex].content += data.chunk;
                  hasNewContent = true;
                  
                  // 立即滚动到底部
                  scrollToBottom();
                }
                
                if (data.finished) {
                  console.log('Received finished signal');
                  messages.value[messageIndex].streamFinished = true;
                }
              } catch (e) {
                console.error('解析流数据错误:', e, '数据:', dataStr);
              }
            }
          }
          
          // 如果有新内容，确保滚动
          if (hasNewContent) {
            scrollToBottom();
          }
          
          read(); // 继续读取
        }).catch(error => {
          console.error('Stream read error:', error);
          reject(error);
        });
      }
      
      read();
    })
    .catch(error => {
      console.error('Fetch error:', error);
      reject(error);
    });
  });
}

const handleKeydown = (e) => {
  if (e.keyCode === 13 && !e.shiftKey) { // Enter键，且没有按Shift
    e.preventDefault();
    handleSend();
  }
  // 如果按Shift+Enter，允许换行
};

// 自动调整文本域高度
const autoResizeTextarea = () => {
  nextTick(() => {
    // uni-app的textarea有auto-height属性，会自动调整高度
    // 这里我们设置一个最大高度限制
    const lines = draft.value.split('\n').length;
    if (lines > 1) {
      textareaHeight.value = Math.min(80 + (lines - 1) * 30, 200) + 'rpx';
    } else {
      textareaHeight.value = '80rpx';
    }
  });
};

// 初始化
onMounted(async () => {
  // 检查登录状态
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  
  await loadConversations();   // 拉取历史会话列表
});

// 加载会话列表
async function loadConversations() {
  try {
    const list = await loadSessionList();   // [{id,name,created_at},...]
    conversations.value = list.map(i => ({
      id: String(i.id),
      title: i.name,
      lastMessage: null,
      unreadCount: 0
    }));
    // 建立 id 映射，方便后面拿 name
    list.forEach(i => sessionMap.value.set(i.id, i));
    // 桌面端默认展开侧边栏
    if (uni.getSystemInfoSync().windowWidth >= 768 && list.length) {
      sidebarVisible.value = true;
    }
    // 如果本地有“当前会话”缓存，直接加载消息
    const lastId = uni.getStorageSync('lastSessionId');
    if (lastId) {
      const exist = list.find(i => i.id == lastId);
      if (exist) switchConversation(lastId);
    }
  } catch (e) {
    uni.showToast({ title: '加载会话失败', icon: 'none' });
  }
}

// 保存会话列表到本地存储
const saveConversations = () => {
  uni.setStorageSync('conversations', conversations.value);
};

// 加载会话消息
const loadConversationMessages = (convId) => {
  // 模拟从本地存储加载消息
  const savedMessages = uni.getStorageSync(`messages_${convId}`);
  if (savedMessages && savedMessages.length > 0) {
    messages.value = savedMessages;
  } else {
    messages.value = [];
  }
  
  scrollToBottom();
};

// 保存当前会话消息到本地存储
const saveCurrentConversationMessages = () => {
  if (currentConversationId.value) {
    uni.setStorageSync(`messages_${currentConversationId.value}`, messages.value);
  }
};

// 切换会话
async function switchConversation(convId) {
  currentConversationId.value = convId;
  try {
    const list = await loadHistoryMsg(convId);   // [{id,sender,content,created_at},...]
    // 转换成本地消息格式
    messages.value = list.map(m => ({
      content: m.content,
      sender: m.sender === 'ai' ? 'robot' : 'user',
      time: new Date(m.created_at).getTime(),
	  htmlContent: '', // 初始化为空，稍后转换
	  isTyping: false
    }));
    // 重置未读
    const idx = conversations.value.findIndex(c => c.id === convId);
    if (idx !== -1) conversations.value[idx].unreadCount = 0;
    uni.setStorageSync('lastSessionId', convId);
  } catch (e) {
    uni.showToast({ title: '加载消息失败', icon: 'none' });
  }
  nextTick(() => {
	  convertHistoryMessagesToHtml();
	  scrollToBottom();
	});
}

// 开始新会话
async function startNewChat() {
  // 仅初始化临时会话状态，不调用创建接口
  currentConversationId.value = null;
  messages.value = [];
  isTemporarySession.value = true;
  sidebarVisible.value = true;
}

// 滚动到底部 - 增强版本
const scrollToBottom = () => {
  nextTick(() => {
    setTimeout(() => {
      // 多种方式尝试滚动
      if (messageContainer.value && messageContainer.value.$el) {
        // 方式1: 直接设置 scrollTop
        const container = messageContainer.value.$el;
        container.scrollTop = container.scrollHeight;
      } else if (messageContainer.value) {
        // 方式2: 通过 uni-app 节点查询
        const query = uni.createSelectorQuery().in(this);
        query.select('.message-container').boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec((res) => {
          if (res[0]) {
            uni.pageScrollTo({
              scrollTop: res[0].height,
              duration: 0
            });
          }
        });
      }
      
      // 方式3: 简单的 DOM 操作（H5 环境）
      // #ifdef H5
      const domContainer = document.querySelector('.message-container');
      if (domContainer) {
        domContainer.scrollTop = domContainer.scrollHeight;
      }
      // #endif
    }, 100); // 增加延迟确保 DOM 更新完成
  });
};

// 新增：转换历史消息的 Markdown 内容
const convertHistoryMessagesToHtml = async () => {
  // #ifdef H5
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt();
  
  messages.value = messages.value.map(msg => {
    if (msg.sender === 'robot' && !msg.htmlContent) {
      // 对历史消息进行 Markdown 转换
      msg.htmlContent = md.render(msg.content)
        .replace(/<ul>/g, '<ul style="margin-left: 20rpx; padding-left: 20rpx;">')
        .replace(/<ol>/g, '<ol style="margin-left: 20rpx; padding-left: 20rpx;">')
        .replace(/<table>/g, '<table style="margin-left: 20rpx;">');
    }
    return msg;
  });
  // #endif
};


// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // 今天的消息显示时分
  if (date.toDateString() === now.toDateString()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // 昨天的消息显示"昨天"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  
  // 今年的消息显示月日
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  
  // 其他显示年月日
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 打字完成回调
function onTypingFinish(msg) {
  msg.isTyping = false;
  // #ifdef H5
  import('markdown-it').then(({ default: MarkdownIt }) => {
    msg.htmlContent = new MarkdownIt().render(msg.content);
	scrollToBottom(); // 打字完成后再滚动一次
  });
  // #endif
  // #ifndef H5
  scrollToBottom(); // 非H5环境也要滚动
  // #endif
}


// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// 导航到报告中心
const navigateToReports = () => {
  uni.navigateTo({ url: '/pages/reports/reports' });
};

// 显示用户信息
const showUserInfo = () => {
  showUserMenu.value = false;
  uni.showToast({ title: '个人信息页面开发中', icon: 'none' });
};

// 退出登录
const handleLogout = () => {
  showUserMenu.value = false;
  uni.showModal({
    title: '确认退出',
    content: '您确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除登录状态
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        uni.navigateTo({ url: '/pages/login/login' });
      }
    }
  });
};

// 监听窗口大小变化，在移动端自动隐藏侧边栏
watch(
  () => uni.getSystemInfoSync().windowWidth,
  (width) => {
    if (width < 768) {
      sidebarVisible.value = false;
    } else if (hasConversations.value) {
      // 桌面端且有会话时显示侧边栏
      sidebarVisible.value = true;
    }
  }
);
</script>

<style scoped>
.markdown-wrapper {
  padding: 12rpx 16rpx; /* 上下 左右 */
  display: block;
}
	
/* ========== 基础布局 ========== */
.chat-container{
  display:flex;
  flex-direction:column;
  height:100vh;
  background:#fafbfc;
  overflow:hidden;
}

/* ========== 导航栏 ========== */
.custom-nav{
  height:100rpx;
  background:#fff;
  border-bottom:1px solid #e5e7eb;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 30rpx;
  flex-shrink:0;
}
.nav-left,.nav-right{
  display:flex;
  align-items:center
}
.nav-right .report-btn { margin-right: 20rpx; }
.nav-right .user-btn  { margin-left: 0; }

.menu-btn,.report-btn,.user-btn{
  width:60rpx;
  height:60rpx;
  background:transparent;
  border:none;
  padding:0;
  margin:0;
  display:flex;
  align-items:center;
  justify-content:center;
}
.menu-btn .iconfont{
  font-size:36rpx;
  color:#333
}
.nav-title{
  font-size:32rpx;
  font-weight:500;
  color:#333
}
.user-btn image{
  width:50rpx;
  height:50rpx;
  border-radius:50%
}

/* 用户菜单 */
.user-menu{
  position:absolute;
  top:100rpx;
  right:20rpx;
  width:240rpx;
  background:#fff;
  border-radius:10rpx;
  box-shadow:0 4rpx 16rpx rgba(0,0,0,.1);
  z-index:100;
  overflow:hidden;
}
.menu-item{
  display:flex;
  align-items:center;
  padding:20rpx 30rpx;
  font-size:28rpx;
  color:#333
}
.menu-item:hover{
  background:#f5f5f5
}
.menu-item .iconfont{
  margin-right:20rpx;
  font-size:30rpx;
  color:#666
}

/* ========== 聊天主体 ========== */
.chat-content{
  display:flex;
  flex:1;
  min-height:0
}   /* min-height:0 让 flex 子项可被压缩 */

/* ========== 侧边栏 ========== */
.sidebar{
  width:0;
  background:#fff;
  border-right:1px solid #e5e7eb;
  display:flex;
  flex-direction:column;
  transition:width .3s;
  overflow:hidden;
}
.sidebar.has-conversations{
  width:400rpx
}
.sidebar-show{
  width:400rpx
}
/* 新建对话按钮行 */
.new-chat-row {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  margin: 20rpx 30rpx 10rpx;
  background: #e8f0ff; /* 比原来深一点的浅蓝灰 */
  border-radius: 16rpx;
  border: 1px solid #d0dcee; /* 轻微边框，增强层次 */
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-chat-row:hover {
  background: #dbe7ff;
  border-color: #b8d0ff;
}

.new-chat-row .iconfont {
  font-size: 36rpx;
  color: #2f6bff;
  margin-right: 16rpx;
}

.new-chat-text {
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

/* 历史会话标题 */
.sidebar-section-title {
  padding: 20rpx 30rpx 10rpx;
  font-size: 26rpx;
  color: #999;
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
}
.new-chat-btn{
  width:50rpx;
  height:50rpx;
  border-radius:50%;
  background:#f0f7ff;
  border:none;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
}
.new-chat-btn .iconfont{
  font-size:24rpx;
  color:#666
}
.conversation-list{
  flex:1;
  overflow-y:auto
}
.conversation-item{
  display:flex;
  align-items:center;
  padding:20rpx 30rpx;
  border-bottom:1px solid #f5f5f5;
  cursor:pointer;
  transition:background .2s;
}
.conversation-item:hover{
  background:#f9f9f9
}
.conversation-item.active{
  background:#f0f7ff
}
.conv-avatar{
  width:48rpx;
  height:48rpx;
  border-radius:8rpx;
  background:#f0f7ff;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-right:20rpx;
}
.conv-avatar .iconfont{
  font-size:30rpx;
  color:#4096ff
}
.conv-info{
  flex:1;
  min-width:0
}
.conv-title{
  font-size:28rpx;
  color:#333;
  margin-bottom:4rpx;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis
}
.conv-last-message{
  font-size:24rpx;
  color:#666;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis
}
.conv-last-message .sender{
  color:#4096ff
}
.conv-time{
  font-size:22rpx;
  color:#999;
  display:flex;
  flex-direction:column;
  align-items:flex-end
}
.unread-count{
  width:30rpx;
  height:30rpx;
  border-radius:50%;
  background:#ff4d4f;
  color:#fff;
  font-size:20rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-top:4rpx;
}

/* ========== 主聊天区 ========== */
.main-chat-area{
  flex:1;
  display:flex;
  flex-direction:column;
  min-height:0;
  position:relative;
}
.main-chat-area.has-sidebar{
  width:calc(100% - 400rpx)
}

/* 消息容器：内部滚动 + 撑满剩余高度 */
.message-container{
  flex:1;
  overflow-y:auto;
  display:flex;
  flex-direction:column;
  padding:30rpx 30rpx 0;
  height:0;          /* 关键：让 flex 撑满父级剩余空间 */
}

/* 欢迎页（无消息时） */
.welcome-container{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:stretch;
  justify-content:center; /* 改为居中布局 */
  padding:0 30rpx;
}
.welcome-message{
  text-align:center;
  margin-bottom:30rpx; /* 减小间距 */
}
.welcome-icon{
  width: 120rpx;
  height: 120rpx;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  margin:0 auto 20rpx;
}
.welcome-icon .iconfont{
  font-size:50rpx;
  color:#4096ff
}
.welcome-message h3{
  font-size:32rpx;
  color:#333;
  margin-bottom:10rpx
}
.welcome-message p{
  font-size:26rpx;
  color:#666;
  line-height:1.6
}


.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 20rpx; /* 增加与欢迎消息的间距 */
}

.empty-center {
  width: 100%;
  padding: 24rpx;
  max-width: 1400rpx;
  margin: 0 auto;        /* 左右自动边距 → 居中 */
  border: 1px solid rgba(0, 0, 0, .1);
  border-radius: 24rpx;
}

.footer {
  border-top: 1px solid #eee;
  background: #fff;
  padding: 16rpx;
  width: 100%;
}

.composer {
  display: flex;
  gap: 16rpx;
  align-items: flex-end; /* 改为底部对齐，适应多行文本 */
}

/* 替换input为textarea样式 */
.input-textarea {
  flex: 1;
  min-height: 80rpx;
  max-height: 200rpx; /* 最大高度限制 */
  border: 1px solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx;
  background: #fff;
  font-size: 28rpx;
  line-height: 1.4;
  resize: none;
  overflow-y: auto;
  box-sizing: border-box;
  word-break: break-word;
}

.send {
  height: 72rpx;
  padding: 0 28rpx;
  border-radius: 12rpx;
  background: #4096ff;
  color: #fff;
  border: none;
  font-size: 28rpx;
  flex-shrink: 0;
  align-self: flex-end; /* 与文本区域底部对齐 */
  margin-bottom: 4rpx;
}

.send[disabled] {
  background: #c0c0c0;
}

/* Tool list */
.tool-list {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tool-btn {
  padding: 12rpx 20rpx;
  border-radius: 24rpx;
  border: 1px solid #ddd;
  color: #333;
  background: #fafafa;
  font-size: 24rpx;
}

.tool-btn.active {
  border-color: #4096ff;
  background: #e8f3ff;
  color: #4096ff;
}

/* ========== 消息列表 ========== */
.message-item{
  display:flex;
  margin-bottom:20rpx;
  max-width:80%;
  animation:fadeIn .3s
}
@keyframes fadeIn{
  from{opacity:0;transform:translateY(10rpx)}to{opacity:1;transform:translateY(0)}
}
.user-message{
  align-self:flex-end;
  flex-direction:row-reverse
}

/* 消息底部栏：时间 + 图标 */
.message-footer{
  display: flex;
  align-items: center;
  justify-content: flex-end;   /* 图标靠右 */
  margin-top: 6rpx;
}
.message-op{
  margin-left: 14rpx;
  font-size: 26rpx;
  color: #999;
  transition: color .2s;
}
.message-op:hover{
  color: #4096ff;
}
.robot-message .message-footer{
  justify-content: flex-start; /* AI 消息图标在左 */
}

.message-avatar{
  width:48rpx;
  height:48rpx;
  margin-right:16rpx;
  flex-shrink:0;
}
.user-message .message-avatar{
  margin-right:0;
  margin-left:16rpx
}
.message-avatar image{
  width:100%;
  height:100%;
  border-radius:8rpx
}
.robot-avatar{
  width:48rpx;
  height:48rpx;
  border-radius:8rpx;
  background:#f0f7ff;
  display:flex;
  align-items:center;
  justify-content:center;
}
.robot-avatar .iconfont{
  font-size:26rpx;
  color:#4096ff
}

.message-content{
  max-width:calc(100% - 64rpx)
}
.message-bubble{
  padding:18rpx 24rpx;
  border-radius:18rpx;
  line-height:1.6;
  font-size:28rpx;
  word-wrap:break-word;
}
.robot-message .message-bubble{
  background:#f5f7fa;
  color:#333;
  border:1px solid #e5e7eb;
  border-top-left-radius:5rpx;
}
.user-message .message-bubble{
  background:#4096ff;
  color:#fff;
  border-top-right-radius:5rpx;
}
.message-time{
  font-size:22rpx;
  color:#999;
  margin-top:6rpx;
  text-align:right
}
.user-message .message-time{
  text-align:left
}

/* 正在输入 */
.typing-indicator{
  display:flex;
  align-items:center;
  margin:10rpx 0 20rpx 16rpx;
  align-self:flex-start
}
.robot-avatar.small{
  width:40rpx;
  height:40rpx;
  margin-right:12rpx
}
.typing-dots{
  display:flex;
  gap:8rpx;
  padding:10rpx 20rpx;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:20rpx
}
.dot{
  width:10rpx;
  height:10rpx;
  border-radius:50%;
  background:#999;
  animation:typing 1.4s infinite ease-in-out
}
.dot:nth-child(1){
  animation-delay:-.32s
}
.dot:nth-child(2){
  animation-delay:-.16s
}
@keyframes typing{
  0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}
}

/* ========== 底部输入区（有消息时） ========== */
.input-area{
  background:#fff;
  border-top:1px solid #e5e7eb;
  padding:20rpx 30rpx;
  display:flex;
  flex-shrink:0;
  width:100%;
}

/* ========== 响应式 ========== */
@media (max-width:767px){
  .sidebar{
    position:absolute;
    height:calc(100vh - 100rpx);
    z-index:5
  }
  .sidebar-show{
    width:75%;
    box-shadow:2rpx 0 10rpx rgba(0,0,0,.1)
  }
  .main-chat-area.has-sidebar{
    width:100%
  }
  .message-item{
    max-width:85%
  }
  /* 移动端输入区始终全宽 */
  .input-area{
    left:0!important
  }
}
@media (min-width:768px){
  .sidebar.has-conversations{
    width:400rpx
  }
  .menu-btn{
    display:none
  }
}
</style>