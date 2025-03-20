document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const submissionsList = document.getElementById('submissionsList');
    const noSubmissions = document.getElementById('noSubmissions');
    const filterButtons = document.querySelectorAll('.filter-button');
    
    // 从localStorage获取提交的工具数据
    function getSubmittedTools() {
        const tools = JSON.parse(localStorage.getItem('submittedTools')) || [];
        return tools;
    }
    
    // 渲染提交列表
    function renderSubmissions(category = 'all') {
        const tools = getSubmittedTools();
        
        // 清空列表
        submissionsList.innerHTML = '';
        
        // 如果没有提交的工具，显示提示信息
        if (tools.length === 0) {
            noSubmissions.style.display = 'block';
            return;
        }
        
        // 隐藏提示信息
        noSubmissions.style.display = 'none';
        
        // 筛选工具
        const filteredTools = category === 'all' ? 
            tools : 
            tools.filter(tool => tool.category === category);
        
        // 如果筛选后没有工具，显示提示信息
        if (filteredTools.length === 0) {
            const noFilteredTools = document.createElement('div');
            noFilteredTools.className = 'no-submissions';
            noFilteredTools.textContent = '该类别暂无提交的工具。';
            submissionsList.appendChild(noFilteredTools);
            return;
        }
        
        // 渲染工具列表
        filteredTools.forEach(tool => {
            const card = createSubmissionCard(tool);
            submissionsList.appendChild(card);
        });
    }
    
    // 创建提交卡片
    function createSubmissionCard(tool) {
        const card = document.createElement('div');
        card.className = 'submission-card';
        
        // 获取类别显示名称
        const categoryName = getCategoryName(tool.category);
        
        // 格式化日期
        const submissionDate = new Date(tool.submissionDate).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // 创建图片元素
        const img = document.createElement('img');
        img.src = 'images/placeholder.svg'; // 默认先使用占位图
        img.alt = `${tool.name} Logo`;
        
        // 先设置错误处理函数，再设置图片源，避免竞态条件
        img.onerror = function() {
            console.error(`Logo加载失败: ${tool.name}`);
            this.onerror = null; // 防止循环触发错误
            this.src = 'images/placeholder.svg';
        };
        
        // 简化图片加载逻辑，统一处理所有类型的图片URL
        if (tool.logoUrl && tool.logoUrl.trim() !== '') {
            try {
                // 检查是否为Base64数据或有效URL
                if (tool.logoUrl.startsWith('data:image/') || tool.logoUrl.startsWith('http') || tool.logoUrl.startsWith('images/')) {
                    img.src = tool.logoUrl;
                } else {
                    console.warn(`无效的图片URL格式: ${tool.name}`);
                    img.src = 'images/placeholder.svg';
                }
            } catch (error) {
                console.error(`加载图片出错: ${tool.name}`, error);
                img.src = 'images/placeholder.svg';
            }
        } else {
            img.src = 'images/placeholder.svg';
        }
        
        // 创建提交卡片HTML结构
        const logoDiv = document.createElement('div');
        logoDiv.className = 'submission-logo';
        logoDiv.appendChild(img);
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'submission-title';
        titleDiv.innerHTML = `
            <h3>${tool.name}</h3>
            <span class="submission-category">${categoryName}</span>
        `;
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'submission-header';
        headerDiv.appendChild(logoDiv);
        headerDiv.appendChild(titleDiv);
        
        card.appendChild(headerDiv);
        card.innerHTML += `
            <div class="submission-brief">${tool.brief}</div>
            <div class="submission-description">${tool.description}</div>
            <a href="${tool.link}" class="submission-link" target="_blank">访问工具</a>
            <div class="submission-date">提交于 ${submissionDate}</div>
        `;
        
        return card;
    }
    
    // 获取类别显示名称
    function getCategoryName(categoryValue) {
        const categories = {
            'ai-writing': 'AI写作平台',
            'ai-drawing': 'AI绘画生成',
            'ai-video': 'AI视频创作',
            'ai-chat': 'AI智能对话',
            'aigc-design': 'AIGC创意设计',
            'aigc-audio': 'AIGC音频处理',
            'aigc-office': 'AIGC办公效率',
            'ai-learning': 'AI学习资源',
            'ai-agent': 'AI智能体',
            'ai-model': 'AI大模型平台',
            'aigc-dev': 'AIGC开发平台',
            'aigc-infra': 'AIGC基础设施',
            'aigc-life': 'AIGC生命科学',
            'aigc-enterprise': 'AIGC企业场景',
            'ai-coding': 'AI编程工具',
            'other': '其他'
        };
        
        return categories[categoryValue] || '其他';
    }
    
    // 筛选按钮点击事件
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前按钮的active类
            this.classList.add('active');
            
            // 获取类别值并渲染列表
            const category = this.getAttribute('data-category');
            renderSubmissions(category);
        });
    });
    
    // 初始渲染
    renderSubmissions();
});