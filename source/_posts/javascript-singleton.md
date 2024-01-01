title: 用 Node.js 实现一个 Singleton
date: 2014-09-30 15:21:13
tags: [ 设计模式, Node.js ]
category: Node.js
---

　　今天随便玩了一道 [CodeWar 的题](http://www.codewars.com/kata/singleton-pattern/javascript)。

　　题意大致就是你需要实现一个 `Singleton` 也就是单件模式的类，让其下面代码执行成功：

```javascript
var obj1 = new Singleton();
var obj2 = new Singleton();
obj1 === obj2; // => true
obj1.test = 1;
obj2.test; // => 1
```

　　并且还有很重要的一点就是 `Singleton` 的对象的 `instanceof` 也得的确是 `Singleton` 才行。

## 开始试验

　　我们猜想 `new Singleton()` 的结果，如果 `Singleton` 函数也就是这个类的构造函数没返回值的话，直接会返回 `this`，有返回值的话，那么就是等于其返回值了。

　　我们码下面的代码看一下：

```javascript
var Singleton = function() {
    return { foo: "bar" };
};

console.log(new Singleton());
```

　　跑一遍之后我们的确发现了输出的值就是：

```javascript
{ foo: "bar" }
```

## 小作弊失败

　　于是我这么做：

```javascript
var foo = {};
var Singleton = function() {
    return foo;
};
```

　　结果上面的几个条件都符合了，不信大家可以自己输出一遍看看。

　　但是——

　　这东西不是一个 `Singleton` 的实例，它只是一个简单的 `JSON` 对象，所以还是无法通过。

## 死月の正解

　　答案有很多，CodeWar 上面每个人的解法都不一样，但是归根结底本质还是大同小异的。

　　就是第一次的时候先直接返回 `this`，并且把 `this` 放在某个地方。以后每次来这里创建的时候返回之前存好的 `this` 即可：

```javascript
var Singleton = function() {
    if(Singleton.prototype.instance) return Singleton.prototype.instance = this;

    // Do some initialize things
    // ...

    Singleton.prototype.instance = this;
    return this;
};
```

## 别的写法

　　写法很多，我这里随意挑几个别人的答案吧。

```javascript
/**
 * By tjwudi
 */
var Singleton = function(){
  return Singleton.ins = Singleton.ins ? Singleton.ins : this;
};
```

```javascript
/**
 * By nonowarn
 */
var Singleton = (function () {
  var instance = null;

  return function(){
    return instance || (instance = this);
  };
})();
```

