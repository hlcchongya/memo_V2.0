/**
 * 备忘录业务逻辑服务
 * 处理备忘录的增删改查和高级功能
 */

class MemoService {
  /**
   * 构造函数
   * @param {StorageManager} storageManager - 存储管理器实例
   */
  constructor(storageManager) {
    this.storage = storageManager;
    this.storageKey = 'memos';
    this.memos = this.loadMemos();
  }

  /**
   * 从存储中加载所有备忘录
   * @returns {Array} 备忘录数组
   */
  loadMemos() {
    const memosData = this.storage.get(this.storageKey, []);
    return memosData.map(data => Memo.fromObject(data));
  }

  /**
   * 保存所有备忘录到存储
   * @returns {Boolean} 是否保存成功
   */
  saveMemos() {
    const memosData = this.memos.map(memo => memo.toObject());
    return this.storage.set(this.storageKey, memosData);
  }

  /**
   * 创建新备忘录
   * @param {Object} memoData - 备忘录数据
   * @returns {Object} 创建结果 {success, memo, errors}
   */
  createMemo(memoData) {
    const result = {
      success: false,
      memo: null,
      errors: []
    };

    try {
      // 创建备忘录实例
      const memo = new Memo(memoData);

      // 验证数据
      const validation = memo.validate();
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // 添加到列表
      this.memos.push(memo);

      // 保存到存储
      if (this.saveMemos()) {
        result.success = true;
        result.memo = memo;
      } else {
        result.errors.push('保存失败');
        this.memos.pop(); // 回滚
      }

      return result;
    } catch (error) {
      result.errors.push('创建失败: ' + error.message);
      return result;
    }
  }

  /**
   * 获取所有备忘录
   * @returns {Array} 备忘录数组
   */
  getAllMemos() {
    return [...this.memos];
  }

  /**
   * 根据ID获取备忘录
   * @param {String} id - 备忘录ID
   * @returns {Memo|null} 备忘录实例或null
   */
  getMemoById(id) {
    return this.memos.find(memo => memo.id === id) || null;
  }

  /**
   * 更新备忘录
   * @param {String} id - 备忘录ID
   * @param {Object} updates - 更新的字段
   * @returns {Object} 更新结果 {success, memo, errors}
   */
  updateMemo(id, updates) {
    const result = {
      success: false,
      memo: null,
      errors: []
    };

    try {
      const memo = this.getMemoById(id);
      if (!memo) {
        result.errors.push('备忘录不存在');
        return result;
      }

      // 保存旧数据用于回滚
      const oldData = memo.toObject();

      // 更新数据
      memo.update(updates);

      // 验证更新后的数据
      const validation = memo.validate();
      if (!validation.isValid) {
        result.errors = validation.errors;
        // 回滚
        Object.assign(memo, Memo.fromObject(oldData));
        return result;
      }

      // 保存到存储
      if (this.saveMemos()) {
        result.success = true;
        result.memo = memo;
      } else {
        result.errors.push('保存失败');
        // 回滚
        Object.assign(memo, Memo.fromObject(oldData));
      }

      return result;
    } catch (error) {
      result.errors.push('更新失败: ' + error.message);
      return result;
    }
  }

  /**
   * 删除备忘录
   * @param {String} id - 备忘录ID
   * @returns {Object} 删除结果 {success, errors}
   */
  deleteMemo(id) {
    const result = {
      success: false,
      errors: []
    };

    try {
      const index = this.memos.findIndex(memo => memo.id === id);
      if (index === -1) {
        result.errors.push('备忘录不存在');
        return result;
      }

      // 删除备忘录
      const deleted = this.memos.splice(index, 1);

      // 保存到存储
      if (this.saveMemos()) {
        result.success = true;
      } else {
        result.errors.push('删除失败');
        // 回滚
        this.memos.splice(index, 0, ...deleted);
      }

      return result;
    } catch (error) {
      result.errors.push('删除失败: ' + error.message);
      return result;
    }
  }

  /**
   * 切换备忘录完成状态
   * @param {String} id - 备忘录ID
   * @returns {Object} 切换结果 {success, memo, errors}
   */
  toggleMemoComplete(id) {
    const result = {
      success: false,
      memo: null,
      errors: []
    };

    try {
      const memo = this.getMemoById(id);
      if (!memo) {
        result.errors.push('备忘录不存在');
        return result;
      }

      memo.toggleComplete();

      if (this.saveMemos()) {
        result.success = true;
        result.memo = memo;
      } else {
        result.errors.push('保存失败');
        memo.toggleComplete(); // 回滚
      }

      return result;
    } catch (error) {
      result.errors.push('切换状态失败: ' + error.message);
      return result;
    }
  }

  /**
   * 搜索备忘录（标题和内容）
   * @param {String} keyword - 搜索关键词
   * @returns {Array} 匹配的备忘录数组
   */
  searchMemos(keyword) {
    if (!keyword || keyword.trim() === '') {
      return this.getAllMemos();
    }

    const lowerKeyword = keyword.toLowerCase();
    return this.memos.filter(memo => {
      const titleMatch = memo.title.toLowerCase().includes(lowerKeyword);
      const contentMatch = memo.content.toLowerCase().includes(lowerKeyword);
      return titleMatch || contentMatch;
    });
  }

  /**
   * 按分类筛选备忘录
   * @param {String} category - 分类名称
   * @returns {Array} 筛选后的备忘录数组
   */
  filterByCategory(category) {
    if (!category || category === '全部') {
      return this.getAllMemos();
    }
    return this.memos.filter(memo => memo.category === category);
  }

  /**
   * 按优先级筛选备忘录
   * @param {String} priority - 优先级
   * @returns {Array} 筛选后的备忘录数组
   */
  filterByPriority(priority) {
    if (!priority || priority === '全部') {
      return this.getAllMemos();
    }
    return this.memos.filter(memo => memo.priority === priority);
  }

  /**
   * 按标签筛选备忘录
   * @param {String} tag - 标签名称
   * @returns {Array} 筛选后的备忘录数组
   */
  filterByTag(tag) {
    if (!tag) {
      return this.getAllMemos();
    }
    return this.memos.filter(memo => memo.tags.includes(tag));
  }

  /**
   * 按完成状态筛选备忘录
   * @param {Boolean} isCompleted - 是否已完成
   * @returns {Array} 筛选后的备忘录数组
   */
  filterByStatus(isCompleted) {
    return this.memos.filter(memo => memo.isCompleted === isCompleted);
  }

  /**
   * 组合筛选
   * @param {Object} filters - 筛选条件 {category, priority, tag, isCompleted, keyword}
   * @returns {Array} 筛选后的备忘录数组
   */
  filterMemos(filters = {}) {
    let results = this.getAllMemos();

    // 按分类筛选
    if (filters.category && filters.category !== '全部') {
      results = results.filter(memo => memo.category === filters.category);
    }

    // 按优先级筛选
    if (filters.priority && filters.priority !== '全部') {
      results = results.filter(memo => memo.priority === filters.priority);
    }

    // 按标签筛选
    if (filters.tag) {
      results = results.filter(memo => memo.tags.includes(filters.tag));
    }

    // 按完成状态筛选
    if (filters.isCompleted !== undefined) {
      results = results.filter(memo => memo.isCompleted === filters.isCompleted);
    }

    // 按关键词搜索
    if (filters.keyword && filters.keyword.trim() !== '') {
      const lowerKeyword = filters.keyword.toLowerCase();
      results = results.filter(memo => {
        const titleMatch = memo.title.toLowerCase().includes(lowerKeyword);
        const contentMatch = memo.content.toLowerCase().includes(lowerKeyword);
        return titleMatch || contentMatch;
      });
    }

    return results;
  }

  /**
   * 排序备忘录
   * @param {Array} memos - 备忘录数组
   * @param {String} sortBy - 排序字段 (createdAt|updatedAt|priority|title)
   * @param {String} order - 排序顺序 (asc|desc)
   * @returns {Array} 排序后的备忘录数组
   */
  sortMemos(memos, sortBy = 'createdAt', order = 'desc') {
    const sorted = [...memos];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
        case 'updatedAt':
          comparison = a[sortBy] - b[sortBy];
          break;
        
        case 'priority':
          const priorityOrder = { '高': 3, '中': 2, '低': 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        
        default:
          comparison = 0;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * 获取所有标签
   * @returns {Array} 标签数组（去重）
   */
  getAllTags() {
    const tagsSet = new Set();
    this.memos.forEach(memo => {
      memo.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStatistics() {
    const total = this.memos.length;
    const completed = this.memos.filter(m => m.isCompleted).length;
    const pending = total - completed;

    const byCategory = {
      '工作': 0,
      '生活': 0,
      '学习': 0,
      '其他': 0
    };

    const byPriority = {
      '高': 0,
      '中': 0,
      '低': 0
    };

    this.memos.forEach(memo => {
      byCategory[memo.category]++;
      byPriority[memo.priority]++;
    });

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory,
      byPriority,
      totalTags: this.getAllTags().length
    };
  }

  /**
   * 批量删除备忘录
   * @param {Array} ids - 备忘录ID数组
   * @returns {Object} 删除结果 {success, deleted, errors}
   */
  batchDeleteMemos(ids) {
    const result = {
      success: false,
      deleted: 0,
      errors: []
    };

    try {
      const deletedMemos = [];
      
      ids.forEach(id => {
        const index = this.memos.findIndex(memo => memo.id === id);
        if (index !== -1) {
          deletedMemos.push({ index, memo: this.memos[index] });
          this.memos.splice(index, 1);
          result.deleted++;
        } else {
          result.errors.push(`备忘录 ${id} 不存在`);
        }
      });

      if (this.saveMemos()) {
        result.success = true;
      } else {
        result.errors.push('保存失败');
        // 回滚
        deletedMemos.sort((a, b) => a.index - b.index);
        deletedMemos.forEach(item => {
          this.memos.splice(item.index, 0, item.memo);
        });
      }

      return result;
    } catch (error) {
      result.errors.push('批量删除失败: ' + error.message);
      return result;
    }
  }

  /**
   * 清空所有已完成的备忘录
   * @returns {Object} 清空结果 {success, deleted, errors}
   */
  clearCompleted() {
    const completedIds = this.memos
      .filter(memo => memo.isCompleted)
      .map(memo => memo.id);
    
    return this.batchDeleteMemos(completedIds);
  }

  /**
   * 导出所有备忘录数据
   * @returns {Object} 导出的数据对象
   */
  exportData() {
    return {
      version: '1.0',
      timestamp: Date.now(),
      memos: this.memos.map(memo => memo.toObject()),
      statistics: this.getStatistics()
    };
  }

  /**
   * 导入备忘录数据
   * @param {Object} data - 导入的数据对象
   * @param {Boolean} merge - 是否合并（false则覆盖）
   * @returns {Object} 导入结果 {success, imported, errors}
   */
  importData(data, merge = false) {
    const result = {
      success: false,
      imported: 0,
      errors: []
    };

    try {
      if (!data || !data.memos || !Array.isArray(data.memos)) {
        result.errors.push('无效的数据格式');
        return result;
      }

      const backupMemos = [...this.memos];

      if (!merge) {
        this.memos = [];
      }

      data.memos.forEach((memoData, index) => {
        try {
          const memo = Memo.fromObject(memoData);
          const validation = memo.validate();
          
          if (validation.isValid) {
            // 检查是否已存在（避免ID冲突）
            if (!this.getMemoById(memo.id)) {
              this.memos.push(memo);
              result.imported++;
            } else if (merge) {
              // 合并模式下，如果ID已存在则生成新ID
              memo.id = memo.generateId();
              this.memos.push(memo);
              result.imported++;
            }
          } else {
            result.errors.push(`第 ${index + 1} 条数据无效: ${validation.errors.join(', ')}`);
          }
        } catch (error) {
          result.errors.push(`导入第 ${index + 1} 条数据失败: ${error.message}`);
        }
      });

      if (this.saveMemos()) {
        result.success = result.errors.length === 0;
      } else {
        result.errors.push('保存失败');
        this.memos = backupMemos; // 回滚
      }

      return result;
    } catch (error) {
      result.errors.push('导入失败: ' + error.message);
      return result;
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoService;
}
