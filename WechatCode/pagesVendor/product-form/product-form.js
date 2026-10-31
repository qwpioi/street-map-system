const { productApi, uploadApi } = require('../../utils/api');
const logger = require('../../utils/logger')

Page({
  data: {
    vendorId: null,
    productId: null,
    isEdit: false,
    formData: {
      name: '',
      description: '',
      price: '',
      imageUrl: ''
    },
    imageTempPath: '',   // 临时图片路径（预览用）
    uploading: false     // 是否正在上传
  },

  onLoad(options) {
    const vendorId = options.vendorId;
    const productId = options.id;

    this.setData({
      vendorId,
      productId,
      isEdit: !!productId
    });

    if (productId) {
      this.loadProduct(productId);
    }
  },

  async loadProduct(id) {
    wx.showLoading({ title: '加载中' });
    try {
      const res = await productApi.getProducts(this.data.vendorId);
      if (res.code === 200 && res.data) {
        const product = res.data.find(p => p.id == id);
        if (product) {
          this.setData({
            formData: {
              name: product.name || '',
              description: product.description || '',
              price: String(product.price || ''),
              imageUrl: product.imageUrl || ''
            },
            imageTempPath: product.imageUrl || ''
          });
        } else {
          wx.showToast({ title: '商品不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    } catch (err) {
      console.error('加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 选择图片
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.setData({ imageTempPath: tempPath })
      }
    })
  },

  // 移除已选图片
  onRemoveImage() {
    this.setData({ imageTempPath: '', 'formData.imageUrl': '' })
  },

  onSubmit(e) {
    const { name, description, price } = e.detail.value;

    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }

    // 如果选了本地图片但还没上传，先上传
    if (this.data.imageTempPath && !this.data.formData.imageUrl) {
      this.doUploadAndSubmit(name, description, price);
    } else {
      this.doSubmit(name, description, price);
    }
  },

  // 先上传图片，再提交表单
  async doUploadAndSubmit(name, description, price) {
    this.setData({ uploading: true });
    wx.showLoading({ title: '上传图片中...' });

    try {
      const res = await uploadApi.uploadImage(this.data.imageTempPath);
      wx.hideLoading();

      if (res.code === 200) {
        const imageUrl = res.data;
        this.setData({
          'formData.imageUrl': imageUrl,
          uploading: false
        });
        this.doSubmit(name, description, price);
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ uploading: false });
      wx.showToast({ title: '图片上传失败', icon: 'none' });
    }
  },

  // 提交表单
  doSubmit(name, description, price) {
    if (this.data.uploading) return;

    const data = {
      vendorId: parseInt(this.data.vendorId),
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(price),
      imageUrl: this.data.formData.imageUrl || ''
    };

    if (this.data.isEdit) {
      data.id = parseInt(this.data.productId);
      this.doUpdate(data);
    } else {
      this.doAdd(data);
    }
  },

  async doAdd(data) {
    wx.showLoading({ title: '发布中' })
    try {
      const res = await productApi.addProduct(data)
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({ title: '发布成功', icon: 'success' })
        getApp().globalData.needRefreshVendors = true
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res.message || '发布失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
    }
  },

  async doUpdate(data) {
    wx.showLoading({ title: '保存中' })
    try {
      const res = await productApi.updateProduct(data)
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        getApp().globalData.needRefreshVendors = true
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
