/**
 * 日志管理工具
 * 统一管理系统日志，支持环境控制
 *
 * 功能特性：
 * - 提供 4 个日志级别：debug, info, warn, error
 * - 根据小程序运行环境自动控制日志输出
 * - 开发环境：显示所有级别日志
 * - 体验版/正式版：只显示 warn 和 error 级别日志
 */

// 获取当前小程序环境信息
const accountInfo = wx.getAccountInfoSync()
const envVersion = accountInfo.miniProgram.envVersion

// 判断是否为开发环境
const isDev = envVersion === 'develop'

/**
 * 日志管理器对象
 * @namespace logger
 */
const logger = {
  /**
   * 调试日志（仅开发环境显示）
   * 用于开发调试阶段的详细信息输出
   *
   * @param {...any} args - 要输出的日志内容，支持多个参数
   * @example
   * logger.debug('用户数据:', userData)
   * logger.debug('请求参数:', params, '响应:', response)
   */
  debug(...args) {
    if (isDev) {
      console.debug('[DEBUG]', new Date().toISOString(), ...args)
    }
  },

  /**
   * 信息日志（仅开发环境显示）
   * 用于记录一般性的信息和流程跟踪
   *
   * @param {...any} args - 要输出的日志内容，支持多个参数
   * @example
   * logger.info('页面加载完成')
   * logger.info('用户登录成功:', userId)
   */
  info(...args) {
    if (isDev) {
      console.info('[INFO]', new Date().toISOString(), ...args)
    }
  },

  /**
   * 警告日志（所有环境显示）
   * 用于记录潜在的问题或异常情况，但不影响程序运行
   *
   * @param {...any} args - 要输出的日志内容，支持多个参数
   * @example
   * logger.warn('接口响应数据为空')
   * logger.warn('用户未授权:', scope)
   */
  warn(...args) {
    console.warn('[WARN]', new Date().toISOString(), ...args)
  },

  /**
   * 错误日志（所有环境显示）
   * 用于记录严重的错误信息，需要及时处理
   *
   * @param {...any} args - 要输出的日志内容，支持多个参数
   * @example
   * logger.error('请求失败:', error)
   * logger.error('数据解析错误:', err.message)
   */
  error(...args) {
    console.error('[ERROR]', new Date().toISOString(), ...args)
  }
}

// 导出日志管理器
module.exports = logger
