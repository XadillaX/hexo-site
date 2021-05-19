title: 关于JavaScript中callback函数的this指针重定义
date: 2013-07-15 14:20:29
tags: [ 老博客备份归档, JavaScript ]
category: 老博客备份归档
---

　　最近在写 **NBUT Virtual Judge** 的内核框架，用的又是 **Node.JS** 了，把它当作一个本地运行的脚本不断进行轮询。

　　众所周知JS中的一个精髓就是异步回调。

　　所以在我自己写的框架中也经常会出现类似于下面的代码：

```javascript
foo.bar(a, b, function(){});
```

　　总而言之就是写一个函数，这个函数将会调用一个回调函数。

　　但是问题出现了：在那个回调函数 `function` 中，你如果使用了一个 `this` 指针的话，它将会指向根，而不是 `foo` 的本体。

　　那么如果我们想在 `function` 中也用 `this` 来指代这个 `foo` 对象该怎么办呢？

　　结果还是IRC有用。本人跑 **Node.JS** 的 **IRC** 上问了这个问题，结果有人就这样回复我了：

> 13:07 &lt;shama> xadillax: foo(a, b callback.bind(foo))
>
> 13:10 &lt;olalonde> foo (a, b fn) { fn = fn.bind(this); …. }

　　然后还很热心地给了我个网址：[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

　　总之最后得出的结论就是说：

　　你只要给你的 `callback` 函数指定一个 `this` 指针即可。

　　如：

```javascript
var cb = callback.bind(foo);
foo.bar(a, b, cb);
```

　　这样就能在回调函数中使用foo来作为其this指针了。
