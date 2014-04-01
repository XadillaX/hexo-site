title: 让Node.js和C++一起搞基 —— 1
date: 2014-04-02 00:53:22
tags: [ Node.js, C++ ]
category: NodeJS
---

　　N久之前的一个坑——用 **Node.js** 来重构 NBUT 的 **Online Judge**，包括评测端也得重构一遍。（至于什么时候完成大家就不要关心了，(／‵Д′)／~ ╧╧

　　总之我们现在要做的其实简而言之就是——用C/C++来实现 **Node.js** 的模块。

## 准备工作

　　工欲善其事，必先~~耍流氓~~利其器。
  
### node-gyp

　　首先你需要一个 `node-gyp` 模块。

　　在任意角落，执行：

{% code shell %}
$ npm install node-gyp -g
{% endcode %}

　　在进行一系列的 `blahblah` 之后，你就安装好了。

### Python

　　然后你需要有个 `python` 环境。

　　自己去[官网](http://python.org/)搞一个来。

> **注意：** 根据 `node-gyp` 的[GitHub](https://github.com/TooTallNate/node-gyp#installation)显示，请务必保证你的 `python` 版本介于 `2.5.0` 和 `3.0.0` 之间。

### 编译环境

　　嘛嘛，我就偷懒点不细写了，还请自己移步到 [node-gyp](https://github.com/TooTallNate/node-gyp#installation) 去看编译器的需求。并且倒腾好。

## 入门

　　我就拿[官网的入门 Hello World](http://nodejs.org/api/addons.html#addons_hello_world)说事儿了。

### Hello World

　　请准备一个 `C++` 文件，比如就叫 ~~sb.cc~~ hello.cc。

　　然后我们一步步来，先往里面搞出头文件和定义好命名空间：

{% code cpp %}
#include <node.h>
#include <v8.h>
using namespace v8;
{% endcode %}

#### 主要函数

　　接下去我们写一个函数，其返回值是 `Handle<Value>`。

{% code cpp %}
Handle<Value> Hello(const Arguments& args)
{
    //... 嗷嗷待写
}
{% endcode %}

　　然后我来粗粗解析一下这些东西：

##### Handle&lt;Value>

　　做人要有节操，我事先申明我是从[这里](http://cnodejs.org/topic/4f16442ccae1f4aa270010c5)([@fool](http://cnodejs.org/user/fool))参考的。

> V8 里使用 Handle 类型来托管 JavaScript 对象，与 C++ 的 std::sharedpointer 类似，Handle 类型间的赋值均是直接传递对象引用，但不同的是，V8 使用自己的 GC 来管理对象生命周期，而不是智能指针常用的引用计数。
>
> JavaScript 类型在 C++ 中均有对应的自定义类型，如 String 、 Integer 、 Object 、 Date 、 Array 等，严格遵守在 JavaScript 中的继承关系。 C++ 中使用这些类型时，必须使用 Handle 托管，以使用 GC 来管理它们的生命周期，而不使用原生栈和堆。

　　而这个所谓的 **Value** ，从 V8 引擎的头文件 [v8.h](http://code.google.com/p/v8/source/browse/trunk/include/v8.h#1417) 中的各种继承关系中可以看出来，其实就是 JavaScript 中各种对象的基类。

　　在了解了这件事之后，我们大致能明白上面那段函数的申明的意思就是说，我们写一个 `Hello` 函数，其返回的是一个不定类型的值。

> **注意：** 我们只能返回特定的类型，即在 Handle 托管下的 String 啊 Integer 啊等等等等。

##### Arguments

　　这个就是传入这个函数的参数了。我们都知道在 `Node.js` 中，参数个数是乱来的。而这些参数传进去到 `C++` 中的时候，就转变成了这个 `Arguments` 类型的对象了。

　　具体的用法我们在后面再说，在这里只需要明白这个是个什么东西就好。（为毛要卖关子？因为 `Node.js` 官方文档中的[例子](https://github.com/rvagg/node-addon-examples)就是分开来讲的，我现在只是讲第一个 `Hello World` 的例子而已( ´థ౪థ）σ
  
#### 添砖加瓦

　　接下去我们就开始添砖加瓦了。就最简单的两句话：

{% code cpp %}
Handle<Value> Hello(const Arguments& args)
{
    HandleScope scope;
    return scope.Close(String::New("world"));
}
{% endcode %}

　　这两句话是什么意思呢？大致的意思就是返回一个 `Node.js` 中的字符串 `"world"`。

##### HandleScope

　　同参考自[这里](http://cnodejs.org/topic/4f16442ccae1f4aa270010c5)。

> Handle 的生命周期和 C++ 智能指针不同，并不是在 C++ 语义的 scope 内生存（即{} 包围的部分），而需要通过 HandleScope 手动指定。HandleScope 只能分配在栈上，HandleScope 对象声明后，其后建立的 Handle 都由 HandleScope 来管理生命周期，HandleScope 对象析构后，其管理的 Handle 将由 GC 判断是否回收。

　　所以呢，我们得在需要管理他的生命周期的时候申明这个 `Scope` 。好的，那么为什么我们的代码不这么写呢？

{% code cpp %}
Handle<Value> Hello(const Arguments& args)
{
    HandleScope scope;
    return String::New("world");
}
{% endcode %}

　　因为当函数返回时，`scope` 会被析构，其管理的Handle也都将被回收，所以这个 `String` 就会变得没有意义。

　　所以呢 V8 就想出了个神奇的点子——`HandleScope::Close(Handle<T> Value)` 函数！这个函数的用处就是关闭这个 Scope 并且把里面的参数转交给上一个 Scope 管理，也就是进入这个函数前的 Scope。

　　于是就有了我们之前的代码 `scope.Close(String::New("world"));`。

##### String::New

　　这个 `String` 类所对应的就是 `Node.js` 中原生的字符串类。继承自 `Value` 类。与此类似，还有：

+ Array
+ Integer
+ Boolean
+ Object
+ Date
+ Number
+ Function
+ ...

　　这些东西有些是继承自 `Value`，有些是二次继承。我们这里就不多做研究，自己可以看看 V8 的代码（至少是头文件）研究研究或者看看这个[手册](http://bespin.cz/~ondras/html/classv8_1_1Value.html#a70d4afaccc7903e6a01f40a46ad04188)。

　　而这个 `New` 呢？[这里](http://bespin.cz/~ondras/html/classv8_1_1String.html)可以看的。就是新建一个 `String` 对象。

　　至此，这个主要函数我们就解析完毕了。

#### 导出对象

　　我们来温习一下，如果是在 `Node.js` 里面写的话，我们怎么导出函数或者对象什么的呢？

{% code javascript %}
exports.hello = function() {}
{% endcode %}

　　那么，在 `C++` 中我们该如何做到这一步呢？

##### 初始化函数

　　首先，我们写个初始化函数：

{% code cpp %}
void init(Handle<Object> exports)
{
    //... 嗷嗷待写你妹啊！#ﾟÅﾟ）⊂彡☆))ﾟДﾟ)･∵
}
{% endcode %}

　　这是龟腚！函数名什么的无所谓，但是传入的参数一定是一个 `Handle&lt;Object>`，代表我们下面将要在这货上导出东西。

　　然后，我们就在这里面写上导出的东西了：

{% code cpp %}
void init(Handle<Object> exports)
{
    exports->Set(String::NewSymbol("hello"),
        FunctionTemplate::New(Hello)->GetFunction());
}
{% endcode %}

　　大致的意思就是说，为这个 `exports` 对象添加一个字段叫 `hello`，所对应的东西是一个[函数](http://bespin.cz/~ondras/html/classv8_1_1FunctionTemplate.html)，而这个函数就是我们亲爱的 `Hello` 函数了。

　　用伪代码写直白点就是：


{% code cpp %}
void init(Handle<Object> exports)
{
    exports.Set("hello", function hello);
}
{% endcode %}

　　大功告成！

　　（大功告成你妹啊！闭嘴( ‘д‘⊂彡☆))Д´)

##### 真·导出

　　这才是最后一步，我们最后要申明，这个就是导出的入口，所以我们在代码的末尾加上这一行：

{% code cpp %}
NODE_MODULE(hello, init)
{% endcode %}

　　纳了个尼？！这又是什么东西？

　　别着急，这个 `NODE_MODULE` 是一个宏，它的意思呢就是说我们采用 `init` 这个初始化函数来把要导出的东西导出到 `hello` 中。那么这个 `hello` 哪来呢？

　　**它来自文件名！**对，没错，它来自文件名。你并不需要事先申明它，你也不必担心不能用，总之你的这个最终编译好的二进制文件名叫什么，这里的 `hello` 你就填什么，当然要除去后缀名了。

　　详见[官方文档](http://nodejs.org/api/addons.html#addons_hello_world)。

> Note that all Node addons must export an initialization function:
> 
> {% code cpp %}
void Initialize (Handle<Object> exports);
NODE_MODULE(module_name, Initialize)
{% endcode %}
> There is no semi-colon after NODE_MODULE as it's not a function (see node.h).
>
> The module_name needs to match the filename of the final binary (minus the .node suffix).

### 编译 (๑•́ ₃ •̀๑)

　　来吧，让我们一起编译吧！

　　我们再新建一个类似于 `Makefile` 的归档文件吧——`binding.gyp`。

　　并且在里面添加这样的[代码](https://github.com/TooTallNate/node-gyp#the-bindinggyp-file)：

{% code json %}
{
  "targets": [
    {
      "target_name": "hello",
      "sources": [ "hello.cc" ]
    }
  ]
}
{% endcode %}

　　为什么这么写呢？可以参考 `node-gyp` 的[官方文档](http://code.google.com/p/gyp/wiki/GypUserDocumentation#Skeleton_of_a_typical_Chromium_.gyp_file)。

#### configure

　　在文件搞好之后，我们要在这个目录下面执行这个命令了：

{% code shell %}
$ node-gyp configure
{% endcode %}

　　如果一切正常的话，应该会生成一个 `build` 的目录，然后里面有相关文件，也许是 **M$ Visual Studio** 的 `vcxproj` 文件等，也许是 `Makefile` ，视平台而定。

#### build

　　`Makefile` 也生成好之后，我们就开始构造编译了：

{% code shell %}
$ node-gyp build
{% endcode %}

　　等到一切编译完成，才算是真正的大功告成了！不信你去看看 `build/Release` 目录，下面是不是有一个 `hello.node` 文件了？没错，这个就是 C++ 等下要给 Node.js 捡的肥皂！

### 搞基吧！Node ヽ(✿ﾟ▽ﾟ)ノ C++

　　我们在刚才那个目录下新建一个文件 `jianfeizao.js`：

{% code javascript %}
var addon = require("./build/Release/hello");
console.log(addon.hello());
{% endcode %}

　　看到没！看到没！出来了出来了！Node.js 和 C++ 搞基的结果！这个 `addon.hello()` 就是我们之前在 C++ 代码中写的 `Handle<Value> Hello(const Arguments& args)` 了，我们现在就已经把它返回的值给输出了。
  
## 洗洗睡吧，下节更深入

　　时间不早了，今天就写到这里了，至此为止大家都能搞出最基础的 **Hello world** 的 C++ 扩展了吧。下一次写的应该会更深入一点，至于下一次是什么时候，我也不知道啦其实。
　　（喂喂喂，撸主怎么可以这么不负责！(ｏﾟﾛﾟ)┌┛Σ(ﾉ´*ω*`)ﾉ