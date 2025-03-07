// 内容脚本，在知乎文章页面上执行

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get_article_info') {
    const articleInfo = getArticleInfo();
    sendResponse(articleInfo);
  }
});

// 获取文章信息
function getArticleInfo() {
  // 获取文章标题
  const title = document.querySelector('h1.Post-Title')?.textContent ||
               document.querySelector('h1.QuestionHeader-title')?.textContent ||
               document.title;
  
  // 获取文章内容
  const content = document.querySelector('.Post-RichText')?.innerHTML ||
                 document.querySelector('.QuestionAnswer-content')?.innerHTML ||
                 '';
  
  // 获取作者信息
  const authorElement = document.querySelector('.AuthorInfo-name') ||
                       document.querySelector('.UserLink-link');
  const author = authorElement ? authorElement.textContent.trim() : '未知作者';
  
  // 获取文章摘要
  const summaryElement = document.querySelector('.Post-Summary') ||
                        document.querySelector('.RichText.ztext.Post-RichText');
  const summary = summaryElement ? 
                 summaryElement.textContent.substring(0, 200) + '...' : 
                 '';
  
  // 获取标签
  const tagElements = document.querySelectorAll('.Tag');
  const tags = Array.from(tagElements).map(tag => tag.textContent.trim());
  
  // 获取封面图片
  let coverImage = '';
  const imgElement = document.querySelector('.RichContent-cover img') ||
                    document.querySelector('.Post-RichText img');
  if (imgElement && imgElement.src) {
    coverImage = imgElement.src;
  }
  
  return {
    title,
    content,
    author,
    summary,
    tags,
    coverImage,
    url: window.location.href,
    publishTime: new Date().toISOString()
  };
}

// 在页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  console.log('知乎文章同步助手已加载');
});