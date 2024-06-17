import { app, BrowserWindow, ipcMain, Menu, Tray, dialog } from 'electron'
import pkg from '../../package';
import urlencode from 'urlencode';
import { checkAuth, saveUserInfo } from '../main/index.util';

// 获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // 如果获取失败，说明已经有实例在运行了，直接退出
  app.quit();
}

const path = require('path')
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let currentWindowName = "";
let mainWindow;
let mainWindowName = "main";
let loadingWindow;
let loginWindow;
let loginWindowName = "login";
let tray = null;
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`
const loadingWinURL = path.resolve(__static, './html/loading.html')
const apiURL = process.env.NODE_ENV === 'development' ? pkg.dev.apiURL : "http://192.168.1.10:12021/"
const loginWinURL = path.resolve(__static, './html/login.html?api=' + urlencode(apiURL))

// 最后一个窗口被关闭时退出应用
app.on('window-all-closed', () => {
  app.quit()
})

function resart() {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
  app.exit(0)
}

let isLogin = checkAuth()
// 检查授权
// checkAuth().then((res) => {
//   console.log("res",res)
//   if (res == 1) {
//     isLogin = true
//   } 
// })

console.log("isLogin", isLogin)

if (isLogin) {
  app.on('ready', () => {
    console.log("已登录")
    newLoadingWindow()
    newMainWindow()
    newTray(mainWindow)
  })
} else {
  console.log("未登录")
  app.on('ready', () => {
    newLoginWindow()
    newTray(loginWindow)
  })
}

function newTray(window) {
  if (tray != null) {
    return
    // tray = null
  }
  tray = new Tray(path.resolve(__static, './icon/favicon.ico'));
  tray.setToolTip('upload game client')
  tray.setContextMenu(Menu.buildFromTemplate([{
    label: '退出', click: () => {
      quit()
    }
  },
  ]))
  tray.on('click', () => {
    if (loadingWindow != null) {
      loadingWindow.isVisible() ? loadingWindow.hide() : loadingWindow.show();
      loadingWindow.isVisible() ? loadingWindow.setSkipTaskbar(false) : loadingWindow.setSkipTaskbar(true);
    }
    window.isVisible() ? window.hide() : window.show();
    window.isVisible() ? window.setSkipTaskbar(false) : window.setSkipTaskbar(true);
    // if (currentWindowName == loginWindowName) {
    //   // 如果当前窗口时 login
    //   loginWindow.isVisible() ? loginWindow.hide() : loginWindow.show();
    //   loginWindow.isVisible() ? loginWindow.setSkipTaskbar(false) : loginWindow.setSkipTaskbar(true);
    // } else {
    //   // 如果当前窗口时 main
    //   mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    //   mainWindow.isVisible() ? mainWindow.setSkipTaskbar(false) : mainWindow.setSkipTaskbar(true);
    // }
  })
}

function newLoginWindow() {
  // 设置当前的窗体名字
  currentWindowName = loginWindowName

  console.log("new login window")
  loginWindow = new BrowserWindow({
    width: 900,
    height: 560,
    maxWidth: 900,
    maxHeight: 560,
    useContentSize: true,
    autoHideMenuBar: true,
    parent: mainWindow,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })
  // loginWindow.webContents.openDevTools();

  loginWindow.setMenu(null)
  loginWindow.loadURL(loginWinURL);
  loginWindow.on('close', () => {
    loginWindow = null;
  });

  // 登陆完成
  ipcMain.on("login finish", (_, userInfo) => {
    console.log("login finish ")
    // 写入用户数据到用户系统的临时目录中
    saveUserInfo(userInfo)
    loginWindow.destroy()
    resart()
    return
    if (loginWindow != null) {
      loginWindow.close()
    }

    console.log("set currentWindowName main, login finish")
    currentWindowName = mainWindowName
    mainWindow.show()
  })
}

function quit() {
  if (mainWindow != null) {
    mainWindow.destroy()
  }
}

function newMainWindow() {
  console.log("new main window")
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 850,
    useContentSize: true,
    autoHideMenuBar: true,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })
  mainWindow.setMenu(null)
  mainWindow.loadURL(winURL)

  // 主窗体加载完成
  let readyToShow = false;
  mainWindow.on('ready-to-show', function () {

    if (loadingWindow != null) {
      // 给loading发送要完成的指令
      loadingWindow.webContents.send('do loading finish');
    }

    if (readyToShow) {
      return
    }
    readyToShow = true
  })

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.on("did-frame-finish-load", () => {
      mainWindow.webContents.once("devtools-opened", () => {
        mainWindow.focus();
      });
      mainWindow.webContents.openDevTools();
    });
  }

  mainWindow.on('close', () => {
    quit()
  })

  mainWindow.webContents.on('crashed', () => {
    const options = {
      type: 'error',
      title: '进程崩溃了',
      message: '这个进程已经崩溃.',
      buttons: ['重载', '退出'],
    };
    recordCrash().then(() => {
      dialog.showMessageBox(options, (index) => {
        if (index === 0) reloadWindow(mainWindow);
        else app.quit();
      });
    }).catch((e) => {
      console.log('err', e);
    });
  })
}


function newLoadingWindow() {
  // 启动页
  loadingWindow = new BrowserWindow({
    width: 480,
    height: 320,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  // loadingWindow.webContents.openDevTools();
  loadingWindow.setMenu(null)
  loadingWindow.loadURL(loadingWinURL);
  loadingWindow.on('close', () => {
    loadingWindow = null;
  });
}


// 加载启动做好准备
ipcMain.on('loading launch ready', () => {
  loadingWindow.show();
  mainWindow.hide();
});

// 未登录
ipcMain.on('not login', () => {
  // 不做窗体跳转
  return
  console.log("not login")
  if (currentWindowName == loginWindowName || currentWindowName == "") {
    return
  }
  currentWindowName = loginWindowName

  console.log("not login", loginWindow)
  if (loginWindow == null) {
    newLoginWindow()
  }
  loginWindow.show();
  mainWindow.hide();
});

// 加载页进度100%，加载完成
ipcMain.on("loading finish", () => {
  if (loadingWindow != null) {
    console.log("close loadingWindow")
    loadingWindow.hide()
    loadingWindow.close()
  }

  console.log("set currentWindowName main, loading finish")

  mainWindow.show()
  // // 检查授权
  // checkAuth().then(res => {
  //   if (res == 1) {
  //     loginWindow.hide()
  //     mainWindow.show()
  //     console.log("权限正常，已经登陆")
  //   } else {
  //     loginWindow.show()
  //     mainWindow.hide()
  //     console.log("权限异常，可能未登陆")
  //   }
  // })

  // e.sender.send('login finish', strDeContent);
})




// 设置进度
ipcMain.on('set percentage', (_, percentage) => {
  mainWindow.setProgressBar(percentage)
});

// win10 ,不设置没有通知显示
app.setAppUserModelId(pkg.build.appId);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
});

// app.on('ready', createWindow)


/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
