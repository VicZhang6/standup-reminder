const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 提醒窗口 API
  dismissReminder: () => ipcRenderer.send('dismiss-reminder'),

  // 控制面板 API
  toggleTimer: () => ipcRenderer.send('toggle-timer'),
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  setInterval: (minutes) => ipcRenderer.send('set-interval', minutes),

  // 监听主进程事件
  onTimerUpdate: (callback) => {
    ipcRenderer.on('timer-update', (_event, data) => callback(data));
  },
  onTimerStateChanged: (callback) => {
    ipcRenderer.on('timer-state-changed', (_event, data) => callback(data));
  },

  // 清理监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
