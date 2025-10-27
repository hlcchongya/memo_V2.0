/**
 * 备忘录数据模型
 * 定义备忘录的数据结构和基本验证
 */

class Memo {
  /**
   * 构造函数
   * @param {Object} data - 备忘录数据
   */
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    this.content = data.content || '';
    this.category = data.category || '其他';
    this.priority = data.priority || '中';
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.isCompleted = data.isCompleted || false;
  }

  /**
   * 生成唯一ID (UUID v4)
   * @returns {String} UUID
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 更新备忘录信息
   * @param {Object} updates - 要更新的字段
   * @returns {Memo} 返回当前实例
   */
  update(updates) {
    const allowedFields = ['title', 'content', 'category', 'priority', 'tags', 'isCompleted'];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        this[key] = updates[key];
      }
    });
    
    this.updatedAt = Date.now();
    return this;
  }

  /**
   * 切换完成状态
   * @returns {Memo} 返回当前实例
   */
  toggleComplete() {
    this.isCompleted = !this.isCompleted;
    this.updatedAt = Date.now();
    return this;
  }

  /**
   * 添加标签
   * @param {String} tag - 标签名称
   * @returns {Memo} 返回当前实例
   */
  addTag(tag) {
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = Date.now();
    }
    return this;
  }

  /**
   * 移除标签
   * @param {String} tag - 标签名称
   * @returns {Memo} 返回当前实例
   */
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = Date.now();
    }
    return this;
  }

  /**
   * 验证备忘录数据
   * @returns {Object} 验证结果 {isValid, errors}
   */
  validate() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('标题不能为空');
    }

    if (this.title.length > 100) {
      errors.push('标题长度不能超过100个字符');
    }

    if (this.content.length > 5000) {
      errors.push('内容长度不能超过5000个字符');
    }

    const validCategories = ['工作', '生活', '学习', '其他'];
    if (!validCategories.includes(this.category)) {
      errors.push('分类必须是：工作、生活、学习、其他之一');
    }

    const validPriorities = ['高', '中', '低'];
    if (!validPriorities.includes(this.priority)) {
      errors.push('优先级必须是：高、中、低之一');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 转换为普通对象
   * @returns {Object} 备忘录对象
   */
  toObject() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      category: this.category,
      priority: this.priority,
      tags: [...this.tags],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isCompleted: this.isCompleted
    };
  }

  /**
   * 从对象创建 Memo 实例
   * @param {Object} obj - 普通对象
   * @returns {Memo} Memo 实例
   */
  static fromObject(obj) {
    return new Memo(obj);
  }

  /**
   * 克隆备忘录
   * @returns {Memo} 新的 Memo 实例
   */
  clone() {
    return new Memo(this.toObject());
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Memo;
}
