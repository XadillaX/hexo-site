title: Node.js 中使用 Redis 來實現定時任務
date: 2015-06-05 15:23:51
tags: [ Redis, Node.js, 定時任務 ]
---

　　好久沒寫博文了，最近在跟隨着公司大牛們的腳步祕密研發新產品中。

　　不過前幾天有一個小需求的東西可以提出來寫一點點小乾貨兒跟大家分享分享。米娜桑會的就可以忽略了，反正我也是隨便寫的；如果覺得本文對你有用的話還請多多支持喵。(●´ω｀●)ゞ

## 序

　　本文所說的定時任務或者說計劃任務並不是很多人想象中的那樣，比如說每天凌晨三點自動運行起來跑一個腳本。這種都已經爛大街了，隨便一個 **[Crontab](https://wiki.archlinux.org/index.php/Cron)** 就能搞定了。

　　這裏所說的定時任務可以說是計時器任務，比如說用戶觸發了某個動作，那麼從這個點開始過二十四小時我們要對這個動作做點什麼。那麼如果有 1000 個用戶觸發了這個動作，就會有 1000 個定時任務。於是這就不是 **Cron** 範疇裏面的內容了。

　　舉個最簡單的例子，一個用戶推薦了另一個用戶，我們定一個二十四小時之後的任務，看看被推薦的用戶有沒有來註冊，如果沒註冊就給他搞一條短信過去。Σ>―(〃°ω°〃)♡→

## 最初的設想

　　一開始我是想把這個計時器做在內存裏面直接調用的。

　　考慮到 Node.js 的定時並不是那麼準確（無論是 `setTimeout` 還是 `setInterval`），所以本來打算自己維護這個定時器隊列。

　　又考慮到 Node.js 原生對象比較耗內存。之前我用 `JSON` 對象存了一本字典，約十二萬多的詞條，原文件大概也就五六兆，用 Node.js 的原生對象一存居然有五六百兆的內存佔用——所以打算這個定時器隊列用 C++ 來寫 addon。

　　考慮到任何時候插入的任務都有可能在已有的任務之前或者之後，所以本來想用 C++ 來寫一個[小根堆](http://zh.wikipedia.org/wiki/%E6%9C%80%E5%A4%A7%E2%80%94%E6%9C%80%E5%B0%8F%E5%A0%86)。每次用戶來一個任務的時候就將這個任務插入到堆中。

　　如果按照上述方法的話，再加上對時間要求掐得也不是那麼緊，於是就是一個不斷的 `process.nextTick()` 的過程。

　　在 `process.nextTick()` 當中執行這麼一個函數：

1. 從小根堆中不斷獲取堆頂的任務並處理，一直處理到堆頂任務的執行時間大於當前時間爲止。
2. 繼續 `process.nextTick()` 來讓下一個 tick 執行步驟 1 中的流程。

　　所以最後就是一邊往小根堆插入任務，另一邊通過不斷 `process.nextTick()` 消費任務的這麼一個過程。

　　最後，爲了考慮到程序重啓的時候內存數據會丟失，還應該做一個持久化的事情——在每次插入任務的時候順便往持久化中間件中插一條副本，比如 MySQL、MongoDB、Redis、Riak 等等任何三方依賴。消費任務的時候順便把中間件中的這條任務數據給刪除。

　　也就是說中間件中永遠存的就是當前尚未完成的任務。每當程序重啓的時候都先從中間件中把所有任務讀取進來重建一下堆，然後就能繼續工作了。

> 如果當時我沒有發現 Redis 的這個妙用的話，上述的流程將會是我實現我們定時任務的流程了。

## Redis 妙用

　　在 Redis 的 2.8.0 版本之後，其推出了一個新的特性——鍵空間消息（[Redis Keyspace Notifications](http://redis.io/topics/notifications)），它配合 2.0.0 版本之後的 `SUBSCRIBE` 就能完成這個定時任務的操作了，**不過定時的單位是秒**。

### Publish / Subscribe

　　Redis 在 2.0.0 之後推出了 [Pub / Sub](http://redis.io/topics/pubsub) 的指令，大致就是說一邊給 Redis 的特定頻道發送消息，另一邊從 Redis 的特定頻道取值——形成了一個簡易的消息隊列

　　比如我們可以往 `foo` 頻道推一個消息 `bar`，那麼就可以直接：

```
PUBLISH foo bar
```

　　另一邊我們在客戶端訂閱 `foo` 頻道就能接受到這個消息了。

　　舉個例子，如果在 Node.js 裏面使用 [ioredis](https://github.com/luin/ioredis) 這個包那麼看起來就會像這樣：

```javascript
var Redis = require("ioredis");
var sub = new Redis(/** 連接信息 */);
sub.once("connect", function() {
    // 假設我們需要選擇 redis 的 db，因爲實際上我們不會去污染默認的 db 0
    sub.select(DB_NUMBER, function(err) {
        if(err) process.exit(4);
        sub.subscribe("foo", function() {
            //... 訂閱頻道成功
        });
    });
});

// 監聽從 `foo` 來的消息
sub.on("message", function(channel, msg) {
    console.log(channel, msg);
});
```

### Redis Keyspace Notifications

　　在 Redis 裏面有一些事件，比如鍵到期、鍵被刪除等。然後我們可以通過配置一些東西來讓 Redis 一旦觸發這些事件的時候就往特定的 Channel 推一條消息。

　　本文所涉及到的需求的話我們所需要關心的事件是 `EXPIRE` 即過期事件。

　　大致的流程就是我們給 Redis 的某一個 db 設置過期事件，使其鍵一旦過期就會往特定頻道推消息，我在自己的客戶端這邊就一直消費這個頻道就好了。

　　以後一來一條定時任務，我們就把這個任務狀態壓縮成一個鍵，並且過期時間爲距這個任務執行的時間差。那麼當鍵一旦到期，就到了任務該執行的時間，Redis 自然會把過期消息推去，我們的客戶端就能接收到了。這樣一來就起到了定時任務的作用。

#### 消息類型

　　當達到一定條件後，有兩種類型的這種消息會被觸發，用哪個需要自己選了。舉個例子，我們刪除了在 db 0 中一個叫 `foo` 的鍵，那麼系統會往兩個頻道推消息，一個是 `del` 事件頻道推 `foo` 消息，另一個是 `foo` 頻道推 `del` 消息，它們小倆口被系統推送的指令分別等價於：

```
PUBLISH __keyspace@0__:foo del
PUBLISH __keyevent@0__:del foo
```

　　其中往 `foo` 推送 `del` 的頻道名爲 `__keyspace@0__:foo`，即是 `"__keyspace@" + DB_NUMBER + "__:" + KEY_NAME`；而 `del` 的頻道名爲 `"__keyevent@" + DB_NUMBER + "__:" + EVENT_NAME`。

#### 配置

　　即使你的 Redis 版本達標了，但是 Redis 默認是關閉這個功能的，你需要修改配置文件來打開它，或者直接在 CLI 裏面通過指令修改。這裏就說說配置文件的修改吧。

　　如果不想看我在這裏羅裏吧嗦的，也可以直接去看 Redis 的[相關文檔](http://redis.io/topics/notifications#configuration)。

　　首先打開 Redis 的配置文件，在不同的系統和安裝方式下文件位置可能不同，比如通過 `brew` 安裝的 MacOS 下可能是在 `/usr/local/etc/redis.conf` 下面，通過 `apt-get` 安裝的 Ubuntu 下可能是在 `/etc/redis/redis.conf` 下，總之找到配置文件。**或者自己寫一個配置文件，啓動的時候指定配置文件地址就好。**

　　然後找到一項叫 `notify-keyspace-events` 的地方，如果找不到則自行添加，其值可以是 `Ex`、`Klg` 等等。這些字母的具體含義如下所示：

+ **K**，表示 `keyspace` 事件，有這個字母表示會往 `__keyspace@<db>__` 頻道推消息。
+ **E**，表示 `keyevent` 事件，有這個字母表示會往 `__keyevent@<db>__` 頻道推消息。
+ **g**，表示一些通用指令事件支持，如 `DEL`、`EXPIRE`、`RENAME` 等等。
+ **$**，表示字符串（String）相關指令的事件支持。
+ **l**，表示列表（List）相關指令事件支持。
+ **s**，表示集合（Set）相關指令事件支持。
+ **h**，哈希（Hash）相關指令事件支持。
+ **z**，有序集（Sorted Set）相關指令事件支持。
+ **x**，過期事件，與 **g** 中的 `EXPIRE` 不同的是，**g** 的 `EXPIRE` 是指執行 `EXPIRE key ttl` 這條指令的時候順便觸發的事件，而這裏是指那個 `key` 剛好過期的這個時間點觸發的事件。
+ **e**，驅逐事件，一個 `key` 由於內存上限而被驅逐的時候會觸發的事件。
+ **A**，`g$lshzxe` 的別名。也就是說 `AKE` 的意思就代表了所有的事件。

　　結合上述列表我們就能拼湊出自己所需要的事件支持字符串了，在我的需求中我只需要 `Ex` 就可以滿足了，所以配置項就是這樣的：

```
notify-keyspace-events Ex
```

　　然後保存配置文件，啓動 Redis 就啓用了過期事件的支持了。

#### 實踐

　　我們先說任務的創造者吧。由於這裏 **Redis** 的事件只會傳鍵名，並不會傳鍵值，而過期事件觸發的時候那個鍵已經沒了，你也無法獲取鍵值，加上我的主系統和任務系統是分佈式的，所以就把所有需要的信息往鍵名塞。

　　一個最簡單的鍵名設計就是 `任務類型 + ":" + JSON.stringify 化後的參數數組`；更有甚者可以直接把任務類型替換成所需的函數路徑，比如需要執行這個任務的函數在 `task/foo/bar` 文件下面的 `baz` 函數，參數 `arguments` 數組爲 `[ 1, 2 ]`，那麼鍵名的設計可以是 `task/foo/bar.baz:[1,2]`，反正我們只需要觸發這個鍵，用不着去查詢這個鍵。等到真正過期了任務系統接收到這個鍵名的時候再一一解析，得到需要執行 `task/foo/bar.baz` 這個消息，並且網函數裏面傳入 `[1,2]` 這個 `arguments`。

　　所以當接收到一個定時任務的時候，我們得到消息、函數名、過期時間參數，這個函數可以如下設計：

```javascript
/** 我們假設 redis 是一個 ioredis 的對象 */

var sampleTaskMaker = function(message, func, timeout) {
    message = JSON.stringify(message);
    console.log("Received a new task:", func, message, "after " + timeout + ".");

    // 這裏的 uuid 是 npm 一個包
    // 生成一個唯一 uuid 的目的是爲了防止兩個任務用了相同的函數和參數，那麼
    // 鍵名可能會重複並覆蓋的情況
    // uuid 的文檔爲 https://www.npmjs.com/package/node-uuid
    //
    // 這裏的 ❤️ 是一個分隔符，冒號是分割 uuid 和後面內容的，而 ❤️ 是分割函數名
    // 和消息的
    var key = uuid.v1().replace(/-/g, "") +
        ":❤️" + func + "❤️" + message;
    var content = "";

    redis.multi()
        .set(key, content)
        .expire(key, timeout)
        .exec(function(err) {
            if(err) {
                console.error("Failed to publish EXPIRE EVENT for " + content);
                console.error(err);
                return;
            }
        });
};
```

> Ioredis 的穩定可以[點此](https://github.com/luin/ioredis)查看。

　　然後在任務系統裏面的一開始監聽這個過期頻道：

```javascript
// assign 是 sugarjs 裏面的函數
// 把 db 塞到字符串裏面的 {db} 裏去
var subscribeKey = "__keyevent@{db}__:expired".assign({ db: 1 });

// 假設 sub 是 ioredis 的對象
sub.once("connect", function() {
    // 假設我們需要選擇 redis 的 db，因爲實際上我們不會去污染默認的 db 0
    sub.select(1, function(err) {
        if(err) process.exit(4);
        sub.subscribe("foo", function() {
            //... 訂閱頻道成功
        });
    });
});

// 監聽從 `foo` 來的消息
sub.on("message", sampleOnExpired);
```

> **注意：** 我們這裏選擇 db 1 是因爲一旦開啓過期事件監聽，那麼這個 db 的所有過期事件都會被髮送。爲了不跟正常使用的 redis 過期鍵混淆，我們爲這個事情專門用一個新的 db。比如我們在自己正常使用的 db 0 裏面監聽了，那麼不是我們任務觸發的過期事件也會傳過來，這個時候我們解析的鍵名就不對了。

　　最後就是我們的 `sampleOnExpired` 函數了。

```javascript
var sampleOnExpired = function(channel, key) {
    // UUID:❤️func❤️params
    var body = key.split("❤️");
    if(body.length < 3) return;

    // 取出 body 第一位爲 func
    var func = body[1];

    // 推出前兩位，後面剩下的有可能是參數裏面自帶 ❤️ 而被分割，所以要拼回去
    body.shift(); body.shift();
    var params = body.join("❤️");

    // 然後把 params 傳入 func 去執行
    // func:
    //   path1/path2.func
    func = func.split(".");
    if(func.length !== 2) {
        console.error("Bad params for task:", func.join("."), "-", params);
        return;
    }

    var path = func[0];
    func = func[1];

    var mod;
    try {
        mod = require("./tasks/" + path);
    } catch(e) {
        console.error("Failed to load module", path);
        console.error(e.stack);
        return;
    }

    process.nextTick(function() {
        try {
            mod[func].apply(null, JSON.parse(params));
        } catch(e) {
            console.error("Failed to call function", path, "-", func, "-", params);
            console.error(e.stack);
        }
    });
};
```

　　這個簡易的架子搭好後，你只需要去寫一堆任務執行函數，然後在生成任務的時候把相應參數傳給 `sampleTaskMaker` 就好了。Redis 會自動過期並且觸發事件給你的 `sampleOnExpired` 函數，然後就會去執行相應的任務處理函數了。

## 小結

　　其實這個需求在我們項目目前就是給用戶定時發提醒短信用的。如果沒有發現 Redis 的這個妙用，我還是會去用[第二節](#最初的設想)裏面的方法來寫的。其實這期間也有考慮過用 RabbitMQ，不過貌似它的定時消息需要做一些 Hack，比較麻煩，最後就放棄了。

　　Redis 的這個方法其實是我在谷歌搜出來的，別人在 StackOverflow 回答的答案。我參考了之後用我自己的方法實現了出來，並且把代碼的關鍵部分提取出來整理成這篇小文，還希望能給各位看官一些用吧，望打賞。

　　如果沒有什麼用也憋噴我，畢竟我是個蒟蒻。有更好的方法希望留個言，望告知。謝謝。(´,,•ω•,,)♡
