// 存储平台登录状态
let platformStatus = {
  csdn: false,
  cnblogs: false,
  juejin: false,
  toutiao: false
};

// 检查当前页面是否是知乎文章页面
async function checkCurrentTab() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  const currentTab = tabs[0];
  const isZhihu = currentTab.url.includes('zhihu.com');
  
  document.getElementById('not-zhihu').style.display = isZhihu ? 'none' : 'block';
  document.getElementById('zhihu-content').style.display = isZhihu ? 'block' : 'none';
  
  if (isZhihu) {
    // 获取文章标题
    chrome.scripting.executeScript({
      target: {tabId: currentTab.id},
      function: getArticleInfo
    }, (results) => {
      if (results && results[0]) {
        document.getElementById('article-title').textContent = results[0].result.title;
      }
    });
  }
}

// 从知乎页面获取文章信息
function getArticleInfo() {
  const title = document.querySelector('h1.Post-Title')?.textContent ||
               document.querySelector('h1.QuestionHeader-title')?.textContent ||
               document.title;
  const content = document.querySelector('.Post-RichText')?.innerHTML ||
                 document.querySelector('.QuestionAnswer-content')?.innerHTML ||
                 '';
  return {title, content};
}

// 检查各平台登录状态
async function checkLoginStatus() {
  // 从storage中获取保存的登录信息
  const loginInfo = await chrome.storage.local.get(['platformCredentials']);
  const credentials = loginInfo.platformCredentials || {};
  
  // 更新各平台状态显示
  for (const platform in platformStatus) {
    const hasCredentials = credentials[platform];
    platformStatus[platform] = hasCredentials;
    const statusElement = document.getElementById(`${platform}-status`);
    const checkbox = document.getElementById(platform);
    
    if (hasCredentials) {
      statusElement.textContent = '(已登录)';
      statusElement.style.color = '#28a745';
      checkbox.disabled = false;
    } else {
      statusElement.textContent = '(未登录)';
      statusElement.style.color = '#dc3545';
      checkbox.disabled = true;
    }
  }
}

// 同步文章到选中的平台
async function syncArticle() {
  const syncButton = document.getElementById('sync-button');
  const statusMessage = document.getElementById('status-message');
  
  // 获取选中的平台
  const selectedPlatforms = [];
  for (const platform in platformStatus) {
    if (document.getElementById(platform).checked) {
      selectedPlatforms.push(platform);
    }
  }
  
  if (selectedPlatforms.length === 0) {
    statusMessage.textContent = '请选择至少一个同步平台';
    statusMessage.className = 'status error';
    return;
  }
  
  // 禁用同步按钮
  syncButton.disabled = true;
  syncButton.textContent = '同步中...';
  
  try {
    // 获取当前文章内容
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const results = await chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      function: getArticleInfo
    });
    
    const articleInfo = results[0].result;
    
    // 发送消息给background script处理同步
    chrome.runtime.sendMessage({
      type: 'sync_article',
      data: {
        platforms: selectedPlatforms,
        article: articleInfo
      }
    }, (response) => {
      if (response.success) {
        statusMessage.textContent = '同步成功！';
        statusMessage.className = 'status success';
      } else {
        statusMessage.textContent = `同步失败：${response.error}`;
        statusMessage.className = 'status error';
      }
      
      // 恢复按钮状态
      syncButton.disabled = false;
      syncButton.textContent = '开始同步';
    });
  } catch (error) {
    statusMessage.textContent = `发生错误：${error.message}`;
    statusMessage.className = 'status error';
    syncButton.disabled = false;
    syncButton.textContent = '开始同步';
  }
}

// 打开设置页面
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 检查当前页面
  await checkCurrentTab();
  
  // 检查登录状态
  await checkLoginStatus();
  
  // 绑定事件处理
  document.getElementById('sync-button').addEventListener('click', syncArticle);
  document.getElementById('settings-link').addEventListener('click', openSettings);
});