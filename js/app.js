/**
 * LocalMemo 应用主入口
 * 整合所有模块，初始化应用
 */

class LocalMemoApp {
  /**
   * 构造函数
   */
  constructor() {
    // 初始化存储管理器
    this.storage = new StorageManager('LocalMemo');
    
    // 初始化备忘录服务
    this.memoService = new MemoService(this.storage);
    
    // 初始化UI组件
    this.memoList = null;
    this.memoEditor = null;
    this.modal = new Modal();
    
    // 当前筛选和排序状态
    this.currentFilter = {
      category: '全部',
      priority: '全部',
      status: 'all',
      keyword: ''
    };
    
    this.currentSort = {
      by: 'updatedAt',
      order: 'desc'
    };
    
    // 当前主题
    this.currentTheme = this.storage.get('theme', 'light');
  }

  /**
   * 初始化应用
   */
  init() {
    console.log('LocalMemo 应用启动...');
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onDOMReady();
      });
    } else {
      this.onDOMReady();
    }
  }

  /**
   * DOM加载完成后执行
   */
  onDOMReady() {
    // 初始化UI组件
    this.initComponents();
    
    // 绑定事件
    this.bindEvents();
    
    // 应用主题
    this.applyTheme(this.currentTheme);
    
    // 渲染初始数据
    this.renderMemos();
    
    // 更新统计信息
    this.updateStatistics();
    
    console.log('LocalMemo 应用启动完成！');
  }

  /**
   * 初始化UI组件
   */
  initComponents() {
    // 初始化备忘录列表
    this.memoList = new MemoList('memo-list-container', this.memoService);
    
    // 设置列表事件回调
    this.memoList.onMemoClick = (memoId) => {
      this.openEditor(memoId);
    };
    
    this.memoList.onMemoDelete = () => {
      this.renderMemos();
      this.updateStatistics();
      Toast.success('删除成功');
    };
    
    this.memoList.onMemoToggle = (memoId, isCompleted) => {
      Toast.success(isCompleted ? '已标记为完成' : '已标记为未完成');
      this.updateStatistics();
    };
    
    // 初始化备忘录编辑器
    this.memoEditor = new MemoEditor('memo-editor-container', this.memoService);
    
    // 设置编辑器事件回调
    this.memoEditor.onSaveCallback((memo) => {
      this.renderMemos();
      this.updateStatistics();
      Toast.success('保存成功');
      this.memoList.highlightMemo(memo.id);
    });
    
    this.memoEditor.onCancelCallback(() => {
      // 取消编辑，不做特殊处理
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 新建备忘录按钮
    const newMemoBtn = document.getElementById('new-memo-btn');
    if (newMemoBtn) {
      newMemoBtn.addEventListener('click', () => {
        this.openEditor();
      });
    }
    
    // 搜索框
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentFilter.keyword = e.target.value.trim();
          this.applyFilters();
        }, 300);
      });
    }
    
    // 分类筛选
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.currentFilter.category = category;
        this.updateCategoryButtons(category);
        this.applyFilters();
      });
    });
    
    // 优先级筛选
    const prioritySelect = document.getElementById('priority-filter');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.currentFilter.priority = e.target.value;
        this.applyFilters();
      });
    }
    
    // 状态筛选
    const statusBtns = document.querySelectorAll('.status-btn');
    statusBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const status = e.target.dataset.status;
        this.currentFilter.status = status;
        this.updateStatusButtons(status);
        this.applyFilters();
      });
    });
    
    // 排序选择
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [sortBy, order] = e.target.value.split('-');
        this.currentSort = { by: sortBy, order };
        this.renderMemos();
      });
    }
    
    // 清空已完成
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', () => {
        this.clearCompleted();
      });
    }
    
    // 导出数据
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }
    
    // 导入数据
    const importBtn = document.getElementById('import-btn');
    const importInput = document.getElementById('import-input');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
        importInput.click();
      });
      
      importInput.addEventListener('change', (e) => {
        this.importData(e.target.files[0]);
        e.target.value = ''; // 重置input
      });
    }
    
    // 主题切换
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // 显示统计
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
      statsBtn.addEventListener('click', () => {
        this.showStatistics();
      });
    }
  }

  /**
   * 打开编辑器
   * @param {String} memoId - 备忘录ID（可选，用于编辑模式）
   */
  openEditor(memoId = null) {
    if (memoId) {
      this.memoEditor.edit(memoId);
    } else {
      this.memoEditor.show();
    }
  }

  /**
   * 渲染备忘录列表
   */
  renderMemos() {
    const memos = this.getFilteredMemos();
    this.memoList.render(memos);
    this.updateMemoCount(memos.length);
  }

  /**
   * 获取筛选后的备忘录
   * @returns {Array} 备忘录数组
   */
  getFilteredMemos() {
    let filters = { ...this.currentFilter };
    
    // 处理状态筛选
    if (filters.status === 'completed') {
      filters.isCompleted = true;
    } else if (filters.status === 'pending') {
      filters.isCompleted = false;
    }
    delete filters.status;
    
    // 处理"全部"选项
    if (filters.category === '全部') {
      delete filters.category;
    }
    if (filters.priority === '全部') {
      delete filters.priority;
    }
    
    // 筛选和排序
    let memos = this.memoService.filterMemos(filters);
    memos = this.memoService.sortMemos(memos, this.currentSort.by, this.currentSort.order);
    
    return memos;
  }

  /**
   * 应用筛选
   */
  applyFilters() {
    this.renderMemos();
  }

  /**
   * 更新分类按钮状态
   * @param {String} activeCategory - 激活的分类
   */
  updateCategoryButtons(activeCategory) {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      if (btn.dataset.category === activeCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * 更新状态按钮
   * @param {String} activeStatus - 激活的状态
   */
  updateStatusButtons(activeStatus) {
    const statusBtns = document.querySelectorAll('.status-btn');
    statusBtns.forEach(btn => {
      if (btn.dataset.status === activeStatus) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * 更新备忘录数量显示
   * @param {Number} count - 备忘录数量
   */
  updateMemoCount(count) {
    const countElement = document.getElementById('memo-count');
    if (countElement) {
      countElement.textContent = count;
    }
  }

  /**
   * 更新统计信息
   */
  updateStatistics() {
    const stats = this.memoService.getStatistics();
    
    // 更新各个统计数字
    const totalElement = document.getElementById('stat-total');
    if (totalElement) {
      totalElement.textContent = stats.total;
    }
    
    const completedElement = document.getElementById('stat-completed');
    if (completedElement) {
      completedElement.textContent = stats.completed;
    }
    
    const pendingElement = document.getElementById('stat-pending');
    if (pendingElement) {
      pendingElement.textContent = stats.pending;
    }
    
    const completionRateElement = document.getElementById('stat-completion-rate');
    if (completionRateElement) {
      completionRateElement.textContent = stats.completionRate + '%';
    }
  }

  /**
   * 显示统计详情
   */
  showStatistics() {
    const stats = this.memoService.getStatistics();
    
    const message = `
📊 统计信息

总计：${stats.total} 条
已完成：${stats.completed} 条
待完成：${stats.pending} 条
完成率：${stats.completionRate}%

📂 分类统计
工作：${stats.byCategory['工作']} 条
生活：${stats.byCategory['生活']} 条
学习：${stats.byCategory['学习']} 条
其他：${stats.byCategory['其他']} 条

⭐ 优先级统计
高：${stats.byPriority['高']} 条
中：${stats.byPriority['中']} 条
低：${stats.byPriority['低']} 条

🏷️ 标签总数：${stats.totalTags} 个
    `;
    
    this.modal.alert(message.trim(), '统计信息');
  }

  /**
   * 清空已完成的备忘录
   */
  async clearCompleted() {
    const confirmed = await this.modal.confirm(
      '确定要删除所有已完成的备忘录吗？此操作不可恢复。',
      '清空已完成'
    );
    
    if (confirmed) {
      Loading.show('正在删除...');
      
      setTimeout(() => {
        const result = this.memoService.clearCompleted();
        Loading.hide();
        
        if (result.success) {
          Toast.success(`已删除 ${result.deleted} 条备忘录`);
          this.renderMemos();
          this.updateStatistics();
        } else {
          Toast.error('删除失败：' + result.errors.join(', '));
        }
      }, 300);
    }
  }

  /**
   * 导出数据
   */
  exportData() {
    try {
      const data = this.memoService.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `LocalMemo-备份-${DateUtil.format(Date.now(), 'date')}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      Toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      Toast.error('导出失败：' + error.message);
    }
  }

  /**
   * 导入数据
   * @param {File} file - 文件对象
   */
  async importData(file) {
    if (!file) return;
    
    // 验证文件类型
    const validation = Validator.validateFileType(file, ['.json', 'application/json']);
    if (!validation.isValid) {
      Toast.error(validation.message);
      return;
    }
    
    // 验证文件大小（10MB）
    const sizeValidation = Validator.validateFileSize(file, 10);
    if (!sizeValidation.isValid) {
      Toast.error(sizeValidation.message);
      return;
    }
    
    try {
      Loading.show('正在导入数据...');
      
      const text = await file.text();
      const jsonValidation = Validator.validateJSON(text);
      
      if (!jsonValidation.isValid) {
        Loading.hide();
        Toast.error('文件格式错误：' + jsonValidation.message);
        return;
      }
      
      const data = jsonValidation.data;
      
      // 询问是否覆盖现有数据
      Loading.hide();
      const merge = !(await this.modal.confirm(
        '是否覆盖现有数据？\n\n选择"确定"将清空现有数据并导入新数据\n选择"取消"将合并数据',
        '导入确认'
      ));
      
      Loading.show('正在处理数据...');
      
      setTimeout(() => {
        const result = this.memoService.importData(data, merge);
        Loading.hide();
        
        if (result.success) {
          Toast.success(`成功导入 ${result.imported} 条备忘录`);
          this.renderMemos();
          this.updateStatistics();
        } else {
          const errorMsg = result.errors.length > 0 
            ? result.errors.join('\n')
            : '导入失败';
          Toast.error(`导入部分失败\n成功：${result.imported} 条\n失败：${result.errors.length} 条`);
        }
      }, 500);
    } catch (error) {
      Loading.hide();
      console.error('导入失败:', error);
      Toast.error('导入失败：' + error.message);
    }
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    this.currentTheme = newTheme;
    this.storage.set('theme', newTheme);
    Toast.success(`已切换到${newTheme === 'light' ? '亮色' : '暗色'}模式`);
  }

  /**
   * 应用主题
   * @param {String} theme - 主题名称 (light|dark)
   */
  applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    
    // 更新主题按钮图标
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
      themeBtn.title = theme === 'light' ? '切换到暗色模式' : '切换到亮色模式';
    }
  }

  /**
   * 获取应用版本
   * @returns {String} 版本号
   */
  getVersion() {
    return '2.0.0';
  }

  /**
   * 获取应用信息
   * @returns {Object} 应用信息
   */
  getAppInfo() {
    return {
      name: 'LocalMemo',
      version: this.getVersion(),
      description: '本地备忘录应用',
      author: 'LocalMemo Team',
      buildDate: '2025-10-27'
    };
  }
}

// 创建应用实例并初始化
const app = new LocalMemoApp();
app.init();

// 导出到全局（便于调试）
window.LocalMemoApp = app;
