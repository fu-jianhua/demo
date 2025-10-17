<template>
  <view class="reports-container">
    <!-- 页面标题栏 -->
    <view class="page-header">
      <view class="header-left">
        <button 
          class="back-btn" 
          @click="navigateBack"
        >
          <text class="iconfont icon-arrow-left"></text>
        </button>
      </view>
      <view class="header-title">报告中心</view>
      <view class="header-right">
        <button 
          class="filter-btn" 
          @click="showFilter = !showFilter"
        >
          <text class="iconfont icon-filter"></text>
        </button>
      </view>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="iconfont icon-search"></text>
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索报告..." 
          @input="handleSearch"
        />
      </view>
    </view>
    
    <!-- 筛选面板 -->
    <view 
      class="filter-panel"
      v-if="showFilter"
    >
      <view class="filter-title">报告类型</view>
      <view class="filter-tags">
        <view 
          class="filter-tag"
          :class="{ 'active': selectedType === 'all' }"
          @click="selectedType = 'all'"
        >
          全部
        </view>
        <view 
          class="filter-tag"
          :class="{ 'active': selectedType === 'analysis' }"
          @click="selectedType = 'analysis'"
        >
          分析报告
        </view>
        <view 
          class="filter-tag"
          :class="{ 'active': selectedType === 'summary' }"
          @click="selectedType = 'summary'"
        >
          摘要报告
        </view>
        <view 
          class="filter-tag"
          :class="{ 'active': selectedType === 'technical' }"
          @click="selectedType = 'technical'"
        >
          技术报告
        </view>
      </view>
      
      <view class="filter-title">时间范围</view>
      <view class="filter-tags">
        <view 
          class="filter-tag"
          :class="{ 'active': selectedTime === 'all' }"
          @click="selectedTime = 'all'"
        >
          全部时间
        </view>
        <view 
          class="filter-tag"
          :class="{ 'active': selectedTime === 'week' }"
          @click="selectedTime = 'week'"
        >
          近一周
        </view>
        <view 
          class="filter-tag"
          :class="{ 'active': selectedTime === 'month' }"
          @click="selectedTime = 'month'"
        >
          近一月
        </view>
        <view 
          class="filter-tag"
          :class="{ 'active': selectedTime === 'quarter' }"
          @click="selectedTime = 'quarter'"
        >
          近三月
        </view>
      </view>
      
      <button 
        class="apply-filter-btn"
        @click="applyFilter"
      >
        应用筛选
      </button>
    </view>
    
    <!-- 报告列表 -->
    <view class="reports-list">
      <view 
        class="report-card"
        v-for="report in filteredReports"
        :key="report.id"
        @click="navigateToDetail(report.id)"
      >
        <view class="report-image">
          <image 
            :src="report.imageUrl" 
            mode="aspectFill"
            :alt="report.title"
          ></image>
          <view class="report-type-tag">
            {{ getReportTypeName(report.type) }}
          </view>
        </view>
        
        <view class="report-info">
          <h3 class="report-title">{{ report.title }}</h3>
          
          <view class="report-meta">
            <view class="meta-item">
              <text class="iconfont icon-calendar"></text>
              <span>{{ formatDate(report.createTime) }}</span>
            </view>
            <view class="meta-item">
              <text class="iconfont icon-eye"></text>
              <span>{{ report.views }} 次查看</span>
            </view>
          </view>
          
          <view class="report-summary">
            {{ report.summary.length > 100 
              ? report.summary.slice(0, 100) + '...' 
              : report.summary }}
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredReports.length === 0">
        <view class="empty-icon">
          <text class="iconfont icon-file-text-o"></text>
        </view>
        <h3>没有找到相关报告</h3>
        <p>尝试调整筛选条件或搜索关键词</p>
        <button 
          class="reset-btn"
          @click="resetFilter"
        >
          重置筛选条件
        </button>
      </view>
    </view>
    
    <!-- 加载更多 -->
    <view class="load-more" v-if="filteredReports.length > 0 && hasMore">
      <button 
        class="load-more-btn"
        @click="loadMoreReports"
        :loading="loadingMore"
      >
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 状态管理
const searchKeyword = ref('');
const showFilter = ref(false);
const selectedType = ref('all');
const selectedTime = ref('all');
const loadingMore = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = ref(6);

// 报告数据
const reports = ref([
  {
    id: '1',
    title: '2023年度市场分析报告',
    type: 'analysis',
    summary: '本报告详细分析了2023年度市场发展趋势、消费者行为变化以及行业竞争格局，为企业决策提供数据支持。',
    imageUrl: 'https://picsum.photos/id/28/400/225',
    createTime: new Date().getTime() - 86400000 * 5,
    views: 1243
  },
  {
    id: '2',
    title: '产品使用指南摘要',
    type: 'summary',
    summary: '本文档是产品使用手册的精简版本，涵盖了核心功能的操作步骤和常见问题解答，帮助用户快速上手。',
    imageUrl: 'https://picsum.photos/id/42/400/225',
    createTime: new Date().getTime() - 86400000 * 12,
    views: 3567
  },
  {
    id: '3',
    title: '系统架构设计说明',
    type: 'technical',
    summary: '详细描述了系统的整体架构设计、模块划分、技术选型以及接口规范，供开发人员参考。',
    imageUrl: 'https://picsum.photos/id/60/400/225',
    createTime: new Date().getTime() - 86400000 * 20,
    views: 892
  },
  {
    id: '4',
    title: '用户满意度调研分析',
    type: 'analysis',
    summary: '基于10000+用户样本的调研数据，分析了用户对产品各功能的满意度评分及改进建议。',
    imageUrl: 'https://picsum.photos/id/180/400/225',
    createTime: new Date().getTime() - 86400000 * 3,
    views: 654
  },
  {
    id: '5',
    title: '季度业务总结报告',
    type: 'summary',
    summary: '总结了本季度业务发展情况、业绩完成度、市场拓展成果以及下季度工作计划。',
    imageUrl: 'https://picsum.photos/id/201/400/225',
    createTime: new Date().getTime() - 86400000 * 35,
    views: 1023
  },
  {
    id: '6',
    title: 'API接口开发文档',
    type: 'technical',
    summary: '包含所有API接口的详细说明、参数列表、返回值格式及调用示例，方便第三方开发者集成。',
    imageUrl: 'https://picsum.photos/id/160/400/225',
    createTime: new Date().getTime() - 86400000 * 45,
    views: 789
  }
]);

// 模拟更多报告数据
const moreReports = [
  {
    id: '7',
    title: '移动端用户体验分析',
    type: 'analysis',
    summary: '分析了移动端用户的使用习惯、界面交互反馈及性能表现，提出了优化建议。',
    imageUrl: 'https://picsum.photos/id/237/400/225',
    createTime: new Date().getTime() - 86400000 * 50,
    views: 543
  },
  {
    id: '8',
    title: '项目管理流程摘要',
    type: 'summary',
    summary: '概述了项目从启动到交付的全流程管理规范、关键节点及角色职责。',
    imageUrl: 'https://picsum.photos/id/342/400/225',
    createTime: new Date().getTime() - 86400000 * 60,
    views: 432
  },
  {
    id: '9',
    title: '数据库优化技术方案',
    type: 'technical',
    summary: '详细介绍了数据库性能瓶颈分析方法及优化策略，包括索引优化、查询优化等内容。',
    imageUrl: 'https://picsum.photos/id/366/400/225',
    createTime: new Date().getTime() - 86400000 * 70,
    views: 678
  }
];

// 计算筛选后的报告
const filteredReports = computed(() => {
  return reports.value.filter(report => {
    // 搜索关键词筛选
    const matchesSearch = searchKeyword.value.trim() === '' || 
      report.title.includes(searchKeyword.value.trim()) || 
      report.summary.includes(searchKeyword.value.trim());
    
    // 类型筛选
    const matchesType = selectedType.value === 'all' || report.type === selectedType.value;
    
    // 时间筛选
    const now = new Date().getTime();
    let matchesTime = true;
    
    if (selectedTime.value === 'week') {
      // 近一周 (7天)
      matchesTime = report.createTime >= now - 86400000 * 7;
    } else if (selectedTime.value === 'month') {
      // 近一月 (30天)
      matchesTime = report.createTime >= now - 86400000 * 30;
    } else if (selectedTime.value === 'quarter') {
      // 近三月 (90天)
      matchesTime = report.createTime >= now - 86400000 * 90;
    }
    
    return matchesSearch && matchesType && matchesTime;
  });
});

// 初始化
onMounted(() => {
  // 检查登录状态
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
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

// 处理搜索
const handleSearch = (e) => {
  // 搜索逻辑在computed中处理
};

// 应用筛选
const applyFilter = () => {
  showFilter.value = false;
  // 筛选逻辑在computed中处理
};

// 重置筛选条件
const resetFilter = () => {
  searchKeyword.value = '';
  selectedType.value = 'all';
  selectedTime.value = 'all';
  showFilter.value = false;
};

// 加载更多报告
const loadMoreReports = async () => {
  if (loadingMore.value || !hasMore.value) return;
  
  loadingMore.value = true;
  
  try {
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 添加更多报告
    const startIndex = (currentPage.value - 1) * pageSize.value;
    const endIndex = startIndex + pageSize.value;
    const newReports = moreReports.slice(startIndex, endIndex);
    
    if (newReports.length > 0) {
      reports.value = [...reports.value, ...newReports];
      currentPage.value++;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('加载更多报告失败', error);
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  } finally {
    loadingMore.value = false;
  }
};

// 导航到详情页
const navigateToDetail = (id) => {
  uni.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}` });
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack({ delta: 1 });
};
</script>

<style scoped>
.reports-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 页面标题栏 */
.page-header {
  height: 100rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
}

.back-btn, .filter-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
}

.back-btn .iconfont, .filter-btn .iconfont {
  font-size: 36rpx;
  color: #333;
}

.header-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

/* 搜索栏 */
.search-bar {
  padding: 20rpx 30rpx;
  background-color: #f5f7fa;
}

.search-input {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 40rpx;
  padding: 0 30rpx;
  height: 70rpx;
  border: 1px solid #eee;
}

.search-input .iconfont {
  font-size: 30rpx;
  color: #999;
  margin-right: 15rpx;
}

.search-input input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  border: none;
  outline: none;
}

.search-input input::placeholder {
  color: #ccc;
}

/* 筛选面板 */
.filter-panel {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1px solid #eee;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 30rpx;
}

.filter-tag {
  padding: 12rpx 25rpx;
  background-color: #f5f5f5;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.apply-filter-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  margin-top: 10rpx;
}

/* 报告列表 */
.reports-list {
  padding: 20rpx 30rpx;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340rpx, 1fr));
  gap: 30rpx;
}

.report-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: pointer;
}

.report-card:hover {
  transform: translateY(-5rpx);
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);
}

.report-image {
  position: relative;
  height: 200rpx;
  overflow: hidden;
}

.report-image image {
  width: 100%;
  height: 100%;
  transition: transform 0.5s;
}

.report-card:hover .report-image image {
  transform: scale(1.05);
}

.report-type-tag {
  position: absolute;
  top: 15rpx;
  left: 15rpx;
  padding: 8rpx 15rpx;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 22rpx;
  border-radius: 4rpx;
}

.report-info {
  padding: 25rpx;
}

.report-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.report-meta {
  display: flex;
  font-size: 22rpx;
  color: #999;
  margin-bottom: 15rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-right: 25rpx;
}

.meta-item .iconfont {
  margin-right: 5rpx;
  font-size: 22rpx;
}

.report-summary {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx 30rpx;
  grid-column: 1 / -1;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 30rpx;
}

.empty-icon .iconfont {
  font-size: 60rpx;
  color: #ccc;
}

.empty-state h3 {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.empty-state p {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.reset-btn {
  padding: 15rpx 40rpx;
  background-color: #fff;
  color: #1890ff;
  border: 1px solid #1890ff;
  border-radius: 6rpx;
  font-size: 26rpx;
}

/* 加载更多 */
.load-more {
  padding: 40rpx 30rpx;
  text-align: center;
}

.load-more-btn {
  padding: 15rpx 60rpx;
  background-color: #fff;
  color: #666;
  border: 1px solid #eee;
  border-radius: 6rpx;
  font-size: 26rpx;
}

/* 响应式调整 */
@media (max-width: 767px) {
  .reports-list {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .reports-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .reports-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
