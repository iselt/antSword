/**
 * 插件中心
 * 开写：2016/05/09
 * 更新：－
 * 作者：蚁逅 <https://github.com/antoor>
 */

'use strict';

const path = global.require('path');

class Plugin {
  constructor() {
    // 注册菜单事件
    antSword['menubar'].reg('plugin-store', this.initWin.bind(this, 'ant-views://front/plugin.html'));
    this.win = null;
  }

  /**
   * 初始化新窗口
   * @param  {String} url 要加载的URL
   * @return {Object}     BrowserWindow窗口对象
   */
  initWin(url) {
    if (this.win) {
      return this
        .win
        .focus();
    }
    let win = new antSword['remote'].BrowserWindow({
      width: 950,
      height: 666,
      minWidth: 650,
      minHeight: 555,
      show: false,
      title: 'AntSword.Store',
      webPreferences: {
        // 远程商店页面依赖旧版渲染环境，通过 source/storePreload.js 提供
        // window.require 兼容层，避免开启完整 nodeIntegration
        preload: path.join(antSword['remote'].app.getAppPath(), 'source', 'storePreload.js'),
        contextIsolation: false,
        sandbox: false,
        nodeIntegration: false
      }
    });
    // 远程商店 loader.js 以区分大小写的正则 /antsword\/[\d\.]+/ 校验
    // navigator.userAgent，必须包含小写 antsword/版本；webPreferences.userAgent
    // 经 @electron/remote 传入不可靠，这里创建后用 setUserAgent 方法显式设置
    win
      .webContents
      .setUserAgent(`${navigator.userAgent} antsword/${antSword['package']['version']}`);
    win.on('close', () => {
      this.win = win = null;
    });
    let ses = win.webContents.session;
    let proxyuri = "";
    if (antSword.aproxymode != "noproxy") {
      proxyuri = antSword.aproxyuri;
    }
    // 注意：session 经由 @electron/remote 代理，回调式 API 的函数参数
    // 无法跨进程序列化，必须使用 Promise 形式，否则 show() 永远不会执行
    ses
      .setProxy({ proxyRules: proxyuri })
      .then(() => {
        win.loadURL(url);
        win.show();
        // win.openDevTools();
        this.win = win;
      });
  }

}

module.exports = Plugin;