title: 《Node.js：来一打 C++ 扩展》已出版，求支持
date: 2018-06-14 18:29:51
tags: [ Node.js, C++, 《Node.js：来一打 C++ 扩展》 ]
---

![封面](//dn-cnode.qbox.me/FggqZHIE8va72-RguIC8WKGgyzVn)

> 千呼万唤始出来，犹抱琵琶生哪吒。
>
> 真的不好意思自卖自夸，所以索性直接把编辑推荐语、大佬们的评语贴上来好了。

Node.js 作为近几年新兴的一种编程运行时，托 V8 引擎的福，在作为后端服务时有比较高的运行效率，在很多场景下对于我们的日常开发足够用了。不过，它还为开发者开了一个使用C++ 开发 Node.js 原生扩展的口子，让开发者进行项目开发时有了更多的选择。

《Node.js：来一打 C++ 扩展》以 Chrome V8 的知识作为基础，配合 GYP 的一些内容，将教会大家如何使用 Node.js提供的一些 API 来编写其 C++ 的原生扩展。此外，在后续的进阶章节中，还会介绍原生抽象NAN 以及与异步相关的 libuv 知识，最后辅以几个实例来加深理解。不过，在学习本书内容之前，希望读者已经具备了初步的 Node.js 以及 C++ 基础。

阅读《Node.js：来一打 C++ 扩展》，相当于同时学习Chrome V8 开发、libuv 开发以及 Node.js 的原生 C++ 扩展开发知识，非常值得！

**最后十分感谢包括 Node.js TSC 之一的 Anna、几位 Collaborator 以及各位业界的大佬帮忙写推荐语，感谢 @yorkie 大佬和 @justjavac 大佬帮忙作序。**

## 编辑推荐

《Node.js：来一打 C++ 扩展》在深度上远远超过了目前市面上的Node书籍。全书自始至终围绕一个主题展开：从介绍 Node.js 的包和模块规范开始，深入解析（包括但不限于剖析 Node.js 自身的源码） Node.js 的模块是如何在运行时被引入的，尤其是如何引入 C++ 模块的；接下来详细讲解了在什么时候、为何要编写 C++ 模块；借此契机，深入介绍了 Node.js 的基石 Chrome V8 和 libuv，以及异步非阻塞的原理——不仅如此，本书更教你如何在底层去驾驭它们。所以，本书以 Node.js 的 C++ 扩展为中心，衍生出对 Node.js 底层风光的层层剖析，最后再回归到如何编写 Node.js 的 C++ 扩展，一气呵成。读来酣畅淋漓，痛快不已！

买这一本书相当于买了“Node.js 的底层风光、C++ 扩展编写”、“Chrome V8”和“libuv”三本书！

读完本书后，你甚至能为 Node.js 自身的添砖加瓦做出非凡贡献。

## 购书链接

**目前在预售阶段，顺便蹭 618 活动。**

+ [京东](https://item.jd.com/12380404.html)
+ [天猫](https://detail.tmall.com/item.htm?id=571628730908&cat_id=2)
+ [当当](http://product.dangdang.com/25291814.html)
+ [亚马逊](https://www.amazon.cn/dp/B07DL8GHQC/ie=UTF8&qid=1528969734)
+ [豆瓣](https://book.douban.com/subject/30247892/)（不算购书链接）

## 目录

```
1 Node.js 的 C++ 扩展前驱知识储备 1
1.1 Node.js 的模块机制 2
1.1.1 CommonJS 的模块规范 2
1.1.2 Node.js 的模块 4
1.1.3 小结 9
1.1.4 参考资料 9
1.2 Node.js 的包机制 9
1.2.1 CommonJS 的包规范 9
1.2.2 Node.js / NPM 下的包 13
1.2.3 NPM 与 CNPM 16
1.2.4 小结 19
1.2.5 参考资料 19
1.3 Node.js 依赖简介 20
1.3.1 Chrome V8 20
1.3.2 libuv 25
1.3.3 其他依赖 28
1.3.4 小结 30
1.3.5 参考资料 30
1.4 C++ 扩展开发的准备工作 31
1.4.1 编辑器 / IDE 31
1.4.2 node-gyp 36
1.4.3 其他构建工具 54
1.4.4 小结 56
1.4.5 参考资料 56
2 C++ 模块原理简析 57
2.1 为什么要写 C++ 模块 57
2.1.1 C++ 比 JavaScript 解释器高效 57
2.1.2 已有的 C++ 轮子 72
2.1.3 小结 77
2.1.4 参考资料 77
2.2 什么是 C++ 扩展 78
2.2.1 C++ 模块本质 78
2.2.2 Node.js 模块加载原理 80
2.2.3 小结 102
2.2.4 参考资料 103
3 Chrome V8 基础 104
3.1 Node.js 与 Chrome V8 104
3.2 基本概念 105
3.2.1 内存机制 105
3.2.2 隔离实例（Isolate） 108
3.2.3 上下文（Context） 109
3.2.4 脚本（Script） 110
3.2.5 小结 110
3.2.6 参考资料 111
3.3 句柄（Handle） 111
3.3.1 本地句柄（Local） 112
3.3.2 持久句柄（Persistent） 115
3.3.3 永生句柄（Eternal） 119
3.3.4 待实本地句柄（Maybe Local） 119
3.3.5 小结 121
3.3.6 参考资料 121
3.4 句柄作用域 121
3.4.1 一般句柄作用域（Handle Scope） 122
3.4.2 可逃句柄作用域（Escapable Handle Scope） 125
3.4.3 小结 129
3.4.4 参考资料 129
3.5 上下文（Context） 129
3.6 模板（Template） 133
3.6.1 函数模板（Function Template） 133
3.6.2 对象模板（Object Template） 138
3.6.3 对象模板的访问器（Accessor）与拦截器（Interceptor） 144
3.6.4 对象模板的内置字段（Internal Field） 175
3.6.5 函数模板的继承（Inherit） 183
3.6.6 小结 188
3.6.7 参考资料 189
3.7 常用数据类型 189
3.7.1 基值（Value） 189
3.7.2 字符串（String） 194
3.7.3 数值类型 196
3.7.4 布尔类型（Boolean） 196
3.7.5 对象（Object） 196
3.7.6 函数（Function） 200
3.7.7 数组（Array） 202
3.7.8 JSON 解析器 203
3.7.9 函数回调信息（Function Callback Info） 203
3.7.10 函数返回值（Return Value） 204
3.7.11 隔离实例（Isolate） 204
3.7.12 小结 205
3.7.13 参考资料 206
3.8 异常机制 206
3.8.1 try-catch 206
3.8.2 抛出异常 209
3.8.3 异常生成类（Exception） 211
3.8.4 小结 211
3.8.5 参考资料 211
4 C++ 扩展实战初探 212
4.1 binding.gyp 212
4.1.1 惊鸿一瞥 213
4.1.2 binding.gyp 基础结构 213
4.1.3 GYP 文件 214
4.1.4 常用字段 221
4.1.5 小结 228
4.1.6 参考资料 228
4.2 牛刀小试 229
4.2.1 又是 Hello World 229
4.2.2 函数参数 232
4.2.3 回调函数 234
4.2.4 函数返回 238
4.2.5 小结 239
4.2.6 参考资料 240
4.3 循序渐进 240
4.3.1 C++ 与 JavaScript 类封装 240
4.3.2 实例化 C++ 类封装对象的函数 250
4.3.3 将 C++ 类封装对象传来传去 253
4.3.4 进程退出钩子 255
4.3.5 小结 259
4.3.6 参考资料 259
5 Node.js 原生抽象——NAN 260
5.1 Node.js 原生模块开发方式的变迁 260
5.1.1 以不变应万变 260
5.1.2 时代在召唤 261
5.1.3 小结 267
5.1.4 参考资料 267
5.2 基础开发 267
5.2.1 什么是 NAN 267
5.2.2 安装和配置 269
5.2.3 先睹为快——搭上NAN 的快车 270
5.2.4 基础帮助函数和宏 276
5.2.5 忽略 node_modules 279
5.2.6 小结 279
5.2.7 参考资料 280
5.3 JavaScript 函数 280
5.3.1 函数参数类型 280
5.3.2 函数声明 282
5.3.3 函数设置 288
5.3.4 小结 296
5.3.5 参考资料 296
5.4 常用帮助类与函数 296
5.4.1 句柄相关 296
5.4.2 创建数据对象 298
5.4.3 与数据对象“玩耍” 300
5.4.4 封装一个类 314
5.4.5 异常处理 315
5.4.6 小结 315
5.4.7 参考资料 316
5.5 NAN 中的异步机制 316
5.5.1 Nan::AsyncQueueWorker 316
5.5.2 Nan::Callback 317
5.5.3 Nan::AsyncWorker 317
5.5.4 Nan::AsyncProgressWorker 323
5.5.5 小结 327
5.5.6 参考资料 327
6 异步之旅——libuv 328
6.1 基础概念 329
6.1.1 事件循环 330
6.1.2 句柄（Handle）与请求（Request） 333
6.1.3 尝尝甜头 335
6.1.4 小结 340
6.1.5 参考资料 340
6.2 libuv 的跨线程编程基础 341
6.2.1 libuv 的线程 342
6.2.2 同步原语（Synchronization Primitive） 347
6.2.3 工作队列 355
6.2.4 小结 356
6.2.5 参考资料 357
6.3 跨线程通信 357
6.3.1 uv_async_t 句柄 357
6.3.2 Watchdog 半成品实战解析 358
6.3.3 Watchdog 试运行 367
6.3.4 小结 368
6.3.5 参考资料 369
7 实战——文件监视器 370
7.1 准备工作 370
7.1.1 功能规划 370
7.1.2 文件系统监听库——efsw 373
7.1.3 小结 376
7.1.4 参考资料 376
7.2 核心设计 376
7.2.1 API 设计 377
7.2.2 EFSWCore 的血肉之躯 377
7.2.3 EFSWCore 的灵魂 381
7.2.4 小结 385
7.3 编写JavaScript 类 386
7.3.1 类的设计 386
7.3.2 核心逻辑 388
7.3.3 简单容错 391
7.3.4 小结 393
7.4 进一步完善 393
7.4.1 C++ 代码的完善 393
7.4.2 JavaScript 代码的完善 398
7.4.3 小结 400
8 实战——现有包剖析 401
8.1 字符串哈希模块——Bling Hashes 401
8.1.1 文件设定 402
8.1.2 C++ 源码剖析 403
8.1.3 JavaScript 源码剖析 408
8.1.4 小结 409
8.1.5 参考资料 410
8.2 类 Proxy 包——Auto Object 410
8.2.1 Proxy 410
8.2.2 Auto Object 使用范例 412
8.2.3 代码剖析 415
8.2.4 小结 424
8.2.5 参考资料 424
9 N-API——下一代 Node.js C++ 扩展开发方式 425
9.1 浅尝辄止 426
9.1.1 实现一个 Echo 函数 426
9.1.2 尝试运行 N-API 扩展 430
9.1.3 向下兼容 431
9.1.4 N-API Package——C++ 封装 433
9.1.5 小结 433
9.1.6 参考资料 433
9.2 基本数据类型与错误处理 433
9.2.1 基本数据类型 433
9.2.2 与作用域及生命周期相关的数据类型 435
9.2.3 回调数据类型 438
9.2.4 错误处理 439
9.2.5 模块注册 441
9.2.6 小结 442
9.2.7 参考资料 442
9.3 对象与函数 442
9.3.1 对象 442
9.3.2 函数 448
9.3.3 类的封装 453
9.3.4 小结 455
9.3.5 参考资料 455
```

## 推荐语

> This book contains absolutely everything you need to know about how all the pieces of Node.js' C++ code work and interact, explaining the necessary concepts without needing prior knowledge about the internals of V8, libuv or other pieces of Node.js. It shows well how Node.js' own built-in modules are constructed using the APIs provided by V8, so that they are usable from JavaScript, and how you can create the same kind of modules from scratch.
>
> After having read this book, you will be able to write a production-quality, future-proof C++ extension for Node.js if you need to do that, or maybe even make changes Node.js itself if you're interested in that!
>
> 这本书包含了所有你需要了解的有关于 Node.js C++ 代码是如何运行和交互的知识，解释了一些你不需要知道 V8 的内部机制就能理解的必要概念，另外该书还介绍了 libuv 以及其他一些内容的方方面面。这本书还展示了 Node.js 的内置模块是如何使用 V8 的 API 进行构建并在 JavaScript 层面能提供使用的——并且你也能用这种方法从头开始创建相同类型的模块。
>
> 读完这本书，你将学到如何写出产品级质量的、面向未来的 Node.js C++ 扩展。感兴趣的话，你甚至可以对 Node.js 自身进行修改！
>
> ——安娜·亨宁森（Anna Henningsen, addaleax），Node.js 技术指导委员会成员（Node.js TSC）

---

> Node.js 不是第一个将 JavaScript 带入服务器端领域的技术，然而却成为了史上最热门、最有影响力的工具之一。究其原因，其一，在于 Node.js 适逢后端高并发潮流，巧妙结合 Reactor 模型和 JavaScript 所擅长的回调风格，大大降低了开发高并发服务器应用的成本；其二，在于恰逢浏览器大战，前端技术突飞猛进，急需一个适合 JavaScript 和前端工程师的一套生态和工具链，Node.js 刚好成为前端 JavaScript 最易上手掌握的命令行环境。在 Node.js 发展这么火热之后，Node.js 的开发体验在不断提升，上手门槛也在不断降低。
>
> 然而，如果大家真正想突破自己成为个中高手，无论是后端程序员希望在服务器端及架构方面有所建树，还是前端程序员想跨越边界，你们都应该去了解 Node.js 的底层机制，去学习写一些 Node.js 的扩展。从 Node.js 的内在机制，我们可以学习到更多有关计算机体系的知识如内存管理、多线程编程等等，真正向一个架构师、大牛迈进。
>
> 死月的书，给我们在这些方面带来了一个非常系统的指南。死月通过精彩的内容告诉大家：底层的知识并不枯燥，用 C++ 写一个扩展很有意思也很简单。作为 Node.js 工程师/爱好者的你，值得拥有本书。
>
> ——曹力（ShiningRay），酷链科技 CEO，前暴走漫画 CTO，前糗事百科联合创始人，高级 Node.js 技术专家，《JavaScript 高级程序设计》译者

---

> Native module is one of the most underappreciated features of Node.js. But even in the age of asm.js and WebAssembly, it is an irreplaceable part of the Node.js ecosystem due to its versatility and performance. XadillaX's book provides a refreshing introduction (or reintroduction), and is a must-read for all low-level Node.js engineers.
>
> 原生模块是 Node.js 中最被低估的功能之一。因为它的性能和多样性，使其即使是在 asm.js 和 WebAssembly 时代，仍旧能作为 Node.js 生态系统中不可替代的部分存在。死月的书对其作了一个令人耳目一新的介绍，是所有的底层（Low-Level）Node.js 工程师必读之物。
>
> ——顾天骋（Timothy Gu），pug、ejs 前 Maintainer，Node.js Core Collaborator 之一

---

> 本书全面讲解了 V8、libuv 的原理并且手把手教你编写一打 Node.js 的 C++ 扩展，是目前市面上相关领域非常空缺的技术书籍。如果想更深入了解 Node.js 的实现原理，除了熟读内置 API 文档之外，阅读这本书会是一个很好的选择。
>
> ——雷宗民（老雷），《Node.js 实战》作者之一

---

> 这是一本角度刁钻的 Node.js 相关书籍，与市面上大多数的 Node.js 书籍定位不同。它借为 Node.js 开发 C++ 扩展为基石，顺带介绍了 Chrome V8 和 libuv 的内容，填补了市场上这一类书籍的空白，值得一读。
>
> ——李启雷博士，趣链科技 CTO

---

> 死月一直把实战贯穿在整本书之内，无论是基础部分的 V8 练习，还是使用 Node.js 经典的 Addon 开发、用 NAN 来改写，或是 libuv 里的 WatchDog 案例、EFSW 的封装，甚至在第八章里还特意剖析了两个 C++ 模块，把之前讲解的基础知识部分综合起来，可以边学边练。
>
> 这本《Node.js：来一打 C++ 扩展》，在如今追求大而全的时代，单纯的讲 Node.js 的某一个方面，而且讲的特别棒的书，真的难得。
>
> ——刘琥（响马），西祠胡同创始人，fibjs 作者

---

> 当你掌握了 Node.js 的上层使用，下一步进阶的方向就是研究 Node.js 的底层原理。本书为学习 Node.js 的实现机制打开了一扇门。书中介绍的上下文（Context）、句柄（Handle）、句柄作用域（Handle Scope）等概念直接来自于源码，对于阅读 Node.js 及 V8 的源码具有极高的参考价值。
>
> ——潘旻琦（pmq20），Node.js 技术专家，Node.js Collaborator 之一，RubyConf 讲师之一

---

> 国内 Node.js 偏向于原理的书目前只有朴灵的《深入浅出 Node.js》一本，至今 4 年过去了，Node.js 已经从 v0.10 发展到 v9 版本，中间再没有这样的系统的有深度的书籍。
>
> 很高兴死月的新书弥补了这一遗憾。本书以 C++ 为主线，涵盖 Node.js 最核心的 libuv 和 V8，对理解 Node.js 原理有极大的好处。当然最大的好处在于使用 C++ 编写 Node.js Addon 可以让 Node.js 有更广阔的应用空间。我们都知道 Node.js 擅长的是 I/O 密集型任务，对于 CPU 密集型运算这是极好的弥补。
>
> 特别推荐大家阅读此书，Node.js 应用极其广泛的今天，使用 C++ 编写 Node.js Addon 是更出彩的部分，你值得拥有。
>
> ——桑世龙（狼叔），StuQ 明星讲师，Node.js 技术布道者，《更了不起的 Node.js》作者

---

> 死月对 Node.js 底层机制有非常深入的了解。阅读本书，除了学习 C++ 扩展开发，还会跟随死月了解 V8、libuv，相信读后大家对于 Node.js 的理解会更上一层楼。
>
> ——孙信宇（芋头），大搜车无线架构团队负责人，前端乱炖站长

---

> C++ 扩展其实是从外在，用 C++ 的角度去观察 Node.js 内在的形式。因为 Node.js 整个系统自身几乎就是构建在 C/C++ 之上的，只是内部称之为 built-in，在 user-land 则称之 Addon，它们本质上其实没有区别。死月凭借他在 C/C++ 的深厚积累，选择从 C++ 扩展作为突破口，带大家领略 Node.js 底层的风光，在书里，你能看到真正发挥巨大价值的 V8、libuv 亦是精彩纷呈。
>
> 死月将 C++ 扩展写得这么透，我是服的。
>
> ——田永强（朴灵），高级 Node.js 技术专家，《深入浅出 Node.js》作者

---

> 开发 C++ 扩展，可以扩充 Node.js 平台的本地 API，扩充 Node.js 应用的能力。这本书详细介绍了包括 libuv、V8 在内的各种必要知识，是该领域不可多得的好书。对 C++ 开发者来说，本书既可以作为入门指引，又可以作为日常开发的参考书。
>
> ——王文睿博士（Roger Wang），node-webkit 和 NW.js 项目创始人和维护者，因特尔软件架构师

---

> 清晰记得手写的第一个 Node.js C++ 扩展模块，在 Node.js 0.6.9 跑通的那种愉悦感。随着应用升级到 Node.js 0.8，依赖的 C++ 扩展模块无法安装编译成功，最后发现是 V8 的 API 变化导致不兼容，从此对 C++ 扩展模块产生抗拒。后来看到《Node.js：来一打 C++ 扩展》，从实现原理，到 V8 基础概念的一系列介绍，让我重新对 C++ 扩展模块产生兴趣。参考书里的实战例子，以及 NAN 的辅助下，现在编写一个跨 Node.js 版本的 C++ 扩展已经不是什么困难的事情。通过最后一章节，可以了解到 Node.js 官方的 N-API 计划，让 C++ 扩展不仅仅能跨版本复用，还能跨操作系统（平台）复用。
>
> ——袁锋（fengmk2），Node.js 技术专家
