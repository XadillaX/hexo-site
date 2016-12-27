title       : 一起撸Node.JS（负叁）——概述
date        : 2013-08-13
category    : NodeJS
tags        : [ Node.js, JavaScript, 一起撸Node.JS ]
---

　　本系列教程主要是写给我带的那帮熊孩子们看的。我自己的 **Node.js** 水平半斤八两，措辞之中也免不了有自己错误的理解，会误人子弟。但是对于初学者来说，某些自己助记的理解还是可取的。有些概念性的错误可以等他们进一步深入研究之后再自行更正。

　　由于那帮人大多还处于使用 **M$ Windows** 的令人不愉快的阶段，所以本教程将会退而求其次，使其在 **Cygwin** 中模拟 **linux** 的命令（Windows的bat脚本实在是让人不敢恭维）。以及在这里会讲述一些 **Git** 操作的初步。当然，如果你已经在使用 **linux** 进行开发的话，可以跳过前面一堆令人感到厌烦的环境配置章节。或者你在使用 **M$ Windows** 但却不想改变自己的脚本习惯的话，也可以选择性地跳过一些章节和步骤。


<!-- 我是小小分割符 -->
## Node.JS是什么？

很多人都知道JS是一门语言，而且是一门脚本语言，其全称就是 **JavaScript**，而且与所谓的 **Java** 没有一个屁的关系。

### 前端 JavaScript

在好多年前，**JavaScript** 是网页的一个寄生虫，它必须依赖于网页的浏览器中才能执行，并且作为网页的一部分，以

{% code html %}
<script type="text/javascript">
//blahblah...
</script>
{% endcode %}

标签进行包含，这样才能提供其上下文环境。或者说将其单独写入一个 `*.js` 文件中，并且在网页里以

{% code html %}
<script src="foo/bar.js" type="text/javascript"></script>
{% endcode %}

的形式将其包含进来。

但总而言之，**JavaScript** 只是寄生在网页里面的一只小小可怜虫罢了。它的作用无非就是使网页的交互性更强，页面效果更多而已。

后来，这帮不甘寂寞的人类将 **JavaScript** 从网页（或者说前端）的帝国中独立了出来（小心快递），于是就出现了 **CommonJS**。

### CommonJS

**CommonJS** 其实不是一门新的语言，甚至都不能说它是一个新的解释器——实际上它只是一个概念或者是一个规范。

在这个规范中，它定义了很多 **API** ，讲通俗点或者直截了当点就是函数啊类啊什么的，而这些 **API** 是为那些普通应用程序（Native App）而非浏览器应用使用。它的终极目标就是提供一个类似于 **Python**、**Ruby** 之类的脚本一样的标准库，开发者可以用这样的东西一样来做到 **Python**、**Ruby** 能做到的事，而非仅仅局限于网页中的效果或者功能实现，它也可以跑在本地。

所以说下面的事情对于 **JavaScript** 来说不再是梦：

  + 服务端JavaScript应用
  + 命令行工具
  + 图形界面应用
  + 混合应用（Titanium、Adobe AIR等）

那么，它具体弥补了 **前端JavaScript** 的哪些空白呢？其实这也涉及了很多 **前端JavaScript** 所没有涉及的东西，如二进制、编码、IO、文件、系统、断言测试、套接字、事件队列、Worker、控制台等等。

关于 **CommonJS** 的更进一步了解可以翻阅一下其 **[Wiki](http://wiki.commonjs.org/wiki/CommonJS)**。

### Node.JS

上面讲了那么多，却始终停留在“规范”这个层面上。而 **Node.JS** 的出现便是让 **CommonJS** 成为了现实。

这里要大家明确的一点的就是 **Node.JS** 并不是一门新的语言，它的语言还是 **JavaScript** ，硬要说是一门新的语言那也应该是 **Common JavaScript**。**Node.JS** 只是 **CommonJS** 的一个[解释器](http://zh.wikipedia.org/wiki/%E8%A7%A3%E9%87%8A%E5%99%A8)罢了。

它是基于 **Google** 的 **V8虚拟机**(Chrome浏览器所使用的JavaScript执行环境) 的一个解释器。

很多人印象中的概念还是没能摆脱 **前端JavaScript** 的阴霾，认为 **JavaScript** 就是做网站的， **Node.JS** 也是如此。

包括本人在 **[cnodejs.org](http://cnodejs.org/)** 中看到的帖子大多也都是讲 **Node.JS** 如何如何做网站（服务端）云云，如何如何使用 **Express** 模块来搭建一个网站云云。

> 这是一个误区。

**PHP** 还能用 **[PHP-CLI](http://www.php-cli.com/)** 来写个脚本放本地跑呢，**Node.JS** 更是可以写任何程序。虽然这么讲有些夸大了，但是我这么说的理由是希望大家能摆脱这么一个误区。

举个简单的例子吧，大家都是搞过 **ACM** 的孩子了，总对终端窗口的输入输出有一定感觉了吧。现在给我以最快速度码一个 ***[A + B Problem](http://acm.nbut.edu.cn/problem/view.xhtml?id=1000)*** 给我看看。

轻车熟路，我知道。但是你们现在做的事用 **Node.JS** 同样能做到。

{% code javascript %}
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", function(chunk) {
    var datas = chunk.trim().split("\n");
    for(var i = 0; i < datas.length; i++) {
        var ab = datas[i].trim().split(" ");
        var a = parseInt(ab[0]);
        var b = parseInt(ab[1]);
        console.log(a + b);
    }
});
{% endcode %}

由于~~我们学校~~我的前任学校OJ不支持 **Node.JS**，所以请你们移步到 **[AIZU OJ](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=1000)** 去把上面的代码交过去看看结果看。

> **注意**：语言要选择 **JavaScript**。

怎么样，同样能过题的对吧？

## 小结

上面对这些东西做了个简单的介绍，我需要你们知道的东西很简单：

  1. **Node.JS** 是一个脚本解释器，用的语言是 **JavaScript**。
  2. **Node.JS** 功能很强大，不是只能拿来做网站的，眼光放开阔些。
  3. 给我好好学。

## 番外

> 有个码畜老了，想学学书法来修身养性。当他展开宣纸，犹豫了半天之后，终于挥毫泼墨，在纸上龙飞凤舞写下几个大字：
>
> > ***Hello World***

虽然这一篇文章没有讲到任何 **Node.JS** 的语法，但是还是可以让你们练练书法的。

**C语言** 的标准输出函数是 `printf`，而 **Node.JS** 的标准输出则是：

{% code javascript %}
console.log("blahblah...");
{% endcode %}

好的，即使没有装上 **Node.JS** 环境也阻止不了我们向世界问好。

打开 **[IDEOne](http://ideone.com/)**，将你的 `Hello World` 贴到编辑框中，然后在左侧的语言栏里面选中 **Node.JS** ，点击送出，你就能看到你的第一个 **Node.JS** 程序的运行结果了。

***To be continued...***
