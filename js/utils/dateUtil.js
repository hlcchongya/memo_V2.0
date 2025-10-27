/**
 * 日期工具函数
 * 提供日期格式化和处理功能
 */

const DateUtil = {
  /**
   * 格式化时间戳为可读日期字符串
   * @param {Number} timestamp - 时间戳
   * @param {String} format - 格式 (full|date|time|relative)
   * @returns {String} 格式化后的日期字符串
   */
  format(timestamp, format = 'full') {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    switch (format) {
      case 'full':
        return this.formatFull(date);
      case 'date':
        return this.formatDate(date);
      case 'time':
        return this.formatTime(date);
      case 'relative':
        return this.formatRelative(timestamp);
      default:
        return this.formatFull(date);
    }
  },

  /**
   * 完整日期时间格式 (YYYY-MM-DD HH:mm:ss)
   * @param {Date} date - 日期对象
   * @returns {String} 格式化的日期时间
   */
  formatFull(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  /**
   * 日期格式 (YYYY-MM-DD)
   * @param {Date} date - 日期对象
   * @returns {String} 格式化的日期
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  /**
   * 时间格式 (HH:mm:ss)
   * @param {Date} date - 日期对象
   * @returns {String} 格式化的时间
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * 中文友好的日期时间格式
   * @param {Date} date - 日期对象
   * @returns {String} 中文格式的日期时间
   */
  formatChinese(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  },

  /**
   * 相对时间格式 (刚刚、5分钟前、3小时前等)
   * @param {Number} timestamp - 时间戳
   * @returns {String} 相对时间描述
   */
  formatRelative(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    // 未来时间
    if (diff < 0) {
      return this.formatFull(new Date(timestamp));
    }
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 10) {
      return '刚刚';
    } else if (seconds < 60) {
      return `${seconds}秒前`;
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 30) {
      return `${days}天前`;
    } else if (months < 12) {
      return `${months}个月前`;
    } else {
      return `${years}年前`;
    }
  },

  /**
   * 获取星期几
   * @param {Date|Number} dateOrTimestamp - 日期对象或时间戳
   * @returns {String} 星期几（中文）
   */
  getWeekday(dateOrTimestamp) {
    const date = dateOrTimestamp instanceof Date 
      ? dateOrTimestamp 
      : new Date(dateOrTimestamp);
    
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  },

  /**
   * 判断是否是今天
   * @param {Number} timestamp - 时间戳
   * @returns {Boolean} 是否是今天
   */
  isToday(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  },

  /**
   * 判断是否是昨天
   * @param {Number} timestamp - 时间戳
   * @returns {Boolean} 是否是昨天
   */
  isYesterday(timestamp) {
    const date = new Date(timestamp);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return date.getFullYear() === yesterday.getFullYear() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getDate() === yesterday.getDate();
  },

  /**
   * 判断是否是本周
   * @param {Number} timestamp - 时间戳
   * @returns {Boolean} 是否是本周
   */
  isThisWeek(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // 获取本周一的日期
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    
    // 获取本周日的日期
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return date >= monday && date <= sunday;
  },

  /**
   * 智能格式化日期（根据时间自动选择格式）
   * @param {Number} timestamp - 时间戳
   * @returns {String} 智能格式化的日期
   */
  smartFormat(timestamp) {
    if (this.isToday(timestamp)) {
      return '今天 ' + this.formatTime(new Date(timestamp));
    } else if (this.isYesterday(timestamp)) {
      return '昨天 ' + this.formatTime(new Date(timestamp));
    } else if (this.isThisWeek(timestamp)) {
      return this.getWeekday(timestamp) + ' ' + this.formatTime(new Date(timestamp));
    } else {
      return this.formatChinese(new Date(timestamp));
    }
  },

  /**
   * 计算时间差
   * @param {Number} startTimestamp - 开始时间戳
   * @param {Number} endTimestamp - 结束时间戳
   * @returns {Object} 时间差对象 {days, hours, minutes, seconds}
   */
  getDifference(startTimestamp, endTimestamp) {
    const diff = Math.abs(endTimestamp - startTimestamp);
    
    return {
      days: Math.floor(diff / (24 * 60 * 60 * 1000)),
      hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
      minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
      seconds: Math.floor((diff % (60 * 1000)) / 1000),
      totalSeconds: Math.floor(diff / 1000)
    };
  },

  /**
   * 解析日期字符串为时间戳
   * @param {String} dateString - 日期字符串
   * @returns {Number|null} 时间戳或null
   */
  parse(dateString) {
    try {
      const timestamp = Date.parse(dateString);
      return isNaN(timestamp) ? null : timestamp;
    } catch (error) {
      console.error('日期解析失败:', error);
      return null;
    }
  },

  /**
   * 获取当前时间戳
   * @returns {Number} 当前时间戳
   */
  now() {
    return Date.now();
  },

  /**
   * 获取指定天数前/后的时间戳
   * @param {Number} days - 天数（负数表示之前，正数表示之后）
   * @returns {Number} 时间戳
   */
  addDays(days) {
    return Date.now() + (days * 24 * 60 * 60 * 1000);
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateUtil;
}
