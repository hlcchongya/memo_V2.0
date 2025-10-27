/**
 * 数据验证工具
 * 提供各种数据验证功能
 */

const Validator = {
  /**
   * 验证是否为空
   * @param {*} value - 要验证的值
   * @returns {Boolean} 是否为空
   */
  isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  },

  /**
   * 验证字符串长度
   * @param {String} str - 字符串
   * @param {Number} min - 最小长度
   * @param {Number} max - 最大长度
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateLength(str, min = 0, max = Infinity) {
    const length = str ? str.length : 0;
    
    if (length < min) {
      return {
        isValid: false,
        message: `长度不能少于${min}个字符`
      };
    }
    
    if (length > max) {
      return {
        isValid: false,
        message: `长度不能超过${max}个字符`
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  },

  /**
   * 验证备忘录标题
   * @param {String} title - 标题
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateMemoTitle(title) {
    if (this.isEmpty(title)) {
      return {
        isValid: false,
        message: '标题不能为空'
      };
    }
    
    return this.validateLength(title, 1, 100);
  },

  /**
   * 验证备忘录内容
   * @param {String} content - 内容
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateMemoContent(content) {
    return this.validateLength(content || '', 0, 5000);
  },

  /**
   * 验证分类
   * @param {String} category - 分类
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateCategory(category) {
    const validCategories = ['工作', '生活', '学习', '其他'];
    
    if (!validCategories.includes(category)) {
      return {
        isValid: false,
        message: '分类必须是：工作、生活、学习、其他之一'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  },

  /**
   * 验证优先级
   * @param {String} priority - 优先级
   * @returns {Object} 验证结果 {isValid, message}
   */
  validatePriority(priority) {
    const validPriorities = ['高', '中', '低'];
    
    if (!validPriorities.includes(priority)) {
      return {
        isValid: false,
        message: '优先级必须是：高、中、低之一'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  },

  /**
   * 验证标签
   * @param {String} tag - 标签
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateTag(tag) {
    if (this.isEmpty(tag)) {
      return {
        isValid: false,
        message: '标签不能为空'
      };
    }
    
    const result = this.validateLength(tag, 1, 20);
    if (!result.isValid) {
      result.message = '标签' + result.message;
    }
    
    return result;
  },

  /**
   * 验证标签数组
   * @param {Array} tags - 标签数组
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateTags(tags) {
    if (!Array.isArray(tags)) {
      return {
        isValid: false,
        message: '标签必须是数组'
      };
    }
    
    if (tags.length > 10) {
      return {
        isValid: false,
        message: '标签数量不能超过10个'
      };
    }
    
    for (let tag of tags) {
      const result = this.validateTag(tag);
      if (!result.isValid) {
        return result;
      }
    }
    
    return {
      isValid: true,
      message: ''
    };
  },

  /**
   * 验证完整的备忘录数据
   * @param {Object} memoData - 备忘录数据
   * @returns {Object} 验证结果 {isValid, errors}
   */
  validateMemo(memoData) {
    const errors = [];
    
    // 验证标题
    const titleResult = this.validateMemoTitle(memoData.title);
    if (!titleResult.isValid) {
      errors.push(titleResult.message);
    }
    
    // 验证内容
    const contentResult = this.validateMemoContent(memoData.content);
    if (!contentResult.isValid) {
      errors.push(contentResult.message);
    }
    
    // 验证分类
    if (memoData.category) {
      const categoryResult = this.validateCategory(memoData.category);
      if (!categoryResult.isValid) {
        errors.push(categoryResult.message);
      }
    }
    
    // 验证优先级
    if (memoData.priority) {
      const priorityResult = this.validatePriority(memoData.priority);
      if (!priorityResult.isValid) {
        errors.push(priorityResult.message);
      }
    }
    
    // 验证标签
    if (memoData.tags) {
      const tagsResult = this.validateTags(memoData.tags);
      if (!tagsResult.isValid) {
        errors.push(tagsResult.message);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * 验证JSON数据
   * @param {String} jsonString - JSON字符串
   * @returns {Object} 验证结果 {isValid, data, message}
   */
  validateJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return {
        isValid: true,
        data,
        message: ''
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        message: 'JSON格式错误: ' + error.message
      };
    }
  },

  /**
   * 清理字符串（移除首尾空格和多余空格）
   * @param {String} str - 字符串
   * @returns {String} 清理后的字符串
   */
  sanitizeString(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    
    return str.trim().replace(/\s+/g, ' ');
  },

  /**
   * 转义HTML特殊字符
   * @param {String} str - 字符串
   * @returns {String} 转义后的字符串
   */
  escapeHTML(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return str.replace(/[&<>"']/g, char => map[char]);
  },

  /**
   * 验证文件类型
   * @param {File} file - 文件对象
   * @param {Array} allowedTypes - 允许的文件类型
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateFileType(file, allowedTypes = []) {
    if (!file) {
      return {
        isValid: false,
        message: '请选择文件'
      };
    }
    
    if (allowedTypes.length === 0) {
      return {
        isValid: true,
        message: ''
      };
    }
    
    const fileType = file.type || '';
    const fileName = file.name || '';
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    const isValid = allowedTypes.some(type => {
      if (type.includes('*')) {
        // MIME类型匹配 (例如: image/*)
        const prefix = type.split('/')[0];
        return fileType.startsWith(prefix);
      } else if (type.startsWith('.')) {
        // 扩展名匹配
        return fileExtension === type.substring(1);
      } else {
        // 完整MIME类型匹配
        return fileType === type;
      }
    });
    
    return {
      isValid,
      message: isValid ? '' : `不支持的文件类型，仅支持: ${allowedTypes.join(', ')}`
    };
  },

  /**
   * 验证文件大小
   * @param {File} file - 文件对象
   * @param {Number} maxSizeInMB - 最大文件大小（MB）
   * @returns {Object} 验证结果 {isValid, message}
   */
  validateFileSize(file, maxSizeInMB = 10) {
    if (!file) {
      return {
        isValid: false,
        message: '请选择文件'
      };
    }
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    if (file.size > maxSizeInBytes) {
      return {
        isValid: false,
        message: `文件大小不能超过${maxSizeInMB}MB`
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
