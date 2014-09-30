title: 用 Node.js 實現一個 Singleton
date: 2014-09-30 15:21:13
tags: [ 設計模式, Node.js ]
category: Node.js
---

　　今天隨便玩了一道 [CodeWar 的題](http://www.codewars.com/kata/singleton-pattern/javascript)。

　　題意大致就是你需要實現一個 `Singleton` 也就是單件模式的類，讓其下面代碼執行成功：

```javascript
var obj1 = new Singleton();
var obj2 = new Singleton();
obj1 === obj2; // => true
obj1.test = 1;
obj2.test; // => 1
```

　　並且還有很重要的一點就是 `Singleton` 的對象的 `instanceof` 也得的確是 `Singleton` 才行。

## 開始試驗

　　我們猜想 `new Singleton()` 的結果，如果 `Singleton` 函數也就是這個類的構造函數沒返回值的話，直接會返回 `this`，有返回值的話，那麼就是等於其返回值了。

　　我們碼下面的代碼看一下：

```javascript
var Singleton = function() {
    return { foo: "bar" };
};

console.log(new Singleton());
```

　　跑一遍之後我們的確發現了輸出的值就是：

```javascript
{ foo: "bar" }
```

## 小作弊失敗

　　於是我這麼做：

```javascript
var foo = {};
var Singleton = function() {
    return foo;
};
```

　　結果上面的幾個條件都符合了，不信大家可以自己輸出一遍看看。

　　但是——

　　這東西不是一個 `Singleton` 的實例，它只是一個簡單的 `JSON` 對象，所以還是無法通過。

## 死月の正解

　　答案有很多，CodeWar 上面每個人的解法都不一樣，但是歸根結底本質還是大同小異的。

　　就是第一次的時候先直接返回 `this`，並且把 `this` 放在某個地方。以後每次來這裏創建的時候返回之前存好的 `this` 即可：

```javascript
var Singleton = function() {
    if(Singleton.prototype.instance) return Singleton.prototype.instance = this;

    // Do some initialize things
    // ...

    Singleton.prototype.instance = this;
    return this;
};
```

## 別的寫法

　　寫法很多，我這裏隨意挑幾個別人的答案吧。

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

