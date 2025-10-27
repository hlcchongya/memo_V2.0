/**
 * 备忘录编辑器UI组件
 * 负责创建和编辑备忘录的表单界面
 */

class MemoEditor {
  /**
   * 构造函数
   * @param {String} containerId - 容器元素ID
   * @param {MemoService} memoService - 备忘录服务实例
   */
  constructor(containerId, memoService) {
    this.container = document.getElementById(containerId);
    this.memoService = memoService;
    this.currentMemo = null;
    this.isEditMode = false;
    this.onSave = null;
    this.onCancel = null;
    
    this.initializeEditor();
  }

  /**
   * 初始化编辑器
   */
  initializeEditor() {
    if (!this.container) {
      console.error('编辑器容器不存在');
      return;
    }

    this.container.innerHTML = `
      <div class="editor-container">
        <div class="editor-header">
          <h2 class="editor-title">新建备忘录</h2>
          <button class="editor-close-btn" title="关闭">✕</button>
        </div>
        
        <div class="editor-body">
          <div class="form-group">
            <label for="memo-title" class="form-label">标题 <span class="required">*</span></label>
            <input 
              type="text" 
              id="memo-title" 
              class="form-input" 
              placeholder="请输入标题（必填）"
              maxlength="100"
            />
            <div class="form-error" id="title-error"></div>
          </div>

          <div class="form-group">
            <label for="memo-content" class="form-label">内容</label>
            <textarea 
              id="memo-content" 
              class="form-textarea" 
              placeholder="请输入内容"
              rows="8"
              maxlength="5000"
            ></textarea>
            <div class="form-hint">
              <span id="content-count">0</span> / 5000 字符
            </div>
            <div class="form-error" id="content-error"></div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="memo-category" class="form-label">分类</label>
              <select id="memo-category" class="form-select">
                <option value="其他">其他</option>
                <option value="工作">工作</option>
                <option value="生活">生活</option>
                <option value="学习">学习</option>
              </select>
            </div>

            <div class="form-group">
              <label for="memo-priority" class="form-label">优先级</label>
              <select id="memo-priority" class="form-select">
                <option value="中">中</option>
                <option value="高">高</option>
                <option value="低">低</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="memo-tags" class="form-label">标签</label>
            <div class="tags-input-wrapper">
              <input 
                type="text" 
                id="memo-tags-input" 
                class="form-input" 
                placeholder="输入标签后按回车添加"
                maxlength="20"
              />
            </div>
            <div class="tags-container" id="memo-tags-container"></div>
            <div class="form-hint">最多可添加10个标签，每个标签最多20字符</div>
            <div class="form-error" id="tags-error"></div>
          </div>

          <div class="form-group" id="completed-group" style="display: none;">
            <label class="checkbox-label">
              <input type="checkbox" id="memo-completed" class="form-checkbox" />
              <span>标记为已完成</span>
            </label>
          </div>
        </div>

        <div class="editor-footer">
          <button class="btn btn-secondary" id="editor-cancel-btn">取消</button>
          <button class="btn btn-primary" id="editor-save-btn">保存</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮
    const closeBtn = this.container.querySelector('.editor-close-btn');
    closeBtn.addEventListener('click', () => this.handleCancel());

    // 取消按钮
    const cancelBtn = this.container.querySelector('#editor-cancel-btn');
    cancelBtn.addEventListener('click', () => this.handleCancel());

    // 保存按钮
    const saveBtn = this.container.querySelector('#editor-save-btn');
    saveBtn.addEventListener('click', () => this.handleSave());

    // 标题输入实时验证
    const titleInput = this.container.querySelector('#memo-title');
    titleInput.addEventListener('input', () => this.validateTitle());
    titleInput.addEventListener('blur', () => this.validateTitle());

    // 内容字符计数
    const contentTextarea = this.container.querySelector('#memo-content');
    contentTextarea.addEventListener('input', () => {
      this.updateCharCount();
      this.validateContent();
    });

    // 标签输入
    const tagsInput = this.container.querySelector('#memo-tags-input');
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag(tagsInput.value.trim());
        tagsInput.value = '';
      }
    });

    // 标签输入验证
    tagsInput.addEventListener('blur', () => {
      const value = tagsInput.value.trim();
      if (value) {
        this.addTag(value);
        tagsInput.value = '';
      }
    });
  }

  /**
   * 显示编辑器（新建模式）
   */
  show() {
    this.isEditMode = false;
    this.currentMemo = null;
    this.resetForm();
    this.container.querySelector('.editor-title').textContent = '新建备忘录';
    this.container.querySelector('#completed-group').style.display = 'none';
    this.container.style.display = 'block';
    this.container.querySelector('#memo-title').focus();
  }

  /**
   * 显示编辑器（编辑模式）
   * @param {String} memoId - 备忘录ID
   */
  edit(memoId) {
    const memo = this.memoService.getMemoById(memoId);
    if (!memo) {
      alert('备忘录不存在');
      return;
    }

    this.isEditMode = true;
    this.currentMemo = memo;
    this.loadMemo(memo);
    this.container.querySelector('.editor-title').textContent = '编辑备忘录';
    this.container.querySelector('#completed-group').style.display = 'block';
    this.container.style.display = 'block';
    this.container.querySelector('#memo-title').focus();
  }

  /**
   * 加载备忘录数据到表单
   * @param {Memo} memo - 备忘录实例
   */
  loadMemo(memo) {
    this.container.querySelector('#memo-title').value = memo.title;
    this.container.querySelector('#memo-content').value = memo.content;
    this.container.querySelector('#memo-category').value = memo.category;
    this.container.querySelector('#memo-priority').value = memo.priority;
    this.container.querySelector('#memo-completed').checked = memo.isCompleted;
    
    // 加载标签
    const tagsContainer = this.container.querySelector('#memo-tags-container');
    tagsContainer.innerHTML = '';
    memo.tags.forEach(tag => {
      this.renderTag(tag);
    });

    this.updateCharCount();
  }

  /**
   * 隐藏编辑器
   */
  hide() {
    this.container.style.display = 'none';
    this.resetForm();
  }

  /**
   * 重置表单
   */
  resetForm() {
    this.container.querySelector('#memo-title').value = '';
    this.container.querySelector('#memo-content').value = '';
    this.container.querySelector('#memo-category').value = '其他';
    this.container.querySelector('#memo-priority').value = '中';
    this.container.querySelector('#memo-completed').checked = false; // ✅ 确保重置
    this.container.querySelector('#memo-tags-container').innerHTML = '';
    this.clearErrors();
    this.updateCharCount();
  }

  /**
   * 处理保存
   */
  handleSave() {
    // 验证表单
    if (!this.validateForm()) {
      return;
    }

    // 收集表单数据
    const formData = this.getFormData();

    let result;
    if (this.isEditMode && this.currentMemo) {
      // 更新模式
      result = this.memoService.updateMemo(this.currentMemo.id, formData);
    } else {
      // 创建模式
      result = this.memoService.createMemo(formData);
    }

    if (result.success) {
      this.hide();
      if (this.onSave) {
        this.onSave(result.memo);
      }
    } else {
      this.showErrors(result.errors);
    }
  }

  /**
   * 处理取消
   */
  handleCancel() {
    if (this.hasUnsavedChanges()) {
      if (confirm('有未保存的更改，确定要取消吗？')) {
        this.hide();
        if (this.onCancel) {
          this.onCancel();
        }
      }
    } else {
      this.hide();
      if (this.onCancel) {
        this.onCancel();
      }
    }
  }

  /**
   * 获取表单数据
   * @returns {Object} 表单数据对象
   */
  getFormData() {
    return {
      title: this.container.querySelector('#memo-title').value.trim(),
      content: this.container.querySelector('#memo-content').value.trim(),
      category: this.container.querySelector('#memo-category').value,
      priority: this.container.querySelector('#memo-priority').value,
      tags: this.getTags(),
      // ✅ 新建模式强制为 false
      isCompleted: this.isEditMode 
        ? this.container.querySelector('#memo-completed').checked 
        : false
    };
  }

  /**
   * 获取所有标签
   * @returns {Array} 标签数组
   */
  getTags() {
    const tagElements = this.container.querySelectorAll('.tag');
    return Array.from(tagElements).map(el => el.dataset.tag);
  }

  /**
   * 添加标签
   * @param {String} tag - 标签文本
   */
  addTag(tag) {
    if (!tag) {
      return;
    }

    // 验证标签
    const validation = Validator.validateTag(tag);
    if (!validation.isValid) {
      this.showError('tags-error', validation.message);
      return;
    }

    // 检查标签数量
    const currentTags = this.getTags();
    if (currentTags.length >= 10) {
      this.showError('tags-error', '最多只能添加10个标签');
      return;
    }

    // 检查重复
    if (currentTags.includes(tag)) {
      this.showError('tags-error', '标签已存在');
      return;
    }

    this.clearError('tags-error');
    this.renderTag(tag);
  }

  /**
   * 渲染标签
   * @param {String} tag - 标签文本
   */
  renderTag(tag) {
    const tagsContainer = this.container.querySelector('#memo-tags-container');
    
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.dataset.tag = tag;
    
    const tagText = document.createElement('span');
    tagText.className = 'tag-text';
    tagText.textContent = tag;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tag-remove';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', () => {
      tagElement.remove();
      this.clearError('tags-error');
    });
    
    tagElement.appendChild(tagText);
    tagElement.appendChild(removeBtn);
    tagsContainer.appendChild(tagElement);
  }

  /**
   * 更新字符计数
   */
  updateCharCount() {
    const content = this.container.querySelector('#memo-content').value;
    const count = content.length;
    this.container.querySelector('#content-count').textContent = count;
  }

  /**
   * 验证表单
   * @returns {Boolean} 是否验证通过
   */
  validateForm() {
    let isValid = true;

    // 验证标题
    if (!this.validateTitle()) {
      isValid = false;
    }

    // 验证内容
    if (!this.validateContent()) {
      isValid = false;
    }

    return isValid;
  }

  /**
   * 验证标题
   * @returns {Boolean} 是否验证通过
   */
  validateTitle() {
    const title = this.container.querySelector('#memo-title').value.trim();
    const validation = Validator.validateMemoTitle(title);
    
    if (!validation.isValid) {
      this.showError('title-error', validation.message);
      return false;
    }
    
    this.clearError('title-error');
    return true;
  }

  /**
   * 验证内容
   * @returns {Boolean} 是否验证通过
   */
  validateContent() {
    const content = this.container.querySelector('#memo-content').value;
    const validation = Validator.validateMemoContent(content);
    
    if (!validation.isValid) {
      this.showError('content-error', validation.message);
      return false;
    }
    
    this.clearError('content-error');
    return true;
  }

  /**
   * 显示错误信息
   * @param {String} errorId - 错误元素ID
   * @param {String} message - 错误消息
   */
  showError(errorId, message) {
    const errorElement = this.container.querySelector(`#${errorId}`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * 清除单个错误
   * @param {String} errorId - 错误元素ID
   */
  clearError(errorId) {
    const errorElement = this.container.querySelector(`#${errorId}`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  /**
   * 显示多个错误
   * @param {Array} errors - 错误消息数组
   */
  showErrors(errors) {
    if (errors.length > 0) {
      alert('保存失败：\n' + errors.join('\n'));
    }
  }

  /**
   * 清除所有错误
   */
  clearErrors() {
    const errorElements = this.container.querySelectorAll('.form-error');
    errorElements.forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  /**
   * 检查是否有未保存的更改
   * @returns {Boolean} 是否有更改
   */
  hasUnsavedChanges() {
    const title = this.container.querySelector('#memo-title').value.trim();
    const content = this.container.querySelector('#memo-content').value.trim();
    const tags = this.getTags();
    
    if (this.isEditMode && this.currentMemo) {
      // 编辑模式：检查是否有修改
      return title !== this.currentMemo.title ||
             content !== this.currentMemo.content ||
             JSON.stringify(tags) !== JSON.stringify(this.currentMemo.tags);
    } else {
      // 新建模式：检查是否有输入
      return title !== '' || content !== '' || tags.length > 0;
    }
  }

  /**
   * 设置保存回调
   * @param {Function} callback - 保存回调函数
   */
  onSaveCallback(callback) {
    this.onSave = callback;
  }

  /**
   * 设置取消回调
   * @param {Function} callback - 取消回调函数
   */
  onCancelCallback(callback) {
    this.onCancel = callback;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoEditor;
}
