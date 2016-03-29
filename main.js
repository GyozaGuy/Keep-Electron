'use strict';

// Change these to customize the app
var url = 'https://keep.google.com';
var height = 750;
var width = 1200;

// Everything below this should be the same for most apps
var electron = require('electron');
var path = require('path');
var menu = electron.Menu;
var tray = electron.Tray;
var app = electron.app;
var appName = app.getName();
var browserWindow = electron.BrowserWindow;
var appIcon = path.join(__dirname, 'images', 'app.png');
var ipc = electron.ipcMain;

electron.crashReporter.start();

var mainWindow;
var sysTray;
var isQuitting = false;

function createMainWindow() {
  var win = new electron.BrowserWindow({
    title: appName,
    show: false,
    height: height,
    width: width,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false, // fails without this because of CommonJS script detection
      preload: path.join(__dirname, 'js', 'browser.js'),
      plugins: true
    }
  });

  win.loadURL(url);

  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  return win;
}

function showAndCenter(win) {
  center(win);
  win.show();
  win.focus();
}

function center(win) {
  var electronScreen = electron.screen;
  var size = electronScreen.getPrimaryDisplay().workAreaSize;
  var x = Math.round(size['width'] / 2 - width / 2);
  var y = Math.round(size['height'] / 2 - height / 2);
  win.setPosition(x, y);
}

app.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  if (mainWindow) {
    showAndCenter(mainWindow);
  }
  return true;
});

if (shouldQuit) {
  app.quit();
  return;
}

app.commandLine.appendSwitch('ppapi-flash-path', '/opt/google/chrome/PepperFlash/libpepflashplayer.so');

app.on('ready', () => {
  sysTray = new tray(appIcon);
  var contextMenu = menu.buildFromTemplate([
    { label: 'Show', click: function() { showAndCenter(mainWindow); } },
    { label: 'Quit', click: function() { app.quit(); } }
  ]);
  sysTray.setToolTip(appName);
  sysTray.setContextMenu(contextMenu);

  sysTray.on('click', () => {
    showAndCenter(mainWindow);
  });

  mainWindow = createMainWindow();

  var page = mainWindow.webContents;

  page.on('dom-ready', () => {
    showAndCenter(mainWindow);
  });

  page.on('new-window', (e, url) => {
    e.preventDefault();
    electron.shell.openExternal(url);
  });
});

app.on('activate', () => {
  showAndCenter(mainWindow);
});

app.on('before-quit', () => {
  isQuitting = true;
});

ipc.on('notification-click', () => {
  showAndCenter(mainWindow);
});
