// renderer.js - 提醒弹窗渲染进程
document.getElementById('dismiss-btn').addEventListener('click', () => {
    // 添加按钮反馈动画
    const btn = document.getElementById('dismiss-btn');
    btn.textContent = '✓ 好的，继续加油！';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    btn.style.pointerEvents = 'none';

    // 稍微延迟后关闭，给用户看到反馈
    setTimeout(() => {
        window.electronAPI.dismissReminder();
    }, 400);
});
