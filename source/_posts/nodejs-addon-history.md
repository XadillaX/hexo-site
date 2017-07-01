title: 从暴力到 NAN 再到 NAPI——Node.js 原生模块开发方式变迁
date: 2017-07-01 15:55:08
tags: [ Node.js, NAPI, C++ ]
---

> 本文由我首发于 [GitChat](http://gitbook.cn/books/5938f4ae8b55d47644b7a445/index.html) 中。

## 前言

在 Node.js 开发领域中，原生 C++ 模块的开发一直是一个被人冷落的角落。但是实际上在必要的时候，用 C++ 进行 Node.js 的原生模块开发能有意想不到的好处。

+ 性能提升。很多情况下，使用 C++ 进行 Node.js 原生模块开发的性能会比纯 Node.js 开发要高，少数情况除外。
+ 开发成本节约。在一些即有的 C++ 代码上做封装，开发成本远远低于从零开始写 Node.js 代码。
+ Node.js 无法完成的工作。个别情况，开发者只能得到一个库的静态连接库或者动态链接库以及一堆 C++ 头文件，其余都是黑盒的，这种情况就不得不使用 C++ 进行模块开发了。

本文将从早期的 Node.js 开始，逐渐披露 Node.js 原生 C++ 模块开发方式的变迁。一直到最后，会比较详细地对 Node.js v8.x 新出的原生模块开发接口 N-API 做一次初步的尝试和解析，使得大家对 Node.js 原生 C++ 模块开发的固有印象（认为特别麻烦）有一个比较好的改观，让大家都来尝试一下 Node.js 原生 C++ 模块的开发。

## 不变应万变

虽然 Node.js 原生 C++ 模块开发方式有了很大的改变，但是有一些内容是不变的，至少到现在来说都是基本上没什么 Breaking 的变化。

### 原生模块本质

这就要从 Node.js 最本质的 C++ 模块开发讲起了。举个例子，我们在 Linux 下有一个合法的原生模块 **ons.node**，它其实是一个二进制文件，使用文本编辑器无法正常地看出什么鬼，直到我们遇到了二进制文件查看器。

![ons.node 二进制内容](http://images.gitbook.cn/81655b10-4cbe-11e7-920d-2570ff832158)

眼尖的同学会看到它的 Magic Number[^1] 是 `0x7F454C46`，其按位的 ASCII 码代表的字符串是 `ELF`。于是答案呼之欲出，这就是一个 Linux 下的动态链接库文件。

事实上，不只是在 Linux 中。当一个 Node.js 的 C++ 模块在 OSX 下编译会得到一个后缀是 **\*.node** 本质上是 **\*.dylib** 的动态链接库；而在 Windows 下则会得到一个后缀是 **\*.node** 本质上是 **\*.dll** 的动态链接库。

这么一个模块在 Node.js 中被 `require` 的时候，是通过 `process.dlopen()` 对其进行引入的。我们来看一下 Node.js v6.9.4 的 `DLOpen`[^2] 函数吧：

```cpp
void DLOpen(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);
  uv_lib_t lib;

  ...

  Local<Object> module = args[0]->ToObject(env->isolate());
  node::Utf8Value filename(env->isolate(), args[1]);

  // 使用 uv_dlopen 加载链接库
  const bool is_dlopen_error = uv_dlopen(*filename, &lib);
  node_module* const mp = modpending;
  modpending = nullptr;

  ...

  // 将加载的链接库句柄转移到 mp 上
  mp->nm_dso_handle = lib.handle;
  mp->nm_link = modlist_addon;
  modlist_addon = mp;

  Local<String> exports_string = env->exports_string();

  // exports_string 其实就是 `"exports"`
  // 这句的意思是 `exports = module.exports`
  Local<Object> exports = module->Get(exports_string)->ToObject(env->isolate());

  if (mp->nm_context_register_func != nullptr) {
    mp->nm_context_register_func(exports, module, env->context(), mp->nm_priv);
  } else if (mp->nm_register_func != nullptr) {
    mp->nm_register_func(exports, module, mp->nm_priv);
  } else {
    uv_dlclose(&lib);
    env->ThrowError("Module has no declared entry point.");
    return;
  }
}
```

按照逻辑来讲，这个加载过程其实就是下面这样的。

1. 通过 `uv_dlopen` 加载链接库。
2. 将加载的链接库挂到原生模块链表中去。
3. 通过 `mp->nm_register_func()` 初始化这个模块，并得到该有的 `module` 和 `module.exports`。

流程走下来就跟这个流程图差不多。

![DLOpen 流程图](http://images.gitbook.cn/4c391290-4cc0-11e7-be96-bb59812ba34f)

### node-gyp

这货是 Node.js 中编译原生模块用的。自从 Node.js v0.8 之后，它就跟 Node.js 黏上了，在此之前它的默认编译帮助包是 node-waf[^3]，对于老 Noder 来说应该不会陌生的。

#### GYP

node-gyp 是基于 GYP[^4] 的。它会识别包或者项目中的 **binding.gyp**[^5] 文件，然后根据该配置文件生成各系统下能进行编译的项目，如 Windows 下生成 Visual Studio 项目文件（**\*.sln** 等），Unix 下生成 Makefile。在生成这些项目文件之后，node-gyp 还能调用各系统的编译工具（如 GCC）来将项目进行编译，得到最后的动态链接库 **\*.node** 文件。

> 从上面的描述中大家可以看到，Windows 下编译 C++ 原生模块是依赖 Visual Studio 的，这就是为什么大家在安装一些 Node.js 包的时候会需要你事先安装好 Vusual Studio 了。
>
> 事实上，对于并没有 Visual Studio 需求的同学们来说，它不是必须的，毕竟 node-gyp 只依赖它的编译器，而不是 IDE。想要精简化安装的同学可以直接访问 http://landinghub.visualstudio.com/visual-cpp-build-tools 下载 Visual CPP Build Tools 安装，或者通过 `$ npm install --global --production windows-build-tools` 命令行的方式安装，就能得到你该得到的编译工具了。

说了那么多，让大家见识一下 **binding.gyp** 的基本结构吧。

```js
# binding.gyp

{
  "targets": [{
    "target_name": "addon1",
    "sources": [ "1/addon.cc", "1/myobject.cc" ]
  }, {
    "target_name": "addon2",
    "sources": [ "2/addon.cc", "2/myobject.cc" ]
  }, {
    "target_name": "addon3",
    "sources": [ "3/addon.cc", "3/myobject.cc" ]
  }, {
    "target_name": "addon4",
    "sources": [ "4/addon.cc", "4/myobject.cc" ]
  }]
}
```

这段配置讲述了这么一个故事：

+ 定义了 4 个 C++ 原生模块。
+ 每个模块的源码分别是 **\*/addon.cc** 和 **\*/myobject.cc**。
+ 4 个模块名分别是 **addon1** 至 **addon4**。
+ 隐藏故事：通过正规途径编译好后，这些模块存在于 **build/Release/addon\*.node** 中。

关于 GYP 配置文件的更多内容，大家可自行去官方文档观摩，在脚注中有 GYP 的链接。

#### 做的事情

node-gyp 除了自身是基于 GYP 的之外，它还做了一些额外的事情。首先，在我们编译一个 C++ 原生扩展的时候，它会去指定目录下（通常是 **~/.node-gyp** 目录下）搜我们当前 Node.js 版本的头文件和静态连接库文件，若不存在，它就会火急火燎跑去 Node.js 官网下载。

这是一个 Windows 下 node-gyp 下载的指定版本 Node.js 头文件和库文件的目录结构。

![Windows 下的 Node.js 头文件与库文件](http://images.gitbook.cn/fca37040-4cc4-11e7-920d-2570ff832158)

这个头文件目录会在 node-gyp 进行编译时，以 `"include_dirs"` 字段的形式合并进我们事先写好的 **binding.gyp** 中，总而言之，这里面的所有头文件能被直接 `#include <>`。

#### 子命令

node-gyp 是一个命令行的程序，在安装好后能通过 `$ node-gyp` 直接运行它。它有一些子命令供大家使用。

+ `$ node-gyp configure`：通过当前目录的 binding.gyp 生成项目文件，如 Makefile 等；
+ `$ node-gyp build`：将当前项目进行构建编译，前置操作必须先 `configure`；
+ `$ node-gyp clean`：清理生成的构建文件以及输出目录，说白了就是把目录清理了；
+ `$ node-gyp rebuild`：相当于依次执行了 `clean`、`configure` 和 `build`；
+ `$ node-gyp install`：手动下载当前版本的 Node.js 的头文件和库文件到对应目录。

## 时代在召唤

> 第 N 套国际 Node.js 开发者原生 C++ 模块开发方式，时代在召唤。

除去前文中讲的一些不变的内容，还有很多内容是一直在变化的，虽然说用老旧的开发方式也是可以开发出能用的 C++ 原生模块，但是旧不如新。

而且，其实目前来说 node-gyp 的地位也有可能在未来进行变化。因为当年 Chromium 是通过 GYP 来管理它的构建配置的，现如今已经步入了 GN[^6] 的殿堂，是否也意味着 node-gyp 有一天也会被可能叫做 node-gn 的东西给取代呢？

话不多说，先来看看沧海桑田的故事吧。

### 黑暗时代：node-waf

在 Node.js 0.8 之前，通常在开发 C++ 原生模块的时候，是通过 node-waf 构建的。当然彼 node-waf 不是现在在 NPM 仓库上能搜到的 node-waf 了，当年那个 node-waf 早就年久失修了。

这个东西使用一种叫 wscript 的文件来配置。自 Node.js 升上 0.8 之后，就自带了 node-gyp 的支持，从此就不再需要 wscript 了。

不过就是因为有这个青黄交接的时候，那段时间的各种使用 C++ 来开发 Node.js 原生扩展的包为了兼容 0.8 前后版本的 Node.js，通常都是 binding.gyp 和 wscript 共存的。

大家可以来看一下 **node-mysql-libmysqlclient** 这个包在当年相应时间段的时候的[仓库文件](https://github.com/Sannis/node-mysql-libmysqlclient/tree/9545ea7485fcc8b07b7c56c5ec3575938bfd4e5f)。为了支持 node-gyp，有一个 binding.gyp 文件，然后还存留着 wscript 配置文件。

### 封建时代：暴力！暴力！暴力！

在早期的时候，Node.js 原生 C++ 模块开发方式是非常暴力的，直接使用其提供的原生模块开发头文件。

开发者直接深入到 Node.js 的各种 API，以及 Google V8 的 API。

举个最简单的例子，在几年前，你的 Node.js C++ 原生扩展代码可能是长这样的。

```cpp
Handle<Value> Echo(const Arguments& args)
{
    HandleScope scope;

    if(args.Length() < 1)
    {
        ThrowException(
            Exception::TypeError(
                String::New("Wrong number of arguments.")));
        return scope.Close(Undefined());
    }

    return scope.Close(args[0]);
}

void Init(Handle<Object> exports)
{
    exports->Set(String::NewSymbol("echo"),
        FunctionTemplate::New(Echo)->GetFunction());
}
```

这是一个最简单的 `echo` 函数，返回传进来的参数。写作 JavaScript 相当于是这样的。

```js
exports.echo = function() {
    if(arguments.length < 1)
        throw new Error("Wrong number of arguments.");
    return arguments[0];
};
```

遗憾的是，这样的代码如果发成一个包，你现在是无论如何无法安装的，除非你用的是 0.10.x 的 Node.js 版本。

为什么这么说呢，这段代码的确是在 Node.js 0.10.x 的时候可以用的。但是再往上升 Google V8 的大版本，这段代码就无法适用了，讲粗暴点就是没办法再编译通过了。

就拿 Node.js 6.x 版本的 Google V8 来说，函数声明的对比是这样的：

```cpp
Handle<Value> Echo(const Arguments& args);    // 0.10.x
void Echo(FunctionCallbackInfo<Value>& args); // 6.x
```

事实上，根本不需要等到 6.x。上面的代码到 0.12 就已经无法再编译通过了。不只是函数声明的变化，连句柄作用域[^7]的声明方式都变了。

如果要让它在 Node.js 6.x 下能编译，就需要改代码，就像这样。

```cpp
void Echo(const FunctionCallbackInfo<Value>& args)
{
    Isolate* isolate = args.GetIsolate();
    if(args.Length() < 1)
    {
        isolate->ThrowException(
            Exception::TypeError(
                String::NewFromUtf8(isolate, "Wrong number of arguments.")));
        return;
    }

    args.GetReturnValue().Set(args[0]);
}

void Init(Local<Object> exports)
{
    NODE_SET_METHOD(exports, "echo", Echo);
}
```

也就是说，以黑暗时代的方式进行 Node.js 原生模块开发的时候，一个版本只能支持特定几个版本的 Node.js，一旦 Node.js 的底层 API 以及 Google V8 的 API 发生变化，而这些原生模块又依赖了变化了的 API 的话，包就作废了。除非包的维护者去支持新版的 API，不过这样依赖，老版 Node.js 下就又无法编译通过新版的包了。

这就很尴尬了。

### 城堡时代：Native Abstractions for Node.js

在经历了黑暗时代的尴尬局面之后，2013 年年中，一个救世主突然现世。

它的名字叫作 [NAN](https://github.com/nodejs/nan)，全称 Native Abstractions for Node.js，即 Node.js 原生模块抽象接口。

> NAN 由 [Rod Vagg](https://github.com/rvagg) 和 [Benjamin Byholm](https://github.com/kkoopa) 两手带大，记名在 GitHub 的 Rod Vagg 账号下。并且在 Node.js 与 io.js 黑历史的年代，这个在 GitHub 上面项目移到了 io.js 的组织下面；后来由于两家又重归于好，NAN 最终归属到了 [nodejs](https://github.com/nodejs) 这个组织下面。

总之在 NAN 出现之后，Node.js 的原生开发方式进入了城堡时代，并且一直持续到现在，甚至可能会持续到好久之后。

说 NAN 是 Node.js 原生模块抽象接口可能还是有点抽象，那么讲明白点，它就是一堆宏判断。比如声明一个函数的时候，只需要通过下面的一个宏就可以了：

```cpp
NAN_METHOD(Echo)
{
}
```

NAN 的宏会判断当前编译时候的 Node.js 版本，根据不同版本的 Node.js 来展开不同的结果。这会儿就又会提到先前的两个函数声明对比了。

```cpp
Handle<Value> Echo(const Arguments& args);    // 0.10.x
void Echo(FunctionCallbackInfo<Value>& args); // 6.x
```

`NAN_METHOD` 将会在不同版本的 Node.js 下被 NAN 展开成上面两个这样。

而且 NAN 可不只是提供了 `NAN_METHOD` 一个宏，它还有一坨一坨数不清的宏供开发者使用。

比如声明句柄作用域的 `Nan::HandleScope`、能黑盒调起 libuv[^8] 进行事件循环上的异步操作的 `Nan::AsyncWorker` 等。

于是，在城堡时代，大家的 C++ 原生模块代码都差不多长这样。

```cpp
NAN_METHOD(Echo)
{
    if(info.Length() < 1)
    {
        Nan::ThrowError("Wrong number of arguments.");
        return info.GetReturnValue().Set(Nan::Undefined());
    }

    info.GetReturnValue().Set(info[0]);
}

NAN_MODULE_INIT(InitAll)
{
    Nan::Set(
        target,
        Nan::New<String>("echo").ToLocalChecked(),
        Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Echo)).ToLocalChecked());
}
```

这样做的好处就是，代码只需要随着 NAN 的升级做改变就好，它会帮你兼容各不同 Node.js 版本，使其在任意版本都能被编译使用。

> 即使是 NAN 这样的好物，也有自己的一个使命，使命之外的东西会被逐渐剥离。比如 0.10.x 和 0.12.x 等版本就应该要退出历史舞台了，NAN 会逐渐放弃对它们的兼容和支持。

### 帝国时代：符合 ABI 的 N-API

自从前几天 Node.js v8.0.0 发布之后，Node.js 推出了全新的用于开发 C++ 原生模块的接口，N-API。

> 据官方文档所述，它的发音就是一个单独的 `N`，加上 API，即四个英文字母单独发音。

这东西相较于先前三个时代有什么不同呢？为什么会是更进一步的帝国时代呢？

首先，我们知道，即使是在 NAN 的开发方式下，一次编写好的代码在不同版本的 Node.js 下也需要重新编译，否则版本不符的话 Node.js 无法正常载入一个 C++ 扩展。即一次编写，到处编译。

而 N-API 相较于 NAPI 来说，它把 Node.js 的所有底层数据结构全部黑盒化，抽象成 N-API 当中的接口。

不同版本的 Node.js 使用同样的接口，这些接口是稳定地 ABI 化的，即应用二进制接口（Application Binary Interface）。这使得在不同 Node.js 下，只要 ABI 的版本号一致，编译好的 C++ 扩展就可以直接使用，而不需要重新编译。事实上，在支持 N-API 接口的 Node.js 中，的确就指定了当前 Node.js 所使用的 ABI 版本。

为了使得以后的 C++ 扩展开发、维护更方便，N-API 致力于以下的几个目标：

+ 以 C 的风格提供稳定 ABI 接口；
+ 消除 Node.js 版本的差异；
+ 消除 JavaScript 引擎的差异（如 Google V8、Microsoft ChakraCore 等）。

而这些 API 主要就是用来创建和操作 JavaScript 的值了，我们就再也不用直接使用 Google V8 提供的数据类型了。毕竟在 NAN 中，就算我们有时候看不到 Google V8 的影子，实际上在宏展开后还是无数的 Google V8 数据结构。

为了达成上述隐藏的目标，N-API 的姿势就变成了这样：

+ 提供头文件 **node_api.h**；
+ 任何 N-API 调用都返回一个 `napi_status` 枚举，来表示这次调用成功与否；
+ N-API 的返回值由于被 `napi_status` 占坑了，所以真实返回值由传入的参数来继承，如传入一个指针让函数操作；
+ 所有 JavaScript 数据类型都被黑盒类型 `napi_value` 封装，不再是类似于 `v8::Object`、`v8::Number` 等类型；
+ 如果函数调用不成功，可以通过 `napi_get_last_error_info` 函数来获取最后一次出错的信息。

> **注意：**哪怕是现在的 Node.js v8.x 版本，N-API 仍处于一个实验状态，个人认为还有非常长的一段路要走，所以大家在生产环境中还不必太过于激进，不过 N-API 依然是大势所趋；不过对于使用老版本的 Node.js 开发者来说，大家也不要着急，即使 N-API 是在 v8.x 才正式集成进 Node.js，在其它旧版本的 Node.js 中依然可以将 N-API 作为外挂式的头文件9中使用，只不过无法做到跨版本的特性，这只是它做的向后兼容的一个事情而已。

关于 N-API 一系列的函数可以访问它的[文档](https://nodejs.org/docs/v8.0.0/api/n-api.html)了解更多详情，现在我们来点料儿让大家对 N-API 的印象不是那么抽象。

#### 模块初始化

在封建时代和 NAN 所处的，模块的初始化是交给 Node.js 提供的宏来实现的。

```cpp
NODE_MODULE(addon, Init)
```

而到了当前的 N-API，它就变成了 N-API 的一个宏了。

```cpp
NAPI_MODULE(addon, Init)
```

相应地，这个初始化函数 `Init` 的写法也会有所改变。比如这是封建时代和 NAN 时代的两种不同写法：

```cpp
// 暴力写法
void Init(Local<Object> exports) {
    NODE_SET_METHOD(exports, "echo", Echo);
}

// NAN 写法
NAN_MODULE_INIT(Init)
{
    Nan::Set(
        target,
        Nan::New<String>("echo").ToLocalChecked(),
        Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Echo)).ToLocalChecked());
}
```

而到了 N-API 的时候，这个 `Init` 函数就该是这样的了。

```c
void Init(napi_env env, napi_value exports, napi_value module, void* priv)
{
    napi_status status;

    // 用于设置 exports 对象的描述结构体
    napi_property_descriptor desc =
        { "echo", 0, Echo, 0, 0, 0, napi_default, 0 };

    // 把 "echo" 设置到 exports 去
    status = napi_define_properties(env, exports, 1, &desc);
}
```

> `napi_property_descriptor` 是用于设置对象属性的描述结构体，它的声明如下：
>
> ```c
typedef struct {
  const char* utf8name;

  napi_callback method;
  napi_callback getter;
  napi_callback setter;
  napi_value value;

  napi_property_attributes attributes;
  void* data;
} napi_property_descriptor;
```
> 那么上面 `Init` 函数中的 `desc` 意思就是，即将被挂在的对象下会挂一个叫 `"echo"` 的东西，它的函数是 `Echo`，其它的 `getter`、`setter` 等全是空指针，而属性则是 `napi_default`。
>
> > `napi_property_attributes` 除了 `napi_default` 之外，还有诸如只读、是否可枚举等属性。

#### 函数声明

还记得之前的两种函数声明吗？第三次再搬过来。

```cpp
Handle<Value> Echo(const Arguments& args);    // 0.10.x
void Echo(FunctionCallbackInfo<Value>& args); // 6.x
```

在 N-API 中，你不用再被告知需要有 C++ 基础，C 即可。因为在 N-API 里面，声明一个 `Echo` 是这样的：

```c
napi_value Echo(napi_env env, napi_callback_info info)
{
    napi_status status;

    size_t argc = 1;
    napi_value argv[1];
    status = napi_get_cb_info(env, info, &argc, argv, 0, 0);
    if(status != napi_ok || argc < 1)
    {
        napi_throw_type_error(env, "Wrong number of arguments");
        return 0; // napi_value 实际上是一个指针，返回空指针表示无返回值
    }

    return argv[0];
}
```

> **重要：**目前 8.0.0 和 8.1.0 版本的 Node.js 官方文档中，关于 N-API 的各种接口文档错误颇多，所以还是要以能使用的接口为准。
> 
> 而且现在大家也有很多人正在帮忙一起修复文档。例如现在的 JavaScript 函数声明返回值其实是 `napi_value`，而官方文档上还是老旧的 `void`。又比如 ``napi_property_descriptor_desc` 结构体中，在 `utf8name` 之后还有一个 `napi_value` 的变量，而文档中却是没有的。
>
> 这也是为什么我前面强调目前来说 N-API 还处于试验阶段。毕竟 API 并没有完全稳定下来，还处于一个快速迭代的步伐中，文档的更新并未跟上代码的更新。至少在笔者写作的当前是这样的（现在日期 2017 年 6 月 9 日）。

上面代码分步解析。

+ 通过 `napi_get_cb_info` 获取当次函数请求的参数信息，包括参数数量和参数体（参数体以 `napi_value` 的数组形式体现）；
+ 看看解析有无出错（`status` 不等于 `napi_ok`）或者看看参数数量是否小于 1；
    - 若解析出错或者参数数量小于 1，通过 `napi_throw_type_error` 在 JavaScript 层抛出一个错误对象，并返回；
    - 若无错则继续进行；
+ 返回 `argv[0]`，即第一个参数。

#### Demo 完整代码

这里放上这个 Echo 样例的完整代码，大家可以拿回家试试看。

##### binding.gyp

```json
{
  "targets": [{
    "target_name": "addon",
    "sources": [ "addon.cc" ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.7"
    },
    "msvs_settings": {
      "VCCLCompilerTool": { "ExceptionHandling": 1 }
    }
  }]
}
```

##### addon.cc

```cpp
#include <node_api.h>

napi_value Echo(napi_env env, napi_callback_info info)
{
    napi_status status;

    size_t argc = 1;
    napi_value argv[1];
    status = napi_get_cb_info(env, info, &argc, argv, 0, 0);
    if(status != napi_ok || argc < 1)
    {
        napi_throw_type_error(env, "Wrong number of arguments");
        status = napi_get_undefined(env, argv);
    }

    return argv[0];
}

void Init(napi_env env, napi_value exports, napi_value module, void* priv)
{
    napi_status status;
    napi_property_descriptor desc =
        { "echo", 0, Echo, 0, 0, 0, napi_default, 0 };
    status = napi_define_properties(env, exports, 1, &desc);
}

NAPI_MODULE(addon, Init)
```

#### 乘风破浪

在完成了代码之后，大家赶紧试一下代码吧。

首先在 Node.js v8.x 下进行试验，把这两段代码分别放到同一个目录下，命名好后，执行这样的终端命令：

```sh
$ node-gyp rebuild
...
$ node --napi-modules
(node:52264) Warning: N-API is an experimental feature and could change at any time
> const addon = require("./build/Release/addon");
undefined
> addon.echo("2333");
'2333'
> addon.echo("蛋花汤🐶", "南瓜饼🐱");
'蛋花汤🐶'
> addon.echo();
TypeError: Wrong number of arguments
    at repl:1:7
    at ContextifyScript.Script.runInThisContext (vm.js:44:33)
    at REPLServer.defaultEval (repl.js:239:29)
    at bound (domain.js:301:14)
    at REPLServer.runBound [as eval] (domain.js:314:12)
    at REPLServer.onLine (repl.js:433:10)
    at emitOne (events.js:120:20)
    at REPLServer.emit (events.js:210:7)
    at REPLServer.Interface._onLine (readline.js:278:10)
    at REPLServer.Interface._line (readline.js:625:8)
```

> **注意：**还是因为试验特性，目前在 Node.js v8.x 要加载和执行 N-API 的 C++ 扩展的话，在启动 `node` 的时候需要加上 `--napi-modules` 参数，表示这次执行要启用 N-API 特性。

效果显而易见，在刚启动 Node.js REPL 的时候，你会得到一个警告。

> (node:52264) Warning: N-API is an experimental feature and could change at any time

表示它目前还不是特别稳定，但是值得我们展望未来。然后在我们 `require()` 扩展的时候，我们就得到了一个拥有 `echo` 函数的对象了。

我们尝试了三种调用方式。第一次是规规矩矩传入一个参数，`echo` 如期返回我们传入的参数 `"2333"`；第二次传入两个参数，`echo` 返回了第一个参数 `"蛋花汤🐶"`；最后一次我们没传任何参数，这个时候就走到了 C++ 扩展中判断函数参数数量失败的条件分支，就抛出了一个 `Wrong number of arguments` 的错误对象。

总之，它按照我们的预期跑起来了。并且代码里面并没有任何 Node.js 非 N-API 所暴露出来的数据结构和 V8 的数据结构——版本差异消除了。

接下来激动人心的时刻到了，如果读者是使用 `nvm` 来管理自己的 Node.js 版本的话，可以尝试着安装一个 8.1.0 的 Node.js 版本。

```sh
$ nvm install 8.1.0
```

在安装成功切换版本成功后，尝试着直接打开 Node.js RELP，忘掉再次编译刚才编译好的扩展这一步。（不过别忘了 `--napi-module` 参数）

把刚才用于测试的几句 JavaScript 代码再重复地输入——N-API 诚不我欺，居然还是能输出结果。这对于以前的暴力做法和 NAN 做法来说，无疑是非常大的一个进步。

#### 向下兼容

至此，我希望大家还没有忘记 N-API 是自 Node.js 8.0 之后出的特性。所以之前 Demo 的代码并不能在 Node.js 8.0 之前的版本如期编译和运行。

辛辛苦苦写好的包，居然不能在 Node.js 6.x 下面跑，搞什么。

![当时我就不乐意了](http://images.gitbook.cn/25ae5fa0-4cf6-11e7-92f5-09e07d17628a)

先别急着摔。文中之前也说了，有一个外挂式头文件的包，其包名是 `node-addon-api`。

我们就试着通过它来进行向下兼容吧。首先在我们刚才的源码目录把这个包给安装上。

```sh
$ npm install --save node-addon-api
```

> 还是由于快速迭代的原因，我不能保证这个包当前版本的时效性，不过我相信大家都有探索精神，在未来版本不符导致的 API 不符的问题应该都能解决。

然后，给我们的 **binding.gyp** 函数加点料，加两个字段，里面是两个指令展开。

```json
"include_dirs": [ "<!@(node -p \"require('node-addon-api').include\")" ],
"dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ]
```

`<!@` 和 `<!` 开头的字符串在 GYP 中代表指令，表示它的值是后面的指令的执行结果。上面两条指令的返回结果分别是外挂式头文件的头文件搜索路径，以及外挂式 N-API 这个包编译成静态连接库供我们自己的包使用的依赖声明。

有了这两个字段后，就表示我们依赖了外挂式 N-API 头文件。而且它内部自带判断，如果版本已经达到了有 N-API 的要求，它的依赖就会是一个空依赖，即不依赖外挂式 N-API 编译的静态连接库。

**也就是说，用了外挂式的 N-API，能自动适配 Node.js 8.x 和低版本。**

于是这个 **binding.gyp** 现在看起来是这样子的。

```json
{
  "targets": [{
    "target_name": "addon",
    "sources": [ "addon.cc" ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.7"
    },
    "msvs_settings": {
      "VCCLCompilerTool": { "ExceptionHandling": 1 }
    },
    "include_dirs": [ "<!@(node -p \"require('node-addon-api').include\")" ],
    "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ]
  }]
}
```

至于源码层面，我们就不需要作任何修改。在 Node.js v6.x 下面试试看吧。同样是使用 **node-gyp rebuild** 进行编译。然后通过 Node.js REPL 进去测试。

具体的终端输出这里就不放出来了，相信经过实验的大家都得到了自己想要的结果。

## 小结

本次内容主要讲解了在 Node.js 领域中原生 C++ 模块开发的方式变迁。

+ 从 node-waf 到 node-gyp，这是构建工具的一个变迁，未来说不定会是 GN 或者其它的构建工具。
+ 从暴力写码，到 NAN 的出现，见证了 Node.js 社区的各种爱恨情仇，一直到现在的新生儿 N-API，为原生 C++ 模块的开发输送了新鲜的血液。

目前的中坚力量仍然是 NAN 的开发方式，甚至我猜测是否未来有可能 NAN 会提供关于 N-API 的各种宏封装，使其彻底消除版本差异，包括 ABI 版本上的差异。当然这种 ABI 版本差异导致的需要多次编译问题应该还是存在的，这里指的是一次编码的差异。

在大家跟着本文对 N-API 进行了一次浅尝辄止的尝试之后，希望能对当下仍然处于实验状态的 N-API 充满了希冀，并对现在存在的各种坑处以包容的心态。

毕竟，Node.js loves you all。

## 参考资料

+ 「Consider moving from gyp to gn」：https://github.com/nodejs/node/issues/6089
+ 「Getting Started with Embedding · v8/v8 Wiki」：https://github.com/v8/v8/wiki/Getting-Started-with-Embedding
+ 「Drop support for v0.10 and v0.12?」：https://github.com/nodejs/nan/issues/676
+ 「Node Loves Rust」：https://cnodejs.org/topic/593353775b07c1b24afa0638
+ 「N-API | Node.js v8.0.0 Documentation」：https://nodejs.org/docs/v8.0.0/api/n-api.html
+ 「doc: fix out of date sections in n-api doc」：https://github.com/nodejs/node/pull/13508

[^1]: 用于定义某种文件类型的特殊标识，详见 https://en.wikipedia.org/wiki/Magic_number_(programming)
[^2]: 代码参见 https://github.com/nodejs/node/blob/v6.9.4/src/node.cc#L2427-L2502
[^3]: 年久失修，当前 NPM 上搜索到的 node-waf 已经不是当年的了，不过这个是 Waf 的官方仓库 https://github.com/waf-project/waf。
[^4]: 全称 Generate Your Projects，是谷歌开发的一套构建系统，未尽事宜详询 https://gyp.gsrc.io。
[^5]: GYP 的配置文件的后缀就是 *.gyp 或者 *.gypi 等，是个类 JSON 文件。
[^6]: GN 是谷歌开发的相较于 GYP 更新更快的一套构建工具，可以参考 https://chromium.googlesource.com/chromium/src/tools/gn/+/HEAD/docs/quick_start.md
[^7]: 让垃圾回收机制来管理 JavaScript 对象生命周期的一种类，即 HandleScope，在我的新书中将会有详解。
[^8]: Node.js 的异步事件循环支撑者，详询 http://www.libuv.org/
[^9]: 详情请查看 node-api 这个包，https://github.com/nodejs/node-api
