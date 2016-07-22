title: 跟我一起部署和定製 CNPM——自定義包存儲層
date: 2016-07-22 14:23:01
tags: [ "CNPM", "Node.js" ]
---

CNPM 的自定義包存儲層文件系統簡稱 NFS，我猜是 NPM File System 的意思。

在之前《[跟我一起部署和定製 CNPM——基礎部署](https://xcoder.in/2016/07/09/lets-cnpm-base-deploy/)》中提到過，CNPM 配置項裏面有一項配置 `nfs`，它所對應的是一個 NFS 對象。

在同步 package 的時候，CNPM 會把源站的包下載到本地，然後傳給 NFS 對象相應的函數交予去處理，由 NFS 對象返回處理結束之後該包在我們自己部署的 CNPM 對應的包下載鏈接。

上面的這一套流程就給我們自定義包存儲提供了可能，比如我們可以把包同步到又拍雲存儲、阿里雲 OSS 等地方去，也可以以二進制的形式存入我們自己的數據庫（不推薦），甚至可以什麼都不用做直接放在本地，然後把本地文件對外網暴露即可。

## NFS 接口

NFS 的接口是實現定義好的，我們如果要寫一個自己的 NFS 類，只需要按照約定的接口實現他們的邏輯即可。

> 雖然我自己不喜歡，但是 NFS 的所有函數需要在菊花函數中被實現。

下面給出接口的定義：

+ `function* upload(filepath, options)`
  - `filepath`：文件路徑。
  - `options`
    * `key`：待上傳文件的標識
    * `size`：待上傳文件大小
+ `function* uploadBuffer(fileBuffer, options)`
  - `fileBuffer`：待上傳文件的 Buffer
  - `options`
    * `key`：待上傳文件的標識
    * `size`：待上傳文件的大小
+ `function* remove(key)`
  - `key`: 文件標識
+ `function* download(key, savePath, options)`（可選實現）
  - `key`：文件標識
  - `savePath`：保存路徑
  - `options`
    * `timeout`：超時時間
+ `function* createDownloadStream(key, options)`（可選實現）
  - `key`: 文件標識
  - `options`
    * `timeout`：超時時間
  - 返回一個 `ReadStream`
+ `function[*] url(key)`（可選實現，可以不是菊花函數）
  - `key`: 文件標識

## OSS-CNPM 解析

這裏拿出一個 NFS 的官方實現阿里雲 OSS 版來作爲解析。它的 Repo 是 [https://github.com/cnpm/oss-cnpm](https://github.com/cnpm/oss-cnpm)。

打開 [index.js](https://github.com/cnpm/oss-cnpm/tree/2.1.0/index.js) 我們能看到，的確 `OssWrapper` 實現了上面的一些接口。

### 構造函數

在 `function OssWrapper` 裏面我們看到它 `new` 了 [ali-oss](https://github.com/aliyun/oss-nodejs-sdk) 對象。

```javascript
if (options.cluster) {
  options.schedule = options.schedule || 'masterSlave';
  this.client = new oss.ClusterClient(options);
} else {
  this.client = oss(options);
}
```

也就是說在各種上傳等函數裏面都是以這個 `client` 爲主體做的事情的。

### upload 和 uploadBuffer

首先我們看看 `upload` 函數，從外部傳進來文件的 `key`，NFS 對象將該文件以 `key` 爲名傳到 OSS 去，並返回該文件上傳之後在 OSS 上的地址。

```javascript
proto.upload = function* (filePath, options) {
  const key = trimKey(options.key);
  // https://github.com/ali-sdk/ali-oss#putname-file-options
  const result = yield this.client.put(key, filePath, {
    headers: this._defaultHeaders,
  });
  if (this._mode === 'public') {
    return { url: result.url };
  }
  return { key: key };
};
```

`uploadBuffer` 其實也一樣，參數第一個 `fileBuffer` 是一個文件二進制 Buffer 對象，而 `ali-oss` 包的 `put` 函數第二個參數既可以傳一個文件路徑，也可以傳一個 Buffer，所以相當於把 `upload` 這個函數直接拿過來就能用了，於是就有了：

```javascript
proto.uploadBuffer = proto.upload;
```

### remove、download 和 createDownloadStream

這兩個函數實際上也是直接調用了 `ali-oss` 的函數，並沒有什麼好講的，大家自己看看就好了。

### url

這個函數無非就是判斷下有沒有自定義的 CDN 域名什麼的，根據不同的返回不同的網址而已。

### trimKey

把 `key` 裏面帶的最前面的斜槓去掉。

## 我的 OSS-CNPM 隨意改造

上面一節解析了 `oss-cnpm` 這個包的代碼，如果官方出的幾個 NFS 包不能滿足，大家也能自己去寫一個 CNPM 存儲層的包了。

我們公司的包是直接在 OSS 上面的，所以用 `oss-cnpm` 並沒有什麼不妥。

不過對於阿里系本身的公司門來說，OSS 並不是什麼大事兒，對於我們來說，OSS 的 bucket 資源還是蠻稀缺的，上次就達到上限了。所以我們目前的 NPM 包跟公司別的測試業務用的是同一個 bucket。

那麼問題來了：

**`oss-cnpm` 直接把所有文件放在根目錄下建文件夾，太亂了，而且的確是有小可能衝突的。而這個包又不能讓人自定義前綴什麼什麼的。**

於是我就自己 Fork 小小改裝了一下這個包，讓它適合我們公司自己。

改裝很簡單，在上傳的目錄中加一個文件夾前綴。

動的是 `trimKey` 函數：

```javascript
function trimKey(key) {
  return '_snpm_/' + (key ? key.replace(/^\//, '') : '');
}
```

這下所有在我們內部 CNPM 裏面的包的鏈接都多了個 `_snpm_/` 的前綴了。

## CNPM 調用解析

上面解析了接口之後，我們來扒一扒什麼時候會調用上面實現的接口們吧，這樣就知道 CNPM 對於 NFS 使用的工作原理了。

### controllers/registry/package/download.js

> [源碼參考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/download.js)

對於包下載來說，它的路由是：

```
/{package}/download/{package}-{version}.tgz
```

然後在裏面判斷一下如果 NFS 對象有實現 `url()` 函數的話，先用 `url()` 函數生成對該包而言的真實下載鏈接。

讀出這個包的 registry 信息，裏面如果沒有 `dist` 等參數的話直接 302 到剛生成的地址去。

```javascript
if (typeof nfs.url === 'function') {
  if (is.generatorFunction(nfs.url)) {
    url = yield nfs.url(common.getCDNKey(name, filename));
  } else {
    url = nfs.url(common.getCDNKey(name, filename));
  }
}

if (!row || !row.package || !row.package.dist) {
  if (!url) {
    return yield* next;
  }
  this.status = 302;
  this.set('Location', url);
  _downloads[name] = (_downloads[name] || 0) + 1;
  return;
}
```

接下去是涉及到上一章沒有提到過的一個配置參數，叫 `downloadRedirectToNFS`，默認爲 `false`。如果該值爲 `true` 的話並且剛纔由 `url()` 函數生成了下載鏈接的話，也是直接 302 到真實下載鏈接去。

```javascript
if (config.downloadRedirectToNFS && url) {
  this.status = 302;
  this.set('Location', url);
  return;
}
```

不過如果本身 registry 裏面就沒 `key` 這個選項的話也會直接用 `url()` 生成的鏈接給跳過去。如果沒有 `url()` 的鏈接，那麼直接用 registry 裏面的 `tarball` 字段。

```javascript
var dist = row.package.dist;
if (!dist.key) {
  url = url || dist.tarball;
  this.status = 302;
  this.set('Location', url);
  return;
}
```

上面如果都跳過去了，那麼說明要開始調用事先寫好的 `download` 那兩個函數了，把文件讀到 Buffer 裏面，然後把 Buffer 放到 Response 裏面傳回去。

### controllers/registry/package/remove.js

> [源碼參考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/remove.js)

對於刪除包來說，除了把包從數據庫刪掉之外，還要循環遍歷一遍這個包的所有版本，把所有版本的這個包都從 NFS 裏面刪除。

```javascript
try {
  yield keys.map(function (key) {
    return nfs.remove(key);
  });
} catch (err) {
  logger.error(err);
}
```

這裏就調用了你事先寫好的 `remove` 了。當然你不實現也沒關係，最多是包的壓縮文件不刪除而已。

### controllers/registry/package/remove_version.js

> [源碼參考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/remove_version.js)

這裏跟上一小節差不多，之前是刪除整個包，這裏是刪除包的某一個版本，所以就不用循環刪除了。

```javascript
try {
  yield nfs.remove(key);
} catch (err) {
  logger.error(err);
}
```

### controllers/registry/package/save.js

> [源碼參考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/save.js)

然後就是用戶 `$ npm publish` 用的路由了，在一堆判斷之後，發佈傳過來的包被放在二進制 Buffer 內存裏面：

```javascript
var tarballBuffer;
tarballBuffer = new Buffer(attachment.data, 'base64');
```

接下去又判斷來判斷去，最後交由 NFS 的 `uploadBuffer` 來上傳並得到結果。

```javascript
var uploadResult = yield nfs.uploadBuffer(tarballBuffer, options);

var dist = {
  shasum: shasum,
  size: attachment.length
};

if (uploadResult.url) {
  dist.tarball = uploadResult.url;
} else if (uploadResult.key) {
  dist.key = uploadResult.key;
  dist.tarball = uploadResult.key;
}
```

看到沒有，就是這裏記錄的它到底是 `key` 還是 `tarball` 了。

如果你的 `upload` 函數返回的是 `{ url: 'FOO' }`，那麼就是 `tarball` 設置成該值，在下載的時候會直接 302 到 `tarball` 所指的地址去；如果返回的是 `{ key: 'key' }` 的話，會在 `dist` 裏面存個 `key`，下載的時候判斷如果有 `key` 的話會把它傳進你的 `createDownloadStream` 或者 `download` 函數去交由你的函數生成包 Buffer 並傳回 Response。

### controller/sync_module_worker.js

> [源碼參考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/sync_module_worker.js)

這個文件是從源端同步相關的一些邏輯了，這裏面有兩個操作。

一個是 `unpublish`，調用的就是 NFS 的 `remove`，不作詳談了。

另一個就是同步了。同步包會被打散成同步一個版本，然後把每個版本同步過來。在同步版本的時候先把包文件[下載](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/sync_module_worker.js#L940)到本地文件 `filepath` 裏面去。

```javascript
var r = yield urllib.request(downurl, options);
```

> [urllib](https://github.com/node-modules/urllib) 是蘇千死馬他們自己寫的比較方便和適合他們自己的一個 http 請求庫。

上面的代碼 `options` 裏面有一個文件流，鏈接到 `filepath` 目錄的這個文件去，相當於這一步就是把源端的包下載到本地 `filepath` 去了。

經過一堆 blahblah 的判斷（比如 SHASUM）之後，這個這個函數就會[調用 NFS 的 `upload` 函數](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/sync_module_worker.js#L995)將本地文件名對應的文件上傳到你所需要的地方去了。

```javascript
try {
  result = yield nfs.upload(filepath, options);
} catch (err) {
  logger.syncInfo('[sync_module_worker] upload %j to nfs error: %s', err);
  throw err;
}
```

> 其結果到底是 `key` 還是 `url` 對於下載的影響跟前一小節一個道理。

## 小結

本章講瞭如何使用和自己定製一個 CNPM 的 NFS 層，讓包的走向跟着你的心走。在描述了開發規範和出示了樣例代碼和改造小例子之後，又解析了這個 NFS 是如何在 CNPM 裏面工作的，上面已經提到了 2.12.2 版本中所有用到 NFS 的地方。

看了上面的解析之後會對 NFS 的工作流程有更深一層的瞭解，然後就不會有寫 NFS 層的時候有種心慌慌摸不着底的情況了。
