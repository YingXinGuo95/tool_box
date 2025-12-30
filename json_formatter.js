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
        
        // 导入文件按钮事件
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // 文件输入变化事件
        document.getElementById('fileInput').addEventListener('change', (event) => {
            this.handleFileImport(event);
        });
        
        // 导出结果按钮事件
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResult();
        });
        
        // CodeMirror编辑器变化事件（用于实时验证）
        this.codeMirror.on('change', () => {
            this.updateStatus();
        });
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
document.addEventListener('DOMContentLoaded', () => {
    new JsonFormatter();
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

// 扩展JsonFormatter类以添加文件操作功能
Object.assign(JsonFormatter.prototype, {
    /**
     * 处理文件导入
     */
    handleFileImport(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                this.codeMirror.setValue(content);
                this.updateStatus(`文件导入成功: ${file.name}`);
                
                // 清空文件输入，以便可以重复选择同一文件
                event.target.value = '';
            } catch (error) {
                this.showError(`读取文件失败: ${error.message}`);
            }
        };
        
        reader.onerror = () => {
            this.showError('读取文件时发生错误');
        };
        
        reader.readAsText(file);
    },
    
    /**
     * 导出结果到文件
     */
    exportResult() {
        const result = this.codeMirror.getValue();
        
        if (!result) {
            this.showError('没有可导出的内容');
            return;
        }
        
        try {
            const blob = new Blob([result], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `json_${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            this.updateStatus('内容已导出');
        } catch (error) {
            this.showError(`导出失败: ${error.message}`);
        }
    }
});