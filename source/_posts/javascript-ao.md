title: JavaScript 中的活跃对象（AO）浅谈及导读
date: 2021-05-14 15:49
tags: [ JavaScript, ECMAScript, Closure ]
category: Programming
---

目前市面上很多文章一大抄，在如今 ES202+ 的年代，还在摘抄着 ES3 的原文。

> Every execution context has associated with it a variable object. Variables and functions declared in the source text are added as properties of the variable object. For function code, parameters are added as properties of the variable object.

然后将其与“面试官”绑在一起。其实在书面理解上沿用活跃对象的概念没什么问题，但是照抄原文又不指明出处，就会让人误以为如今的规范中也还定义了活跃对象这一概念。其实上引文中包含了活跃对象（Activation Object, AO，有时也称活动对象、激活对象）与可变对象（Variable Object, VO，有时也称变量对象）的内容，摘抄自 ECMAScript 3 Spec 的两处并组装起来。

今天，这里与大家一起浅尝一下 JavaScript 中的活跃对象。

![](https://dm.nbut.ac.cn/xcoder/2021/05/14/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A8%A1%E6%9D%BF.png)

## ECMAScript 1 / 3

在 ECMAScript 1 和 ECMAScript 3 中，的确是有着关于活跃对象的定义。

> 当控制进入函数代码的执行上下文时，创建一个活动对象并将它与该执行上下文相关联， 并使用一个名为 `arguments`、特征为 `{ DontDelete }` 的属性初始化该对象。该属性的初始值是稍后将要描述的一个参数对象。 
> 
> 接下来，这个活动对象将被用作变量初始化的可变对象。 
> 
> 活动对象纯粹是一种规范性机制，在 ECMAScript 访问它是不可能的。只能访问其成员而非该活动对象本身。对一个基对象为活动对象的引用值应用调用运算符时，这次调用的 `this` 值 为 `null`。
>
> ——ECMAScript Language Specification 262 Edition 3 Final, 10.1.6 活跃对象

但也仅限于 ECMAScript 1 和 3 了。我们现在在网上（尤其是中文搜索环境中）获取到的关于活跃对象和可变对象（Variable Object）的文章，大多都是为我们描述的 ECMAScript 1 和 3，早已过时。

如果大家对这块内容仍然感兴趣（实际上我也建议大家感兴趣），可以参阅：

+ ECMA-262-3 in detail. Chapter 2. Variable object.：http://dmitrysoshnikov.com/ecmascript/chapter-2-variable-object/
+ ECMA-262-3 深入解析·第二章·变量对象（上一条的翻译）：https://www.cnblogs.com/justinw/archive/2010/04/23/1718733.html

## ECMAScript 5+

在 ES5 及之后的 ES 版本，已经不存在活跃对象（AO）及一系列周边内容的概念了。取而代之，是一个叫词法环境（Lexical Environments）的定义。

也就是说，严谨来讲，现代的 ECMAScript 早已没有了活跃对象这一概念，所以当网络上文章中“面试官跟你聊起 AO”这些内容出现的时候，其实就是“市面文章一大抄”的体现。他们还会有理有据地把 ECMAScript Spec 原文给你列出来（参照文首的摘抄）。

关于词法环境，大家可以参阅：

+ ECMA-262-5 in detail. Chapter 3.2. Lexical environments: ECMAScript implementation.：http://dmitrysoshnikov.com/ecmascript/es5-chapter-3-2-lexical-environments-ecmascript-implementation/
+ ECMA-262-5 词法环境：ECMA实现（上一条的翻译）：https://blog.csdn.net/szengtal/article/details/78726143

这里就不赘述了。

## 广义的活跃对象

经过上面两节内容，我们可以知道，活跃对象是 ECMAScript 1 / 3 中的内容。后续的版本中，其就不复存在了。但是活跃对象这个概念就不能再被提起了吗？

![](https://dm.nbut.ac.cn/xcoder/2021/05/14/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A8%A1%E6%9D%BF%20(1).png)

其实也不是，它对应的概念还是可以延续下来的。只不过不能让人误以为现代 ECMAScript 中还有其定义，我们现在再聊起活跃对象时，应该知道它只是广义的抽象，而不再是狭义的定义了。广义的活跃对象在不同的场景下也可以有不同的名字，如活跃记录（Activation Record）、栈帧（Stack Frame）等。

每当函数被调用的时候，其都会创建一个活跃对象。该对象对开发者不可见，是一个隐藏的数据结构，其中包含了一些函数在执行时必要的信息和绑定，以及返回值的地址等等。

在 C 语言中，这个对象会在一个栈中被分配生成。当函数返回的时候，该对象会被销毁（或者出栈）。

> 你看，此处“活跃对象”被引申到 C 语言了。它指的是一个抽象的存在，意为栈帧（Stack Frame）。

JavaScript 与 C 语言不同，它是从堆中分配该对象。且这个活跃对象并不会在函数返回时被自动销毁，它的生命周期与普通对象的垃圾回收机制类似，是根据引用数量决定的。

一个活跃对象包含：

+ 对应函数对象的引用；
+ 调用者对应的活跃对象，用于 `return` 之后的控制权转移；
+ 调用完毕之后用于继续执行后续逻辑的恢复信息，它通常是一个将在函数调用完毕之后立即要执行的指令的地址；
+ 函数对应的形参，从实参初始化而来；
+ 函数中的变量，以 `undefined` 进行初始化；
+ 函数用于计算复杂表达式的临时变量；
+ `this`，如果函数作为一个方法被调用，那么 `this` 通常就是它的宿主对象。

其实 ES5+ 之后的广义“活跃对象”就是对于 ES 1 / 3 定义的活跃对象的一个扩展，并将其应用到了词法环境中。

至此为止，关于“活跃对象”的浅析就足矣。当下环境中，我们不是不能再谈论“活跃对象”，而是不能乱谈，还谈得有鼻子有眼的。现如今的“活跃对象”是一个类似于活跃记录和栈帧的广义抽象概念。

不然，仍旧用老旧的文章去回答所谓“面试官”的问题，很有可能被刷掉哦。

## 闭包

闭包也是老生常谈的一个概念。为什么在这篇文章中要提起这么个看起来八竿子打不着的概念呢？

闭包一直没有一个非常严谨的定义。如：

> 闭包就是能够读取其他函数内部变量的函数。
> 
> 闭包就是能够读取外层函数变量的函数。

等等等等。

再例如：

> 「函数」和「函数内部能访问到的变量」（也叫环境）的总和，就是一个闭包。

上述的解释也都是我从网上的各文章中摘抄出来的。其实理解起来很容易，但是语言描述出来并不那么严谨。大家知道那么回事就好了。

不过，在我们有了广义活跃对象之后，我们可以从另一个角度来定义闭包了。怎么说呢？函数是可嵌套的。当一个嵌套的函数对象被创建时，它会包含一个外层函数对象所对应的活跃对象引用

有了这层关系，闭包就好定义了：

> 一个拥有外层函数对象所对应的活跃对象引用的函数对象就被称为闭包。

言简意赅。虽然不至于像“能读取外层函数中的变量”那样亲民朴实，但也非常言简了。同时，有了“活跃对象”作为大前提，已经帮忙做了很多前提条件定义，所以这个定义也能达到意赅的效果。

以后再面试起什么是闭包，大家可以尝试从这个角度解释哦。前提是你真的懂了，不要到时候又被面试官给绕进去了。
