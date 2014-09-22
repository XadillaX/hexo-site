title: 讓我們用 Node.js 寫自己的 DDNS 動態域名程序
date: 2014-09-20 15:51:40
tags: [ DDNS, 動態域名, Node.js ]
catelogy: NodeJS
---

## 起因

　　一開始我在移動的寬帶中。那個時候雖然還不是完全的局域網，但是電信網絡訪問不了我的外網 IP。又因爲我需要一個 DDNS 服務來維持我的 [kacaka.ca](http://kacaka.ca/)（目前暫失效）。

　　爲了解決讓電信網絡也能訪問我的 Web，於是我想到了免費 CDN 當中比較有名的 [CloudFlare](http://cloudflare.com/)。而且它也有提供 API 讓開發者自己開發通過他的服務解析域名的服務。

　　再然後，去年的九月份，我的早期 Node.js 作品 **[dloucflare](https://github.com/XadillaX/dloucflare/tree/0.0.2)** 發佈了。所以就有了[這個帖子](http://cnodejs.org/topic/522b64c3101e574521332451)。

　　現在，我已經搬到電信了，然後舊版的貌似不能用了，因爲 **CloudFlare** 貌似 API 都遷移到了 `https` 上面。然後我爲了我的小夥伴們能訪問我出租屋裏的舊電腦，又重構了一遍[這個項目](https://github.com/XadillaX/dloucflare)。

## 使用 dlouc-flare 構建

　　首先安裝最新的 `dlouc-flare` 包：

```sh
$ npm install dlouc-flare
```

　　然後去創建一個 **DF** 對象：

```javascript
var DloucFlare = require("dlouc-flare");
var df = DloucFlare.create("你的郵箱", "API KEY", "域名（不需要 www）");
```

　　**CloudFlare** 如何使用的話這裏就不多做解釋了，至於 **API KEY** 的話，可以在[這裏](https://www.cloudflare.com/my-account)獲取到。

　　然後調用 `df.dynamicDomains` 函數去把你這個域名下面的一些子域名加入你這個腳本的動態域名範疇當中：

```javascript
df.dynamicDomains([ "@", "www", "子域名3", "子域名4", ... ], 檢測時間間隔);
```

> 其中 `"@"` 代表的是域名沒有 `www` 前綴的本身。檢測時間間隔以毫秒爲單位。

　　事實上，你也可以自定義一個檢測你當前主機的 IP 地址的函數（如果你不喜歡用包內的默認檢測 IP 函數）。

　　只要你寫一個函數：

```javascript
function checkIp(callback) {
    // blahblah...
    callback(undefined, IP地址);
}
```

　　然後覆蓋掉默認的 IP 檢測函數即可：

```javascript
df.getIpFunction = checkIp;
```

　　最後保存退出並用 `node` 執行你的程序就好了，程序就會開始歡快地跑了。

![Preview](preview.png)

## 如何自己寫？

　　其實要完全自己寫也是很簡單的——無非就是調用一下 **CloudFlare** 的 API 而已。

　　我們定位明確就是要做 DDNS，所以沒必要關係其它很多不相關的 API，只需要最基礎的幾個就夠了。

### API 解析

　　所有 API 的基礎 URI 都爲：[https://www.cloudflare.com/api_json.html](https://www.cloudflare.com/api_json.html)。

#### 驗證信息

　　根據 **CloudFlare** 文檔所說，所有的提交都要黏上[驗證信息](https://www.cloudflare.com/docs/client-api.html#s2.1)給 POST 過去。而驗證的字段如下：

+ **tkn:** 從你的個人頁面當中複製出來的 API KEY。
+ **email:** 你的登錄郵箱。
+ **a:** 操作名，每種操作都有其特有的操作名。

#### 獲取域名下的子域名記錄

　　其操作名爲 `rec_load_all`，我們不關心其它不重要的參數，只需要再傳一個 `z` 字段代表其域名就好了，舉個例子：

```javascript
var self = this;
var param = {
    a       : "rec_load_all",
    tkn     : this.apiKey,
    email   : this.email,
    z       : this.domain
};

var url = "https://www.cloudflare.com/api_json.html";
spidex.post(url, function(html, status) {
    if(status !== 200) {
        return callback(new Error("Error status while fetching DNS records."));
    }

    var json;
    try {
        json = JSON.parse(html);
    } catch(e) {
        return callback(new Error("Error while parsing DNS records: " + e.message));
    }

    if(json.result === "error") {
        var msg = json.msg;
        if(undefined === msg) msg = "Unknown error.";
        return callback(new Error(msg));
    } else if(json.result === "success") {
        var count = json.response.recs.count;
        var objects = json.response.recs.objs;
        for(var i = 0; i < count; i++) {
            self.records.push(new DNSRecordObject(self, objects[i]));
        }

        callback(undefined, self.records);
    } else {
        callback(new Error("Unknown error."));
    }
}, param, "utf8").on("error", callback);
```

　　上述代碼就是把 `param` 數據給 POST 到 API 的 RESTful 裏面去。然後根據返回值進行解析。

> 關於 `DNSRecordObject` 的代碼可以自行翻閱[這裏](https://github.com/XadillaX/dloucflare/blob/master/lib/dnsrecordobject.js)。
>
> 以及 **spidex** 的文檔在[這裏](https://www.npmjs.org/package/spidex#readme)。

#### 修改某記錄

　　其操作名爲 `rec_edit`，如[文檔](https://www.cloudflare.com/docs/client-api.html#s5.2)所說，除了固有的幾個參數之外，我們還需要有如下參數：

+ `z:` 域名。
+ `id:` 域名記錄編號，從 `rec_load_all` 中獲取。
+ `type:` 記錄類型。如 `A` / `CNAME` 等等。
+ `name:` 子域名名，如果無前綴子域名則與域名相同。
+ `content:` 值。如果我們只是做動態域名的話，這裏的值就是 IP。
+ `service_mode:` 服務類型，填原值即可。
+ `ttl`: TTL，填原值即可。

> 上面參數的解說只是對於我們要做 DDNS 腳本而言的解釋。

　　所以說在 **[dnsrecordobject.js](https://github.com/XadillaX/dloucflare/blob/master/lib/dnsrecordobject.js)** 中我是這麼做的：

```javascript
var param = {
    a       : "rec_edit",
    tkn     : this.dloucflare.apiKey,
    email   : this.dloucflare.email,
    id      : this.recordId(),

    z       : this.domain,
    type    : this.recordType(),
    name    : this.name,
    content : ip,

    service_mode    : this.object.service_mode,
    ttl     : this.object.ttl
};

var self = this;
spidex.post(config.baseUrl, function(html, status, respHeader) {
    if(status !== 200) {
        return callback(new Error("Error status while editing " + self.name + "."));
    }

    var json;
    try {
        json = JSON.parse(html);
    } catch(e) {
        return callback(new Error("Error while parsing editing result: " + e.message));
    }

    if(json.result === "success") {
        self.object.content = ip;
        return callback();
    } else {
        var msg = json.msg || "Unknown error.";
        return callback(new Error(msg));
    }
}, param, "utf8").on("error", callback);
```

> 上面的代碼就能將你某個域名（`this.domain`）下的子域名 `this.name` 的 IP 給修改成 `ip` 了。

#### 探測 IP

　　這種 API 網上就多了去了。

　　舉個簡單的例子，我的 `dlouc-flare` 的獲取 IP 的 API 就是從

> http://www.telize.com/ip

　　來的。

　　請求上面的地址之後，輸出的內容（注意有換行符）就是你當前機子所在的網絡的公網 IP 了。

　　類似的 API 還有很多：

+ **http://ip-api.com/json**: 這個 API 就會輸出一堆的 JSON，需要自行解析。
+ **http://ip.taobao.com/service/getIpInfo2.php?ip=myip**: 這個是淘寶提供的 RESTful 獲取 IP 的 API。
+ ...（其它的可以自己去發現）

### 流程

　　有了上面的仨 API，一切都好說了，流程很簡單：

+ 獲取自己某個使用 `CloudFlare` 解析的域名下的[子域名](#獲取域名下的子域名記錄)。
+ 自己設置幾個子域名名拿來做 DDNS。
+ 設置一個定時器，每次定時器到時的時候都進行如下操作：
  1. 通過 [IP 的 API](#探測_IP) 獲取當前 IP。
  2. 循環遍歷每個自己設置的子域名名。
  3. 對於每個子域名，都判斷其當前記錄 IP 是否等於當前剛探測的 IP。
    - **是**：[修改該子域名的記錄值](#修改某記錄)爲剛探測的 IP。
    - **否**：不作任何操作。

　　有了上面的幾個步驟，加上之前我們講的幾個 API，大家就能輕鬆加愉快地完成自己的 DDNS 腳本了。

　　當然，如果自己懶的話也可以用本文一開始的方法，使用 `dlouc-flare` 這個包，通過簡單的編碼就能實現自己的 DDNS 動態域名腳本了。

> 這裏的定時器時間自己按需而定，就我自己而言，我是給設置了 `1000 * 60` 毫秒的間隔。

## 小結

　　最早與動態域名結緣的時候是初中的時候，大概七八年前了吧，那個時候花生殼什麼的，但是最終用的是 `3322.org`。

　　其實基本的動態域名的原理很簡單，無非就是本地開一個腳本，不停去探測本機 IP，一旦有變化就去解析服務器修改。

　　本人在這裏拋磚引玉。如果哪裏有別的解析商的 API，大家自己也可以舉一反三，寫什麼 DNSPod 的動態域名，寫什麼 jiasule 的動態域名等等等等。

　　喵~*ଘ(੭*ˊᵕˋ)੭* ੈ✩‧₊˚

