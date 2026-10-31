const { getUserId, reviewApi } = require('../../utils/api.js');
const logger = require('../../utils/logger');

Page({
  data: {
    vendorId: '',
    vendorName: '',
    rating: 0,
    content: '',
    stars: [1, 2, 3, 4, 5],
    submitting: false
  },

  onLoad(options) {
    this.setData({
      vendorId: options.vendorId,
      vendorName: options.vendorName
    });
  },

  onStarTap(e) {
    const star = e.currentTarget.dataset.star;
    this.setData({ rating: star });
  },

  onRatingChange(e) {
    const star = e.detail.rating;
    this.setData({ rating: star });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onSubmit() {
    const { vendorId, rating, content } = this.data;
    const userId = getUserId();

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (rating == 0) {
      wx.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写评价内容', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    reviewApi.addReview(vendorId, rating, content.trim()).then(res => {
      this.setData({ submitting: false });
      if (res.code == 200) {
        wx.showToast({ title: '评价成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.loadVendorDetail) {
            prevPage.loadVendorDetail(vendorId);
          }
        }, 1500);
      } else {
        wx.showModal({
          title: '提交失败',
          content: res.message || '请稍后重试',
          showCancel: false
        });
      }
    }).catch(err => {
      logger.error('提交评价失败:', err);
      this.setData({ submitting: false });
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    });
  }
});
