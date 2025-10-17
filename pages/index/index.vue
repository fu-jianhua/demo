<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<!-- #ifdef H5 -->
			h5的测试
		<!-- #endif -->
		<!-- #ifdef MP-WEIXIN -->
			微信小程序显示
		<!-- #endif -->
		
<!-- 		<view class="text-area">
			<text class="title">{{title}}</text>
		</view> -->
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style lang="scss">
	view{
		color: $uni-color-error;
	}
	
</style>