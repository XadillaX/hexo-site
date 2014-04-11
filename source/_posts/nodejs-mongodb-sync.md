title: 关于Node.js下的MongoDB阻塞模式实现
date: 2013-03-29 09:31:38
tags: [ 老博客备份归档, Node.JS, MongoDB ]
category: 老博客备份归档
---

　　***注：本文仅为我初学 Node.JS 的时候的稚嫩笔记。是从 [http://web.archive.org/](http://web.archive.org/) 扒回来的。现在看来已无多大参考价值，各位可以略过。我只是把它扒回来纪念一下而已，以记录我的历程。而那个相对应的 `SevenzJS` 也已经被遗弃***

## 背景

　　最近在做公司项目的一个模块，主要用于 **JSON Api** 的传输，所以开发环境的目标就锁定在了 **Node.js**。而这一块的登陆用户又是存在 **MongoDB** 里面的，所以就有了如下的问题。

+ 网上的 Node.JS 框架都比较重型或者臃肿的，学了 Node 之后还需要学额外的东西。
+ 所以我就打算自己写一个专注于 JSON Api 的快速开发框架，于是有了 SevenJS。
+ 问题出现了，虽然 Node.JS 极度推崇异步非阻塞模式，但是阻塞模式在平常开发中还是太常用了。

　　我们试想一下，如果我们有几句MongoDB的查询之类的，用node-mongodb-native来写的话是这样的：

```javascript
var client = new Db('test', new Server("127.0.0.1", 27017, {}));
var test = function (err, collection) {
    collection.insert({a:2}, function(err, docs) {
        collection.count(function(err, count) {
            test.assertEquals(1, count); });

            // Locate all the entries using find
            collection.find().toArray(function(err, results) {
            test.assertEquals(1, results.length);
            test.assertTrue(results[0].a === 2);

            // Let's close the db
            client.close();
        });
    });
};

client.open(function(err, client) {
    client.collection('test_insert', test);
});
```

　　各种嵌套回调有木有！这不是我们想要的，尤其是我的那个框架，因为我的框架是流式的。

　　所以我就想有这样的一种方案：

```javascript
var client = mongodb.connect();
var collection = mongodb.getCollection(client, "dbname");
var result = mongodb.find({ "foo" : "bar" });
```

　　使得这样就能找出dbname表下的foo为bar值的记录了。

## 正题

　　出于这样的想法，我在网上找遍了大江南北，除了 CNode 社区有人问到了类似的问题以外，再也找不到音信了，而且那里也没有一个好的回答。

　　不过这也正常，因为 Node.js 官方本身就不推荐这么做——他们认为异步非阻塞是非常优雅的一件事情。

　　包括我在 Node.js 的 IRC 聊天室里面问了这个问题，也有人是这么回答我的：

> You can’t use a car as a boat. If you want a boat, use a boat.

　　言简意赅，直截了当地说明 Node.js 是不支持这样的，如果你想这样做，就用 python 或者 ruby 去吧。

　　不过好在后来 IRC 里面有人推荐了我一个模块：[fibers](https://github.com/laverdet/node-fibers)。

　　有了这个模块好啊，直接能用了有木有！

　　接下来就来讲一下如何使用吧：

```javascript
function find(collection, selector, callback) {
    collection.find(selector).toArray(callback);
}

var Fiber = require('fibers');
var Future = require('fibers/future');
var wait = Future.wait;

Fiber(function(){
    var wrapper = Future.wrap(fund);

    /** 这里就是正题了，我们假设已经获取一个collection了 */
    var result = wrapper(collection, { "foo" : "bar" }).wait();
    console.log(JSON.stringify(result));
}).run();
```

　　这就是一个非常简单的同步查询 MongoDB 的例子了，实际上本质还是一个异步，注意到没有，其实 `Fiber()` 内部的那个 `function` 本质上还是一个回调函数，只不过在这个回调函数里面，里面的所有 `callback` 都可以被同步了。不过我们只需要小动一些手脚就能加上这个外壳了。具体请参见 [sRouter.js](https://github.com/XadillaX/SevenzJS/blob/a0a0476000c492dd8e70c062cfa432f559edbd16/sevenz/sRouter.js) 约 121 行的外壳以及 [sMongoSync.js](https://github.com/XadillaX/SevenzJS/blob/a0a0476000c492dd8e70c062cfa432f559edbd16/sevenz/sMongoSync.js) 的实现，加上 [index.js](http://web.archive.org/web/20130726042859/https://github.com/XadillaX/SevenzJS/blob/a0a0476000c492dd8e70c062cfa432f559edbd16/actions/index.js) 中的查询 demo。

## 结尾

　　所以说当我们做不到某件事的时候，多去IRC看看，多去社区混混，也多去找找模块，要真没有的话就只能自己丰衣足食了（我还没到那水平，笑）。总之这次Fibers帮了我一个大忙。

　　最后，SevenzJS 欢迎 [Fork](https://github.com/XadillaX/SevenzJS)。