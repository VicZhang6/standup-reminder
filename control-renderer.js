// control-renderer.js - 控制面板渲染进程

const CIRCUMFERENCE = 2 * Math.PI * 78; // 圆环周长

// DOM 元素
const progressCircle = document.getElementById('progressCircle');
const timeDisplay = document.getElementById('timeDisplay');
const timeInput = document.getElementById('timeInput');
const timeLabel = document.getElementById('timeLabel');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const intervalValue = document.getElementById('intervalValue');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');

let currentInterval = 20;
let isEditing = false;

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ── 时间点击编辑功能 ──────────────────────────────────

function enterEditMode() {
    if (isEditing) return;
    isEditing = true;

    // 将当前显示的时间填入输入框
    timeInput.value = timeDisplay.textContent;
    timeDisplay.classList.add('hidden');
    timeInput.classList.add('active');
    timeLabel.textContent = '输入分钟数 或 MM:SS';
    timeLabel.classList.add('editing');

    // 选中全部文字方便直接输入
    timeInput.focus();
    timeInput.select();
}

function exitEditMode(apply) {
    if (!isEditing) return;
    isEditing = false;

    if (apply) {
        const value = timeInput.value.trim();
        let totalSeconds = parseTimeInput(value);

        if (totalSeconds !== null && totalSeconds > 0) {
            // 转换为分钟（向上取整到至少1分钟）
            const newMinutes = Math.max(1, Math.min(120, Math.ceil(totalSeconds / 60)));
            currentInterval = newMinutes;
            intervalValue.textContent = `${currentInterval} 分钟`;
            window.electronAPI.setInterval(currentInterval);
        }
    }

    timeInput.classList.remove('active');
    timeDisplay.classList.remove('hidden');
    timeLabel.classList.remove('editing');
}

function parseTimeInput(value) {
    // 支持格式: "20:00", "20:30", "5", "15" 等
    if (value.includes(':')) {
        const parts = value.split(':');
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10);
        if (!isNaN(mins) && !isNaN(secs) && mins >= 0 && secs >= 0 && secs < 60) {
            return mins * 60 + secs;
        }
    } else {
        // 纯数字视为分钟
        const mins = parseInt(value, 10);
        if (!isNaN(mins) && mins > 0) {
            return mins * 60;
        }
    }
    return null;
}

// 事件绑定
timeDisplay.addEventListener('click', () => {
    enterEditMode();
});

timeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        exitEditMode(true);
    } else if (e.key === 'Escape') {
        exitEditMode(false);
    }
});

timeInput.addEventListener('blur', () => {
    exitEditMode(true);
});

// 限制输入内容只允许数字和冒号
timeInput.addEventListener('input', () => {
    timeInput.value = timeInput.value.replace(/[^0-9:]/g, '');
});

// ── UI 更新 ───────────────────────────────────────────

function updateUI(data) {
    // 编辑模式下不更新时间显示，避免打断用户输入
    if (!isEditing) {
        timeDisplay.textContent = formatTime(data.remaining);
    }

    // 更新进度环
    const progress = data.elapsed / data.total;
    const offset = CIRCUMFERENCE * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;

    // 更新状态
    if (data.running) {
        statusBadge.className = 'status-badge running';
        statusText.textContent = '计时中';
        if (!isEditing) timeLabel.textContent = '剩余时间';

        toggleBtn.className = 'btn-primary is-running';
        toggleText.textContent = '暂停计时';
        toggleBtn.querySelector('svg').innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
    } else {
        statusBadge.className = 'status-badge stopped';
        statusText.textContent = data.elapsed > 0 ? '已暂停' : '未开始';
        if (!isEditing) timeLabel.textContent = data.elapsed > 0 ? '剩余时间' : '准备就绪';

        toggleBtn.className = 'btn-primary';
        toggleText.textContent = data.elapsed > 0 ? '继续计时' : '开始计时';
        toggleBtn.querySelector('svg').innerHTML = '<polygon points="5,3 19,12 5,21"/>';
    }

    currentInterval = data.intervalMinutes;
    intervalValue.textContent = `${currentInterval} 分钟`;
}

// 初始化 - 获取当前状态
async function init() {
    const state = await window.electronAPI.getTimerState();
    updateUI(state);
}

// 监听主进程事件
window.electronAPI.onTimerUpdate((data) => {
    updateUI(data);
});

window.electronAPI.onTimerStateChanged((data) => {
    updateUI(data);
});

// 开始/暂停按钮
toggleBtn.addEventListener('click', () => {
    window.electronAPI.toggleTimer();
});

// 间隔调节
decreaseBtn.addEventListener('click', () => {
    if (currentInterval > 1) {
        currentInterval--;
        intervalValue.textContent = `${currentInterval} 分钟`;
        window.electronAPI.setInterval(currentInterval);
    }
});

increaseBtn.addEventListener('click', () => {
    if (currentInterval < 120) {
        currentInterval++;
        intervalValue.textContent = `${currentInterval} 分钟`;
        window.electronAPI.setInterval(currentInterval);
    }
});

// 启动
init();
