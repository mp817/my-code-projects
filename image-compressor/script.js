document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const compressionSection = document.getElementById('compressionSection');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const originalDimensions = document.getElementById('originalDimensions');
    const compressedDimensions = document.getElementById('compressedDimensions');
    const compressionRate = document.getElementById('compressionRate');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const maxWidthInput = document.getElementById('maxWidthInput');
    const formatSelect = document.getElementById('formatSelect');
    const compressButton = document.getElementById('compressButton');
    const downloadButton = document.getElementById('downloadButton');
    const uploadButton = document.querySelector('.upload-button');

    // 存储原始图片数据
    let originalFile = null;
    let compressedBlob = null;

    // 拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    // 处理拖放的文件
    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }

    // 处理文件选择
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });

    // 点击上传区域触发文件选择 - 修改这部分逻辑，避免事件冲突
    dropArea.addEventListener('click', function(e) {
        // 如果点击的是上传按钮或其子元素，不做任何处理（让上传按钮自己的事件处理）
        if (e.target === uploadButton || uploadButton.contains(e.target)) {
            return;
        }
        // 否则，触发文件选择
        fileInput.click();
    });
    
    // 确保上传按钮点击时触发文件选择
    uploadButton.addEventListener('click', function(e) {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止事件冒泡
        fileInput.click();
    });

    // 处理上传的文件
    function handleFiles(files) {
        try {
            const file = files[0];
            if (!file.type.match('image.*')) {
                alert('请上传图片文件！');
                return;
            }

            originalFile = file;
            const reader = new FileReader();

            reader.onerror = function(error) {
                console.error('文件读取错误:', error);
                alert('读取文件时发生错误，请重试！');
            };

            reader.onload = function(e) {
                try {
                    // 显示原始图片
                    originalImage.src = e.target.result;
                    originalImage.onerror = function() {
                        console.error('图片加载失败');
                        alert('图片加载失败，请尝试其他图片！');
                    };
                    
                    originalImage.onload = function() {
                        try {
                            // 显示原始图片信息
                            originalDimensions.textContent = `${originalImage.naturalWidth} x ${originalImage.naturalHeight}`;
                            originalSize.textContent = formatFileSize(file.size);
                            
                            // 设置最大宽度输入框的默认值
                            maxWidthInput.placeholder = originalImage.naturalWidth;
                            
                            // 显示压缩区域
                            compressionSection.classList.remove('hidden');
                            
                            // 自动进行一次压缩
                            compressImage();
                        } catch (error) {
                            console.error('处理图片信息时出错:', error);
                            alert('处理图片信息时出错，请重试！');
                        }
                    };
                } catch (error) {
                    console.error('设置图片时出错:', error);
                    alert('设置图片时出错，请重试！');
                }
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('处理文件时出错:', error);
            alert('处理文件时出错，请重试！');
        }
    }

    // 质量滑块事件
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = `${qualitySlider.value}%`;
    });

    // 压缩按钮事件
    compressButton.addEventListener('click', compressImage);

    // 下载按钮事件
    downloadButton.addEventListener('click', function() {
        if (compressedBlob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedBlob);
            
            // 设置文件名
            const originalName = originalFile.name;
            const extension = getOutputExtension();
            const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
            link.download = `${baseName}_compressed.${extension}`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // 压缩图片函数
    function compressImage() {
        if (!originalFile) return;

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onerror = function() {
                console.error('压缩过程中图片加载失败');
                alert('压缩过程中图片加载失败，请重试！');
            };

            img.onload = function() {
                try {
                    // 计算新的尺寸
                    let newWidth = img.width;
                    let newHeight = img.height;
                    
                    // 如果设置了最大宽度，则按比例缩放
                    const maxWidth = parseInt(maxWidthInput.value);
                    if (!isNaN(maxWidth) && maxWidth > 0 && maxWidth < img.width) {
                        const ratio = maxWidth / img.width;
                        newWidth = maxWidth;
                        newHeight = img.height * ratio;
                    }
                    
                    // 设置画布尺寸
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    
                    // 绘制图片
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // 获取压缩质量
                    const quality = parseInt(qualitySlider.value) / 100;
                    
                    // 获取输出格式
                    const outputFormat = getOutputFormat();
                    
                    // 转换为Blob
                    canvas.toBlob(function(blob) {
                        try {
                            if (!blob) {
                                throw new Error('生成压缩图片失败');
                            }
                            
                            compressedBlob = blob;
                            const compressedURL = URL.createObjectURL(blob);
                            
                            // 显示压缩后的图片
                            compressedImage.src = compressedURL;
                            compressedImage.onerror = function() {
                                console.error('压缩后图片显示失败');
                                alert('压缩后图片显示失败，请重试！');
                            };
                            
                            compressedImage.onload = function() {
                                try {
                                    // 显示压缩后的图片信息
                                    compressedDimensions.textContent = `${newWidth} x ${newHeight}`;
                                    compressedSize.textContent = formatFileSize(blob.size);
                                    
                                    // 计算压缩率
                                    const ratio = 100 - (blob.size / originalFile.size * 100);
                                    compressionRate.textContent = `${ratio.toFixed(2)}%`;
                                    
                                    // 启用下载按钮
                                    downloadButton.disabled = false;
                                } catch (error) {
                                    console.error('更新压缩信息时出错:', error);
                                    alert('更新压缩信息时出错，请重试！');
                                }
                            };
                        } catch (error) {
                            console.error('处理压缩后图片时出错:', error);
                            alert('处理压缩后图片时出错，请重试！');
                        }
                    }, outputFormat, quality);
                } catch (error) {
                    console.error('压缩图片时出错:', error);
                    alert('压缩图片时出错，请重试！');
                }
            };
            
            img.src = originalImage.src;
        } catch (error) {
            console.error('初始化压缩过程时出错:', error);
            alert('初始化压缩过程时出错，请重试！');
        }
    }

    // 获取输出格式
    function getOutputFormat() {
        const format = formatSelect.value;
        if (format === 'same') {
            // 使用与原图相同的格式
            if (originalFile.type.includes('png')) {
                return 'image/png';
            } else {
                return 'image/jpeg';
            }
        } else if (format === 'png') {
            return 'image/png';
        } else {
            return 'image/jpeg';
        }
    }
    
    // 获取输出扩展名
    function getOutputExtension() {
        const format = getOutputFormat();
        if (format === 'image/png') {
            return 'png';
        } else {
            return 'jpg';
        }
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});