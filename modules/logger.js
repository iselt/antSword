/**
 * 后端日志输出模块
 * 开写：2016/05/02
 * 更新：
 * 作者：蚁逅 <https://github.com/antoor>
 */

'use strict';

let mainWindow;

class Logger {
  constructor(tag) {
    this.tag = tag;
  }

  /**
   * 解析日志输入文本
   * @param  {String} type 日志类型（debug,warn,fatal,info
   * @param  {Object} logs 日志内容
   * @return {String}      格式化后的内容文本
   */
  parseLog(type, logs) {
    let tm = new Date()
      .toTimeString()
      .split(' ')[0];
    let args = Array.from(logs);
    let log = args
      .map((_) => {
        if (_ instanceof Error) {
          return _.stack || _.message;
        }
        return typeof _ === 'object' ? JSON.stringify(_) : String(_);
      })
      .join(' ');
    return `[${tm}] ${type.toUpperCase()}::${this.tag}\t${log}`;
  }

  serialize(logs) {
    return Array.from(logs).map((_) => {
      if (_ instanceof Error) {
        return {
          name: _.name,
          message: _.message,
          stack: _.stack
        };
      }
      return _;
    });
  }

  /**
   * 调试信息（正常颜色
   * @return {[type]} [description]
   */
  debug() {
    mainWindow.send('logger-debug', [
      this.parseLog('debug', arguments),
      this.serialize(arguments)
    ]);
  }

  /**
   * 成功信息（绿色
   * @return {[type]} [description]
   */
  info() {
    mainWindow.send('logger-info', [
      this.parseLog('info', arguments),
      this.serialize(arguments)
    ]);
  }

  /**
   * 警告信息（黄色
   * @return {[type]} [description]
   */
  warn() {
    mainWindow.send('logger-warn', [
      this.parseLog('warn', arguments),
      this.serialize(arguments)
    ]);
  }

  /**
   * 错误信息（红色
   * @return {[type]} [description]
   */
  fatal() {
    mainWindow.send('logger-fatal', [
      this.parseLog('fatal', arguments),
      this.serialize(arguments)
    ]);
  }
}

module.exports = (win) => {
  mainWindow = win;
  return Logger;
}
