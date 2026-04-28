/**
 * 中国蚁剑::语言模板
 */
'use strict';

const languages = {
  'zh': '简体中文',
  'en': 'English',
  'zh_hk': '繁體中文(香港)',
  'zh_tw': '繁體中文(台灣)'
}

// 获取本地设置语言；未设置时默认使用简体中文
let lang = antSword['storage']('language', false, 'zh');

// 判断本地设置语言是否符合语言模板
lang = languages[lang] ?
  lang :
  'zh';

// 返回语言模板
let langModule = require(`./${lang}`);
langModule.__languages__ = languages;

module.exports = langModule;
