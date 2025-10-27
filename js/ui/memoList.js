/**
 * 备忘录列表UI组件
 * 负责渲染和管理备忘录列表的显示
 */

class MemoList {
  /**
   * 构造函数
   * @param {String} containerId - 容器元素ID
   * @param {MemoService} memoService - 备忘录服务实例
   */
  constructor(containerId, memoService) {
    this.container = document.getElementById(containerId);
    this.memoService = memoService;
    this.currentFilter = {};
    this.currentSort = { by: 'updatedAt', order: 'desc' };
    this.onMemoClick = null;
    this.onMemoDelete = null;
    this.onMemoToggle = null;
  }

  /**
   * 渲染备忘录列表
   * @param {Array} memos - 备忘录数组
   */
  render(memos = null) {
    if (!this.container) {
      console.error('列表容器不存在');
      return;
    }

    // 如果没有传入备忘录，则使用筛选和排序后的列表
    if (!memos) {
      memos = this.memoService.filterMemos(this.currentFilter);
      memos = this.memoService.sortMemos(memos, this.currentSort.by, this.currentSort.order);
    }

    // 清空容器
    this.container.innerHTML = '';

    // 如果没有备忘录，显示空状态
    if (memos.length === 0) {
      this.renderEmptyState();
      return;
    }

    // 渲染每个备忘录
    memos.forEach(memo => {
      const memoElement = this.createMemoElement(memo);
      this.container.appendChild(memoElement);
    });
  }

  /**
   * 创建备忘录元素
   * @param {Memo} memo - 备忘录实例
   * @returns {HTMLElement} 备忘录DOM元素
   */
  createMemoElement(memo) {
    const memoDiv = document.createElement('div');
    memoDiv.className = `memo-item ${memo.isCompleted ? 'completed' : ''} priority-${memo.priority}`;
    memoDiv.dataset.memoId = memo.id;

    // 复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'memo-checkbox';
    checkbox.checked = memo.isCompleted;
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleToggleComplete(memo.id);
    });

    // 内容区域
    const contentDiv = document.createElement('div');
    contentDiv.className = 'memo-content';
    contentDiv.addEventListener('click', () => {
      this.handleMemoClick(memo.id);
    });

    // 标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'memo-title';
    titleDiv.textContent = memo.title;

    // 元信息（分类、优先级、时间）
    const metaDiv = document.createElement('div');
    metaDiv.className = 'memo-meta';

    const categorySpan = document.createElement('span');
    categorySpan.className = 'memo-category';
    categorySpan.textContent = memo.category;

    const prioritySpan = document.createElement('span');
    prioritySpan.className = 'memo-priority';
    prioritySpan.textContent = memo.priority;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'memo-time';
    timeSpan.textContent = DateUtil.smartFormat(memo.updatedAt);

    metaDiv.appendChild(categorySpan);
    metaDiv.appendChild(prioritySpan);
    metaDiv.appendChild(timeSpan);

    // 标签
    if (memo.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'memo-tags';
      
      memo.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'memo-tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });

      contentDiv.appendChild(titleDiv);
      contentDiv.appendChild(metaDiv);
      contentDiv.appendChild(tagsDiv);
    } else {
      contentDiv.appendChild(titleDiv);
      contentDiv.appendChild(metaDiv);
    }

    // 操作按钮区域
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'memo-actions';

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'memo-delete-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDeleteMemo(memo.id);
    });

    actionsDiv.appendChild(deleteBtn);

    // 组装元素
    memoDiv.appendChild(checkbox);
    memoDiv.appendChild(contentDiv);
    memoDiv.appendChild(actionsDiv);

    return memoDiv;
  }

  /**
   * 渲染空状态
   */
  renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无备忘录</div>
      <div class="empty-hint">点击"新建备忘录"按钮创建第一条备忘录</div>
    `;
    this.container.appendChild(emptyDiv);
  }

  /**
   * 处理备忘录点击事件
   * @param {String} memoId - 备忘录ID
   */
  handleMemoClick(memoId) {
    if (this.onMemoClick) {
      this.onMemoClick(memoId);
    }
  }

  /**
   * 处理删除备忘录
   * @param {String} memoId - 备忘录ID
   */
  handleDeleteMemo(memoId) {
    if (confirm('确定要删除这条备忘录吗？')) {
      const result = this.memoService.deleteMemo(memoId);
      
      if (result.success) {
        this.refresh();
        if (this.onMemoDelete) {
          this.onMemoDelete(memoId);
        }
      } else {
        alert('删除失败: ' + result.errors.join(', '));
      }
    }
  }

  /**
   * 处理切换完成状态
   * @param {String} memoId - 备忘录ID
   */
  handleToggleComplete(memoId) {
    const result = this.memoService.toggleMemoComplete(memoId);
    
    if (result.success) {
      this.refresh();
      if (this.onMemoToggle) {
        this.onMemoToggle(memoId, result.memo.isCompleted);
      }
    } else {
      alert('操作失败: ' + result.errors.join(', '));
    }
  }

  /**
   * 设置筛选条件
   * @param {Object} filter - 筛选条件
   */
  setFilter(filter) {
    this.currentFilter = { ...filter };
    this.refresh();
  }

  /**
   * 设置排序方式
   * @param {String} sortBy - 排序字段
   * @param {String} order - 排序顺序
   */
  setSort(sortBy, order = 'desc') {
    this.currentSort = { by: sortBy, order };
    this.refresh();
  }

  /**
   * 刷新列表
   */
  refresh() {
    this.render();
  }

  /**
   * 高亮显示指定备忘录
   * @param {String} memoId - 备忘录ID
   */
  highlightMemo(memoId) {
    // 移除所有高亮
    const allMemos = this.container.querySelectorAll('.memo-item');
    allMemos.forEach(item => item.classList.remove('highlighted'));

    // 添加高亮
    const memoElement = this.container.querySelector(`[data-memo-id="${memoId}"]`);
    if (memoElement) {
      memoElement.classList.add('highlighted');
      memoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * 清空列表
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * 获取当前显示的备忘录数量
   * @returns {Number} 备忘录数量
   */
  getDisplayCount() {
    return this.container.querySelectorAll('.memo-item').length;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoList;
}
