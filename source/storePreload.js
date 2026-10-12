/**
 * 插件市场窗口兼容层
 * 远程商店页面(AntSword-Store.github.io)发布于 2016 年，依赖旧版 Electron
 * 渲染环境：window.require('electron') 中的内置 remote 模块，以及 node
 * 内置模块。现代 Electron 已移除这些能力，这里通过 preload 暴露最小白名单，
 * 使远程商店页面无需完整 nodeIntegration 即可运行。
 */
'use strict';

const electron = require('electron');
const path = require('path');
const os = require('os');

const realRemote = require('@electron/remote');

// 商店 bundle 读取 remote.process.env.AS_WORKDIR 并拼接 antData/plugins
// 来列本地插件；本 fork 已把数据目录分离到 ~/.antsword/antData（见
// modules/config.js），因此重定向该变量使本地插件列表指向真实目录
const dataPath = process.env.AS_DATA_PATH || path.join(os.homedir(), '.antsword', 'antData');
const envShim = Object.assign({}, process.env, {
  AS_WORKDIR: path.basename(dataPath) === 'antData' ? path.dirname(dataPath) : dataPath
});
const processShim = { env: envShim };

const remoteShim = new Proxy(realRemote, {
  get: (target, prop) => (prop === 'process' ? processShim : target[prop])
});

const modules = {
  electron: {
    ipcRenderer: electron.ipcRenderer,
    remote: remoteShim
  },
  path: path,
  fs: require('fs'),
  process: processShim
};

window.require = (name) => {
  if (!Object.prototype.hasOwnProperty.call(modules, name)) {
    throw new Error(`AntSword store preload: module not allowed: ${name}`);
  }
  return modules[name];
};

window.process = window.process || processShim;
