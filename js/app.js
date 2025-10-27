/**
 * 本地备忘录应用主入口
 */
class LocalMemoApp {
  constructor() {
    this.service = null;
    this.memoList = null;
    this.editor = null;
    this.currentFilters = {
      search: '',
      category: '',
      priority: '',
      status: ''
    };
    this.currentSort = 'updateTime';
    this.init();
  }

  /**
   * 初始化应用
   */
  init() {
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  /**
   * DOM 就绪后的初始化
   */
  onDOMReady() {
    try {
      Loading.show('正在加载...');
      this.initService();
      this.initComponents();
      this.bindEvents();
      this.loadMemos();
      Loading.hide();
      Toast.success('备忘录加载成功');
    } catch (error) {
      console.error('应用初始化失败:', error);
      Loading.hide();
      Toast.error('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化服务
   */
  initService() {
    const storage = new StorageManager();
    this.service = new MemoService(storage);
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // ✅ 修正：使用正确的选择器获取 DOM 元素
    const memoListContainer = document.querySelector('#memo-list');
    const memoEditorContainer = document.querySelector('#memo-editor-modal'); // ✅ 修改这里
    
    // 检查元素是否存在
    if (!memoListContainer) {
      throw new Error('未找到 #memo-list 元素');
    }
    if (!memoEditorContainer) {
      throw new Error('未找到 #memo-editor-modal 元素');
    }
    
    // 初始化列表组件
    this.memoList = new MemoList(
      memoListContainer,
      (memo) => this.handleEdit(memo),
      (id) => this.handleDelete(id),
      (id) => this.handleToggleComplete(id)
    );

    // ✅ 修正：传入正确的 DOM 元素
    this.editor = new MemoEditor(
      memoEditorContainer,
      (data) => this.handleSave(data),
      () => this.handleCancel()
    );
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 新建备忘录按钮
    const newBtn = document.querySelector('#new-memo-btn');
    newBtn.addEventListener('click', () => this.handleNew());

    // 搜索输入框
    const searchInput = document.querySelector('#search-input');
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.currentFilters.search = e.target.value.trim();
        this.applyFiltersAndSort();
      }, 300); // 防抖 300ms
    });

    // 分类筛选
    const categoryFilter = document.querySelector('#category-filter');
    categoryFilter.addEventListener('change', (e) => {
      this.currentFilters.category = e.target.value;
      this.applyFiltersAndSort();
    });

    // 优先级筛选
    const priorityFilter = document.querySelector('#priority-filter');
    priorityFilter.addEventListener('change', (e) => {
      this.currentFilters.priority = e.target.value;
      this.applyFiltersAndSort();
    });

    // 状态筛选
    const statusFilter = document.querySelector('#status-filter');
    statusFilter.addEventListener('change', (e) => {
      this.currentFilters.status = e.target.value;
      this.applyFiltersAndSort();
    });

    // 排序选择
    const sortSelect = document.querySelector('#sort-select');
    sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.applyFiltersAndSort();
    });

    // 清空筛选按钮
    const clearBtn = document.querySelector('#clear-filters-btn');
    clearBtn.addEventListener('click', () => this.clearFilters());

    // 全局键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N: 新建备忘录
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.handleNew();
      }
      // ESC: 关闭编辑器
      if (e.key === 'Escape') {
        this.handleCancel();
      }
    });
  }

  /**
   * 加载备忘录列表
   */
  loadMemos() {
    const memos = this.service.getAllMemos();
    this.memoList.render(memos);
    this.updateStats();
  }

  /**
   * 应用筛选和排序
   */
  applyFiltersAndSort() {
    let memos = this.service.getAllMemos();

    // 应用筛选
    memos = this.service.filterMemos(memos, this.currentFilters);

    // 应用排序
    memos = this.service.sortMemos(memos, this.currentSort);

    // 渲染列表
    this.memoList.render(memos);
    this.updateStats();
  }

  /**
   * 清空筛选条件
   */
  clearFilters() {
    // 重置筛选条件
    this.currentFilters = {
      search: '',
      category: '',
      priority: '',
      status: ''
    };

    // 重置表单
    document.querySelector('#search-input').value = '';
    document.querySelector('#category-filter').value = '';
    document.querySelector('#priority-filter').value = '';
    document.querySelector('#status-filter').value = '';

    // 重新加载
    this.applyFiltersAndSort();
    Toast.info('已清空筛选条件');
  }

  /**
   * 更新统计信息
   */
  updateStats() {
    const allMemos = this.service.getAllMemos();
    const totalCount = allMemos.length;
    const completedCount = allMemos.filter(m => m.isCompleted).length;
    const activeCount = totalCount - completedCount;

    document.querySelector('#total-count').textContent = totalCount;
    document.querySelector('#active-count').textContent = activeCount;
    document.querySelector('#completed-count').textContent = completedCount;
  }

  /**
   * 处理新建备忘录
   */
  handleNew() {
    this.editor.show();
  }

  /**
   * 处理编辑备忘录
   * @param {Object} memo - 要编辑的备忘录
   */
  handleEdit(memo) {
    this.editor.showEdit(memo);
  }

  /**
   * 处理保存备忘录
   * @param {Object} memoData - 备忘录数据
   */
  handleSave(memoData) {
    try {
      Loading.show('正在保存...');

      if (this.editor.isEditMode) {
        // 编辑模式
        const updatedMemo = this.service.updateMemo(
          this.editor.currentMemo.id,
          memoData
        );
        if (updatedMemo) {
          Toast.success('备忘录更新成功');
        } else {
          Toast.error('备忘录更新失败');
        }
      } else {
        // 新建模式
        const newMemo = this.service.addMemo(memoData);
        Toast.success('备忘录创建成功');
      }

      this.applyFiltersAndSort();
      Loading.hide();
    } catch (error) {
      console.error('保存备忘录失败:', error);
      Loading.hide();
      Toast.error('保存失败，请重试');
    }
  }

  /**
   * 处理删除备忘录
   * @param {string} id - 备忘录ID
   */
  handleDelete(id) {
    const memo = this.service.getMemoById(id);
    if (!memo) {
      Toast.error('备忘录不存在');
      return;
    }

    Modal.confirm(
      '确认删除',
      `确定要删除备忘录"${memo.title}"吗？`,
      () => {
        try {
          Loading.show('正在删除...');
          const success = this.service.deleteMemo(id);
          if (success) {
            Toast.success('备忘录已删除');
            this.applyFiltersAndSort();
          } else {
            Toast.error('删除失败');
          }
          Loading.hide();
        } catch (error) {
          console.error('删除备忘录失败:', error);
          Loading.hide();
          Toast.error('删除失败，请重试');
        }
      }
    );
  }

  /**
   * 处理切换完成状态
   * @param {string} id - 备忘录ID
   */
  handleToggleComplete(id) {
    try {
      const memo = this.service.getMemoById(id);
      if (!memo) {
        Toast.error('备忘录不存在');
        return;
      }

      const success = this.service.toggleComplete(id);
      if (success) {
        const newStatus = !memo.isCompleted;
        Toast.success(newStatus ? '已标记为完成' : '已标记为未完成');
        this.applyFiltersAndSort();
      } else {
        Toast.error('操作失败');
      }
    } catch (error) {
      console.error('切换完成状态失败:', error);
      Toast.error('操作失败，请重试');
    }
  }

  /**
   * 处理取消编辑
   */
  handleCancel() {
    // 编辑器组件内部会处理隐藏和重置
  }
}

// 启动应用
const app = new LocalMemoApp();
