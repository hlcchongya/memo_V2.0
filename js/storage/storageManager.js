/**
 * 本地存储管理器
 * 封装 localStorage 操作，提供统一的数据持久化接口
 */

class StorageManager {
  /**
   * 构造函数
   * @param {String} namespace - 命名空间，用于隔离不同应用的数据
   */
  constructor(namespace = 'LocalMemo') {
    this.namespace = namespace;
    this.storage = window.localStorage;
  }

  /**
   * 生成完整的存储键名
   * @param {String} key - 键名
   * @returns {String} 带命名空间的键名
   */
  getKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * 保存数据
   * @param {String} key - 键名
   * @param {*} value - 要保存的值
   * @returns {Boolean} 是否保存成功
   */
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(this.getKey(key), serializedValue);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      if (error.name === 'QuotaExceededError') {
        console.error('存储空间已满');
      }
      return false;
    }
  }

  /**
   * 获取数据
   * @param {String} key - 键名
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储的值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const serializedValue = this.storage.getItem(this.getKey(key));
      if (serializedValue === null) {
        return defaultValue;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('读取数据失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除数据
   * @param {String} key - 键名
   * @returns {Boolean} 是否删除成功
   */
  remove(key) {
    try {
      this.storage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据（仅清空当前命名空间的数据）
   * @returns {Boolean} 是否清空成功
   */
  clear() {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => {
        this.storage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }

  /**
   * 获取所有键名（当前命名空间）
   * @returns {Array} 键名数组
   */
  getAllKeys() {
    const keys = [];
    const prefix = this.namespace + ':';
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * 检查键是否存在
   * @param {String} key - 键名
   * @returns {Boolean} 是否存在
   */
  has(key) {
    return this.storage.getItem(this.getKey(key)) !== null;
  }

  /**
   * 获取存储数据的大小（字节）
   * @returns {Number} 存储大小
   */
  getSize() {
    let size = 0;
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      const value = this.storage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    });
    
    return size;
  }

  /**
   * 获取存储数据的大小（可读格式）
   * @returns {String} 格式化的大小
   */
  getFormattedSize() {
    const bytes = this.getSize();
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 导出所有数据
   * @returns {Object} 所有数据的对象
   */
  exportData() {
    const data = {};
    const keys = this.getAllKeys();
    
    keys.forEach(fullKey => {
      const key = fullKey.replace(this.namespace + ':', '');
      data[key] = this.get(key);
    });
    
    return {
      version: '1.0',
      timestamp: Date.now(),
      namespace: this.namespace,
      data: data
    };
  }

  /**
   * 导入数据
   * @param {Object} exportedData - 导出的数据对象
   * @param {Boolean} clearExisting - 是否清空现有数据
   * @returns {Object} 导入结果 {success, imported, errors}
   */
  importData(exportedData, clearExisting = false) {
    const result = {
      success: false,
      imported: 0,
      errors: []
    };

    try {
      // 验证数据格式
      if (!exportedData || !exportedData.data) {
        result.errors.push('无效的数据格式');
        return result;
      }

      // 清空现有数据（如果需要）
      if (clearExisting) {
        this.clear();
      }

      // 导入数据
      const data = exportedData.data;
      Object.keys(data).forEach(key => {
        try {
          this.set(key, data[key]);
          result.imported++;
        } catch (error) {
          result.errors.push(`导入 ${key} 失败: ${error.message}`);
        }
      });

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push('导入失败: ' + error.message);
      return result;
    }
  }

  /**
   * 获取剩余存储空间（估算）
   * @returns {Number} 剩余空间（字节）
   */
  getRemainingSpace() {
    // localStorage 通常限制为 5-10MB
    const maxSize = 5 * 1024 * 1024; // 假设 5MB
    const usedSize = this.getSize();
    return Math.max(0, maxSize - usedSize);
  }

  /**
   * 检查是否有足够的存储空间
   * @param {Number} requiredBytes - 需要的字节数
   * @returns {Boolean} 是否有足够空间
   */
  hasSpace(requiredBytes) {
    return this.getRemainingSpace() >= requiredBytes;
  }

  /**
   * 批量保存数据
   * @param {Object} items - 键值对对象
   * @returns {Object} 保存结果 {success, saved, errors}
   */
  batchSet(items) {
    const result = {
      success: false,
      saved: 0,
      errors: []
    };

    try {
      Object.keys(items).forEach(key => {
        try {
          if (this.set(key, items[key])) {
            result.saved++;
          } else {
            result.errors.push(`保存 ${key} 失败`);
          }
        } catch (error) {
          result.errors.push(`保存 ${key} 失败: ${error.message}`);
        }
      });

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push('批量保存失败: ' + error.message);
      return result;
    }
  }

  /**
   * 批量获取数据
   * @param {Array} keys - 键名数组
   * @returns {Object} 键值对对象
   */
  batchGet(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  /**
   * 批量删除数据
   * @param {Array} keys - 键名数组
   * @returns {Object} 删除结果 {success, deleted, errors}
   */
  batchRemove(keys) {
    const result = {
      success: false,
      deleted: 0,
      errors: []
    };

    try {
      keys.forEach(key => {
        try {
          if (this.remove(key)) {
            result.deleted++;
          } else {
            result.errors.push(`删除 ${key} 失败`);
          }
        } catch (error) {
          result.errors.push(`删除 ${key} 失败: ${error.message}`);
        }
      });

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push('批量删除失败: ' + error.message);
      return result;
    }
  }
}

// 创建默认实例
const storageManager = new StorageManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, storageManager };
}  
