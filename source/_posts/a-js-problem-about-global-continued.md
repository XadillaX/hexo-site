title: Node.js 啓動方式：一道關於全局變量的題目引發的思考·續
date: 2015-11-27 14:36:27
tags: [ Node.js, 源碼分析, REPL, vm ]
---

本文是上文《[一道關於 Node.js 全局變量的題目](http://f2e.souche.com/blog/a-js-problem-about-global/)》的續章。

## 原題回顧

我們還是先回顧下原題吧。

```javascript
var a = 2;  
function foo(){  
    console.log(this.a);
}

foo();  
```

> 上題由我們親愛的[小龍](http://f2e.souche.com/blog/author/wang-xing-long/)童鞋發現並在我們的 901 羣裏提問的。

不過在上面一篇文章中，我們講的是在 REPL 和 `vm` 中有什麼事情，但是並沒有解釋爲什麼在文件模塊的載入形式下，`var` 並不會掛載到全局變量去。

其實原因很簡單，大家應該也都明白，在 Node.js 中，每個文件相當於是一個閉包，在 `require` 的時候被編譯包了起來。

但是具體是怎麼樣的呢？雖然網上也有很多答案，我還是決定在這裏按上一篇文章的尿性稍微解釋一下。

## 分析

首先我們還是回到上一篇文章的《Node REPL 啓動的沙箱》一節，裏面說了當啓動 Node.js 的時候是以 [src/node.js](https://github.com/nodejs/node/blob/dfee4e3712ac4673b5fc472a8f77ac65bdc65f87/src/node.js) 爲入口的。

如果以 REPL 爲途徑啓動的話是直接啓動一個 `vm`，而此時的所有根級變量都在最頂級的作用域下，所以一個 `var` 自然會綁定到 `global` 下面了。

而如果是以文件，即 `$ node foo.js` 形式啓動的話，它就會執行 src/node.js 裏面的另一坨條件分支了。

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

從上面的代碼看出，只要是以 `$ node foo.js` 形式啓動的，都會經歷 `startup.preloadModules()` 和 `Module.runMain()` 兩個函數。

### startup.preloadModules()

我們來看看[這個函數](https://github.com/nodejs/node/blob/dfee4e3712ac4673b5fc472a8f77ac65bdc65f87/src/node.js#L870)。

```javascript
startup.preloadModules = function() {
  if (process._preload_modules) {
    NativeModule.require('module')._preloadModules(process._preload_modules);
  }
};
```

實際上就是執行的 lib/module.js 裏面的 `_preloadModules` 函數，並且把這個 `process._preload_modules` 給傳進去。當然，前提是有這個 `process._preload_modules`。

#### process.\_preload_modules

這個 `process._preload_modules` 指的就是當你在使用 Node.js 的時候，命令行裏面的 `--require` 參數。

```
-r, --require         module to preload (option can be repeated)
```

代碼在 [src/node.cc](https://github.com/nodejs/node/blob/master/src/node.cc#L3306) 裏面可考。

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

如果遇到了 `--require` 這個參數，則對靜態變量 `local_preload_modules` 和 `preload_module_count` 做處理，把這個預加載模塊路徑加進去。

待到[要生成 `process` 這個變量的時候](https://github.com/nodejs/node/blob/master/src/node.cc#L2933)，再把預加載模塊的信息放到 `process._preload_modules` 裏面去。

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

最重要的就是這句

```cpp
READONLY_PROPERTY(process,
                  "_preload_modules",
                  array);
```

#### require('module')._preloadModules

上面我們講了這個 `process._preload_modules`，然後現在我們說說是如何把 `$ node --require bar.js foo.js` 給預加載進去的。

接下去我們就要移步到 lib/module.js 文件裏面去了。

在[第 496 行左右](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L496)的地方有這個函數。

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

大概我們能看到，就是以 `internal/preload` 爲 ID 的 Module 對象來載入這些預加載模塊。

```javascript
var parent = new Module('internal/preload', null);
requests.forEach(function(request) {
  parent.require(request);
});
```

根據這個函數的註釋說明，這個 Module 對象是一個虛擬的 Module 對象，主要是跟非預加載的那些模塊給隔離或者區別開來，並且提供一個模塊搜索路徑。

### Module.runMain()

看完上面的說明，我們接下去看看 `Module.runMain()` 函數。

這個函數還是位於 [lib/module.js](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L455)  文件裏面。

```javascript
Module.runMain = function() {
  // Load the main module--the command line argument.
  Module._load(process.argv[1], null, true);
  // Handle any nextTicks added in the first tick of the program
  process._tickCallback();
};
```

我們看到了就是在這句話中，Module 載入了 `process.argv[1]` 也就是文件名，自此一發不可收拾。

#### Module._load

這個函數相信很多人都知道它的用處了，無非就是載入文件，並加載到一個閉包裏面。

這樣一來在文件裏面 `var` 出來的變量就不在根作用域下面了，所以不會粘到 `global` 裏面去。它的 `this` 就是包起來的這個閉包了。

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

上面的代碼首先是根據傳入的文件名找到真的文件地址，就是所謂的搜索路徑了。比如 `require("foo")` 就會分別從 `node_modules` 路徑等依次查找下來。

我經常 Hack 這個 `_resolveFilename` 函數來簡化 `require` 函數，比如我希望我用 `require("controller/foo")` 就能直接拿到 ./src/controller/foo.js 文件。有興趣討論一下這個用法的童鞋可以轉到我的 [Gist](https://gist.github.com/XadillaX/bc0e7c92925de0647477) 上查看 Hack 的一個 Demo。

第二步就是我們常說的緩存了。如果這個模塊之前加載過，那麼在 `Module._cache` 下面會有個緩存，直接去取就是了。

第三步就是看看是不是 `NativeModule`。

```javascript
if (NativeModule.nonInternalExists(filename)) {
  debug('load native module %s', request);
  return NativeModule.require(filename);
}
```

##### NativeModule

之前的代碼裏面其實也沒少出現這個 `NativeModule`。那這個 `NativeModule` 到底是個 shenmegui 呢？

其實它還是在 Node.js 的入口 [src/node.js](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/src/node.js#L886) 裏面。

它主要用來加載 Node.js 的一些原生模塊，比如說 `NativeModule.require("child_process")` 等，也用於一些 `internal` 模塊的載入，比如 `NativeModule.require("internal/repl")`。

之前代碼的這個判斷就是說如果判斷要載入的文件是一個原生模塊，那麼就使用 `NativeModule.require` 來載入。

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

先看看是否是本身，再看看是否被緩存，然後看看是否合法。接下去就是填充 `process.moduleLoadList`，最後載入這個原生模塊、緩存、編譯並返回。

> 有興趣的同學可以在 Node.js 中輸出 `process.moduleLoadList` 看看。

這個 `compile` 很重要。

###### NativeModule.prototype.compile

在 `NativeModule` 編譯的過程中，大概的步驟是獲取代碼、包裹（Wrap）代碼，把包裹的代碼 `runInContext` 一遍得到包裹好的函數，然後執行一遍就算載入好了。

```javascript
NativeModule.prototype.compile = function() {
  var source = NativeModule.getSource(this.id);
  source = NativeModule.wrap(source);

  var fn = runInThisContext(source, { filename: this.filename });
  fn(this.exports, NativeModule.require, this, this.filename);

  this.loaded = true;
};
```

我們往這個 src/node.js 文件這個函數的上面幾行看一下，就知道包裹代碼是怎麼回事了。

```javascript
NativeModule.wrap = function(script) {
  return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
};

NativeModule.wrapper = [
  '(function (exports, require, module, __filename, __dirname) {\n',
  '\n});'
];
```

根據上面的代碼，我們能知道的就是比如我們一個內置模塊的代碼是：

```javascript
var foo = require("foo");
module.exports = 1;
```

那麼包裹好的代碼將會是這樣子的：

```javascript
(function (exports, require, module, __filename, __dirname) {
var foo = require("foo");
module.exports = 1;
});
```

這樣一看就明白了這些 `require`、`module`、`exports`、`__filename` 和 `__dirname` 是怎麼來了吧。

當我們通過 `var fn = runInThisContext(source, { filename: this.filename });` 得到了這個包裹好的函數之後，我們就把相應的參數傳進這個閉包函數去執行。

```javascript
fn(this.exports, NativeModule.require, this, this.filename);
```

這個 `this` 就是對應的這個 `module`，自然這個 `module` 裏面就有它的 `exports`；`require` 函數就是 `NativeModule.require`。

所以我們看到的在 `lib/*.js` 文件裏面的那些 `require` 函數，實際上就是包裹好之後的代碼的 `NativeModule.require` 了。

所以說實際上這些內置模塊內部的根作用域下的 `var` 再怎麼樣高級也都是在包裹好的閉包裏面 `var`，怎麼的也跟 `global` 搭不着邊。

###### 內部原生模塊

通過上面的追溯我們知道了，如果我們在代碼裏面使用 `require` 的話，會先看看這個模塊是不是原生模塊。

不過回過頭看一下它的這個判斷條件：

```javascript
if (NativeModule.nonInternalExists(filename)) {
  // ...
}
```

> 如果是原生模塊並且不是原生內部模塊的話。

那是怎麼區分原生模塊和內部原生模塊呢？

我們再來看看這個 `NativeModule.nonInternalExists(filename)` 函數。

```javascript
NativeModule.nonInternalExists = function(id) {
  return NativeModule.exists(id) && !NativeModule.isInternal(id);
};

NativeModule.isInternal = function(id) {
  return id.startsWith('internal/');
};
```

> 上面的代碼是去除各種雜七雜八的條件之後的一種情況，別的情況還請各位童鞋自行看 Node.js 源碼。

也就是說我們在我們自己的代碼裏面是請求不到 Node.js 源碼裏面 `lib/internal/*.js` 這些文件的——因爲它們被上面的這個條件分支給過濾了。（比如 `require("internal/module")` 在自己的代碼裏面是無法運行的）

> **注意：** 不過有一個例外，那就是 `require("internal/repl")`。詳情可以參考這個 [Issue](https://github.com/nodejs/node/issues/3393) 和[這段代碼](https://github.com/nodejs/node/blob/9148114c93861359a502801499d4c26d0b761174/lib/module.js#L276-L277)。

##### Module.prototype.load

解釋完了上面的 `NativeModule` 之後，我們要就上面 `Module._load` 裏面的下一步 `module.load` 也就是 `Module.prototype.load` 做解析了。

```javascript
Module.prototype.load = function(filename) {
  // ...

  var extension = path.extname(filename) || '.js';
  if (!Module._extensions[extension]) extension = '.js';
  Module._extensions[extension](this, filename);
  this.loaded = true;
};
```

做了一系列操作之後得到了真·文件名，然後判斷一下後綴。如果是 `".js"` 的話執行 `Module._extensions[".js"]` 這個函數去編譯代碼，如果是 `".json"` 則是 `Module._extensions[".json"]`。

這裏我們略過 JSON 和 C++ Addon，直奔 `Module._extensions[".js"]`。

```javascript
Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(internalModule.stripBOM(content), filename);
};
```

它也很簡單，就是奔着 `_compile` 去的。

###### Module.prototype._compile

先上[代碼](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L378-L426)。

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

感覺流程上跟 `NativeModule` 的編譯相似，不過這裏是事先準備好要在載入的文件裏面用的 `require` 函數，以及一些 `require` 的周邊。

接下去就是用 `Module.wrap` 來包裹代碼了，包裹完之後把得到的函數用參數 `self.exports, require, self, filename, dirname` 去執行一遍，就算是文件載入完畢了。

最後回到之前載入代碼的那一刻，把載入完畢得到的 `module.exports` 再 `return` 出去就好了。

###### Module.wrap

這個就不用說了。

在 lib/module.js 的[最頂端附近](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L46-L48)有這麼幾行代碼。

```javascript
Module.wrapper = NativeModule.wrapper;
Module.wrap = NativeModule.wrap;
Module._debug = util.debuglog('module');
```

一切豁然開朗了吧。

連 `NativeModule` 的代碼都逃不開被之前說的閉包所包裹，那麼你自己寫的 JS 文件當然也會被 `NativeModule.wrap` 所包裹。

那麼你在代碼根作用域申明的函數實際上在運行時裏面已經被一個閉包給包住了。

以前可能很多同學只知道是被閉包包住了，但是包的方法、流程今天算是解析了一遍了。

```javascript
(function (exports, require, module, __filename, __dirname) {
var a = 2;
function foo(){  
    console.log(this.a);
}

foo();
});
```

這個 `var a` 怎麼也不可能綁到 `global` 去啊。

###### Module.prototype.require

雖然我們上面講得差不多了，可能很多童鞋也厭煩了。

不過該講完的還是得講完。

我們在我們自己文件中用的 `require` 在上一節裏面有提到過，傳到我們閉包裏面的 `require` 實際上是長這樣的：

```javascript
function require(path) {
  return self.require(path);
}
```

所以實際上就是個 `Module.prototype.require`。

我們再看看[這個函數](https://github.com/nodejs/node/blob/e25f8683f1735f55a27c00d41691be286f50e13f/lib/module.js#L362-L366)。

```javascript
Module.prototype.require = function(path) {
  assert(path, 'missing path');
  assert(typeof path === 'string', 'path must be a string');
  return Module._load(path, this);
};
```

一下子又繞回到了我們一開始的 `Module._load`。

所以基本上就差不多到這過了。

## REPL vs 文件啓動

最後我們再點一下，或者說回顧一下吧。

REPL 啓動的時候 Node.js 是開了個 `vm` 直接讓你跑，並沒有把代碼包在一個閉包裏面，所以再根作用域下的變量會 `Biu` 一下貼到 `global` 中去。

而文件啓動的時候，會做本文中說的一系列事情，然後就會把各文件都包到一個閉包去，所以變量就無法通過這種方式來貼到 `global` 去了。

不過這種二義性會在 `"use strict";` 中戛然而止。

珍愛生命，`use strict`。

## 小結

本文可能很多童鞋看完後悔覺得很坑——JS 爲什麼有那麼多二義性那麼坑呢。

其實不然，主要是可能很多人對 Node.js 執行的機制不是很瞭解。

本文從小龍拋出的一個簡單問題進入，然後淺入淺出 Node.js 的一些執行機制什麼的，希望對大家還是有點幫助，更何況我在意的不是問題本身，而是分析的這個過程。

## 番外

> 以下均爲臆想。
>
> **小龍：** 喂喂喂，我就問一個簡單的小破題目，你至於嘛！
