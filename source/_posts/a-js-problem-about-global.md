title: 一道關於 Node.js 全局變量的題目
date: 2015-11-26 21:51:37
tags: [ Node.js, 源碼分析, REPL, vm ]
---

## 原題

　　題目是這樣的。

```javascript
var a = 2;
function foo(){
    console.log(this.a);
}

foo();
```

> 上題由我們親愛的[小龍](http://f2e.souche.com/blog/author/wang-xing-long/)童鞋發現並在我們的 901 羣裏提問的。

## 經過

　　然後有下面的小對話。

> **小龍：**你們猜這個輸出什麼？
>
> **弍紓：**2
>
> **力叔：**2 啊
>
> **死月·絲卡蕾特：**2
>
> **力叔：**有什麼問題麼？
>
> **小龍：**輸出 undefind。
>
> **死月·絲卡蕾特：**你確定？
>
> **小龍：**是不是我電腦壞了
>
> **力叔：**你確定？
>
> **弍紓：**你確定？
>
> **小龍：**爲什麼我 node 文件名跑出來的是 undefined？
>
> **鄭昱：**-.- 一樣阿。undefined

　　以上就是剛見到這個題目的時候羣裏的一個小討論。

## 分析

　　後來我就覺得奇怪，既然小龍驗證過了，說明他也不是隨地大小便，無的放矢什麼的。

　　於是我也驗證了一下，不過由於偷懶，沒有跟他們一樣寫在文件裏面，而是直接 node 開了個 REPL 來輸入上述代碼。

> **結果是 2！**
>
> **結果是 2！**
>
> **結果是 2！**

　　於是這就出現了一個很奇怪的問題。

　　尼瑪爲毛我是 `2` 他們倆是 `undefined` 啊！

　　不過馬上我就反應過來了——我們幾個的環境不同，他們是 `$ node foo.js` 而我是直接 node 開了個 REPL，所以有一定的區別。

　　而力叔本身就是前端大神，我估計是以 Chrome 的調試工具下爲基礎出的答案。

## REPL vs 文件執行

　　其實上述的問題，需要解釋的問題大概就是 `a` 到底掛在哪了。

　　因爲細細一想，在 `function` 當中，`this` 指向的目標是 `global` 或者 `window`。

> 還無法理解上面這句話的童鞋需要先補一下基礎。

　　那麼最終需要解釋的就是 `a` 到底有沒有掛在全局變量上面。

　　這麼一想就有點細思恐極的味道了——如果在 node 線上運行環境裏面的源代碼文件裏面隨便 `var` 一個變量就掛到了全局變量裏面那是有多恐怖！

　　於是就有些釋然了。

　　但究竟是什麼原因導致 REPL 和文件執行方式不一樣的呢？

### 全局對象的屬性

　　首先是弍紓找出了阮老師 ES6 系列文章中的[全局對象屬性](http://es6.ruanyifeng.com/#docs/let)一節。

> 全局對象是最頂層的對象，在瀏覽器環境指的是 window 象，在 Node.js 指的是 global 對象。ES5 之中，全局對象的屬性與全局變量是等價的。
>
> ```javascript
window.a = 1;
a // 1

a = 2;
window.a // 2
```
> 上面代碼中，全局對象的屬性賦值與全局變量的賦值，是同一件事。（對於Node來說，這一條只對REPL環境適用，模塊環境之中，全局變量必須顯式聲明成global對象的屬性。）

有了阮老師的文章驗證了這個猜想，我可以放心大膽繼續看下去了。

### repl.js

　　知道了上文的內容之後，感覺首要查看的就是 Node.js 源碼中的 [repl.js](https://github.com/nodejs/node/blob/master/lib/repl.js#L513) 了。

　　先是結合了一下自己以前用自定義 REPL 的情況，一般的步驟先是獲取 REPL 的上下文，然後在上下文裏面貼上各種自己需要的東西。

```javascript
var r = relp.start(" ➜ ");
var c = r.context;

// 在 c 裏面貼上各種上下文
c.foo = bar;
// ...
```

> 關於自定義 REPL 的一些使用方式可以參考下老雷寫的《[Node.js 定製 REPL 的妙用](https://cnodejs.org/topic/563735ed677332084c319d95)》。

　　有了之前寫 REPL 的經驗，大致明白了 REPL 裏面有個上下文的東西，那麼在 repl.js 裏面我們也找到了類似的代碼。

```javascript
REPLServer.prototype.createContext = function() {
  var context;
  if (this.useGlobal) {
    context = global;
  } else {
    context = vm.createContext();
    for (var i in global) context[i] = global[i];
    context.console = new Console(this.outputStream);
    context.global = context;
    context.global.global = context;
  }

  context.module = module;
  context.require = require;

  this.lines = [];
  this.lines.level = [];

  // make built-in modules available directly
  // (loaded lazily)
  exports._builtinLibs.forEach(function(name) {
    Object.defineProperty(context, name, {
      get: function() {
        var lib = require(name);
        context._ = context[name] = lib;
        return lib;
      },
      // allow the creation of other globals with this name
      set: function(val) {
        delete context[name];
        context[name] = val;
      },
      configurable: true
    });
  });

  return context;
};
```

　　看到了關鍵字 `vm`。我們暫時先不管 `vm`，光從上面的代碼可以看出，`context` 要麼等於 `global`，要麼就是把 `global` 上面的所有東西都粘過來。

　　然後順帶着把必須的兩個不在 `global` 裏的兩個東西 `require` 和 `module` 給弄過來。

　　下面的東西就不需要那麼關心了。

### VM

　　接下去我們來講講 `vm`。

　　VM 是 node 中的一個內置模塊，可以在[文檔](https://nodejs.org/dist/v4.2.2/docs/api/vm.html)中看到說明和使用方法。

　　大致就是將代碼運行在一個沙箱之內，並且事先賦予其一些 `global` 變量。

　　而真正起到上述 `var` 和 `global` 區別的就是這個 `vm` 了。

　　`vm` 之中在根作用域（也就是最外層作用域）中使用 `var` 應該是跟在瀏覽器中一樣，會把變量粘到 `global`（瀏覽器中是 `window`）中去。

　　我們可以試試這樣的代碼：

```javascript
var vm = require('vm');
var localVar = 'initial value';

vm.runInThisContext('var localVar = "vm";');
console.log('localVar: ', localVar);
console.log('global.localVar: ', global.localVar);
```

　　其輸出結果是：

```javascript
localVar: initial value
global.localVar: vm
```

　　如文檔中所說，`vm` 的一系列函數中跑腳本都無法對當前的局部變量進行訪問。各函數能訪問自己的 `global`，而 `runInThisContext` 的 `global` 與當前上下文的 `global` 是一樣的，所以能訪問當前的全局變量。

　　所以出現上述結果也是理所當然的了。

　　所以在 `vm` 中跑我們一開始拋出的問題，答案自然就是 `2` 了。

```javascript
var vm = require("vm");
var sandbox = {
    console: console
};

vm.createContext(sandbox);
vm.runInContext("var a = 2;function foo(){console.log(this.a);}foo();", sandbox);
```

### Node REPL 啓動的沙箱

　　最後我們再只需要驗證一件事就能真相大白了。

　　平時我們自定義一個 `repl.js` 然後執行 `$ node repl.js` 的話是會啓動一個 REPL，而這個 REPL 會去調 `vm`，所以會出現 `2` 的答案；或者我們自己在代碼裏面寫一個 `vm` 然後跑之前的代碼，也是理所當然出現 `2`。

　　那麼我們就輸入 `$ node` 來進入的 REPL 跟我們之前講的 REPL 是不是同一個東西呢？

　　如果是的話，一切就釋然了。

　　首先我們進入到 Node 的入口文件——C++ 的 `int main()`。

　　它在 Node.js 源碼 [src/node_main.cc](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node_main.cc#L45) 之中。

```cpp
int main(int argc, char *argv[]) {
  setvbuf(stderr, NULL, _IOLBF, 1024);
  return node::Start(argc, argv);
}
```

　　就在主函數中執行了 `node::Start`。而這個 `node::Start` 又存在 [src/node.cc](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node.cc#L4109) 裏面。

　　然後在 `node::Start` 裏面又調用 `StartNodeInstance`，在這裏面是 `LoadEnvironment` 函數。

　　最後在 `LoadEnvironment` 中看到了幾句關鍵的語句：

```cpp
Local<String> script_name = FIXED_ONE_BYTE_STRING(env->isolate(), "node.js");
Local<Value> f_value = ExecuteString(env, MainSource(env), script_name);

//...

Local<Function> f = Local<Function>::Cast(f_value);

//...
Local<Object> global = env->context()->Global();

//...
Local<Value> arg = env->process_object();
f->Call(global, 1, &arg);
```

　　還有這麼一段關鍵的註釋。

```cpp
// Now we call 'f' with the 'process' variable that we've built up with
// all our bindings. Inside node.js we'll take care of assigning things to
// their places.

// We start the process this way in order to be more modular. Developers
// who do not like how 'src/node.js' setups the module system but do like
// Node's I/O bindings may want to replace 'f' with their own function.
```

　　也就是說，啓動 `node` 的時候，在做了一些準備之後是開始載入執行 src 文件夾下面的 [node.js](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node.js) 文件。

　　在 [92 行](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node.js#L92)附近有針對 `$ node foo.js` 和 `$ node` 的判斷啓動不同的邏輯。

```javascript
  // ...
} else if (process.argv[1]) {
  // make process.argv[1] into a full path
  var path = NativeModule.require('path');
  process.argv[1] = path.resolve(process.argv[1]);

  var Module = NativeModule.require('module');

  // ...

  startup.preloadModules();
  if (global.v8debug &&
      process.execArgv.some(function(arg) {
        return arg.match(/^--debug-brk(=[0-9]*)?$/);
      })) {
    var debugTimeout = +process.env.NODE_DEBUG_TIMEOUT || 50;
    setTimeout(Module.runMain, debugTimeout);
  } else {
    // Main entry point into most programs:
    Module.runMain();
  }
} else {
  var Module = NativeModule.require('module');

  if (process._forceRepl || NativeModule.require('tty').isatty(0)) {
    // REPL
    var cliRepl = Module.requireRepl();
    cliRepl.createInternalRepl(process.env, function(err, repl) {
      // ...
    });
  } else {
    // ...
  }
}
```

　　在上述節選代碼的第一個 `else if` 中，就是對 `$ node foo.js` 這種情況進行處理了，再做完各種初始化之後，使用 `Module.runMain();` 來運行入口代碼。

　　第二個 `else if` 裏面就是 `$ node` 這種情況了。

　　我們在終端中打開 `$ node` 的時候，TTY 通常是關連着的，所以 `require('tty').isatty(0)` 爲 `true`，也就是說會進到條件分支並且執行裏面的 `cliRepl` 相關代碼。

　　我們進入到 [lib/module.js](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/lib/module.js#L490) 看看這個 `Module.requireRepl` 是什麼東西。

```javascript
Module.requireRepl = function() {
  return Module._load('internal/repl', '.');
}
```

　　所以我們還是得轉入 [lib/internal/repl.js](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/lib/internal/repl.js#L23) 來一探究竟。

　　上面在 `node.js` 裏面我們看到它執行了這個 `cliRepl` 的 `createInternalRepl` 函數，它的實現大概是這樣的：

```javascript
function createRepl(env, opts, cb) {
  // ...

  opts = opts || {
    ignoreUndefined: false,
    terminal: process.stdout.isTTY,
    useGlobal: true
  };

  // ...

  opts.replMode = {
    'strict': REPL.REPL_MODE_STRICT,
    'sloppy': REPL.REPL_MODE_SLOPPY,
    'magic': REPL.REPL_MODE_MAGIC
  }[String(env.NODE_REPL_MODE).toLowerCase().trim()];

  // ...

  const repl = REPL.start(opts);

  // ...
}
```

　　轉頭一看這個 lib/internal/repl.js 頂端的模塊引入，赫然看到一句話：

```javascript
const REPL = require('repl');
```

　　真相大白。

## 小結

　　最後再梳理一遍。

　　在於 Node.js 的 `vm` 裏面，頂級作用域下的 `var` 會把變量貼到 `global` 下面。而 REPL 使用了 `vm`。然後 `$ node` 進入的一個模式就是一個特定參數下面啓動的一個 `REPL`。

　　所以我們一開始提出的問題裏面在 `$ node foo.js` 模式下執行是 `undefined`，因爲不在全局變量上，但是啓用 `$ node` 這種 REPL 模式的時候得到的結果是 `2`。

## 番外

> **小龍：**我用 node test.js 跑出來是 `a: undefined`；那我應該怎麼修改“環境”，來讓他跑出：`a: 2` 呢？

　　於是有了上面寫的那段代碼。

```javascript
var vm = require("vm");
var sandbox = {
    console: console
};

vm.createContext(sandbox);
vm.runInContext("var a = 2;function foo(){console.log(this.a);}foo();", sandbox);
```
