document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const toolSubmitForm = document.getElementById('toolSubmitForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const toolLogo = document.getElementById('toolLogo');
    const logoFileName = document.getElementById('logoFileName');
    
    // 文件选择显示文件名
    toolLogo.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            logoFileName.textContent = this.files[0].name;
            
            // 图片预览功能
            const reader = new FileReader();
            reader.onload = function(e) {
                // 可以在这里添加图片预览
                // const previewElement = document.createElement('div');
                // previewElement.innerHTML = `<img src="${e.target.result}" alt="Logo Preview" style="max-width: 100px; max-height: 100px;">`;
                // logoFileName.parentNode.appendChild(previewElement);
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            logoFileName.textContent = '未选择文件';
        }
    });
    
    // 表单提交处理
    toolSubmitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 表单验证
        if (!validateForm()) {
            return;
        }
        
        // 获取表单数据
        const toolName = document.getElementById('toolName').value.trim();
        const toolLink = document.getElementById('toolLink').value.trim();
        const toolCategory = document.getElementById('toolCategory').value;
        const toolBrief = document.getElementById('toolBrief').value.trim();
        const toolDescription = document.getElementById('toolDescription').value.trim();
        const contactInfo = document.getElementById('contactInfo').value.trim();
        
        // 处理Logo文件
        let logoUrl = 'images/placeholder.svg';
        // 不再使用URL.createObjectURL创建临时URL，因为它在页面刷新后会失效
        // 实际的图片数据会在saveSubmittedTool函数中转换为Base64
        
        // 创建工具对象
        const tool = {
            id: generateId(),
            name: toolName,
            link: toolLink,
            category: toolCategory,
            brief: toolBrief,
            description: toolDescription,
            logoUrl: logoUrl,
            contactInfo: contactInfo,
            status: 'pending',  // 默认状态为待审核
            submissionDate: new Date().toISOString()
        };
        
        // 保存工具数据
        saveSubmittedTool(tool);
        
        // 显示成功消息
        showSuccess();
        
        // 重置表单
        toolSubmitForm.reset();
        logoFileName.textContent = '未选择文件';
    });
    
    // 表单验证函数
    function validateForm() {
        // 重置错误消息
        errorMessage.style.display = 'none';
        
        // 获取表单字段
        const toolName = document.getElementById('toolName').value.trim();
        const toolLink = document.getElementById('toolLink').value.trim();
        const toolCategory = document.getElementById('toolCategory').value;
        const toolBrief = document.getElementById('toolBrief').value.trim();
        const toolDescription = document.getElementById('toolDescription').value.trim();
        const contactInfo = document.getElementById('contactInfo').value.trim();
        
        // 验证必填字段
        if (!toolName || !toolLink || !toolCategory || !toolBrief || !toolDescription || !contactInfo) {
            showError('请填写所有必填字段');
            return false;
        }
        
        // 验证URL格式
        if (!isValidUrl(toolLink)) {
            showError('请输入有效的工具链接URL');
            return false;
        }
        
        // 验证文件是否选择
        if (!toolLogo.files || !toolLogo.files[0]) {
            showError('请上传应用Logo');
            return false;
        }
        
        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(toolLogo.files[0].type)) {
            showError('Logo只支持JPG和PNG格式');
            return false;
        }
        
        // 验证文件大小（最大2MB）
        if (toolLogo.files[0].size > 2 * 1024 * 1024) {
            showError('Logo文件大小不能超过2MB');
            return false;
        }
        
        return true;
    }
    
    // 显示错误消息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // 滚动到错误消息
        errorMessage.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 验证URL格式
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // 显示成功消息
    function showSuccess() {
        successMessage.style.display = 'block';
        
        // 滚动到成功消息
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        // 5秒后隐藏成功消息
        setTimeout(function() {
            successMessage.style.display = 'none';
        }, 5000);
    }
    
    // 生成唯一ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // 保存提交的工具数据
    function saveSubmittedTool(tool) {
        // 获取现有的工具数据
        let allTools = JSON.parse(localStorage.getItem('allTools')) || [];
        let submittedTools = JSON.parse(localStorage.getItem('submittedTools')) || [];
        
        // 添加新工具
        allTools.push(tool);
        
        // 将图片数据转换为Base64格式以便持久化存储
        if (toolLogo.files && toolLogo.files[0]) {
            // 使用Promise处理异步文件读取
            const readFileAsDataURL = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(file);
                });
            };
            
            // 读取文件并处理结果
            readFileAsDataURL(toolLogo.files[0])
                .then(dataUrl => {
                    try {
                        // 更新工具对象中的logoUrl为Base64数据
                        tool.logoUrl = dataUrl;
                        
                        // 更新allTools中的对应工具
                        allTools[allTools.length - 1].logoUrl = dataUrl;
                        
                        // 添加到待审核工具列表
                        submittedTools.push(tool);
                        
                        // 保存到localStorage
                        localStorage.setItem('allTools', JSON.stringify(allTools));
                        localStorage.setItem('submittedTools', JSON.stringify(submittedTools));
                        
                        console.log('图片保存成功:', tool.name);
                    } catch (error) {
                        console.error('处理图片时出错:', error);
                        handleImageError();
                    }
                })
                .catch(error => {
                    console.error('读取文件时出错:', error);
                    handleImageError();
                });
                
            // 处理图片错误的函数
            function handleImageError() {
                // 出错时使用默认图片
                tool.logoUrl = 'images/placeholder.svg';
                allTools[allTools.length - 1].logoUrl = 'images/placeholder.svg';
                submittedTools.push(tool);
                localStorage.setItem('allTools', JSON.stringify(allTools));
                localStorage.setItem('submittedTools', JSON.stringify(submittedTools));
            }
        } else {
            // 如果没有上传图片，直接保存
            submittedTools.push(tool);
            localStorage.setItem('allTools', JSON.stringify(allTools));
            localStorage.setItem('submittedTools', JSON.stringify(submittedTools));
        }
    }
    
    // 模拟表单提交
    function simulateFormSubmit() {
        // 显示加载状态
        const submitButton = toolSubmitForm.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = '提交中...';
        submitButton.disabled = true;
        
        // 模拟异步提交
        setTimeout(function() {
            // 隐藏加载状态
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // 显示成功消息
            successMessage.style.display = 'block';
            
            // 重置表单
            toolSubmitForm.reset();
            logoFileName.textContent = '未选择文件';
            
            // 滚动到成功消息
            successMessage.scrollIntoView({ behavior: 'smooth' });
            
            // 5秒后隐藏成功消息
            setTimeout(function() {
                successMessage.style.display = 'none';
            }, 5000);
        }, 1500);
    }
});