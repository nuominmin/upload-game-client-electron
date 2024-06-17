import { aesEncryption, writeFileContent, readFileContent, aesDecryption, getTmpdir } from './util';
import { ipcRenderer } from 'electron'
import rp from 'request-promise'
import pkg from '../../package';

const tmpdirFilePath = getTmpdir() + "\\userinfo.json"
const aesConf = {
    key: "nuominminzhou123", // 密钥
    iv: "1012132405963708" // 偏移向量
}

const apiURL = process.env.NODE_ENV === 'development' ? pkg.dev.apiURL : "http://192.168.1.10:12021/"

// 检查授权 正常返回1  不正常返回0
// async
export function checkAuth() {
    let content = readFileContent(tmpdirFilePath)
    if (content == "") {
        return 0
    }

    let strDeContent = aesDecryption(aesConf, content)
    if (strDeContent == "") {
        return 0
    }

    let deContent = JSON.parse(strDeContent)
    if (deContent == "") {
        return 0
    }

    if (deContent.token == undefined || deContent.token == "") {
        return 0
    }

    return 1
    let result = 0
    // await
    rp({
        method: "GET",
        uri: apiURL + "check_auth",
        resolveWithFullResponse: true,
        headers: {
            token: deContent.token,
        },
        json: true,
    }).then((response) => {
        if (response.body.code == 0) {
            result = 1
        }
    }).catch(() => {

    });
    return result
}

// 获取缓存的用户数据
export function getUserInfo() {
    let content = readFileContent(tmpdirFilePath)
    if (content == "") {
        ipcRenderer.send("not login");
    }

    let strDeContent = aesDecryption(aesConf, content)
    if (strDeContent == "") {
        ipcRenderer.send("not login");
    }

    let deContent = JSON.parse(strDeContent)
    if (deContent == "") {
        ipcRenderer.send("not login");
    }

    if (deContent.token == undefined || deContent.token == "") {
        ipcRenderer.send("not login");
    }

    return deContent
}


// 获取用户 super
export function getUserSuper() {
    return getUserInfo().super
}

// 获取用户 token
export function getUserToken() {
    return getUserInfo().token
}

// 保存用户详情
export function saveUserInfo(data) {
    writeFileContent(tmpdirFilePath, aesEncryption(aesConf, data))
}