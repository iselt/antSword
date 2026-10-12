//
// electron-builder afterPack 钩子：删除 app-update.yml
//
// 只要存在 publish 配置（含从 repository 字段推断的情况），
// electron-builder 就会在产物内生成 resources/app-update.yml，
// 其中包含构建来源的 GitHub 仓库所有者信息。
// 本项目使用手动更新检查（modules/update.js），不依赖 electron-updater，
// 因此打包后统一删除该文件。
//

const fs = require('fs');
const path = require('path');

function removeUpdateMeta(context) {
  const candidates = [
    // Windows / Linux
    path.join(context.appOutDir, 'resources', 'app-update.yml'),
    // macOS
    path.join(context.appOutDir, 'AntSword.app', 'Contents', 'Resources', 'app-update.yml')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

module.exports = removeUpdateMeta;
module.exports.default = removeUpdateMeta;
