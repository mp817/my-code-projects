document.addEventListener('DOMContentLoaded', function() {
    // 导航菜单交互
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活动状态
            navLinks.forEach(item => item.classList.remove('active'));
            
            // 添加当前点击项的活动状态
            this.classList.add('active');
            
            // 这里可以添加页面内容切换逻辑
            const category = this.textContent;
            console.log(`切换到分类: ${category}`);
            
            // 未来可以根据分类加载不同内容
            // loadCategoryContent(category);
        });
    });
    
    // 卡片悬停效果增强
    const cards = document.querySelectorAll('.card, .tool-card, .category-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // 加载已审核通过的工具
    loadApprovedTools();
    
    // 从localStorage加载已审核通过的工具
    function loadApprovedTools() {
        // 尝试从localStorage获取已审核通过的工具
        const approvedTools = JSON.parse(localStorage.getItem('submittedTools')) || [];
        
        // 如果没有已审核通过的工具，使用默认数据
        if (approvedTools.length === 0) {
            const defaultData = fetchAIGCData();
            renderTools(defaultData.tools);
            return;
        }
        
        // 渲染已审核通过的工具
        renderTools(approvedTools);
    }
    
    // 渲染工具卡片
    function renderTools(tools) {
        // 按类别分组工具
        const toolsByCategory = {};
        
        tools.forEach(tool => {
            const category = tool.category || 'other';
            if (!toolsByCategory[category]) {
                toolsByCategory[category] = [];
            }
            toolsByCategory[category].push(tool);
        });
        
        // 遍历所有类别区域，填充对应的工具
        Object.keys(toolsByCategory).forEach(category => {
            const sectionId = category;
            const section = document.getElementById(sectionId);
            
            if (section) {
                const cardContainer = section.querySelector('.card-container');
                if (cardContainer) {
                    // 清空现有内容
                    cardContainer.innerHTML = '';
                    
                    // 添加该类别下的所有工具
                    toolsByCategory[category].forEach(tool => {
                        const card = createToolCard(tool);
                        cardContainer.appendChild(card);
                    });
                }
            }
        });
        
        // 处理推荐区域
        const recommendationSection = document.getElementById('recommendation');
        if (recommendationSection) {
            const cardContainer = recommendationSection.querySelector('.card-container');
            if (cardContainer) {
                // 清空现有内容
                cardContainer.innerHTML = '';
                
                // 从所有工具中选择最多4个作为推荐
                const recommendedTools = tools.slice(0, 4);
                
                // 添加推荐工具
                recommendedTools.forEach(tool => {
                    const card = createToolCard(tool);
                    cardContainer.appendChild(card);
                });
            }
        }
        
        // 重新添加卡片悬停效果
        const cards = document.querySelectorAll('.card, .tool-card, .category-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }
    
    // 创建工具卡片
    function createToolCard(tool) {
        const card = document.createElement('div');
        card.className = 'card';
        
        // 生成随机背景色
        const colors = ['#f0f4ff', '#fff0f4', '#f0fff4', '#fff8f0', '#f5f0ff', '#fff0f8', '#f0fff8'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 创建图片元素
        const img = document.createElement('img');
        img.alt = tool.name;
        img.src = 'images/placeholder.svg'; // 默认先使用占位图
        
        // 先设置错误处理函数，再设置图片源，避免竞态条件
        img.onerror = function() {
            console.error(`图片加载失败: ${tool.name}`);
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
        
        // 创建卡片HTML结构
        const cardImage = document.createElement('div');
        cardImage.className = 'card-image';
        cardImage.style.backgroundColor = randomColor;
        cardImage.appendChild(img);
        
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.innerHTML = `
            <h3>${tool.name}</h3>
            <p>${tool.brief}</p>
        `;
        
        card.appendChild(cardImage);
        card.appendChild(cardContent);
        
        // 添加点击事件，跳转到工具链接
        card.addEventListener('click', function() {
            window.open(tool.link, '_blank');
        });
        
        return card;
    }
    
    // 模拟从aigc.cn获取数据的函数
    // 实际项目中，这里应该使用fetch API从服务器获取数据
    function fetchAIGCData() {
        // 这里是模拟数据，实际应用中应该从服务器获取
        return {
            recommendations: [
                { title: 'AI绘画', description: '智能生成各种风格的图像', color: '#f0f4ff', icon: 'ai-drawing.svg' },
                { title: '智能写作', description: '快速生成高质量文本内容', color: '#fff0f4', icon: 'ai-writing.svg' },
                { title: '分析工具', description: '智能数据分析与可视化', color: '#f0fff4', icon: 'ai-analysis.svg' },
                { title: '语音识别', description: '准确转换语音为文本', color: '#fff8f0', icon: 'ai-voice.svg' }
            ],
            tools: [
                { title: 'DeepSeek-套件版', description: '强大的AI模型与开发工具', icon: 'deepseek.svg' },
                { title: '百度文心一言', description: '中文AI对话与创作助手', icon: 'baidu.svg' },
                { title: '讯飞星火', description: '智能语音与文本处理', icon: 'xunfei.svg' },
                { title: 'Midjourney', description: '高质量AI图像生成', icon: 'midjourney.svg' },
                { title: 'Claude', description: '智能对话与内容创作', icon: 'claude.svg' },
                { title: 'Stable Diffusion', description: '开源图像生成模型', icon: 'stable-diffusion.svg' },
                { title: 'ChatGPT', description: 'OpenAI的对话模型', icon: 'chatgpt.svg' },
                { title: 'DALL-E', description: 'AI图像生成工具', icon: 'dalle.svg' },
                { title: 'GitHub Copilot', description: 'AI驱动的代码自动补全工具', icon: 'placeholder.svg' },
                { title: 'Amazon CodeWhisperer', description: '亚马逊智能代码助手', icon: 'placeholder.svg' },
                { title: 'Tabnine', description: '基于AI的代码补全工具', icon: 'placeholder.svg' }
            ],
            categories: [
                { title: 'AI绘画', description: '智能生成各种风格图像', icon: 'category-drawing.svg' },
                { title: '文本生成', description: '智能创作各类文本内容', icon: 'category-text.svg' },
                { title: '语音处理', description: '语音识别与合成技术', icon: 'category-voice.svg' },
                { title: '视频制作', description: 'AI辅助视频创作与编辑', icon: 'category-video.svg' },
                { title: '代码助手', description: '智能编程与代码生成', icon: 'category-code.svg' },
                { title: '数据分析', description: 'AI驱动的数据处理工具', icon: 'category-data.svg' }
            ]
        };
    }
    
    // 未来可以实现的数据加载函数
    function loadCategoryContent(category) {
        // 这里可以根据分类加载不同内容
        console.log(`加载${category}分类的内容`);
        
        // 实际应用中，这里应该从服务器获取特定分类的数据
        // const data = await fetch(`/api/category/${category}`);
        // const json = await data.json();
        // renderContent(json);
    }
});