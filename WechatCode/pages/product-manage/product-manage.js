const { productApi } = require('../../utils/api');

Page({
  data: {
    vendorId: null,
    products: [],
    loading: false
  },

  onLoad(options) {
    const vendorId = options.vendorId;
    if (!vendorId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    
    this.setData({ vendorId });
    this.loadProducts();
  },

  onShow() {
    if (this.data.vendorId && !this.data.loading) {
      this.loadProducts();
    }
  },

  async loadProducts() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中' });
    
    try {
      const res = await productApi.getProducts(this.data.vendorId);
      if (res.code === 200) {
        this.setData({ products: res.data || [] });
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  onAdd() {
    wx.navigateTo({
      url: `/pages/product-form/product-form?vendorId=${this.data.vendorId}`
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product-form/product-form?vendorId=${this.data.vendorId}&id=${id}`
    });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${name}"吗？`,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          try {
            const result = await productApi.deleteProduct(id);
            wx.hideLoading();
            if (result.code === 200) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              getApp().globalData.needRefreshVendors = true;
              this.loadProducts();
            } else {
              wx.showToast({ title: result.message || '删除失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
