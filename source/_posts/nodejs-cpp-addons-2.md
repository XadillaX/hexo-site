title: 让Node.js和C++一起搞基 —— 2
date: 2014-04-03 22:37:15
tags: [ Node.js, C++ ]
category: NodeJS
---

　　好，今天让我们更深入地搞基吧！

　　首先请大家记住这个 V8 的在线手册——[http://izs.me/v8-docs/main.html](http://izs.me/v8-docs/main.html)。

　　还记得上次的 `building.gyp` 文件吗？

```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ]
    }
  ]
}
```

　　就像这样，举一反三，如果多几个 `*.cc` 文件的话就是这样的：

```json
"sources": [ "addon.cc", "myexample.cc" ]
```

　　上次我们把俩步骤分开了，实际上配置和编译可以放在一起的：

```sh
$ node-gyp configure build
```

　　复习完了吗？没？！

![啪](mama.jpg)

　　好的，那我们继续吧。

## 函数参数

　　现在我们终于要讲参数了呢。

　　让我们设想有这样一个函数 `add(a, b)` 代表把 `a` 和 `b` 相加返回结果，所以先把函数外框写好：

```cpp
#include <node.h>
using namespace v8;

Handle<Value> Add(const Arguments& args)
{
    HandleScope scope;

    //... 又来！
}
```

### Arguments

　　这个就是函数的参数了。我们不妨先看看 v8 的[官方手册参考](http://izs.me/v8-docs/classv8_1_1Arguments.html)。
  
+ `int Length() const`
+ `Local<Value> operator[](int i) const`

　　其它的我们咱不关心，这两个可重要了！一个代表传入函数的参数个数，另一个中括号就是通过下标索引来访问第 `n` 个参数的。

　　所以如上的需求，我们大致就可以理解为 `args.Length()` 为 `2`，`args[0]` 代表 `a` 以及 `args[1]` 代表 `b` 了。并且我们要判断这两个数的类型必须得是 `Number`。

　　注意到没，中括号的索引操作符返回结果是一个 `Local<Value>` 也就是 `Node.js` 的所有类型基类。所以传进来的参数类型不定的，我们必须得自己判断是什么参数。这就关系到了这个 `Value` 类型的一些[函数](http://izs.me/v8-docs/classv8_1_1Value.html)了。

+ `IsArray()`
+ `IsBoolean()`
+ `IsDate()`
+ `IsFunction()`
+ `IsInt32()`
+ `IsNativeError()`
+ `IsNull()`
+ `IsNumber()`
+ `IsRegExp()`
+ `IsString()`
+ ...

　　我就不一一列举了，剩下的自己看文档。｡:.ﾟヽ(*´∀`)ﾉﾟ.:｡

### ThrowException

　　这个是我们等下要用到的一个函数。具体在 [v8 文档](http://izs.me/v8-docs/namespacev8.html#a2469af0ac719d39f77f20cf68dd9200e)中可以找到。

　　顾名思义，就是抛出错误啦。执行这个语句之后，相当于在 `Node.js` 本地文件中执行了一条 `throw()` 语句一样。比如说：

```cpp
ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
```

　　就相当于执行了一条 `Node.js` 的：

```javascript
throw new TypeError("Wrong number of arguments");
```

### Undefined()

　　这个函数呢也在[文档](http://izs.me/v8-docs/namespacev8.html#ad39cfade81e77137fc11ff3a24284340)里面。

　　具体就是一个空值，因为有些函数并不需要返回什么具体的值，或者说没有返回值，这个时候就需要用 `Undefined()` 来代替了。

### 动手吧骚年！

　　在理解了以上的几个要点之后，我相信你们很快就能写出 `a + b` 的逻辑了，我就把 `Node.js` 官方手册的代码抄过来给你们过一遍就算完事了：

```cpp
#include <node.h>
using namespace v8;

Handle<Value> Add(const Arguments& args)
{
    HandleScope scope;
    
    // 代表了可以传入 2 个以上的参数，但实际上我们只用前两个
    if(args.Length() < 2)
    {
        // 抛出错误
        ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
        
        // 返回空值
        return scope.Close(Undefined());
    }
    
    // 若前两个参数其中一个不是数字的话
    if(!args[0]->IsNumber() || !args[1]->IsNumber())
    {
        // 抛出错误并返回空值
        ThrowException(Exception::TypeError(String::New("Wrong arguments")));
        return scope.Close(Undefined());
    }
    
    // 具体参考 v8 文档
    //     http://izs.me/v8-docs/classv8_1_1Value.html#a6eac2b07dced58f1761bbfd53bf0e366)
    // 的 `NumberValue` 函数
    Local<Number> num = Number::New(args[0]->NumberValue() + args[1]->NumberValue());
    
    return scope.Close(num);
}
```

　　函数大功告成！

　　最后把尾部的导出函数给写好就 OK 了。

```cpp
void Init(Handle<Object> exports)
{
    exports->Set(String::NewSymbol("add"),
        FunctionTemplate::New(Add)->GetFunction());
}

NODE_MODULE(addon, Init)
```

　　等你编译好之后，我们就能这样用了：

```javascript
var addon = require('./build/Release/addon');
console.log(addon.add(1, 1) + "b");
```

　　你会看到一个 `2b` ！✧*｡٩(ˊᗜˋ*)و✧*｡
  
## 回调函数

　　上一章我们只讲了个 `Hello world`，这一章阿婆主就良心发现一下，再来个回调函数的写法。

　　惯例我们先写好框架：

```cpp
#include <node.h>
using namespace v8;

Handle<Value> RunCallback(const Arguments& args)
{
  HandleScope scope;

  // ... 噼里啪啦噼里啪啦

  return scope.Close(Undefined());
}
```

　　然后我们决定它的用法是这样的：

```javascript
func(function(msg) {
    console.log(msg);
});
```

　　即它会给回调函数传入一个参数，我们设想它是一个字符串，然后我们可以 `console.log()` 出来看。

### 首先你要有一个字符串系列

　　废话不多说，先给它一个字符串喂饱了再说吧。_(√ ζ ε:)_

　　不过我们得让这个字符串是通用类型的，因为 `Node.js` 代码是弱类型的。

```cpp
Local<Value>::New(String::New("hello world"));
```

　　什么？你问我什么是 `Local<Value>`？

　　那我稍稍讲一下吧，参考自[这里](http://cnodejs.org/topic/4f16442ccae1f4aa270010c5)和[V8参考文档](http://izs.me/v8-docs/classv8_1_1Local.html)。

　　如文档所示，`Local<T>` 实际上继承自 `Handle<T>`，我记得[上一章](/2014/04/02/nodejs-cpp-addons-1/#Handle<Value>)已经讲过 `Handle<T>` 这个东西了。

　　然后下面就是讲 Local 了。

> Handle 有两种类型， Local Handle 和 Persistent Handle ，类型分别是 `Local<T> : Handle<T>` 和 `Persistent<T> : Handle<T>` ，前者和 `Handle<T>` 没有区别生存周期都在 scope 内。而后者的生命周期脱离 scope ，你需要手动调用 `Persistent::Dispose` 结束其生命周期。也就是说 Local Handle 相当于在 C++`在栈上分配对象而 Persistent Handle 相当于 C++ 在堆上分配对象。

### 然后你要有个参数表系列

　　终端命令行调用 C/C++ 之后怎么取命令行参数？

```cpp
#include <stdio.h>

void main(int argc, char* argv[])
{
    // ...
}
```

　　对了，这里的 `argc` 就是命令行参数个数，`argv[]` 就是各个参数了。那么调用 `Node.js` 的回调函数，`v8` 也采用了类似的[方法](http://izs.me/v8-docs/classv8_1_1Function.html#ac61877494d2d8bb81fcef96003ec4059)：

```cpp
V8EXPORT Local<Value> v8::Function::Call(Handle<Object>recv,
    int argc,
    Handle<Value> argv[]
);
```

> QAQ 卡在了 `Handle<Object>recv` 了！！！明天继续写。