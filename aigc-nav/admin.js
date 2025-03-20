document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    const toolFormSection = document.getElementById('toolFormSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const toolListBody = document.getElementById('toolListBody');
    const adminTabs = document.querySelectorAll('.admin-tab');
    const addToolBtn = document.getElementById('addToolBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const backToListBtn = document.getElementById('backToListBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const toolForm = document.getElementById('toolForm');
    const formTitle = document.getElementById('formTitle');
    
    // 文件上传预览
    const adminToolLogo = document.getElementById('adminToolLogo');
    const adminLogoFileName = document.getElementById('adminLogoFileName');
    const logoPreview = document.getElementById('logoPreview');
    const adminToolImage = document.getElementById('adminToolImage');
    const adminImageFileName = document.getElementById('adminImageFileName');
    const imagePreview = document.getElementById('imagePreview');
    
    // 管理员账号信息（实际应用中应该从服务器验证）
    const adminCredentials = {
        username: 'admin',
        password: 'admin123'
    };
    
    // 检查登录状态
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn) {
            showAdminSection();
        } else {
            showLoginSection();
        }
    }
    
    // 显示登录界面
    function showLoginSection() {
        loginSection.style.display = 'block';
        adminSection.style.display = 'none';
        toolFormSection.style.display = 'none';
    }
    
    // 显示管理界面
    function showAdminSection() {
        loginSection.style.display = 'none';
        adminSection.style.display = 'block';
        toolFormSection.style.display = 'none';
        
        // 加载工具列表
        loadToolList('pending');
    }
    
    // 显示工具表单
    function showToolForm(isEdit = false, toolId = null) {
        loginSection.style.display = 'none';
        adminSection.style.display = 'none';
        toolFormSection.style.display = 'block';
        
        // 设置表单标题
        formTitle.textContent = isEdit ? '编辑工具' : '添加工具';
        
        // 如果是编辑模式，加载工具数据
        if (isEdit && toolId) {
            loadToolData(toolId);
        } else {
            // 重置表单
            toolForm.reset();
            document.getElementById('toolId').value = '';
            logoPreview.innerHTML = '';
            imagePreview.innerHTML = '';
            adminLogoFileName.textContent = '未选择文件';
            adminImageFileName.textContent = '未选择文件';
        }
    }
    
    // 登录表单提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // 验证登录信息
        if (username === adminCredentials.username && password === adminCredentials.password) {
            // 登录成功
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminSection();
            loginError.style.display = 'none';
        } else {
            // 登录失败
            loginError.style.display = 'block';
        }
    });
    
    // 退出登录
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        showLoginSection();
    });
    
    // 添加工具按钮
    addToolBtn.addEventListener('click', function() {
        showToolForm(false);
    });
    
    // 返回列表按钮
    backToListBtn.addEventListener('click', function() {
        showAdminSection();
    });
    
    // 取消按钮
    cancelBtn.addEventListener('click', function() {
        showAdminSection();
    });
    
    // 标签切换
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            adminTabs.forEach(t => t.classList.remove('active'));
            
            // 添加当前标签的active类
            this.classList.add('active');
            
            // 加载对应状态的工具列表
            const status = this.getAttribute('data-tab');
            loadToolList(status);
        });
    });
    
    // 文件上传预览 - Logo
    adminToolLogo.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            adminLogoFileName.textContent = this.files[0].name;
            
            // 图片预览
            const reader = new FileReader();
            reader.onload = function(e) {
                logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`;
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            adminLogoFileName.textContent = '未选择文件';
            logoPreview.innerHTML = '';
        }
    });
    
    // 文件上传预览 - 展示图片
    adminToolImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            adminImageFileName.textContent = this.files[0].name;
            
            // 图片预览
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Image Preview">`;
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            adminImageFileName.textContent = '未选择文件';
            imagePreview.innerHTML = '';
        }
    });
    
    // 工具表单提交
    toolForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const toolId = document.getElementById('toolId').value;
        const name = document.getElementById('adminToolName').value.trim();
        const link = document.getElementById('adminToolLink').value.trim();
        const category = document.getElementById('adminToolCategory').value;
        const brief = document.getElementById('adminToolBrief').value.trim();
        const description = document.getElementById('adminToolDescription').value.trim();
        const status = document.getElementById('adminToolStatus').value;
        
        // 处理Logo文件
        let logoUrl = '';
        if (adminToolLogo.files && adminToolLogo.files[0]) {
            // 不使用URL.createObjectURL，而是转换为Base64
            // 这里先保留一个临时值，实际的Base64转换在下面异步处理
            logoUrl = 'pending';
        } else if (logoPreview.querySelector('img')) {
            // 如果没有选择新文件但有预览图，保留原来的URL
            logoUrl = logoPreview.querySelector('img').src;
        } else {
            // 默认使用占位图
            logoUrl = 'images/placeholder.svg';
        }
        
        // 处理展示图片文件
        let imageUrl = '';
        if (adminToolImage.files && adminToolImage.files[0]) {
            // 不使用URL.createObjectURL，而是转换为Base64
            // 这里先保留一个临时值，实际的Base64转换在下面异步处理
            imageUrl = 'pending';
        } else if (imagePreview.querySelector('img')) {
            // 如果没有选择新文件但有预览图，保留原来的URL
            imageUrl = imagePreview.querySelector('img').src;
        }
        
        // 创建工具对象
        const tool = {
            id: toolId || generateId(),
            name: name,
            link: link,
            category: category,
            brief: brief,
            description: description,
            logoUrl: logoUrl,
            imageUrl: imageUrl,
            status: status,
            submissionDate: toolId ? getToolById(toolId).submissionDate : new Date().toISOString()
        };
        
        // 保存工具数据
        saveToolData(tool);
        
        // 返回列表页面
        showAdminSection();
    });
    
    // 从localStorage获取所有工具数据
    function getAllTools() {
        return JSON.parse(localStorage.getItem('allTools')) || [];
    }
    
    // 保存所有工具数据到localStorage
    function saveAllTools(tools) {
        localStorage.setItem('allTools', JSON.stringify(tools));
        
        // 同步更新提交工具数据（仅包含已通过审核的工具）
        const approvedTools = tools.filter(tool => tool.status === 'approved');
        localStorage.setItem('submittedTools', JSON.stringify(approvedTools));
    }
    
    // 根据ID获取工具
    function getToolById(id) {
        const tools = getAllTools();
        return tools.find(tool => tool.id === id);
    }
    
    // 保存工具数据
    function saveToolData(tool) {
        const tools = getAllTools();
        
        // 检查是否已存在该工具
        const index = tools.findIndex(t => t.id === tool.id);
        
        // 处理图片文件转Base64
        const processImages = () => {
            // 处理Logo文件
            if (adminToolLogo.files && adminToolLogo.files[0]) {
                const readFileAsDataURL = (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(e);
                        reader.readAsDataURL(file);
                    });
                };
                
                // 读取Logo文件
                readFileAsDataURL(adminToolLogo.files[0])
                    .then(dataUrl => {
                        // 更新工具对象中的logoUrl为Base64数据
                        tool.logoUrl = dataUrl;
                        
                        // 处理展示图片文件
                        if (adminToolImage.files && adminToolImage.files[0]) {
                            return readFileAsDataURL(adminToolImage.files[0]);
                        }
                        return null;
                    })
                    .then(imageDataUrl => {
                        if (imageDataUrl) {
                            tool.imageUrl = imageDataUrl;
                        }
                        
                        // 更新工具列表
                        if (index !== -1) {
                            // 更新现有工具
                            tools[index] = tool;
                        } else {
                            // 添加新工具
                            tools.push(tool);
                        }
                        
                        // 保存数据
                        saveAllTools(tools);
                    })
                    .catch(error => {
                        console.error('处理图片时出错:', error);
                        // 出错时使用默认图片
                        if (tool.logoUrl === 'pending') tool.logoUrl = 'images/placeholder.svg';
                        if (tool.imageUrl === 'pending') tool.imageUrl = '';
                        
                        // 更新工具列表
                        if (index !== -1) {
                            tools[index] = tool;
                        } else {
                            tools.push(tool);
                        }
                        
                        // 保存数据
                        saveAllTools(tools);
                    });
            } else if (adminToolImage.files && adminToolImage.files[0]) {
                // 只处理展示图片
                const readFileAsDataURL = (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(e);
                        reader.readAsDataURL(file);
                    });
                };
                
                readFileAsDataURL(adminToolImage.files[0])
                    .then(dataUrl => {
                        tool.imageUrl = dataUrl;
                        
                        // 更新工具列表
                        if (index !== -1) {
                            tools[index] = tool;
                        } else {
                            tools.push(tool);
                        }
                        
                        // 保存数据
                        saveAllTools(tools);
                    })
                    .catch(error => {
                        console.error('处理图片时出错:', error);
                        if (tool.imageUrl === 'pending') tool.imageUrl = '';
                        
                        // 更新工具列表
                        if (index !== -1) {
                            tools[index] = tool;
                        } else {
                            tools.push(tool);
                        }
                        
                        // 保存数据
                        saveAllTools(tools);
                    });
            } else {
                // 没有新图片文件，直接保存
                if (index !== -1) {
                    tools[index] = tool;
                } else {
                    tools.push(tool);
                }
                
                // 保存数据
                saveAllTools(tools);
            }
        };
        
        // 执行图片处理
        processImages();
    }
    
    // 加载工具数据到表单
    function loadToolData(toolId) {
        const tool = getToolById(toolId);
        
        if (tool) {
            document.getElementById('toolId').value = tool.id;
            document.getElementById('adminToolName').value = tool.name;
            document.getElementById('adminToolLink').value = tool.link;
            document.getElementById('adminToolCategory').value = tool.category;
            document.getElementById('adminToolBrief').value = tool.brief;
            document.getElementById('adminToolDescription').value = tool.description;
            document.getElementById('adminToolStatus').value = tool.status;
            
            // 显示Logo预览
            if (tool.logoUrl) {
                logoPreview.innerHTML = `<img src="${tool.logoUrl}" alt="Logo Preview">`;
                adminLogoFileName.textContent = '已上传图片';
            }
            
            // 显示展示图片预览
            if (tool.imageUrl) {
                imagePreview.innerHTML = `<img src="${tool.imageUrl}" alt="Image Preview">`;
                adminImageFileName.textContent = '已上传图片';
            }
        }
    }
    
    // 加载工具列表
    function loadToolList(statusFilter) {
        const tools = getAllTools();
        
        // 清空列表
        toolListBody.innerHTML = '';
        
        // 筛选工具
        const filteredTools = statusFilter === 'all' ? 
            tools : 
            tools.filter(tool => tool.status === statusFilter);
        
        // 按提交时间倒序排序
        filteredTools.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
        
        // 渲染工具列表
        filteredTools.forEach(tool => {
            const row = createToolRow(tool);
            toolListBody.appendChild(row);
        });
        
        // 如果没有工具，显示提示信息
        if (filteredTools.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7" style="text-align: center; padding: 20px;">暂无${getStatusName(statusFilter)}工具</td>`;
            toolListBody.appendChild(emptyRow);
        }
    }
    
    // 创建工具列表行
    function createToolRow(tool) {
        const row = document.createElement('tr');
        
        // 获取类别显示名称
        const categoryName = getCategoryName(tool.category);
        
        // 格式化日期
        const submissionDate = new Date(tool.submissionDate).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // 创建行内容
        const logoCell = document.createElement('td');
        const logoImg = document.createElement('img');
        logoImg.alt = `${tool.name} Logo`;
        logoImg.className = 'tool-logo-preview';
        logoImg.src = 'images/placeholder.svg'; // 默认图片
        
        // 简化图片加载逻辑，统一处理所有类型的图片URL
        if (tool.logoUrl) {
            try {
                // 直接设置图片源
                logoImg.src = tool.logoUrl;
                
                // 统一的错误处理
                logoImg.onerror = function() {
                    console.error(`管理界面Logo加载失败: ${tool.name}`);
                    this.src = 'images/placeholder.svg';
                };
            } catch (error) {
                console.error(`加载图片出错: ${tool.name}`, error);
                logoImg.src = 'images/placeholder.svg';
            }
        }
        
        logoCell.appendChild(logoImg);
        
        row.appendChild(logoCell);
        row.innerHTML += `
            <td>${tool.name}</td>
            <td>${categoryName}</td>
            <td>${tool.brief}</td>
            <td>${submissionDate}</td>
            <td>
                <span class="tool-status status-${tool.status}">${getStatusName(tool.status)}</span>
            </td>
            <td>
                <div class="tool-actions">
                    <button class="tool-action-btn view" data-id="${tool.id}">查看</button>
                    <button class="tool-action-btn edit" data-id="${tool.id}">编辑</button>
                    <button class="tool-action-btn delete" data-id="${tool.id}">删除</button>
                    ${tool.status === 'pending' ? `
                    <button class="tool-action-btn approve" data-id="${tool.id}">通过</button>
                    <button class="tool-action-btn reject" data-id="${tool.id}">拒绝</button>
                    ` : ''}
                </div>
            </td>
        `;
        
        // 添加事件监听器
        const viewBtn = row.querySelector('.view');
        const editBtn = row.querySelector('.edit');
        const deleteBtn = row.querySelector('.delete');
        
        viewBtn.addEventListener('click', function() {
            const toolId = this.getAttribute('data-id');
            // 查看工具详情
            // 这里可以实现查看详情的功能
            alert(`查看工具: ${tool.name}`);
        });
        
        editBtn.addEventListener('click', function() {
            const toolId = this.getAttribute('data-id');
            showToolForm(true, toolId);
        });
        
        deleteBtn.addEventListener('click', function() {
            const toolId = this.getAttribute('data-id');
            if (confirm(`确定要删除工具 ${tool.name} 吗？`)) {
                deleteTool(toolId);
                loadToolList(document.querySelector('.admin-tab.active').getAttribute('data-tab'));
            }
        });
        
        // 添加审核按钮事件监听器
        if (tool.status === 'pending') {
            const approveBtn = row.querySelector('.approve');
            const rejectBtn = row.querySelector('.reject');
            
            approveBtn.addEventListener('click', function() {
                const toolId = this.getAttribute('data-id');
                if (confirm(`确定要通过工具 ${tool.name} 的审核吗？`)) {
                    updateToolStatus(toolId, 'approved');
                    loadToolList(document.querySelector('.admin-tab.active').getAttribute('data-tab'));
                }
            });
            
            rejectBtn.addEventListener('click', function() {
                const toolId = this.getAttribute('data-id');
                if (confirm(`确定要拒绝工具 ${tool.name} 的审核吗？`)) {
                    updateToolStatus(toolId, 'rejected');
                    loadToolList(document.querySelector('.admin-tab.active').getAttribute('data-tab'));
                }
            });
        }
        
        return row;
    }
    
    // 删除工具
    function deleteTool(id) {
        let tools = getAllTools();
        tools = tools.filter(tool => tool.id !== id);
        saveAllTools(tools);
    }
    
    // 更新工具状态
    function updateToolStatus(id, status) {
        const tools = getAllTools();
        const index = tools.findIndex(tool => tool.id === id);
        
        if (index !== -1) {
            tools[index].status = status;
            saveAllTools(tools);
        }
    }
    
    // 获取状态显示名称
    function getStatusName(status) {
        const statusNames = {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        
        return statusNames[status] || '未知';
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
    
    // 生成唯一ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // 初始化
    checkLoginStatus();
});