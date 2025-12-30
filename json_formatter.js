class JsonFormatter {
    constructor() {
        this.editorElement = document.getElementById('jsonEditor');
        this.errorDisplay = document.getElementById('errorDisplay');
        this.statusIndicator = document.getElementById('statusIndicator');
        
        // 初始化CodeMirror编辑器
        this.codeMirror = CodeMirror(this.editorElement, {
            mode: 'application/json',
            theme: 'monokai',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lint: true
        });
        
        this.initEventListeners();
        
        // 加载上次的编辑器内容
        this.loadLastContent();
    }
    
    initEventListeners() {
        // 格式化按钮事件
        document.getElementById('formatBtn').addEventListener('click', () => {
            this.formatJson();
        });
        
        // 压缩按钮事件
        document.getElementById('compressBtn').addEventListener('click', () => {
            this.compressJson();
        });
        
        // 复制按钮事件
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyResult();
        });
        
        // 清空按钮事件
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });
        
        // 历史记录按钮事件
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistory();
        });
        
        // CodeMirror编辑器变化事件（用于实时验证和保存内容）
        this.codeMirror.on('change', () => {
            this.updateStatus();
            this.saveCurrentContent();
        });
    }
    
    /**
     * SHA-256哈希函数
     */
    async sha256Hash(message) {
        // 将字符串转换为字节数组
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        
        // 使用浏览器crypto API计算哈希
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        // 将哈希值转换为十六进制字符串
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    /**
     * 保存历史记录
     */
    async saveToHistory(jsonString) {
        // 使用SHA-256对JSON字符串进行哈希，用于排重
        const hash = await this.sha256Hash(jsonString);
        
        // 获取现有的历史记录
        let history = JSON.parse(localStorage.getItem('jsonFormatterHistory') || '[]');
        
        // 检查是否已存在相同的哈希值
        const existingIndex = history.findIndex(item => item.hash === hash);
        if (existingIndex !== -1) {
            // 如果已存在，删除旧记录（将其移到前面）
            history.splice(existingIndex, 1);
        }
        
        // 添加新记录到数组开头
        history.unshift({
            hash: hash,
            content: jsonString,
            timestamp: new Date().toISOString()
        });
        
        // 只保留最近的20条记录
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        
        // 保存到localStorage
        localStorage.setItem('jsonFormatterHistory', JSON.stringify(history));
    }
    
    /**
     * 获取历史记录
     */
    getHistory() {
        return JSON.parse(localStorage.getItem('jsonFormatterHistory') || '[]');
    }
    
    /**
     * 显示历史记录
     */
    showHistory() {
        const history = this.getHistory();
        
        // 创建历史记录模态框
        this.createHistoryModal(history);
    }
    
    /**
     * 创建历史记录模态框
     */
    createHistoryModal(history) {
        // 如果已存在模态框，则先移除
        const existingModal = document.getElementById('historyModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建模态框背景
        const modal = document.createElement('div');
        modal.id = 'historyModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        // 创建模态框内容
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            overflow: auto;
            padding: 20px;
            position: relative;
        `;
        
        // 创建标题
        const title = document.createElement('h2');
        title.textContent = '历史记录';
        title.style.marginTop = '0';
        
        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => modal.remove();
        
        // 创建历史记录列表
        const historyList = document.createElement('div');
        historyList.id = 'historyList';
        
        if (history.length === 0) {
            historyList.innerHTML = '<p>暂无历史记录</p>';
        } else {
            history.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.style.cssText = `
                    border: 1px solid #ddd;
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 4px;
                `;
                
                const date = new Date(item.timestamp).toLocaleString();
                
                historyItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${date}</strong>
                            <div style="font-size: 12px; color: #666; margin-top: 5px; max-height: 60px; overflow: hidden;">
                                ${this.formatPreview(item.content)}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-primary" onclick="jsonFormatter.loadHistoryItem('${item.hash}')" style="margin-right: 5px;">加载</button>
                            <button class="btn btn-danger" onclick="jsonFormatter.deleteHistoryItem('${item.hash}'); this.parentElement.parentElement.remove();" style="margin-left: 5px;">删除</button>
                        </div>
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            });
        }
        
        // 创建清空按钮
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '清空历史记录';
        clearBtn.className = 'btn btn-danger';
        clearBtn.style.cssText = `
            margin-top: 15px;
        `;
        clearBtn.onclick = () => {
            if (confirm('确定要清空所有历史记录吗？')) {
                localStorage.removeItem('jsonFormatterHistory');
                historyList.innerHTML = '<p>暂无历史记录</p>';
            }
        };
        
        // 组装模态框内容
        modalContent.appendChild(title);
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(historyList);
        if (history.length > 0) {
            modalContent.appendChild(clearBtn);
        }
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
    }
    
    /**
     * 格式化预览内容
     */
    formatPreview(content) {
        // 简单截取前100个字符作为预览
        let preview = content.substring(0, 100);
        if (content.length > 100) {
            preview += '...';
        }
        return preview.replace(/[<>&]/g, (match) => {
            switch(match) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                default: return match;
            }
        });
    }
    
    /**
     * 加载历史记录项
     */
    loadHistoryItem(hash) {
        const history = this.getHistory();
        const item = history.find(item => item.hash === hash);
        
        if (item) {
            this.codeMirror.setValue(item.content);
            this.hideError();
            this.updateStatus('已加载历史记录');
            
            // 关闭模态框
            const modal = document.getElementById('historyModal');
            if (modal) {
                modal.remove();
            }
        }
    }
    
    /**
     * 删除历史记录项
     */
    deleteHistoryItem(hash) {
        let history = this.getHistory();
        history = history.filter(item => item.hash !== hash);
        localStorage.setItem('jsonFormatterHistory', JSON.stringify(history));
    }
    
    /**
     * 格式化JSON
     */
    formatJson() {
        const input = this.codeMirror.getValue().trim();
        
        if (!input) {
            this.showError('请输入JSON数据');
            return;
        }
        
        try {
            // 解析JSON
            const parsed = this.parseJson(input);
            
            // 格式化输出（使用4个空格缩进）
            const formatted = JSON.stringify(parsed, null, 4);
            
            this.codeMirror.setValue(formatted);
            this.hideError();
            this.updateStatus('格式化成功');
            
            // 保存到历史记录
            this.saveToHistory(formatted);
        } catch (error) {
            this.showError(`JSON格式错误: ${error.message}`);
        }
    }
    
    /**
     * 压缩JSON
     */
    compressJson() {
        const input = this.codeMirror.getValue().trim();
        
        if (!input) {
            this.showError('请输入JSON数据');
            return;
        }
        
        try {
            // 解析JSON
            const parsed = this.parseJson(input);
            
            // 压缩输出（无空格）
            const compressed = JSON.stringify(parsed);
            
            this.codeMirror.setValue(compressed);
            this.hideError();
            this.updateStatus('压缩成功');
            
            // 保存到历史记录
            this.saveToHistory(compressed);
        } catch (error) {
            this.showError(`JSON格式错误: ${error.message}`);
        }
    }
    
    /**
     * 解析JSON的辅助方法，包含更全面的错误处理
     */
    parseJson(jsonString) {
        // 尝试解析JSON
        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            // 如果解析失败，尝试修复常见的JSON问题
            let fixedJson = this.attemptJsonFix(jsonString);
            
            // 尝试再次解析
            try {
                return JSON.parse(fixedJson);
            } catch (secondParseError) {
                // 如果修复后仍然失败，抛出原始错误
                throw parseError;
            }
        }
    }
    
    /**
     * 尝试修复常见的JSON问题
     */
    attemptJsonFix(jsonString) {
        let fixedJson = jsonString;
        
        // 移除尾随逗号
        fixedJson = fixedJson.replace(/,\s*([}\]])/g, '$1');
        
        // 替换单引号为双引号（但不替换值中的单引号）
        // 这是一个简化版本，实际应用中可能需要更复杂的逻辑
        
        return fixedJson;
    }
    
    /**
     * 复制结果到剪贴板
     */
    async copyResult() {
        const result = this.codeMirror.getValue();
        
        if (!result) {
            this.showError('没有可复制的内容');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(result);
            this.updateStatus('已复制到剪贴板');
            
            // 恢复状态提示
            setTimeout(() => {
                this.updateStatus('就绪');
            }, 2000);
        } catch (err) {
            // 如果浏览器不支持navigator.clipboard，则使用旧方法
            this.fallbackCopy(result);
        }
    }
    
    /**
     * 备用复制方法（当navigator.clipboard不可用时）
     */
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.updateStatus('已复制到剪贴板');
            
            // 恢复状态提示
            setTimeout(() => {
                this.updateStatus('就绪');
            }, 2000);
        } catch (err) {
            this.showError('复制失败，请手动复制');
        }
        
        document.body.removeChild(textArea);
    }
    
    /**
     * 清空所有内容
     */
    clearAll() {
        this.codeMirror.setValue('');
        this.hideError();
        this.updateStatus('已清空');
        
        // 恢复状态提示
        setTimeout(() => {
            this.updateStatus('就绪');
        }, 1000);
    }
    
    /**
     * 更新状态指示器
     */
    updateStatus(message = '就绪') {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message;
            
            // 根据状态设置颜色
            if (message.includes('成功')) {
                this.statusIndicator.style.backgroundColor = '#d4edda';
                this.statusIndicator.style.color = '#155724';
            } else if (message.includes('错误') || message.includes('失败')) {
                this.statusIndicator.style.backgroundColor = '#f8d7da';
                this.statusIndicator.style.color = '#721c24';
            } else {
                this.statusIndicator.style.backgroundColor = '#e9ecef';
                this.statusIndicator.style.color = '#6c757d';
            }
        }
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.classList.remove('hidden');
        }
        
        this.updateStatus('错误');
        
        // 设置错误状态的颜色
        if (this.statusIndicator) {
            this.statusIndicator.style.backgroundColor = '#f8d7da';
            this.statusIndicator.style.color = '#721c24';
        }
    }
    
    /**
     * 隐藏错误信息
     */
    hideError() {
        if (this.errorDisplay) {
            this.errorDisplay.classList.add('hidden');
        }
    }
    
    /**
     * 保存当前编辑器内容到localStorage
     */
    saveCurrentContent() {
        const content = this.codeMirror.getValue();
        localStorage.setItem('jsonFormatterLastContent', content);
    }
    
    /**
     * 从localStorage加载上一次的编辑器内容
     */
    loadLastContent() {
        const lastContent = localStorage.getItem('jsonFormatterLastContent');
        if (lastContent !== null) {
            this.codeMirror.setValue(lastContent);
        }
    }
    
    /**
     * JSON语法高亮（改进版）
     * 注意：由于我们使用textarea，无法直接应用HTML样式，
     * 所以这里暂时保留方法但不执行任何操作
     */
    highlightJson() {
        // textarea无法直接应用HTML样式，所以这里不执行任何操作
        // 如果需要语法高亮，需要使用特殊的代码编辑器组件
    }
}

// 页面加载完成后初始化
let jsonFormatter;
document.addEventListener('DOMContentLoaded', () => {
    jsonFormatter = new JsonFormatter();
});

// 添加一些额外的实用功能
class JsonUtils {
    /**
     * 验证JSON格式
     */
    static validateJson(jsonString) {
        try {
            JSON.parse(jsonString);
            return { valid: true, error: null };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * 获取JSON数据类型
     */
    static getJsonType(data) {
        if (data === null) return 'null';
        if (Array.isArray(data)) return 'array';
        return typeof data;
    }
    
    /**
     * 计算JSON数据大小
     */
    static getJsonSize(jsonString) {
        return new Blob([jsonString]).size; // 字节
    }
}

