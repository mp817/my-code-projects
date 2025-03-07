// 设置页面脚本

// 保存平台凭证
async function saveCredentials() {
  const statusMessage = document.getElementById('status-message');
  
  try {
    // 获取各平台输入的凭证
    const platformCredentials = {
      csdn: {
        username: document.getElementById('csdn-username').value,
        password: document.getElementById('csdn-password').value
      },
      cnblogs: {
        username: document.getElementById('cnblogs-username').value,
        password: document.getElementById('cnblogs-password').value
      },
      juejin: {
        username: document.getElementById('juejin-username').value,
        password: document.getElementById('juejin-password').value
      },
      toutiao: {
        username: document.getElementById('toutiao-username').value,
        password: document.getElementById('toutiao-password').value
      }
    };
    
    // 验证平台凭证是否有效
    const validPlatforms = {};
    
    // 只保存有用户名和密码的平台
    for (const platform in platformCredentials) {
      const cred = platformCredentials[platform];
      if (cred.username && cred.password) {
        validPlatforms[platform] = true;
      }
    }
    
    // 保存到chrome.storage
    await chrome.storage.local.set({ platformCredentials, validPlatforms });
    
    // 显示成功消息
    statusMessage.textContent = '设置已保存';
    statusMessage.className = 'status success';
    
    // 3秒后隐藏消息
    setTimeout(() => {
      statusMessage.className = 'status';
    }, 3000);
    
  } catch (error) {
    // 显示错误消息
    statusMessage.textContent = `保存失败：${error.message}`;
    statusMessage.className = 'status error';
  }
}

// 加载已保存的凭证
async function loadCredentials() {
  try {
    const data = await chrome.storage.local.get(['platformCredentials']);
    const credentials = data.platformCredentials || {};
    
    // 填充表单
    for (const platform in credentials) {
      const cred = credentials[platform];
      if (cred) {
        const usernameInput = document.getElementById(`${platform}-username`);
        const passwordInput = document.getElementById(`${platform}-password`);
        
        if (usernameInput && cred.username) {
          usernameInput.value = cred.username;
        }
        
        if (passwordInput && cred.password) {
          passwordInput.value = cred.password;
        }
      }
    }
  } catch (error) {
    console.error('加载凭证失败:', error);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载已保存的凭证
  loadCredentials();
  
  // 绑定保存按钮事件
  document.getElementById('save-btn').addEventListener('click', saveCredentials);
});