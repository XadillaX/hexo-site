title: 跟我一起部署和定製 CNPM——自定义包存储层
date: 2016-07-22 14:23:01
tags: [ "CNPM", "Node.js" ]
---

CNPM 的自定义包存储层文件系统简称 NFS，我猜是 NPM File System 的意思。

在之前《[跟我一起部署和定製 CNPM——基礎部署](https://xcoder.in/2016/07/09/lets-cnpm-base-deploy/)》中提到过，CNPM 配置项里面有一项配置 `nfs`，它所对应的是一个 NFS 对象。

在同步 package 的时候，CNPM 会把源站的包下载到本地，然后传给 NFS 对象相应的函数交予去处理，由 NFS 对象返回处理结束之后该包在我们自己部署的 CNPM 对应的包下载链接。

上面的这一套流程就给我们自定义包存储提供了可能，比如我们可以把包同步到又拍云存储、阿里云 OSS 等地方去，也可以以二进制的形式存入我们自己的数据库（不推荐），甚至可以什么都不用做直接放在本地，然后把本地文件对外网暴露即可。

## NFS 接口

NFS 的接口是实现定义好的，我们如果要写一个自己的 NFS 类，只需要按照约定的接口实现他们的逻辑即可。

> 虽然我自己不喜欢，但是 NFS 的所有函数需要在菊花函数中被实现。

下面给出接口的定义：

+ `function* upload(filepath, options)`
  - `filepath`：文件路径。
  - `options`
    * `key`：待上传文件的标识
    * `size`：待上传文件大小
+ `function* uploadBuffer(fileBuffer, options)`
  - `fileBuffer`：待上传文件的 Buffer
  - `options`
    * `key`：待上传文件的标识
    * `size`：待上传文件的大小
+ `function* remove(key)`
  - `key`: 文件标识
+ `function* download(key, savePath, options)`（可选实现）
  - `key`：文件标识
  - `savePath`：保存路径
  - `options`
    * `timeout`：超时时间
+ `function* createDownloadStream(key, options)`（可选实现）
  - `key`: 文件标识
  - `options`
    * `timeout`：超时时间
  - 返回一个 `ReadStream`
+ `function[*] url(key)`（可选实现，可以不是菊花函数）
  - `key`: 文件标识

## OSS-CNPM 解析

这里拿出一个 NFS 的官方实现阿里云 OSS 版来作为解析。它的 Repo 是 [https://github.com/cnpm/oss-cnpm](https://github.com/cnpm/oss-cnpm)。

打开 [index.js](https://github.com/cnpm/oss-cnpm/tree/2.1.0/index.js) 我们能看到，的确 `OssWrapper` 实现了上面的一些接口。

### 构造函数

在 `function OssWrapper` 里面我们看到它 `new` 了 [ali-oss](https://github.com/aliyun/oss-nodejs-sdk) 对象。

```javascript
if (options.cluster) {
  options.schedule = options.schedule || 'masterSlave';
  this.client = new oss.ClusterClient(options);
} else {
  this.client = oss(options);
}
```

也就是说在各种上传等函数里面都是以这个 `client` 为主体做的事情的。

### upload 和 uploadBuffer

首先我们看看 `upload` 函数，从外部传进来文件的 `key`，NFS 对象将该文件以 `key` 为名传到 OSS 去，并返回该文件上传之后在 OSS 上的地址。

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

`uploadBuffer` 其实也一样，参数第一个 `fileBuffer` 是一个文件二进制 Buffer 对象，而 `ali-oss` 包的 `put` 函数第二个参数既可以传一个文件路径，也可以传一个 Buffer，所以相当于把 `upload` 这个函数直接拿过来就能用了，于是就有了：

```javascript
proto.uploadBuffer = proto.upload;
```

### remove、download 和 createDownloadStream

这两个函数实际上也是直接调用了 `ali-oss` 的函数，并没有什么好讲的，大家自己看看就好了。

### url

这个函数无非就是判断下有没有自定义的 CDN 域名什么的，根据不同的返回不同的网址而已。

### trimKey

把 `key` 里面带的最前面的斜杠去掉。

## 我的 OSS-CNPM 随意改造

上面一节解析了 `oss-cnpm` 这个包的代码，如果官方出的几个 NFS 包不能满足，大家也能自己去写一个 CNPM 存储层的包了。

我们公司的包是直接在 OSS 上面的，所以用 `oss-cnpm` 并没有什么不妥。

不过对于阿里系本身的公司门来说，OSS 并不是什么大事儿，对于我们来说，OSS 的 bucket 资源还是蛮稀缺的，上次就达到上限了。所以我们目前的 NPM 包跟公司别的测试业务用的是同一个 bucket。

那么问题来了：

**`oss-cnpm` 直接把所有文件放在根目录下建文件夹，太乱了，而且的确是有小可能冲突的。而这个包又不能让人自定义前缀什么什么的。**

于是我就自己 Fork 小小改装了一下这个包，让它适合我们公司自己。

改装很简单，在上传的目录中加一个文件夹前缀。

动的是 `trimKey` 函数：

```javascript
function trimKey(key) {
  return '_snpm_/' + (key ? key.replace(/^\//, '') : '');
}
```

这下所有在我们内部 CNPM 里面的包的链接都多了个 `_snpm_/` 的前缀了。

## CNPM 调用解析

上面解析了接口之后，我们来扒一扒什么时候会调用上面实现的接口们吧，这样就知道 CNPM 对于 NFS 使用的工作原理了。

### controllers/registry/package/download.js

> [源码参考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/download.js)

对于包下载来说，它的路由是：

```
/{package}/download/{package}-{version}.tgz
```

然后在里面判断一下如果 NFS 对象有实现 `url()` 函数的话，先用 `url()` 函数生成对该包而言的真实下载链接。

读出这个包的 registry 信息，里面如果没有 `dist` 等参数的话直接 302 到刚生成的地址去。

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

接下去是涉及到上一章没有提到过的一个配置参数，叫 `downloadRedirectToNFS`，默认为 `false`。如果该值为 `true` 的话并且刚才由 `url()` 函数生成了下载链接的话，也是直接 302 到真实下载链接去。

```javascript
if (config.downloadRedirectToNFS && url) {
  this.status = 302;
  this.set('Location', url);
  return;
}
```

不过如果本身 registry 里面就没 `key` 这个选项的话也会直接用 `url()` 生成的链接给跳过去。如果没有 `url()` 的链接，那么直接用 registry 里面的 `tarball` 字段。

```javascript
var dist = row.package.dist;
if (!dist.key) {
  url = url || dist.tarball;
  this.status = 302;
  this.set('Location', url);
  return;
}
```

上面如果都跳过去了，那么说明要开始调用事先写好的 `download` 那两个函数了，把文件读到 Buffer 里面，然后把 Buffer 放到 Response 里面传回去。

### controllers/registry/package/remove.js

> [源码参考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/remove.js)

对于删除包来说，除了把包从数据库删掉之外，还要循环遍历一遍这个包的所有版本，把所有版本的这个包都从 NFS 里面删除。

```javascript
try {
  yield keys.map(function (key) {
    return nfs.remove(key);
  });
} catch (err) {
  logger.error(err);
}
```

这里就调用了你事先写好的 `remove` 了。当然你不实现也没关系，最多是包的压缩文件不删除而已。

### controllers/registry/package/remove_version.js

> [源码参考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/remove_version.js)

这里跟上一小节差不多，之前是删除整个包，这里是删除包的某一个版本，所以就不用循环删除了。

```javascript
try {
  yield nfs.remove(key);
} catch (err) {
  logger.error(err);
}
```

### controllers/registry/package/save.js

> [源码参考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/registry/package/save.js)

然后就是用户 `$ npm publish` 用的路由了，在一堆判断之后，发布传过来的包被放在二进制 Buffer 内存里面：

```javascript
var tarballBuffer;
tarballBuffer = new Buffer(attachment.data, 'base64');
```

接下去又判断来判断去，最后交由 NFS 的 `uploadBuffer` 来上传并得到结果。

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

看到没有，就是这里记录的它到底是 `key` 还是 `tarball` 了。

如果你的 `upload` 函数返回的是 `{ url: 'FOO' }`，那么就是 `tarball` 设置成该值，在下载的时候会直接 302 到 `tarball` 所指的地址去；如果返回的是 `{ key: 'key' }` 的话，会在 `dist` 里面存个 `key`，下载的时候判断如果有 `key` 的话会把它传进你的 `createDownloadStream` 或者 `download` 函数去交由你的函数生成包 Buffer 并传回 Response。

### controller/sync_module_worker.js

> [源码参考](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/sync_module_worker.js)

这个文件是从源端同步相关的一些逻辑了，这里面有两个操作。

一个是 `unpublish`，调用的就是 NFS 的 `remove`，不作详谈了。

另一个就是同步了。同步包会被打散成同步一个版本，然后把每个版本同步过来。在同步版本的时候先把包文件[下载](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/sync_module_worker.js#L940)到本地文件 `filepath` 里面去。

```javascript
var r = yield urllib.request(downurl, options);
```

> [urllib](https://github.com/node-modules/urllib) 是苏千死马他们自己写的比较方便和适合他们自己的一个 http 请求库。

上面的代码 `options` 里面有一个文件流，链接到 `filepath` 目录的这个文件去，相当于这一步就是把源端的包下载到本地 `filepath` 去了。

经过一堆 blahblah 的判断（比如 SHASUM）之后，这个这个函数就会[调用 NFS 的 `upload` 函数](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/controllers/sync_module_worker.js#L995)将本地文件名对应的文件上传到你所需要的地方去了。

```javascript
try {
  result = yield nfs.upload(filepath, options);
} catch (err) {
  logger.syncInfo('[sync_module_worker] upload %j to nfs error: %s', err);
  throw err;
}
```

> 其结果到底是 `key` 还是 `url` 对于下载的影响跟前一小节一个道理。

## 小结

本章讲了如何使用和自己定制一个 CNPM 的 NFS 层，让包的走向跟着你的心走。在描述了开发规范和出示了样例代码和改造小例子之后，又解析了这个 NFS 是如何在 CNPM 里面工作的，上面已经提到了 2.12.2 版本中所有用到 NFS 的地方。

看了上面的解析之后会对 NFS 的工作流程有更深一层的了解，然后就不会有写 NFS 层的时候有种心慌慌摸不着底的情况了。
