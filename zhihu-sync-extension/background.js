// 后台服务脚本，处理跨页面通信和API请求

// 监听来自popup或content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'sync_article') {
    handleArticleSync(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 异步响应
  }
});

// 处理文章同步
async function handleArticleSync(data) {
  const { platforms, article } = data;
  const results = [];
  
  // 获取平台凭证
  const storage = await chrome.storage.local.get(['platformCredentials']);
  const credentials = storage.platformCredentials || {};
  
  // 依次同步到各平台
  for (const platform of platforms) {
    try {
      if (!credentials[platform]) {
        throw new Error(`${getPlatformName(platform)}未登录`);
      }
      
      // 根据不同平台调用不同的同步方法
      const result = await syncToPlatform(platform, article, credentials[platform]);
      results.push({ platform, success: true, result });
    } catch (error) {
      results.push({ platform, success: false, error: error.message });
    }
  }
  
  // 检查是否全部成功
  const allSuccess = results.every(r => r.success);
  
  if (allSuccess) {
    return { success: true, results };
  } else {
    const failedPlatforms = results.filter(r => !r.success)
      .map(r => `${getPlatformName(r.platform)}: ${r.error}`)
      .join(', ');
    return { success: false, error: `部分平台同步失败: ${failedPlatforms}`, results };
  }
}

// 同步到指定平台
async function syncToPlatform(platform, article, credential) {
  // 根据不同平台调用不同的API
  switch (platform) {
    case 'csdn':
      return await syncToCSDN(article, credential);
    case 'cnblogs':
      return await syncToCnblogs(article, credential);
    case 'juejin':
      return await syncToJuejin(article, credential);
    case 'toutiao':
      return await syncToToutiao(article, credential);
    default:
      throw new Error(`不支持的平台: ${platform}`);
  }
}

// 同步到CSDN
async function syncToCSND(article, credential) {
  // 这里是CSDN的API调用逻辑
  // 实际项目中需要根据CSDN的API文档实现
  // 使用credential.username和credential.password进行认证
  console.log(`同步到CSDN: ${article.title}，用户：${credential.username}`);
  
  // 模拟API请求
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ articleId: 'csdn_' + Date.now(), url: 'https://blog.csdn.net/example/article/details/123456' });
    }, 1000);
  });
}

// 同步到博客园
async function syncToCnblogs(article, credential) {
  // 这里是博客园的API调用逻辑
  console.log(`同步到博客园: ${article.title}`);
  
  // 模拟API请求
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ articleId: 'cnblogs_' + Date.now(), url: 'https://www.cnblogs.com/example/p/123456.html' });
    }, 1000);
  });
}

// 同步到掘金
async function syncToJuejin(article, credential) {
  // 这里是掘金的API调用逻辑
  console.log(`同步到掘金: ${article.title}`);
  
  // 模拟API请求
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ articleId: 'juejin_' + Date.now(), url: 'https://juejin.cn/post/123456' });
    }, 1000);
  });
}

// 同步到头条
async function syncToToutiao(article, credential) {
  // 这里是头条的API调用逻辑
  console.log(`同步到头条: ${article.title}`);
  
  // 模拟API请求
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ articleId: 'toutiao_' + Date.now(), url: 'https://mp.toutiao.com/profile_v3/graphic/publish' });
    }, 1000);
  });
}

// 获取平台名称
function getPlatformName(platform) {
  const platformNames = {
    csdn: 'CSDN',
    cnblogs: '博客园',
    juejin: '掘金',
    toutiao: '头条'
  };
  return platformNames[platform] || platform;
}