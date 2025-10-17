<template>
  <view class="report-detail-container">
    <!-- 顶部导航 -->
    <view class="page-header">
      <button 
        class="back-btn" 
        @click="navigateBack"
      >
        <text class="iconfont icon-arrow-left"></text>
      </button>
      <view class="header-title">报告详情</view>
      <view class="header-actions">
        <button class="action-btn" @click="handleShare">
          <text class="iconfont icon-share-alt"></text>
        </button>
        <button class="action-btn" @click="handleDownload">
          <text class="iconfont icon-download"></text>
        </button>
      </view>
    </view>
    
    <!-- 报告内容 -->
    <scroll-view 
      class="report-content" 
      scroll-y
      enhanced
      show-scrollbar
    >
      <view class="report-header">
        <view class="report-type-tag">
          {{ getReportTypeName(currentReport.type) }}
        </view>
        <h1 class="report-title">{{ currentReport.title }}</h1>
        
        <view class="report-meta">
          <view class="meta-item">
            <text class="iconfont icon-calendar"></text>
            <span>发布于 {{ formatDate(currentReport.createTime) }}</span>
          </view>
          <view class="meta-item">
            <text class="iconfont icon-eye"></text>
            <span>{{ currentReport.views }} 次查看</span>
          </view>
        </view>
        
        <view class="report-cover">
          <image 
            :src="currentReport.imageUrl" 
            mode="widthFix"
            :alt="currentReport.title"
          ></image>
        </view>
      </view>
      
      <view class="report-body">
        <!-- 报告摘要 -->
        <view class="section summary-section">
          <h2 class="section-title">报告摘要</h2>
          <view class="section-content">
            <p>{{ currentReport.summary }}</p>
          </view>
        </view>
        
        <!-- 目录 -->
        <view class="section toc-section">
          <h2 class="section-title">目录</h2>
          <view class="toc-list">
            <view 
              class="toc-item"
              v-for="(item, index) in tocItems"
              :key="index"
              @click="scrollToSection(item.id)"
            >
              <text class="toc-number">{{ index + 1 }}.</text>
              <text class="toc-text">{{ item.title }}</text>
            </view>
          </view>
        </view>
        
        <!-- 主要内容部分 -->
        <view 
          class="section"
          v-for="(item, index) in tocItems"
          :key="item.id"
          :id="item.id"
        >
          <h2 class="section-title">{{ index + 1 }}. {{ item.title }}</h2>
          
          <view class="section-content">
            <!-- 段落内容 -->
            <p v-for="(para, pIndex) in item.paragraphs" :key="pIndex">
              {{ para }}
            </p>
            
            <!-- 图表 -->
            <view class="chart-container" v-if="item.hasChart">
              <image 
                :src="`https://picsum.photos/id/${100 + index}/800/400`" 
                mode="widthFix"
                :alt="item.title + '图表'"
              ></image>
              <view class="chart-caption">
                {{ item.title }}数据图表
              </view>
            </view>
            
            <!-- 列表 -->
            <view class="bullet-list" v-if="item.hasList">
              <view class="bullet-item" v-for="(listItem, liIndex) in 3" :key="liIndex">
                <view class="bullet"></view>
                <text>{{ item.title }}相关要点 {{ liIndex + 1 }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 结论部分 -->
        <view class="section conclusion-section">
          <h2 class="section-title">结论与建议</h2>
          <view class="section-content">
            <p>基于本报告的分析，我们提出以下建议：</p>
            <view class="numbered-list">
              <view class="numbered-item" v-for="(item, index) in 3" :key="index">
                <text class="number">{{ index + 1 }}.</text>
                <text>针对{{ currentReport.title }}的关键改进措施，应优先考虑实施。</text>
              </view>
            </view>
            <p>通过上述措施，预计可在未来3-6个月内看到明显成效。建议每季度进行一次进度评估，及时调整策略。</p>
          </view>
        </view>
        
        <!-- 附件部分 -->
        <view class="section attachments-section" v-if="currentReport.attachments && currentReport.attachments.length > 0">
          <h2 class="section-title">相关附件</h2>
          <view class="attachments-list">
            <view 
              class="attachment-item"
              v-for="(attach, index) in currentReport.attachments"
              :key="index"
              @click="downloadAttachment(attach)"
            >
              <view class="attachment-icon">
                <text class="iconfont icon-file-text-o"></text>
              </view>
              <view class="attachment-info">
                <view class="attachment-name">{{ attach.name }}</view>
                <view class="attachment-size">{{ formatFileSize(attach.size) }}</view>
              </view>
              <view class="attachment-download">
                <text class="iconfont icon-download"></text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 底部留白 -->
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';

// 获取当前页面实例
const { proxy } = getCurrentInstance();

// 状态管理
const currentReport = ref({});
const tocItems = ref([
  {
    id: 'section-1',
    title: '研究背景与目的',
    paragraphs: [
      '本报告旨在分析当前市场环境下的发展趋势，为企业决策提供数据支持。随着数字化转型的加速，行业格局正在发生深刻变化，了解这些变化对企业未来发展至关重要。',
      '研究范围涵盖了过去12个月的市场数据，包括消费者行为分析、竞争对手动态及技术创新趋势。通过综合评估这些因素，我们希望为企业制定有效的战略规划提供参考。'
    ],
    hasChart: true,
    hasList: false
  },
  {
    id: 'section-2',
    title: '数据收集与分析方法',
    paragraphs: [
      '本次研究采用了混合研究方法，包括定量调查和定性访谈。定量调查覆盖了全国范围内的10000名受访者，确保了数据的代表性和统计显著性。',
      '定性访谈则针对行业专家、企业高管和典型用户进行，深入了解他们对市场趋势的看法和预期。数据分析采用了SPSS和R语言进行统计建模，确保结果的科学性和准确性。'
    ],
    hasChart: false,
    hasList: true
  },
  {
    id: 'section-3',
    title: '主要发现与分析',
    paragraphs: [
      '研究发现，过去一年中，市场需求呈现出三个明显趋势：一是消费者对个性化产品的需求显著增加；二是线上线下融合的消费模式成为主流；三是可持续发展理念对购买决策的影响日益增强。',
      '从竞争格局来看，市场集中度有所提高，头部企业的市场份额持续扩大。同时，新兴品牌通过差异化策略在细分市场取得了突破，给传统企业带来了挑战。',
      '技术创新方面，人工智能和大数据分析的应用正在改变行业的运营模式，提高了效率并创造了新的商业模式。'
    ],
    hasChart: true,
    hasList: true
  }
]);

// 初始化
onMounted(() => {
  // 检查登录状态
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const reportId = currentPage.options.id;
  
  // 根据ID获取报告详情
  fetchReportDetail(reportId);
});

// 获取报告详情
const fetchReportDetail = (id) => {
  // 模拟报告数据
  const reportData = {
    id: id,
    title: id === '1' ? '2023年度市场分析报告' : 
           id === '2' ? '产品使用指南摘要' :
           id === '3' ? '系统架构设计说明' :
           id === '4' ? '用户满意度调研分析' :
           id === '5' ? '季度业务总结报告' :
           id === '6' ? 'API接口开发文档' : '通用报告',
    type: id === '1' || id === '4' ? 'analysis' : 
          id === '2' || id === '5' ? 'summary' : 'technical',
    summary: id === '1' ? '本报告详细分析了2023年度市场发展趋势、消费者行为变化以及行业竞争格局，为企业决策提供数据支持。' :
             id === '2' ? '本文档是产品使用手册的精简版本，涵盖了核心功能的操作步骤和常见问题解答，帮助用户快速上手。' :
             id === '3' ? '详细描述了系统的整体架构设计、模块划分、技术选型以及接口规范，供开发人员参考。' :
             id === '4' ? '基于10000+用户样本的调研数据，分析了用户对产品各功能的满意度评分及改进建议。' :
             id === '5' ? '总结了本季度业务发展情况、业绩完成度、市场拓展成果以及下季度工作计划。' :
             id === '6' ? '包含所有API接口的详细说明、参数列表、返回值格式及调用示例，方便第三方开发者集成。' :
             '这是一份通用报告，包含了相关领域的重要信息和分析。',
    imageUrl: id === '1' ? 'https://picsum.photos/id/28/800/450' :
              id === '2' ? 'https://picsum.photos/id/42/800/450' :
              id === '3' ? 'https://picsum.photos/id/60/800/450' :
              id === '4' ? 'https://picsum.photos/id/180/800/450' :
              id === '5' ? 'https://picsum.photos/id/201/800/450' :
              id === '6' ? 'https://picsum.photos/id/160/800/450' :
              'https://picsum.photos/id/237/800/450',
    createTime: id === '1' ? new Date().getTime() - 86400000 * 5 :
                id === '2' ? new Date().getTime() - 86400000 * 12 :
                id === '3' ? new Date().getTime() - 86400000 * 20 :
                id === '4' ? new Date().getTime() - 86400000 * 3 :
                id === '5' ? new Date().getTime() - 86400000 * 35 :
                id === '6' ? new Date().getTime() - 86400000 * 45 :
                new Date().getTime() - 86400000 * 10,
    views: id === '1' ? 1243 : id === '2' ? 3567 : id === '3' ? 892 : 
           id === '4' ? 654 : id === '5' ? 1023 : id === '6' ? 789 : 500,
    attachments: [
      {
        name: '完整数据表格.xlsx',
        size: 2048000,
        url: '/attachments/data.xlsx'
      },
      {
        name: '图表素材.zip',
        size: 5632000,
        url: '/attachments/charts.zip'
      }
    ]
  };
  
  currentReport.value = reportData;
  
  // 模拟增加阅读量
  currentReport.value.views++;
});

// 获取报告类型名称
const getReportTypeName = (type) => {
  const typeMap = {
    'analysis': '分析报告',
    'summary': '摘要报告',
    'technical': '技术报告'
  };
  return typeMap[type] || '未知类型';
};

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

// 滚动到指定章节
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) {
    // 计算导航栏高度，避免被遮挡
    const headerHeight = 100; // 导航栏高度为100rpx
    const rect = el.getBoundingClientRect();
    const scrollTop = rect.top + document.querySelector('.report-content').scrollTop - headerHeight;
    
    document.querySelector('.report-content').scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack({ delta: 1 });
};

// 处理分享
const handleShare = () => {
  uni.showToast({ title: '分享功能开发中', icon: 'none' });
};

// 处理下载
const handleDownload = () => {
  uni.showToast({ title: '报告下载中...', icon: 'none' });
  
  // 模拟下载延迟
  setTimeout(() => {
    uni.showToast({ title: '报告已下载', icon: 'success' });
  }, 1500);
};

// 下载附件
const downloadAttachment = (attach) => {
  uni.showToast({ title: `正在下载 ${attach.name}`, icon: 'none' });
  
  // 模拟下载延迟
  setTimeout(() => {
    uni.showToast({ title: `${attach.name} 已下载`, icon: 'success' });
  }, 1000);
};
</script>

<style scoped>
.report-detail-container {
  min-height: 100vh;
  background-color: #fff;
}

/* 顶部导航 */
.page-header {
  height: 100rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
}

.back-btn .iconfont {
  font-size: 36rpx;
  color: #333;
}

.header-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.header-actions {
  display: flex;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 20rpx;
}

.action-btn .iconfont {
  font-size: 34rpx;
  color: #333;
}

/* 报告内容容器 */
.report-content {
  width: 100%;
  height: calc(100vh - 100rpx);
}

/* 报告头部 */
.report-header {
  padding: 40rpx 30rpx;
  border-bottom: 1px solid #f5f5f5;
}

.report-type-tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  background-color: #e6f7ff;
  color: #1890ff;
  font-size: 24rpx;
  border-radius: 4rpx;
  margin-bottom: 20rpx;
}

.report-title {
  font-size: 40rpx;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 25rpx;
}

.report-meta {
  display: flex;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-right: 30rpx;
}

.meta-item .iconfont {
  margin-right: 8rpx;
  font-size: 24rpx;
}

.report-cover {
  width: 100%;
  border-radius: 10rpx;
  overflow: hidden;
  margin-top: 20rpx;
}

.report-cover image {
  width: 100%;
  height: auto;
}

/* 报告主体内容 */
.report-body {
  padding: 0 30rpx;
  max-width: 1200rpx;
  margin: 0 auto;
}

.section {
  padding: 40rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 34rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 25rpx;
  position: relative;
  padding-left: 15rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10rpx;
  width: 6rpx;
  height: 60%;
  background-color: #1890ff;
  border-radius: 3rpx;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.section-content p {
  margin-bottom: 25rpx;
}

.section-content p:last-child {
  margin-bottom: 0;
}

/* 摘要部分 */
.summary-section {
  background-color: #f5f7fa;
  padding: 40rpx 30rpx;
  margin: 20rpx 0;
  border-radius: 10rpx;
}

/* 目录部分 */
.toc-section {
  background-color: #f9f9f9;
  padding: 40rpx 30rpx;
  border-radius: 10rpx;
}

.toc-list {
  padding-left: 10rpx;
}

.toc-item {
  display: flex;
  align-items: center;
  padding: 15rpx 0;
  cursor: pointer;
  transition: all 0.2s;
}

.toc-item:hover {
  background-color: rgba(24, 144, 255, 0.05);
  padding-left: 10rpx;
  border-radius: 5rpx;
}

.toc-number {
  color: #1890ff;
  font-weight: 500;
  margin-right: 15rpx;
  min-width: 40rpx;
}

.toc-text {
  color: #333;
  font-size: 28rpx;
}

/* 图表容器 */
.chart-container {
  margin: 40rpx 0;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.chart-container image {
  width: 100%;
  height: auto;
}

.chart-caption {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 15rpx 0;
  background-color: #f9f9f9;
}

/* 列表样式 */
.bullet-list {
  margin: 30rpx 0;
  padding-left: 20rpx;
}

.bullet-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.bullet {
  width: 12rpx;
  height: 12rpx;
  background-color: #1890ff;
  border-radius: 50%;
  margin-top: 18rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.numbered-list {
  margin: 30rpx 0;
  padding-left: 20rpx;
}

.numbered-item {
  display: flex;
  margin-bottom: 20rpx;
}

.number {
  font-weight: 600;
  color: #1890ff;
  margin-right: 20rpx;
  min-width: 40rpx;
}

/* 附件部分 */
.attachments-list {
  margin-top: 20rpx;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 25rpx 20rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.attachment-item:hover {
  background-color: #f0f7ff;
}

.attachment-icon {
  width: 60rpx;
  height: 60rpx;
  background-color: #e6f7ff;
  border-radius: 8rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.attachment-icon .iconfont {
  font-size: 34rpx;
  color: #1890ff;
}

.attachment-info {
  flex-grow: 1;
  overflow: hidden;
}

.attachment-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 5rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-size {
  font-size: 22rpx;
  color: #999;
}

.attachment-download {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #1890ff;
}

.attachment-download .iconfont {
  font-size: 30rpx;
}

/* 底部留白 */
.bottom-space {
  height: 60rpx;
}

/* 结论部分 */
.conclusion-section {
  background-color: #fff8e6;
  padding: 40rpx 30rpx;
  border-radius: 10rpx;
  margin-top: 20rpx;
}

.conclusion-section .section-title::before {
  background-color: #faad14;
}
</style>
    