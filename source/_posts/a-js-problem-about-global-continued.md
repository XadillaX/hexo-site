title: Node.js 启动方式：一道关于全局变量的题目引发的思考·续
date: 2015-11-27 14:36:27
tags: [ Node.js, 源码分析, REPL, vm ]
---

本文是上文《[Node.js 启动方式：一道关于全局变量的题目引发的思考](https://xcoder.in/2015/11/26/a-js-problem-about-global/)》的续章。

## 原题回顾

我们还是先回顾下原题吧。

```javascript
var a = 2;  
function foo(){  
    console.log(this.a);
}

foo();  
```

> 上题由我们亲爱的[小龙](http://f2e.souche.com/blog/author/wang-xing-long/)童鞋发现并在我们的 901 群里提问的。

不过在上面一篇文章中，我们讲的是在 REPL 和 `vm` 中有什么事情，但是并没有解释为什么在文件模块的载入形式下，`var` 并不会挂载到全局变量去。

其实原因很简单，大家应该也都明白，在 Node.js 中，每个文件相当于是一个闭包，在 `require` 的时候被编译包了起来。

但是具体是怎么样的呢？虽然网上也有很多答案，我还是决定在这里按上一篇文章的尿性稍微解释一下。

## 分析

首先我们还是回到上一篇文章的《Node REPL 启动的沙箱》一节，里面说了当启动 Node.js 的时候是以 [src/node.js](https://github.com/nodejs/node/blob/dfee4e3712ac4673b5fc472a8f77ac65bdc65f87/src/node.js) 为入口的。

如果以 REPL 为途径启动的话是直接启动一个 `vm`，而此时的所有根级变量都在最顶级的作用域下，所以一个 `var` 自然会绑定到 `global` 下面了。

而如果是以文件，即 `$ node foo.js` 形式启动的话，它就会执行 src/node.js 里面的另一坨条件分支了。

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
  // ...
```

从上面的代码看出，只要是以 `$ node foo.js` 形式启动的，都会经历 `startup.preloadModules()` 和 `Module.runMain()` 两个函数。

### startup.preloadModules()

我们来看看[这个函数](https://github.com/nodejs/node/blob/dfee4e3712ac4673b5fc472a8f77ac65bdc65f87/src/node.js#L870)。

```javascript
startup.preloadModules = function() {
  if (process._preload_modules) {
    NativeModule.require('module')._preloadModules(process._preload_modules);
  }
};
```

实际上就是执行的 lib/module.js 里面的 `_preloadModules` 函数，并且把这个 `process._preload_modules` 给传进去。当然，前提是有这个 `process._preload_modules`。

#### process.\_preload_modules

这个 `process._preload_modules` 指的就是当你在使用 Node.js 的时候，命令行里面的 `--require` 参数。

```
-r, --require         module to preload (option can be repeated)
```

代码在 [src/node.cc](https://github.com/nodejs/node/blob/master/src/node.cc#L3306) 里面可考。

```cpp
// ...
} else if (strcmp(arg, "--require") == 0 ||
           strcmp(arg, "-r") == 0) {
  const char* module = argv[index + 1];
  if (module == nullptr) {
    fprintf(stderr, "%s: %s requires an argument\n", argv[0], arg);
    exit(9);
  }
  args_consumed += 1;
  local_preload_modules[preload_module_count++] = module;
} else if
// ...
```

如果遇到了 `--require` 这个参数，则对静态变量 `local_preload_modules` 和 `preload_module_count` 做处理，把这个预加载模块路径加进去。

待到[要生成 `process` 这个变量的时候](https://github.com/nodejs/node/blob/master/src/node.cc#L2933)，再把预加载模块的信息放到 `process._preload_modules` 里面去。

```cpp
void SetupProcessObject(Environment* env,
                        int argc,
                        const char* const* argv,
                        int exec_argc,
                        const char* const* exec_argv) {
  // ...

  if (preload_module_count) {
    CHECK(preload_modules);
    Local<Array> array = Array::New(env->isolate());
    for (unsigned int i = 0; i < preload_module_count; ++i) {
      Local<String> module = String::NewFromUtf8(env->isolate(),
                                                 preload_modules[i]);
      array->Set(i, module);
    }
    READONLY_PROPERTY(process,
                      "_preload_modules",
                      array);

    delete[] preload_modules;
    preload_modules = nullptr;
    preload_module_count = 0;
  }

  // ...
}
```

最重要的就是这句

```cpp
READONLY_PROPERTY(process,
                  "_preload_modules",
                  array);
```

#### require('module')._preloadModules

上面我们讲了这个 `process._preload_modules`，然后现在我们说说是如何把 `$ node --require bar.js foo.js` 给预加载进去的。

接下去我们就要移步到 lib/module.js 文件里面去了。

在[第 496 行左右](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L496)的地方有这个函数。

```javascript
Module._preloadModules = function(requests) {
  if (!Array.isArray(requests))
    return;

  // Preloaded modules have a dummy parent module which is deemed to exist
  // in the current working directory. This seeds the search path for
  // preloaded modules.
  var parent = new Module('internal/preload', null);
  try {
    parent.paths = Module._nodeModulePaths(process.cwd());
  }
  catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
  requests.forEach(function(request) {
    parent.require(request);
  });
};
```

大概我们能看到，就是以 `internal/preload` 为 ID 的 Module 对象来载入这些预加载模块。

```javascript
var parent = new Module('internal/preload', null);
requests.forEach(function(request) {
  parent.require(request);
});
```

根据这个函数的注释说明，这个 Module 对象是一个虚拟的 Module 对象，主要是跟非预加载的那些模块给隔离或者区别开来，并且提供一个模块搜索路径。

### Module.runMain()

看完上面的说明，我们接下去看看 `Module.runMain()` 函数。

这个函数还是位于 [lib/module.js](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L455)  文件里面。

```javascript
Module.runMain = function() {
  // Load the main module--the command line argument.
  Module._load(process.argv[1], null, true);
  // Handle any nextTicks added in the first tick of the program
  process._tickCallback();
};
```

我们看到了就是在这句话中，Module 载入了 `process.argv[1]` 也就是文件名，自此一发不可收拾。

#### Module._load

这个函数相信很多人都知道它的用处了，无非就是载入文件，并加载到一个闭包里面。

这样一来在文件里面 `var` 出来的变量就不在根作用域下面了，所以不会粘到 `global` 里面去。它的 `this` 就是包起来的这个闭包了。

```javascript
Module._load = function(request, parent, isMain) {
  // ...

  var filename = Module._resolveFilename(request, parent);

  // ...
  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    return cachedModule.exports;
  }

  if (NativeModule.nonInternalExists(filename)) {
    debug('load native module %s', request);
    return NativeModule.require(filename);
  }

  var module = new Module(filename, parent);

  if (isMain) {
    process.mainModule = module;
    module.id = '.';
  }

  Module._cache[filename] = module;

  module.load(filename);
  return module.exports;
}
```

上面的代码首先是根据传入的文件名找到真的文件地址，就是所谓的搜索路径了。比如 `require("foo")` 就会分别从 `node_modules` 路径等依次查找下来。

我经常 Hack 这个 `_resolveFilename` 函数来简化 `require` 函数，比如我希望我用 `require("controller/foo")` 就能直接拿到 ./src/controller/foo.js 文件。有兴趣讨论一下这个用法的童鞋可以转到我的 [Gist](https://gist.github.com/XadillaX/bc0e7c92925de0647477) 上查看 Hack 的一个 Demo。

第二步就是我们常说的缓存了。如果这个模块之前加载过，那么在 `Module._cache` 下面会有个缓存，直接去取就是了。

第三步就是看看是不是 `NativeModule`。

```javascript
if (NativeModule.nonInternalExists(filename)) {
  debug('load native module %s', request);
  return NativeModule.require(filename);
}
```

##### NativeModule

之前的代码里面其实也没少出现这个 `NativeModule`。那这个 `NativeModule` 到底是个 shenmegui 呢？

其实它还是在 Node.js 的入口 [src/node.js](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/src/node.js#L886) 里面。

它主要用来加载 Node.js 的一些原生模块，比如说 `NativeModule.require("child_process")` 等，也用于一些 `internal` 模块的载入，比如 `NativeModule.require("internal/repl")`。

之前代码的这个判断就是说如果判断要载入的文件是一个原生模块，那么就使用 `NativeModule.require` 来载入。

###### NativeModule.require

```javascript
NativeModule.require = function(id) {
  if (id == 'native_module') {
    return NativeModule;
  }

  var cached = NativeModule.getCached(id);
  if (cached) {
    return cached.exports;
  }

  if (!NativeModule.exists(id)) {
    throw new Error('No such native module ' + id);
  }

  process.moduleLoadList.push('NativeModule ' + id);

  var nativeModule = new NativeModule(id);

  nativeModule.cache();
  nativeModule.compile();

  return nativeModule.exports;
};
```

先看看是否是本身，再看看是否被缓存，然后看看是否合法。接下去就是填充 `process.moduleLoadList`，最后载入这个原生模块、缓存、编译并返回。

> 有兴趣的同学可以在 Node.js 中输出 `process.moduleLoadList` 看看。

这个 `compile` 很重要。

###### NativeModule.prototype.compile

在 `NativeModule` 编译的过程中，大概的步骤是获取代码、包裹（Wrap）代码，把包裹的代码 `runInContext` 一遍得到包裹好的函数，然后执行一遍就算载入好了。

```javascript
NativeModule.prototype.compile = function() {
  var source = NativeModule.getSource(this.id);
  source = NativeModule.wrap(source);

  var fn = runInThisContext(source, { filename: this.filename });
  fn(this.exports, NativeModule.require, this, this.filename);

  this.loaded = true;
};
```

我们往这个 src/node.js 文件这个函数的上面几行看一下，就知道包裹代码是怎么回事了。

```javascript
NativeModule.wrap = function(script) {
  return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
};

NativeModule.wrapper = [
  '(function (exports, require, module, __filename, __dirname) {\n',
  '\n});'
];
```

根据上面的代码，我们能知道的就是比如我们一个内置模块的代码是：

```javascript
var foo = require("foo");
module.exports = 1;
```

那么包裹好的代码将会是这样子的：

```javascript
(function (exports, require, module, __filename, __dirname) {
var foo = require("foo");
module.exports = 1;
});
```

这样一看就明白了这些 `require`、`module`、`exports`、`__filename` 和 `__dirname` 是怎么来了吧。

当我们通过 `var fn = runInThisContext(source, { filename: this.filename });` 得到了这个包裹好的函数之后，我们就把相应的参数传进这个闭包函数去执行。

```javascript
fn(this.exports, NativeModule.require, this, this.filename);
```

这个 `this` 就是对应的这个 `module`，自然这个 `module` 里面就有它的 `exports`；`require` 函数就是 `NativeModule.require`。

所以我们看到的在 `lib/*.js` 文件里面的那些 `require` 函数，实际上就是包裹好之后的代码的 `NativeModule.require` 了。

所以说实际上这些内置模块内部的根作用域下的 `var` 再怎么样高级也都是在包裹好的闭包里面 `var`，怎么的也跟 `global` 搭不着边。

###### 内部原生模块

通过上面的追溯我们知道了，如果我们在代码里面使用 `require` 的话，会先看看这个模块是不是原生模块。

不过回过头看一下它的这个判断条件：

```javascript
if (NativeModule.nonInternalExists(filename)) {
  // ...
}
```

> 如果是原生模块并且不是原生内部模块的话。

那是怎么区分原生模块和内部原生模块呢？

我们再来看看这个 `NativeModule.nonInternalExists(filename)` 函数。

```javascript
NativeModule.nonInternalExists = function(id) {
  return NativeModule.exists(id) && !NativeModule.isInternal(id);
};

NativeModule.isInternal = function(id) {
  return id.startsWith('internal/');
};
```

> 上面的代码是去除各种杂七杂八的条件之后的一种情况，别的情况还请各位童鞋自行看 Node.js 源码。

也就是说我们在我们自己的代码里面是请求不到 Node.js 源码里面 `lib/internal/*.js` 这些文件的——因为它们被上面的这个条件分支给过滤了。（比如 `require("internal/module")` 在自己的代码里面是无法运行的）

> **注意：** 不过有一个例外，那就是 `require("internal/repl")`。详情可以参考这个 [Issue](https://github.com/nodejs/node/issues/3393) 和[这段代码](https://github.com/nodejs/node/blob/9148114c93861359a502801499d4c26d0b761174/lib/module.js#L276-L277)。

##### Module.prototype.load

解释完了上面的 `NativeModule` 之后，我们要就上面 `Module._load` 里面的下一步 `module.load` 也就是 `Module.prototype.load` 做解析了。

```javascript
Module.prototype.load = function(filename) {
  // ...

  var extension = path.extname(filename) || '.js';
  if (!Module._extensions[extension]) extension = '.js';
  Module._extensions[extension](this, filename);
  this.loaded = true;
};
```

做了一系列操作之后得到了真·文件名，然后判断一下后缀。如果是 `".js"` 的话执行 `Module._extensions[".js"]` 这个函数去编译代码，如果是 `".json"` 则是 `Module._extensions[".json"]`。

这里我们略过 JSON 和 C++ Addon，直奔 `Module._extensions[".js"]`。

```javascript
Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(internalModule.stripBOM(content), filename);
};
```

它也很简单，就是奔着 `_compile` 去的。

###### Module.prototype._compile

先上[代码](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L378-L426)。

```javascript
Module.prototype._compile = function(content, filename) {
  var self = this;
  // remove shebang
  content = content.replace(shebangRe, '');

  function require(path) {
    return self.require(path);
  }

  require.resolve = function(request) {
    return Module._resolveFilename(request, self);
  };

  require.main = process.mainModule;

  // Enable support to add extra extension types
  require.extensions = Module._extensions;

  require.cache = Module._cache;

  var dirname = path.dirname(filename);

  // create wrapper function
  var wrapper = Module.wrap(content);

  var compiledWrapper = runInThisContext(wrapper,
                                      { filename: filename, lineOffset: -1 });

  // ...

  var args = [self.exports, require, self, filename, dirname];
  return compiledWrapper.apply(self.exports, args);
};
```

感觉流程上跟 `NativeModule` 的编译相似，不过这里是事先准备好要在载入的文件里面用的 `require` 函数，以及一些 `require` 的周边。

接下去就是用 `Module.wrap` 来包裹代码了，包裹完之后把得到的函数用参数 `self.exports, require, self, filename, dirname` 去执行一遍，就算是文件载入完毕了。

最后回到之前载入代码的那一刻，把载入完毕得到的 `module.exports` 再 `return` 出去就好了。

###### Module.wrap

这个就不用说了。

在 lib/module.js 的[最顶端附近](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L46-L48)有这么几行代码。

```javascript
Module.wrapper = NativeModule.wrapper;
Module.wrap = NativeModule.wrap;
Module._debug = util.debuglog('module');
```

一切豁然开朗了吧。

连 `NativeModule` 的代码都逃不开被之前说的闭包所包裹，那么你自己写的 JS 文件当然也会被 `NativeModule.wrap` 所包裹。

那么你在代码根作用域申明的函数实际上在运行时里面已经被一个闭包给包住了。

以前可能很多同学只知道是被闭包包住了，但是包的方法、流程今天算是解析了一遍了。

```javascript
(function (exports, require, module, __filename, __dirname) {
var a = 2;
function foo(){  
    console.log(this.a);
}

foo();
});
```

这个 `var a` 怎么也不可能绑到 `global` 去啊。

###### Module.prototype.require

虽然我们上面讲得差不多了，可能很多童鞋也厌烦了。

不过该讲完的还是得讲完。

我们在我们自己文件中用的 `require` 在上一节里面有提到过，传到我们闭包里面的 `require` 实际上是长这样的：

```javascript
function require(path) {
  return self.require(path);
}
```

所以实际上就是个 `Module.prototype.require`。

我们再看看[这个函数](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L362-L366)。

```javascript
Module.prototype.require = function(path) {
  assert(path, 'missing path');
  assert(typeof path === 'string', 'path must be a string');
  return Module._load(path, this);
};
```

一下子又绕回到了我们一开始的 `Module._load`。

所以基本上就差不多到这过了。

## REPL vs 文件启动

最后我们再点一下，或者说回顾一下吧。

REPL 启动的时候 Node.js 是开了个 `vm` 直接让你跑，并没有把代码包在一个闭包里面，所以再根作用域下的变量会 `Biu` 一下贴到 `global` 中去。

而文件启动的时候，会做本文中说的一系列事情，然后就会把各文件都包到一个闭包去，所以变量就无法通过这种方式来贴到 `global` 去了。

不过这种二义性会在 `"use strict";` 中戛然而止。

珍爱生命，`use strict`。

## 小结

本文可能很多童鞋看完后悔觉得很坑——JS 为什么有那么多二义性那么坑呢。

其实不然，主要是可能很多人对 Node.js 执行的机制不是很了解。

本文从小龙抛出的一个简单问题进入，然后浅入浅出 Node.js 的一些执行机制什么的，希望对大家还是有点帮助，更何况我在意的不是问题本身，而是分析的这个过程。

## 番外

> 以下均为臆想。
>
> **小龙：** 喂喂喂，我就问一个简单的小破题目，你至于嘛！
