title: 一道关于 Node.js 全局变量的题目
date: 2015-11-26 21:51:37
tags: [ Node.js, 源码分析, REPL, vm ]
---

## 原题

　　题目是这样的。

```javascript
var a = 2;
function foo(){
    console.log(this.a);
}

foo();
```

> 上题由我们亲爱的[小龙](http://f2e.souche.com/blog/author/wang-xing-long/)童鞋发现并在我们的 901 群里提问的。

## 经过

　　然后有下面的小对话。

> **小龙：**你们猜这个输出什么？
>
> **弍纾：**2
>
> **力叔：**2 啊
>
> **死月·絲卡蕾特：**2
>
> **力叔：**有什么问题么？
>
> **小龙：**输出 undefind。
>
> **死月·絲卡蕾特：**你确定？
>
> **小龙：**是不是我电脑坏了
>
> **力叔：**你确定？
>
> **弍纾：**你确定？
>
> **小龙：**为什么我 node 文件名跑出来的是 undefined？
>
> **郑昱：**-.- 一样阿。undefined

　　以上就是刚见到这个题目的时候群里的一个小讨论。

## 分析

　　后来我就觉得奇怪，既然小龙验证过了，说明他也不是随地大小便，无的放矢什么的。

　　于是我也验证了一下，不过由于偷懒，没有跟他们一样写在文件里面，而是直接 node 开了个 REPL 来输入上述代码。

> **结果是 2！**
>
> **结果是 2！**
>
> **结果是 2！**

　　于是这就出现了一个很奇怪的问题。

　　尼玛为毛我是 `2` 他们俩是 `undefined` 啊！

　　不过马上我就反应过来了——我们几个的环境不同，他们是 `$ node foo.js` 而我是直接 node 开了个 REPL，所以有一定的区别。

　　而力叔本身就是前端大神，我估计是以 Chrome 的调试工具下为基础出的答案。

## REPL vs 文件执行

　　其实上述的问题，需要解释的问题大概就是 `a` 到底挂在哪了。

　　因为细细一想，在 `function` 当中，`this` 指向的目标是 `global` 或者 `window`。

> 还无法理解上面这句话的童鞋需要先补一下基础。

　　那么最终需要解释的就是 `a` 到底有没有挂在全局变量上面。

　　这么一想就有点细思恐极的味道了——如果在 node 线上运行环境里面的源代码文件里面随便 `var` 一个变量就挂到了全局变量里面那是有多恐怖！

　　于是就有些释然了。

　　但究竟是什么原因导致 REPL 和文件执行方式不一样的呢？

### 全局对象的属性

　　首先是弍纾找出了阮老师 ES6 系列文章中的[全局对象属性](http://es6.ruanyifeng.com/#docs/let)一节。

> 全局对象是最顶层的对象，在浏览器环境指的是 window 象，在 Node.js 指的是 global 对象。ES5 之中，全局对象的属性与全局变量是等价的。
>
> ```javascript
window.a = 1;
a // 1

a = 2;
window.a // 2
```
> 上面代码中，全局对象的属性赋值与全局变量的赋值，是同一件事。（对于Node来说，这一条只对REPL环境适用，模块环境之中，全局变量必须显式声明成global对象的属性。）

有了阮老师的文章验证了这个猜想，我可以放心大胆继续看下去了。

### repl.js

　　知道了上文的内容之后，感觉首要查看的就是 Node.js 源码中的 [repl.js](https://github.com/nodejs/node/blob/master/lib/repl.js#L513) 了。

　　先是结合了一下自己以前用自定义 REPL 的情况，一般的步骤先是获取 REPL 的上下文，然后在上下文里面贴上各种自己需要的东西。

```javascript
var r = relp.start(" ➜ ");
var c = r.context;

// 在 c 里面贴上各种上下文
c.foo = bar;
// ...
```

> 关于自定义 REPL 的一些使用方式可以参考下老雷写的《[Node.js 定制 REPL 的妙用](https://cnodejs.org/topic/563735ed677332084c319d95)》。

　　有了之前写 REPL 的经验，大致明白了 REPL 里面有个上下文的东西，那么在 repl.js 里面我们也找到了类似的代码。

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

　　看到了关键字 `vm`。我们暂时先不管 `vm`，光从上面的代码可以看出，`context` 要么等于 `global`，要么就是把 `global` 上面的所有东西都粘过来。

　　然后顺带着把必须的两个不在 `global` 里的两个东西 `require` 和 `module` 给弄过来。

　　下面的东西就不需要那么关心了。

### VM

　　接下去我们来讲讲 `vm`。

　　VM 是 node 中的一个内置模块，可以在[文档](https://nodejs.org/dist/v4.2.2/docs/api/vm.html)中看到说明和使用方法。

　　大致就是将代码运行在一个沙箱之内，并且事先赋予其一些 `global` 变量。

　　而真正起到上述 `var` 和 `global` 区别的就是这个 `vm` 了。

　　`vm` 之中在根作用域（也就是最外层作用域）中使用 `var` 应该是跟在浏览器中一样，会把变量粘到 `global`（浏览器中是 `window`）中去。

　　我们可以试试这样的代码：

```javascript
var vm = require('vm');
var localVar = 'initial value';

vm.runInThisContext('var localVar = "vm";');
console.log('localVar: ', localVar);
console.log('global.localVar: ', global.localVar);
```

　　其输出结果是：

```javascript
localVar: initial value
global.localVar: vm
```

　　如文档中所说，`vm` 的一系列函数中跑脚本都无法对当前的局部变量进行访问。各函数能访问自己的 `global`，而 `runInThisContext` 的 `global` 与当前上下文的 `global` 是一样的，所以能访问当前的全局变量。

　　所以出现上述结果也是理所当然的了。

　　所以在 `vm` 中跑我们一开始抛出的问题，答案自然就是 `2` 了。

```javascript
var vm = require("vm");
var sandbox = {
    console: console
};

vm.createContext(sandbox);
vm.runInContext("var a = 2;function foo(){console.log(this.a);}foo();", sandbox);
```

### Node REPL 启动的沙箱

　　最后我们再只需要验证一件事就能真相大白了。

　　平时我们自定义一个 `repl.js` 然后执行 `$ node repl.js` 的话是会启动一个 REPL，而这个 REPL 会去调 `vm`，所以会出现 `2` 的答案；或者我们自己在代码里面写一个 `vm` 然后跑之前的代码，也是理所当然出现 `2`。

　　那么我们就输入 `$ node` 来进入的 REPL 跟我们之前讲的 REPL 是不是同一个东西呢？

　　如果是的话，一切就释然了。

　　首先我们进入到 Node 的入口文件——C++ 的 `int main()`。

　　它在 Node.js 源码 [src/node_main.cc](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node_main.cc#L45) 之中。

```cpp
int main(int argc, char *argv[]) {
  setvbuf(stderr, NULL, _IOLBF, 1024);
  return node::Start(argc, argv);
}
```

　　就在主函数中执行了 `node::Start`。而这个 `node::Start` 又存在 [src/node.cc](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node.cc#L4109) 里面。

　　然后在 `node::Start` 里面又调用 `StartNodeInstance`，在这里面是 `LoadEnvironment` 函数。

　　最后在 `LoadEnvironment` 中看到了几句关键的语句：

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

　　还有这么一段关键的注释。

```cpp
// Now we call 'f' with the 'process' variable that we've built up with
// all our bindings. Inside node.js we'll take care of assigning things to
// their places.

// We start the process this way in order to be more modular. Developers
// who do not like how 'src/node.js' setups the module system but do like
// Node's I/O bindings may want to replace 'f' with their own function.
```

　　也就是说，启动 `node` 的时候，在做了一些准备之后是开始载入执行 src 文件夹下面的 [node.js](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node.js) 文件。

　　在 [92 行](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/src/node.js#L92)附近有针对 `$ node foo.js` 和 `$ node` 的判断启动不同的逻辑。

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

　　在上述节选代码的第一个 `else if` 中，就是对 `$ node foo.js` 这种情况进行处理了，再做完各种初始化之后，使用 `Module.runMain();` 来运行入口代码。

　　第二个 `else if` 里面就是 `$ node` 这种情况了。

　　我们在终端中打开 `$ node` 的时候，TTY 通常是关连着的，所以 `require('tty').isatty(0)` 为 `true`，也就是说会进到条件分支并且执行里面的 `cliRepl` 相关代码。

　　我们进入到 [lib/module.js](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/lib/module.js#L490) 看看这个 `Module.requireRepl` 是什么东西。

```javascript
Module.requireRepl = function() {
  return Module._load('internal/repl', '.');
}
```

　　所以我们还是得转入 [lib/internal/repl.js](https://github.com/nodejs/node/blob/0966ab99966b7d3fbe4d7b93797fb299595fca72/lib/internal/repl.js#L23) 来一探究竟。

　　上面在 `node.js` 里面我们看到它执行了这个 `cliRepl` 的 `createInternalRepl` 函数，它的实现大概是这样的：

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

　　转头一看这个 lib/internal/repl.js 顶端的模块引入，赫然看到一句话：

```javascript
const REPL = require('repl');
```

　　真相大白。

## 小结

　　最后再梳理一遍。

　　在于 Node.js 的 `vm` 里面，顶级作用域下的 `var` 会把变量贴到 `global` 下面。而 REPL 使用了 `vm`。然后 `$ node` 进入的一个模式就是一个特定参数下面启动的一个 `REPL`。

　　所以我们一开始提出的问题里面在 `$ node foo.js` 模式下执行是 `undefined`，因为不在全局变量上，但是启用 `$ node` 这种 REPL 模式的时候得到的结果是 `2`。

## 番外

> **小龙：**我用 node test.js 跑出来是 `a: undefined`；那我应该怎么修改“环境”，来让他跑出：`a: 2` 呢？

　　于是有了上面写的那段代码。

```javascript
var vm = require("vm");
var sandbox = {
    console: console
};

vm.createContext(sandbox);
vm.runInContext("var a = 2;function foo(){console.log(this.a);}foo();", sandbox);
```
