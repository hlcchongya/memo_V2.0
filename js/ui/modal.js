/**
 * 模态框组件
 * 提供通用的模态对话框功能
 */

class Modal {
  /**
   * 构造函数
   * @param {String} id - 模态框ID
   */
  constructor(id = 'app-modal') {
    this.id = id;
    this.modal = null;
    this.onConfirm = null;
    this.onCancel = null;
    this.createModal();
  }

  /**
   * 创建模态框DOM结构
   */
  createModal() {
    // 检查是否已存在
    if (document.getElementById(this.id)) {
      this.modal = document.getElementById(this.id);
      return;
    }

    // 创建模态框元素
    const modalHTML = `
      <div class="modal" id="${this.id}">
        <div class="modal-overlay"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title"></h3>
            <button class="modal-close-btn" title="关闭">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-message"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel-btn">取消</button>
            <button class="btn btn-primary modal-confirm-btn">确定</button>
          </div>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById(this.id);

    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.modal) return;

    // 遮罩层点击关闭
    const overlay = this.modal.querySelector('.modal-overlay');
    overlay.addEventListener('click', () => this.hide());

    // 关闭按钮
    const closeBtn = this.modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => this.hide());

    // 取消按钮
    const cancelBtn = this.modal.querySelector('.modal-cancel-btn');
    cancelBtn.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.hide();
    });

    // 确定按钮
    const confirmBtn = this.modal.querySelector('.modal-confirm-btn');
    confirmBtn.addEventListener('click', () => {
      if (this.onConfirm) {
        this.onConfirm();
      }
      this.hide();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  /**
   * 显示模态框
   * @param {Object} options - 配置选项
   */
  show(options = {}) {
    if (!this.modal) {
      this.createModal();
    }

    const {
      title = '提示',
      message = '',
      showCancel = true,
      confirmText = '确定',
      cancelText = '取消',
      onConfirm = null,
      onCancel = null
    } = options;

    // 设置内容
    this.modal.querySelector('.modal-title').textContent = title;
    this.modal.querySelector('.modal-message').textContent = message;
    this.modal.querySelector('.modal-confirm-btn').textContent = confirmText;
    this.modal.querySelector('.modal-cancel-btn').textContent = cancelText;

    // 显示/隐藏取消按钮
    const cancelBtn = this.modal.querySelector('.modal-cancel-btn');
    cancelBtn.style.display = showCancel ? 'inline-block' : 'none';

    // 设置回调
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    // 显示模态框
    this.modal.classList.add('modal-visible');
    document.body.style.overflow = 'hidden';

    // 聚焦到确定按钮
    setTimeout(() => {
      this.modal.querySelector('.modal-confirm-btn').focus();
    }, 100);
  }

  /**
   * 隐藏模态框
   */
  hide() {
    if (!this.modal) return;

    this.modal.classList.remove('modal-visible');
    document.body.style.overflow = '';

    // 清除回调
    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * 判断模态框是否可见
   * @returns {Boolean} 是否可见
   */
  isVisible() {
    return this.modal && this.modal.classList.contains('modal-visible');
  }

  /**
   * 显示确认对话框
   * @param {String} message - 消息内容
   * @param {String} title - 标题
   * @returns {Promise<Boolean>} 用户选择
   */
  confirm(message, title = '确认') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        showCancel: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }

  /**
   * 显示警告对话框
   * @param {String} message - 消息内容
   * @param {String} title - 标题
   * @returns {Promise<void>}
   */
  alert(message, title = '提示') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        showCancel: false,
        onConfirm: () => resolve()
      });
    });
  }

  /**
   * 显示成功提示
   * @param {String} message - 消息内容
   * @param {String} title - 标题
   * @returns {Promise<void>}
   */
  success(message, title = '成功') {
    return this.alert(message, title);
  }

  /**
   * 显示错误提示
   * @param {String} message - 消息内容
   * @param {String} title - 标题
   * @returns {Promise<void>}
   */
  error(message, title = '错误') {
    return this.alert(message, title);
  }

  /**
   * 销毁模态框
   */
  destroy() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}

/**
 * Toast 提示组件
 * 轻量级的消息提示
 */
class Toast {
  /**
   * 显示 Toast 消息
   * @param {String} message - 消息内容
   * @param {String} type - 类型 (success|error|info|warning)
   * @param {Number} duration - 持续时间（毫秒）
   */
  static show(message, type = 'info', duration = 3000) {
    // 创建 Toast 容器（如果不存在）
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // 创建 Toast 元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // 图标
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;

    // 添加到容器
    container.appendChild(toast);

    // 显示动画
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10);

    // 自动隐藏
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => {
        toast.remove();
        
        // 如果容器为空，删除容器
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  }

  /**
   * 显示成功消息
   * @param {String} message - 消息内容
   * @param {Number} duration - 持续时间
   */
  static success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  /**
   * 显示错误消息
   * @param {String} message - 消息内容
   * @param {Number} duration - 持续时间
   */
  static error(message, duration = 3000) {
    this.show(message, 'error', duration);
  }

  /**
   * 显示警告消息
   * @param {String} message - 消息内容
   * @param {Number} duration - 持续时间
   */
  static warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  /**
   * 显示信息消息
   * @param {String} message - 消息内容
   * @param {Number} duration - 持续时间
   */
  static info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
}

/**
 * Loading 加载组件
 */
class Loading {
  static instance = null;

  /**
   * 显示加载动画
   * @param {String} message - 加载提示文本
   */
  static show(message = '加载中...') {
    // 移除已存在的
    this.hide();

    // 创建加载元素
    const loading = document.createElement('div');
    loading.id = 'app-loading';
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">${message}</p>
      </div>
    `;

    document.body.appendChild(loading);
    document.body.style.overflow = 'hidden';
    
    this.instance = loading;

    // 显示动画
    setTimeout(() => {
      loading.classList.add('loading-visible');
    }, 10);
  }

  /**
   * 隐藏加载动画
   */
  static hide() {
    if (this.instance) {
      this.instance.classList.remove('loading-visible');
      
      setTimeout(() => {
        this.instance.remove();
        this.instance = null;
        document.body.style.overflow = '';
      }, 300);
    }
  }

  /**
   * 更新加载文本
   * @param {String} message - 新的提示文本
   */
  static updateMessage(message) {
    if (this.instance) {
      const textElement = this.instance.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Modal, Toast, Loading };
}
