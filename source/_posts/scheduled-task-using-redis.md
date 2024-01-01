title: Node.js 中使用 Redis 来实现定时任务
date: 2015-06-05 15:23:51
tags: [ Redis, Node.js, 定时任务 ]
---

　　好久没写博文了，最近在跟随着公司大牛们的脚步秘密研发新产品中。

　　不过前几天有一个小需求的东西可以提出来写一点点小干货儿跟大家分享分享。米娜桑会的就可以忽略了，反正我也是随便写的；如果觉得本文对你有用的话还请多多支持喵。(●´ω｀●)ゞ

## 序

　　本文所说的定时任务或者说计划任务并不是很多人想象中的那样，比如说每天凌晨三点自动运行起来跑一个脚本。这种都已经烂大街了，随便一个 **[Crontab](https://wiki.archlinux.org/index.php/Cron)** 就能搞定了。

　　这里所说的定时任务可以说是计时器任务，比如说用户触发了某个动作，那么从这个点开始过二十四小时我们要对这个动作做点什么。那么如果有 1000 个用户触发了这个动作，就会有 1000 个定时任务。于是这就不是 **Cron** 范畴里面的内容了。

　　举个最简单的例子，一个用户推荐了另一个用户，我们定一个二十四小时之后的任务，看看被推荐的用户有没有来注册，如果没注册就给他搞一条短信过去。Σ>―(〃°ω°〃)♡→

## 最初的设想

　　一开始我是想把这个计时器做在内存里面直接调用的。

　　考虑到 Node.js 的定时并不是那么准确（无论是 `setTimeout` 还是 `setInterval`），所以本来打算自己维护这个定时器队列。

　　又考虑到 Node.js 原生对象比较耗内存。之前我用 `JSON` 对象存了一本字典，约十二万多的词条，原文件大概也就五六兆，用 Node.js 的原生对象一存居然有五六百兆的内存占用——所以打算这个定时器队列用 C++ 来写 addon。

　　考虑到任何时候插入的任务都有可能在已有的任务之前或者之后，所以本来想用 C++ 来写一个[小根堆](http://zh.wikipedia.org/wiki/%E6%9C%80%E5%A4%A7%E2%80%94%E6%9C%80%E5%B0%8F%E5%A0%86)。每次用户来一个任务的时候就将这个任务插入到堆中。

　　如果按照上述方法的话，再加上对时间要求掐得也不是那么紧，于是就是一个不断的 `process.nextTick()` 的过程。

　　在 `process.nextTick()` 当中执行这么一个函数：

1. 从小根堆中不断获取堆顶的任务并处理，一直处理到堆顶任务的执行时间大于当前时间为止。
2. 继续 `process.nextTick()` 来让下一个 tick 执行步骤 1 中的流程。

　　所以最后就是一边往小根堆插入任务，另一边通过不断 `process.nextTick()` 消费任务的这么一个过程。

　　最后，为了考虑到程序重启的时候内存数据会丢失，还应该做一个持久化的事情——在每次插入任务的时候顺便往持久化中间件中插一条副本，比如 MySQL、MongoDB、Redis、Riak 等等任何三方依赖。消费任务的时候顺便把中间件中的这条任务数据给删除。

　　也就是说中间件中永远存的就是当前尚未完成的任务。每当程序重启的时候都先从中间件中把所有任务读取进来重建一下堆，然后就能继续工作了。

> 如果当时我没有发现 Redis 的这个妙用的话，上述的流程将会是我实现我们定时任务的流程了。

## Redis 妙用

　　在 Redis 的 2.8.0 版本之后，其推出了一个新的特性——键空间消息（[Redis Keyspace Notifications](http://redis.io/topics/notifications)），它配合 2.0.0 版本之后的 `SUBSCRIBE` 就能完成这个定时任务的操作了，**不过定时的单位是秒**。

### Publish / Subscribe

　　Redis 在 2.0.0 之后推出了 [Pub / Sub](http://redis.io/topics/pubsub) 的指令，大致就是说一边给 Redis 的特定频道发送消息，另一边从 Redis 的特定频道取值——形成了一个简易的消息队列

　　比如我们可以往 `foo` 频道推一个消息 `bar`，那么就可以直接：

```
PUBLISH foo bar
```

　　另一边我们在客户端订阅 `foo` 频道就能接受到这个消息了。

　　举个例子，如果在 Node.js 里面使用 [ioredis](https://github.com/luin/ioredis) 这个包那么看起来就会像这样：

```javascript
var Redis = require("ioredis");
var sub = new Redis(/** 连接信息 */);
sub.once("connect", function() {
    // 假设我们需要选择 redis 的 db，因为实际上我们不会去污染默认的 db 0
    sub.select(DB_NUMBER, function(err) {
        if(err) process.exit(4);
        sub.subscribe("foo", function() {
            //... 订阅频道成功
        });
    });
});

// 监听从 `foo` 来的消息
sub.on("message", function(channel, msg) {
    console.log(channel, msg);
});
```

### Redis Keyspace Notifications

　　在 Redis 里面有一些事件，比如键到期、键被删除等。然后我们可以通过配置一些东西来让 Redis 一旦触发这些事件的时候就往特定的 Channel 推一条消息。

　　本文所涉及到的需求的话我们所需要关心的事件是 `EXPIRE` 即过期事件。

　　大致的流程就是我们给 Redis 的某一个 db 设置过期事件，使其键一旦过期就会往特定频道推消息，我在自己的客户端这边就一直消费这个频道就好了。

　　以后一来一条定时任务，我们就把这个任务状态压缩成一个键，并且过期时间为距这个任务执行的时间差。那么当键一旦到期，就到了任务该执行的时间，Redis 自然会把过期消息推去，我们的客户端就能接收到了。这样一来就起到了定时任务的作用。

#### 消息类型

　　当达到一定条件后，有两种类型的这种消息会被触发，用哪个需要自己选了。举个例子，我们删除了在 db 0 中一个叫 `foo` 的键，那么系统会往两个频道推消息，一个是 `del` 事件频道推 `foo` 消息，另一个是 `foo` 频道推 `del` 消息，它们小俩口被系统推送的指令分别等价于：

```
PUBLISH __keyspace@0__:foo del
PUBLISH __keyevent@0__:del foo
```

　　其中往 `foo` 推送 `del` 的频道名为 `__keyspace@0__:foo`，即是 `"__keyspace@" + DB_NUMBER + "__:" + KEY_NAME`；而 `del` 的频道名为 `"__keyevent@" + DB_NUMBER + "__:" + EVENT_NAME`。

#### 配置

　　即使你的 Redis 版本达标了，但是 Redis 默认是关闭这个功能的，你需要修改配置文件来打开它，或者直接在 CLI 里面通过指令修改。这里就说说配置文件的修改吧。

　　如果不想看我在这里罗里吧嗦的，也可以直接去看 Redis 的[相关文档](http://redis.io/topics/notifications#configuration)。

　　首先打开 Redis 的配置文件，在不同的系统和安装方式下文件位置可能不同，比如通过 `brew` 安装的 MacOS 下可能是在 `/usr/local/etc/redis.conf` 下面，通过 `apt-get` 安装的 Ubuntu 下可能是在 `/etc/redis/redis.conf` 下，总之找到配置文件。**或者自己写一个配置文件，启动的时候指定配置文件地址就好。**

　　然后找到一项叫 `notify-keyspace-events` 的地方，如果找不到则自行添加，其值可以是 `Ex`、`Klg` 等等。这些字母的具体含义如下所示：

+ **K**，表示 `keyspace` 事件，有这个字母表示会往 `__keyspace@<db>__` 频道推消息。
+ **E**，表示 `keyevent` 事件，有这个字母表示会往 `__keyevent@<db>__` 频道推消息。
+ **g**，表示一些通用指令事件支持，如 `DEL`、`EXPIRE`、`RENAME` 等等。
+ **$**，表示字符串（String）相关指令的事件支持。
+ **l**，表示列表（List）相关指令事件支持。
+ **s**，表示集合（Set）相关指令事件支持。
+ **h**，哈希（Hash）相关指令事件支持。
+ **z**，有序集（Sorted Set）相关指令事件支持。
+ **x**，过期事件，与 **g** 中的 `EXPIRE` 不同的是，**g** 的 `EXPIRE` 是指执行 `EXPIRE key ttl` 这条指令的时候顺便触发的事件，而这里是指那个 `key` 刚好过期的这个时间点触发的事件。
+ **e**，驱逐事件，一个 `key` 由于内存上限而被驱逐的时候会触发的事件。
+ **A**，`g$lshzxe` 的别名。也就是说 `AKE` 的意思就代表了所有的事件。

　　结合上述列表我们就能拼凑出自己所需要的事件支持字符串了，在我的需求中我只需要 `Ex` 就可以满足了，所以配置项就是这样的：

```
notify-keyspace-events Ex
```

　　然后保存配置文件，启动 Redis 就启用了过期事件的支持了。

#### 实践

　　我们先说任务的创造者吧。由于这里 **Redis** 的事件只会传键名，并不会传键值，而过期事件触发的时候那个键已经没了，你也无法获取键值，加上我的主系统和任务系统是分布式的，所以就把所有需要的信息往键名塞。

　　一个最简单的键名设计就是 `任务类型 + ":" + JSON.stringify 化后的参数数组`；更有甚者可以直接把任务类型替换成所需的函数路径，比如需要执行这个任务的函数在 `task/foo/bar` 文件下面的 `baz` 函数，参数 `arguments` 数组为 `[ 1, 2 ]`，那么键名的设计可以是 `task/foo/bar.baz:[1,2]`，反正我们只需要触发这个键，用不着去查询这个键。等到真正过期了任务系统接收到这个键名的时候再一一解析，得到需要执行 `task/foo/bar.baz` 这个消息，并且网函数里面传入 `[1,2]` 这个 `arguments`。

　　所以当接收到一个定时任务的时候，我们得到消息、函数名、过期时间参数，这个函数可以如下设计：

```javascript
/** 我们假设 redis 是一个 ioredis 的对象 */

var sampleTaskMaker = function(message, func, timeout) {
    message = JSON.stringify(message);
    console.log("Received a new task:", func, message, "after " + timeout + ".");

    // 这里的 uuid 是 npm 一个包
    // 生成一个唯一 uuid 的目的是为了防止两个任务用了相同的函数和参数，那么
    // 键名可能会重复并覆盖的情况
    // uuid 的文档为 https://www.npmjs.com/package/node-uuid
    //
    // 这里的 ❤️ 是一个分隔符，冒号是分割 uuid 和后面内容的，而 ❤️ 是分割函数名
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

> Ioredis 的稳定可以[点此](https://github.com/luin/ioredis)查看。

　　然后在任务系统里面的一开始监听这个过期频道：

```javascript
// assign 是 sugarjs 里面的函数
// 把 db 塞到字符串里面的 {db} 里去
var subscribeKey = "__keyevent@{db}__:expired".assign({ db: 1 });

// 假设 sub 是 ioredis 的对象
sub.once("connect", function() {
    // 假设我们需要选择 redis 的 db，因为实际上我们不会去污染默认的 db 0
    sub.select(1, function(err) {
        if(err) process.exit(4);
        sub.subscribe("foo", function() {
            //... 订阅频道成功
        });
    });
});

// 监听从 `foo` 来的消息
sub.on("message", sampleOnExpired);
```

> **注意：** 我们这里选择 db 1 是因为一旦开启过期事件监听，那么这个 db 的所有过期事件都会被发送。为了不跟正常使用的 redis 过期键混淆，我们为这个事情专门用一个新的 db。比如我们在自己正常使用的 db 0 里面监听了，那么不是我们任务触发的过期事件也会传过来，这个时候我们解析的键名就不对了。

　　最后就是我们的 `sampleOnExpired` 函数了。

```javascript
var sampleOnExpired = function(channel, key) {
    // UUID:❤️func❤️params
    var body = key.split("❤️");
    if(body.length < 3) return;

    // 取出 body 第一位为 func
    var func = body[1];

    // 推出前两位，后面剩下的有可能是参数里面自带 ❤️ 而被分割，所以要拼回去
    body.shift(); body.shift();
    var params = body.join("❤️");

    // 然后把 params 传入 func 去执行
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

　　这个简易的架子搭好后，你只需要去写一堆任务执行函数，然后在生成任务的时候把相应参数传给 `sampleTaskMaker` 就好了。Redis 会自动过期并且触发事件给你的 `sampleOnExpired` 函数，然后就会去执行相应的任务处理函数了。

## 小结

　　其实这个需求在我们项目目前就是给用户定时发提醒短信用的。如果没有发现 Redis 的这个妙用，我还是会去用[第二节](#最初的设想)里面的方法来写的。其实这期间也有考虑过用 RabbitMQ，不过貌似它的定时消息需要做一些 Hack，比较麻烦，最后就放弃了。

　　Redis 的这个方法其实是我在谷歌搜出来的，别人在 StackOverflow 回答的答案。我参考了之后用我自己的方法实现了出来，并且把代码的关键部分提取出来整理成这篇小文，还希望能给各位看官一些用吧，望打赏。

　　如果没有什么用也憋喷我，毕竟我是个蒟蒻。有更好的方法希望留个言，望告知。谢谢。(´,,•ω•,,)♡
