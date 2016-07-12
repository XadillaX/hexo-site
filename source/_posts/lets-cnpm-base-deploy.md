title: 跟我一起部署和定製 CNPM——基礎部署
date: 2016-07-09 19:19:22
tags: [ "CNPM", "Node.js" ]
---

本章會介紹 CNPM 的基礎部署方法。

> 該文章所對應的 cnpm 目標版本爲 [v2.12.2](https://github.com/cnpm/cnpmjs.org/tree/2.12.2)，上下浮動一些兼容的版本問題也都不是特別大。

## 準備

想要部署 CNPM，你需要做以下的一些準備。

1. 部署的宿體，如服務器、雲主機、自己的電腦等；
2. 數據庫，支持 MySQL、PostgreSQL、MariaDB，如果使用 SQLite 則無需準備；
3. Git 客戶端（推薦）。

## 開始部署

### 克隆 CNPM

首先在本地選擇一個目錄，比如我將它選擇在 `/usr/app`，然後預想 CNPM 的目錄爲 `/usr/app/cnpm`，那麼需要在終端 `$ cd /usr/app`。

接下去執行 Git 指令將 CNPM 克隆到相應目錄。

```sh
$ git clone https://github.com/cnpm/cnpmjs.org.git
```

#### Windows 用戶

Windows 用戶也可以用類似 [Cygwin](https://www.cygwin.com/)、[MinGW](http://www.mingw.org/)、[Powershell](https://msdn.microsoft.com/en-us/powershell) 甚至直接是 Command 等來運行 [Git](https://git-scm.com/download/win)。

當然也可以直接下載一些 GUI 工具來克隆，如 [SourceTree](https://www.sourcetreeapp.com/)。

#### 非 Git 用戶

跑到 CNPM 的 Release 頁面，選擇相應的版本下載，比如這裏會選擇 [v2.12.2](https://github.com/cnpm/cnpmjs.org/releases/tag/2.12.2) 版。

下載完畢後將文件夾解壓到相應目錄即可。

### 安裝依賴

安裝依賴其實就是一個 `npm install`，不過 CNPM 把該指令已經寫到 Makefile 裏面了，所以直接執行下面的命令就好了。

```sh
$ make install
```

當然萬一你是 Windows 用戶或者不會 `make`，那麼還是要用 `npm install`。

```sh
$ npm install --build-from-source --registry=https://registry.npm.taobao.org --disturl=https://npm.taobao.org/mirrors/node
```

### 修改配置文件

新建一份 `config/config.js` 文件，並且寫入如下的骨架：

```js
'use strict';

module.exports = {
};
```

在這裏面輸入你需要的鍵值對。

這裏將會列舉一些常用的配置項，其餘的一些配置項請自行參考 [config/index.js](https://github.com/cnpm/cnpmjs.org/blob/2.12.2/config/index.js) 文件。

#### 配置字段參考

+ `enableCluster`：是否啓用 **cluster-worker** 模式啓動服務，默認 `false`，生產環節推薦爲 `true`;
+ `registryPort`：API 專用的 registry 服務端口，默認 `7001`；
+ `webPort`：Web 服務端口，默認 `7002`；
+ `bindingHost`：監聽綁定的 Host，默認爲 `127.0.0.1`，如果外面架了一層本地的 **Nginx** 反向代理或者 **Apache** 反向代理的話推薦不用改；
+ `sessionSecret`：**session** 用的鹽；
+ `logdir`：日誌目錄；
+ `uploadDir`：臨時上傳文件目錄；
+ `viewCache`：視圖模板緩存是否開啓，默認爲 `false`；
+ `enableCompress`：是否開啓 **gzip** 壓縮，默認爲 `false`；
+ `admins`：管理員們，這是一個 `JSON Object`，對應各鍵名爲各管理員的用戶名，鍵值爲其郵箱，默認爲 `{ fengmk2: 'fengmk2@gmail.com', admin: 'admin@cnpmjs.org', dead_horse: 'dead_horse@qq.com' }`；
+ `logoURL`：**Logo** 地址，不過對於我這個已經把 CNPM 前端改得面目全非的人來說已經忽略了這個配置了；
+ `adBanner`：廣告 Banner 的地址；
+ `customReadmeFile`：實際上我們看到的 [cnpmjs.org](http://cnpmjs.org) 首頁中間一大堆冗長的介紹是一個 Markdown 文件轉化而成的，你可以設置該項來自行替換這個文件；
+ `customFooter`：自定義頁腳模板；
+ `npmClientName`：默認爲 `cnpm`，如果你有自己開發或者 fork 的 npm 客戶端的話請改成自己的 CLI 命令，這個應該會在一些頁面的說明處替換成你所寫的；
+ `backupFilePrefix`：備份目錄；
+ `database`：數據庫相關配置，爲一個對象，默認如果不配置將會是一個 `~/.cnpmjs.org/data.sqlite` 的 SQLite；
  - `db`：數據的庫名；
  - `username`：數據庫用戶名；
  - `password`：數據庫密碼；
  - `dialect`：數據庫適配器，可選 `"mysql"`、`"sqlite"`、`"postgres"`、`"mariadb"`，默認爲 `"sqlite"`；
  - `hsot`：數據庫地址；
  - `port`：數據庫端口；
  - `pool`：數據庫連接池相關配置，爲一個對象；
    * `maxConnections`：最大連接數，默認爲 `10`；
    * `minConnections`：最小連接數，默認爲 `0`；
    * `maxIdleTime`：單條鏈接最大空閒時間，默認爲 `30000` 毫秒；
  - `storege`：僅對 SQLite 配置有效，數據庫地址，默認爲 `~/.cnpmjs/data.sqlite`；
+ `nfs`：包文件系統處理對象，爲一個 Node.js 對象，默認是 [fs-cnpm]() 這個包，並且配置在 `~/.cnpmjs/nfs` 目錄下，也就是說默認所有同步的包都會被放在這個目錄下；開發者可以使用別的一些文件系統插件（如上傳到又拍雲等）,又或者自己去按接口開發一個邏輯層，這些都是後話了；
+ `registryHost`：暫時還未試過，我猜是用於 Web 頁面顯示用的，默認爲 `r.cnpmjs.org`；
+ `enablePrivate`：是否開啓私有模式，默認爲 `false`；
  - 如果是私有模式則只有管理員能發佈包，其它人只能從源站同步包；
  - 如果是非私有模式則所有登錄用戶都能發佈包；
+ `scopes`：非管理員發佈包的時候只能用以 `scopes` 裏面列舉的命名空間爲前綴來發布，如果沒設置則無法發佈，也就是說這是一個必填項，默認爲 `[ '@cnpm', '@cnpmtest', '@cnpm-test' ]`，據蘇千大大解釋是爲了便於管理以及讓公司的員工自覺按需發佈；更多關於 NPM scope 的說明請參見 [npm-scope](https://docs.npmjs.com/misc/scope)；
+ `privatePackages`：就如該配置項的註釋所述，出於歷史包袱的原因，有些已經存在的私有包（可能之前是用 Git 的方式安裝的）並沒有以命名空間的形式來命名，而這種包本來是無法上傳到 CNPM 的，這個配置項數組就是用來加這些例外白名單的，默認爲一個空數組；
+ `sourceNpmRegistry`：更新源 NPM 的 registry 地址，默認爲 `https://registry.npm.taobao.org`；
+ `sourceNpmRegistryIsCNpm`：源 registry 是否爲 CNPM，默認爲 `true`，如果你使用的源是官方 NPM 源，請將其設爲 `false`；
+ `syncByInstall`：如果安裝包的時候發現包不存在，則嘗試從更新源同步，默認爲 `true`；
+ `syncModel`：更新模式（不過我覺得是個 `typo`），有下面幾種模式可以選擇，默認爲 `"none"`;
  - `"none"`：永不同步，只管理私有用戶上傳的包，其它源包會直接從源站獲取；
  - `"exist"`：定時同步已經存在於數據庫的包；
  - `"all"`：定時同步所有源站的包；
+ `syncInterval`：同步間隔，默認爲 `"10m"` 即十分鐘；
+ `syncDevDependencies`：是否同步每個包裏面的 `devDependencies` 包們，默認爲 `false`；
+ `badgeSubject`：包的 **badge** 顯示的名字，默認爲 `cnpm`；
+ `userService`：用戶驗證接口，默認爲 `null`，即無用戶相關功能也就是無法有用戶去上傳包，該部分需要自己實現接口功能並配置，如與公司的 **Gitlab** 相對接，這也是後話了；
+ `alwaysAuth`：是否始終需要用戶驗證，即便是 `$ cnpm install` 等命令；
+ `httpProxy`：代理地址設置，用於你在牆內源站在牆外的情況。

#### 一個可能的配置

下面給出一個樣例配置：

```js
module.exports = {
    enableCluster: true,
    database: {
        db: "snpm",
        username: "username",
        password: "password",

        dialect: "mysql",
        host: "127.0.0.1",
        port: 3306
    },
    enablePrivate: false,
    admins: {
        xadillax: "i@2333.moe"
    },
    syncModel: "exist",
    nfs: require('upyun-cnpm').create({
        bucket: "your bucket",
        oprator: "your id",
        password: "your secret"
    }),
    scopes: [ '@cheniu', '@souche', '@souche-f2e' ],
    badgeSubject: 'snpm',
    privatePackages: [ 'snpm' ]
};
```

> 上面的配置包文件系統層用的是 [upyun-cnpm](https://github.com/cnpm/upyun-cnpm) 插件，需要在 CNPM 源碼根目錄執行
```sh
$ npm install --save -d upyun-cnpm
```
> 這個時候你的 `package.json` 就有更改與源 Repo 不一致了，如果是 Git 克隆的用戶在以後升級更新系統的時候稍稍注意一下可能的衝突即可。

#### 官方 NFS 插件

下面給出幾個官方的 NFS 插件：

+ [upyun-cnpm](https://github.com/cnpm/upyun-cnpm)：包本體存在又拍雲的插件；
+ [fs-cnpm](https://github.com/cnpm/fs-cnpm)：包本體存在本地的插件；
+ [sfs-client](https://github.com/cnpm/sfs-client)：包本體存在 [SFS](https://github.com/cnpm/sfs)（Simple FIle Store）插件；
+ [qn-cnpm](https://github.com/cnpm/qn-cnpm)：包本體存在七牛的插件；
+ [oss-cnpm](https://github.com/cnpm/oss-cnpm)：包本體存在阿里雲 OSS 的插件。

以後官方如果有一些新的插件進來，這裏可能不會更新了，請自行去 [NFS Storage Wrappers](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide#present-storage-wrappers) 獲取最新的 NFS 插件們。

### 初始化數據庫

如果你使用的是 SQLite 的話，數據庫是自動就好了的，可以忽略該步。

其它數據庫需要自行導入初始數據庫結構。

初始數據庫腳本在 **docs/db.sql** 裏面，你可以用一些 GUI 工具將數據導入，也可以直接進入命令行導入。

比如你用的是 MySQL，就可以在本機操作 MySQL。

```sh
$ mysql -u yourname -p
mysql> use cnpmjs;
mysql> source docs/db.sql
```

### 啓動服務

搞好配置之後就可以直接啓動服務了。

#### 簡單啓動

最簡單的辦法也是我現在正在用的方法就是直接用 `node` 執行一下入口文件就好了。

```sh
$ node dispatch.js
```

> 其實我是在 [tmux](https://tmux.github.io/) 裏面執行上面的指令的。

#### 官方腳本啓動

官方的其它一些指令，比如你可以用 NPM 的 script 來運行。

```sh
$ npm run start
```

> 在 CNPM 裏面，npm script 還有下面幾種指令
>
> + `npm run dev`：調試模式啓動；
> + `npm run test`：跑測試；
> + `npm run start`：啓動 CNPM；
> + `npm run status`：查看 CNPM 啓動狀態；
> + `npm run stop`：停止 CNPM。

### 小結

本文介紹了一些 CNPM 基礎的部署方法，基本上能達到最小可用狀態。

如果想要進階定製一些 CNPM 的功能，請期待後續吧。ξ( ✿＞◡❛)

以及一些寫得不好和不對的地方，請多多指正哦。
