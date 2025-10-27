/**
 * 备忘录编辑器组件
 * 负责备忘录的创建和编辑界面
 */
class MemoEditor {
  constructor(container, onSave, onCancel) {
    this.container = container;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.isEditMode = false;
    this.currentMemo = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // 保存按钮
    const saveBtn = this.container.querySelector('.btn-save');
    saveBtn.addEventListener('click', () => this.handleSave());

    // 取消按钮
    const cancelBtn = this.container.querySelector('.btn-cancel');
    cancelBtn.addEventListener('click', () => this.handleCancel());

    // 标签添加按钮
    const addTagBtn = this.container.querySelector('.btn-add-tag');
    addTagBtn.addEventListener('click', () => this.addTag());

    // 标签输入框回车事件
    const tagInput = this.container.querySelector('#memo-tag-input');
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag();
      }
    });

    // 内容字符计数
    const contentTextarea = this.container.querySelector('#memo-content');
    contentTextarea.addEventListener('input', () => this.updateCharCount());

    // 点击遮罩层关闭
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.handleCancel();
      }
    });

    // 阻止编辑器内部点击冒泡
    this.container.querySelector('.memo-editor').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * 显示新建备忘录界面
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
   * 显示编辑备忘录界面
   * @param {Object} memo - 要编辑的备忘录对象
   */
  showEdit(memo) {
    this.isEditMode = true;
    this.currentMemo = memo;
    
    // ✅ 先清空表单和标签（不调用 resetForm 避免复选框被重置）
    this.container.querySelector('#memo-title').value = '';
    this.container.querySelector('#memo-content').value = '';
    this.container.querySelector('#memo-tags-container').innerHTML = '';
    this.clearErrors();
    
    // ✅ 填充表单数据
    this.container.querySelector('#memo-title').value = memo.title;
    this.container.querySelector('#memo-content').value = memo.content;
    this.container.querySelector('#memo-category').value = memo.category;
    this.container.querySelector('#memo-priority').value = memo.priority;
    
    // ✅ 核心修复：明确设置复选框状态
    const checkbox = this.container.querySelector('#memo-completed');
    // 确保转换为布尔值，防止字符串 'true'/'false' 的问题
    checkbox.checked = Boolean(memo.isCompleted === true || memo.isCompleted === 'true');
    
    // 渲染标签
    this.renderExistingTags(memo.tags);
    
    // 显示编辑器
    this.container.querySelector('.editor-title').textContent = '编辑备忘录';
    this.container.querySelector('#completed-group').style.display = 'flex';
    this.container.style.display = 'block';
    this.updateCharCount();
    this.container.querySelector('#memo-title').focus();
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
    const formData = this.getFormData();
    
    // 验证表单数据
    const validation = Validator.validateMemo(formData);
    if (!validation.isValid) {
      this.showErrors(validation.errors);
      return;
    }

    // 调用保存回调
    this.onSave(formData);
    this.hide();
  }

  /**
   * 获取表单数据
   * @returns {Object} 表单数据对象
   */
  getFormData() {
    const checkbox = this.container.querySelector('#memo-completed');
    
    return {
      title: this.container.querySelector('#memo-title').value.trim(),
      content: this.container.querySelector('#memo-content').value.trim(),
      category: this.container.querySelector('#memo-category').value,
      priority: this.container.querySelector('#memo-priority').value,
      tags: this.getTags(),
      // ✅ 核心修复：新建模式强制为 false，编辑模式读取复选框状态
      isCompleted: this.isEditMode ? checkbox.checked : false
    };
  }

  /**
   * 获取标签列表
   * @returns {Array} 标签数组
   */
  getTags() {
    const tagElements = this.container.querySelectorAll('.tag-item');
    return Array.from(tagElements).map(tag => tag.querySelector('span').textContent);
  }

  /**
   * 添加标签
   */
  addTag() {
    const tagInput = this.container.querySelector('#memo-tag-input');
    const tagText = tagInput.value.trim();

    if (!tagText) {
      return;
    }

    // 验证标签
    const validation = Validator.validateTag(tagText);
    if (!validation.isValid) {
      Toast.error(validation.errors[0]);
      return;
    }

    // 检查重复
    const existingTags = this.getTags();
    if (existingTags.includes(tagText)) {
      Toast.warning('标签已存在');
      return;
    }

    // 检查数量限制
    if (existingTags.length >= 5) {
      Toast.warning('最多只能添加5个标签');
      return;
    }

    // 添加标签元素
    this.renderTag(tagText);
    tagInput.value = '';
    tagInput.focus();
  }

  /**
   * 渲染单个标签
   * @param {string} tagText - 标签文本
   */
  renderTag(tagText) {
    const tagContainer = this.container.querySelector('#memo-tags-container');
    const tagElement = document.createElement('div');
    tagElement.className = 'tag-item';
    tagElement.innerHTML = `
      <span>${tagText}</span>
      <button type="button" class="tag-remove" aria-label="删除标签">×</button>
    `;

    // 删除标签事件
    tagElement.querySelector('.tag-remove').addEventListener('click', () => {
      tagElement.remove();
    });

    tagContainer.appendChild(tagElement);
  }

  /**
   * 渲染现有标签列表
   * @param {Array} tags - 标签数组
   */
  renderExistingTags(tags) {
    if (!Array.isArray(tags)) return;
    tags.forEach(tag => this.renderTag(tag));
  }

  /**
   * 显示错误信息
   * @param {Object} errors - 错误信息对象
   */
  showErrors(errors) {
    this.clearErrors();

    Object.entries(errors).forEach(([field, message]) => {
      const input = this.container.querySelector(`#memo-${field}`);
      if (input) {
        input.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
      }
    });

    Toast.error('请检查表单输入');
  }

  /**
   * 清除错误信息
   */
  clearErrors() {
    this.container.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });
    this.container.querySelectorAll('.error-message').forEach(el => {
      el.remove();
    });
  }

  /**
   * 更新字符计数
   */
  updateCharCount() {
    const textarea = this.container.querySelector('#memo-content');
    const charCount = this.container.querySelector('.char-count');
    const currentLength = textarea.value.length;
    charCount.textContent = `${currentLength}/5000`;

    if (currentLength > 5000) {
      charCount.style.color = 'var(--color-error)';
    } else {
      charCount.style.color = 'var(--color-text-secondary)';
    }
  }

  /**
   * 处理取消
   */
  handleCancel() {
    this.hide();
    if (this.onCancel) {
      this.onCancel();
    }
  }

  /**
   * 隐藏编辑器
   */
  hide() {
    this.container.style.display = 'none';
    this.resetForm();
  }
}

