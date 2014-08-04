title: Storm 中 Clojure 的 Prepare Bolt 实现
date: 2014-08-04 11:50:21
category: Programming
tags: [ Storm, Clojure, Huaban ]
---

## 起因

Storm 中的 Bolt 都是通过 Nimbus 这个服务将序列化好的 Bolt 断章取义地发到各个 worker 中。所以，任何在 bolt 之外你自认为加载期间初始化计算好的上下文环境并不会被打包上去，Java 我不懂也不知道，但是至少在 Clojure 这个类的概念被淡化的 LIST 方言中，你要做的就是把所有跟 bolt 初始化计算相关的代码放到其 `prepare` 的代码当中去。

你想一下，当你在文件加载的时候初始化了一个 MongoDB 链接，这个链接总不能被序列化到远程去吧？所以说办法就是把 bolt 搞上去之后，bolt 自动去初始化一个链接——这就是 `prepare` 的作用了。

说白了，这个还是我们在 ***Suwako*** 当中踩到的坑。

## 做法

大致的骨架如下：

```clojure
(defbolt bolt [...] {:prepare true}
 [...]
 (let [...]
  (bolt
   (prepare [...]
    (...))
   (execute [tuple]
    (...))))
```

　　首先就是 `{:prepare true}` 代表了它是一个需要初始化的 Bolt。

　　然后在 `(bolt)` 的作用域之内有两个 form——`prepare` 和 `execute`。

　　其中 `prepare` 就是你要初始化的语句了。举个例子，我们让这里面初始化一个 [Monger](http://clojuremongodb.info/)，于是我们要在 `let` 里面定义一个用于链接的 `atom {}`。

```clojure
(defbolt bolt ["..."] {:prepare true}
 [conf context collector]
 (let [conn (atom {})
       db (atom {})]
   (bolt
    (prepare [conf context collector]
     (reset! conn (mg/connect ...))
     (reset! db (mg/get-db @conn ...)))
    (execute [tuple]
     (...)))))
```

　　这样一来，当 Bolt 被 Nimbus 打包传到各个 worker 之后，Bolt 执行起来的时候会自动执行 `prepare` 当中的代码，即初始化 MongoDB 的链接，并且将其赋值给 `conn` 和 `db` 两个 atom。

　　那么，我们就能在本体 `execute` 当中使用 `@conn` 和 `@db` 来使唤 MongoDB 了。

## 思考

　　可能很多人不解，不是说尽量保持 LISP 语系当中值的不变性的么？

　　其实不变性只是为了提高程序在运行时的效率——而事实上是，上面那段代码并没有在运行时去做变量。

　　虽然说这么说有点牵强，但是的确就是这个意思——因为我们是在程序执行真正有用的好逻辑的时候没有去改变一些值，相反只是在 Bolt 启动的时候做一些变量的操作。

　　换句话说，虽然严谨的讲那个时候是算运行时，但是在运行时里面我们却可以把它归类为预处理——这一类东西反正程序还没真正开始跑有用的东西，效率慢一点无所谓，而且就初始化这么屁大点事儿能有多少影响？

　　效率和效果之间权衡上面的还是要仁者见仁智者见智了。

## 小结

　　本以为 `Suwako` 终于可以暂时告一段落了，紧要关头居然还是阻塞了。

　　说多都是泪，不说了，找 Bug 去了。

![泄矢诹访子](suwako.jpg)
