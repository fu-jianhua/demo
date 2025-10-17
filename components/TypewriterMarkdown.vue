<template>
  <view>
    <!-- #ifdef H5 -->
    <rich-text :nodes="html" />
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <text>{{ displayed }}</text>
    <!-- #endif -->
  <text v-if="isTyping" class="typing-cursor">▌</text>
  </view>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue';

// #ifdef H5
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();
// #endif

const props = defineProps({
  content: String,
  speed: { type: Number, default: 20 },
  // 标记流式是否真正结束，由父组件控制
  finished: { type: Boolean, default: false }
});

const emit = defineEmits(['finish']);

const displayed = ref('');
// #ifdef H5
const html = ref('');
// #endif
const isTyping = ref(true);
const isPaused = ref(false);

let timer = null;
let currentIndex = 0;
let fullContent = '';

const processContent = (newContent) => {
  if (newContent === fullContent) {
    return; // 内容没有变化
  }
  
  // 如果新内容比当前显示的内容长，说明有新增内容
  if (newContent.length > fullContent.length) {
    fullContent = newContent;
    
    // 如果打字已经完成但又有新内容，重新开始打字效果
    if (currentIndex >= fullContent.length) {
      currentIndex = displayed.value.length;
    }
    
    // 确保打字机继续工作
    isPaused.value = false;
    continueTyping();
  }
};

const continueTyping = () => {
  if (timer) clearTimeout(timer);
  
  if (currentIndex < fullContent.length) {
    displayed.value = fullContent.substring(0, currentIndex + 1);
    currentIndex++;
    
    // #ifdef H5
    html.value = md.render(displayed.value)
      .replace(/<ul>/g, '<ul style="margin-left: 20rpx; padding-left: 20rpx;">')
      .replace(/<ol>/g, '<ol style="margin-left: 20rpx; padding-left: 20rpx;">')
      .replace(/<table>/g, '<table style="margin-left: 20rpx;">');
    // #endif
    
    timer = setTimeout(continueTyping, props.speed);
  } else {
    // 已打到当前内容末尾，但不代表流结束
    // 进入暂停状态，等待新增内容到来
    isPaused.value = true;
  }
};

const startTyping = () => {
  fullContent = props.content;
  displayed.value = '';
  // #ifdef H5
  html.value = '';
  // #endif
  currentIndex = 0;
  isTyping.value = true;
  isPaused.value = false;
  
  if (timer) clearTimeout(timer);
  
  if (fullContent && fullContent.length > 0) {
    continueTyping();
  } else {
    isTyping.value = false;
  }
};

// 监听内容变化
watch(() => props.content, (newContent, oldContent) => {
  if (newContent !== oldContent) {
    processContent(newContent);
  }
}, { immediate: true });

// 监听流完成信号：仅当父组件告知 finished 才真正结束
watch(() => props.finished, (done) => {
  if (!done) return;
  if (timer) clearTimeout(timer);
  // 确保展示完整内容
  fullContent = props.content || fullContent;
  displayed.value = fullContent;
  // #ifdef H5
  html.value = md.render(displayed.value)
    .replace(/<ul>/g, '<ul style="margin-left: 20rpx; padding-left: 20rpx;">')
    .replace(/<ol>/g, '<ol style="margin-left: 20rpx; padding-left: 20rpx;">')
    .replace(/<table>/g, '<table style="margin-left: 20rpx;">');
  // #endif
  isTyping.value = false;
  isPaused.value = false;
  emit('finish', displayed.value);
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.typing-cursor {
  animation: blink 1s infinite;
  color: #4096ff;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>