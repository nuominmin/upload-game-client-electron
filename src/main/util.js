import pkg from "../../package.json"
const fs = require('fs-extra'),
    klaw = require("klaw-sync"),
    os = require('os'),
    crypto = require('crypto');



/**
 * AES加密的配置 
 * key 密钥 
 * iv 偏移向量 
 */

/**
* 加密
* @param {object} aesConf 
* @param {string} data 
* @returns {base64}
*/
export function aesEncryption(aesConf, data) {
    let key = aesConf.key;
    let iv = aesConf.iv;

    var cipherChunks = [];
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);
    cipherChunks.push(cipher.update(data, 'utf8', 'base64'));
    cipherChunks.push(cipher.final('base64'));
    return cipherChunks.join('');
}


/**
 * 解密
 * @param {object} aesConf 
 * @param {string} data 
 * @returns {string}
 */
export function aesDecryption(aesConf, data) {
    try {
        let key = aesConf.key;
        let iv = aesConf.iv;
        var cipherChunks = [];
        var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        decipher.setAutoPadding(true);
        cipherChunks.push(decipher.update(Buffer.from(data, 'base64').toString(), 'base64', 'utf8'));
        cipherChunks.push(decipher.final('utf8'));
        return cipherChunks.join('');
    } catch (err) {
        return ""
    }
}


/**
 * 获取临时目录
 * @returns {string}
 */
export function getTmpdir() {
    return os.tmpdir()
}

/**
 * 写入文件
 * @param {string} path 文件路径
 * @param {string} data 数据
 */
export function writeFileContent(path, data) {
    return fs.writeFileSync(path, data)
}

/**
 * 读取文件内容
 * @param {string} path 文件路径
 * @returns {string} 数据
 */
export function readFileContent(path) {
    try {
        return fs.readFileSync(path, (err, data) => {
            if (err) {
                return ""
            }
            return data
        })
    } catch (e) {
        return ""
    }
}

/**
 * 读取文件
 * @param {string} path 文件路径
 * @param {string} filename 文件名称
 * @returns {Array}
 */
export function readFile(path, filename) {
    return fs.readFileSync(path, (err, data) => {
        if (err) throw err;
        return new File([data], filename, { type: "text/plain" })
    });
}

/**
 * 根据选取的文件和文件夹,返回文件列表
 * @param {string} path
 * @returns {Array}
 */
export function wrapperFiles(path) {
    let files = []
    if (isDirectory(path)) {
        let result = klaw(path, {
            nodir: true,
            filter: function (item) {
                return !/\.(DS_Store)$/.test(item.path)
            }
        })

        let _path = convertPath(path)
        let dirPrefix = _path.substring(0, _path.lastIndexOf("/") + 1)

        for (let file of result) {
            let filepath = convertPath(file.path)
            files.push({ path: filepath, dir: _path, filename: filepath.replace(dirPrefix, "") })
        }
    } else {
        files.push({ path: convertPath(path) })
    }

    return files
}

/**
 * 统一win的分割符 \ => /
 * @param {string} path
 * @returns {*}
 */
export function convertPath(path) {
    return path.replace(/\\/g, "/")
}

/**
 * 获取文件 Etag 值
 * @param {string} filePath
 * @param platformType
 * @param callback
 */
export const getEtag = function (filePath, platformType, callback = null) {
    return new Promise(function (resolve, reject) {
        switch (platformType) {
            case brand.qiniu.key:
                qetag(filePath, (hash) => {
                    resolve(hash)
                })
                break
            default:
                getFileMd5(filePath, (error, hash) => {
                    resolve(hash)
                })
                break
        }
    })
}


/**
 * 获取文件MD5
 * @param {string} filepath 
 * @param {*} callback 
 */
export function getFileMd5(filepath, callback) {
    const md5 = require("crypto").createHash("md5")
    let readStream = require("fs").createReadStream(filepath)

    readStream.on("data", function (chunk) {
        md5.update(chunk)
    })
    readStream.on("error", function (err) {
        callback(err)
    })
    readStream.on("end", function () {
        let hash = md5.digest("hex")
        callback(null, `"${hash}"`)
    })
}

/**
 * 是否是目录类型
 * @param {string} path
 * @returns {Stats | boolean}
 */
export function isDirectory(path) {
    return fs.statSync(path).isDirectory()
}


/**
 * 获取文件路径和链接的后缀 ≈获取文件名
 * @param {string} path
 * @returns {*}
 */
export function getPostfix(path) {
    if (path.lastIndexOf('/') !== -1)
        return path.substring(path.lastIndexOf('/') + 1, path.length);
    return path;
}

/**
 * 通知
 * @param {Object} option 
 */
export function notification(option) {
    option.title = option.title || pkg.cnname
    option.body = option.message
    option.silent = true
    // option.subtitle = 'subtitle';
    // option.body = 'body';
    new Notification(option).show()
}
