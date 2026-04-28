/**
 * Compatibility bridge for running the legacy renderer code on modern Electron.
 */
'use strict';

const electron = require('electron');
const remote = require('@electron/remote');

electron.remote = electron.remote || remote;

const dialog = remote.dialog;
if (dialog && !dialog.__antSwordCompatPatched) {
  const showOpenDialog = dialog.showOpenDialog.bind(dialog);
  const showOpenDialogSync = dialog.showOpenDialogSync && dialog.showOpenDialogSync.bind(dialog);
  const showSaveDialog = dialog.showSaveDialog.bind(dialog);
  const showSaveDialogSync = dialog.showSaveDialogSync && dialog.showSaveDialogSync.bind(dialog);

  dialog.showOpenDialog = (...args) => {
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    if (callback) {
      showOpenDialog(...args)
        .then((ret) => callback(ret && !ret.canceled ? ret.filePaths : undefined))
        .catch(() => callback(undefined));
      return undefined;
    }
    return showOpenDialogSync ? showOpenDialogSync(...args) : showOpenDialog(...args);
  };

  dialog.showSaveDialog = (...args) => {
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    if (callback) {
      showSaveDialog(...args)
        .then((ret) => callback(ret && !ret.canceled ? ret.filePath : undefined))
        .catch(() => callback(undefined));
      return undefined;
    }
    return showSaveDialogSync ? showSaveDialogSync(...args) : showSaveDialog(...args);
  };

  dialog.__antSwordCompatPatched = true;
}
