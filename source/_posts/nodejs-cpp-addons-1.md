title: 讓Node.js和C++一起搞基 —— 1
date: 2014-04-02 00:53:22
tags: [ Node.js, C++ ]
category: NodeJS
---

　　N久之前的一個坑——用 **Node.js** 來重構 NBUT 的 **Online Judge**，包括評測端也得重構一遍。（至於什麼時候完成大家就不要關心了，(／‵Д′)／~ ╧╧

　　總之我們現在要做的其實簡而言之就是——用C/C++來實現 **Node.js** 的模塊。

## 準備工作

　　工欲善其事，必先~~耍流氓~~利其器。
  
### node-gyp

　　首先你需要一個 `node-gyp` 模塊。

　　在任意角落，執行：

{% code shell %}
$ npm install node-gyp -g
{% endcode %}

　　在進行一系列的 `blahblah` 之後，你就安裝好了。

### Python

　　然後你需要有個 `python` 環境。

　　自己去[官網](http://python.org/)搞一個來。

> **注意：** 根據 `node-gyp` 的[GitHub](https://github.com/TooTallNate/node-gyp#installation)顯示，請務必保證你的 `python` 版本介於 `2.5.0` 和 `3.0.0` 之間。

### 編譯環境

　　嘛嘛，我就偷懶點不細寫了，還請自己移步到 [node-gyp](https://github.com/TooTallNate/node-gyp#installation) 去看編譯器的需求。並且倒騰好。

## 入門

　　我就拿[官網的入門 Hello World](http://nodejs.org/api/addons.html#addons_hello_world)說事兒了。

### Hello World

　　請準備一個 `C++` 文件，比如就叫 ~~sb.cc~~ hello.cc。

　　然後我們一步步來，先往裏面搞出頭文件和定義好命名空間：

{% code cpp %}
#include <node.h>
#include <v8.h>
using namespace v8;
{% endcode %}

#### 主要函數

　　接下去我們寫一個函數，其返回值是 `Handle<Value>`。

{% code cpp %}
Handle<Value> Hello(const Arguments& args)
{
    //... 嗷嗷待寫
}
{% endcode %}

　　然後我來粗粗解析一下這些東西：

##### Handle&lt;Value>

　　做人要有節操，我事先申明我是從[這裏](http://cnodejs.org/topic/4f16442ccae1f4aa270010c5)([@fool](http://cnodejs.org/user/fool))參考的。

> V8 裏使用 Handle 類型來託管 JavaScript 對象，與 C++ 的 std::sharedpointer 類似，Handle 類型間的賦值均是直接傳遞對象引用，但不同的是，V8 使用自己的 GC 來管理對象生命週期，而不是智能指針常用的引用計數。
>
> JavaScript 類型在 C++ 中均有對應的自定義類型，如 String 、 Integer 、 Object 、 Date 、 Array 等，嚴格遵守在 JavaScript 中的繼承關係。 C++ 中使用這些類型時，必須使用 Handle 託管，以使用 GC 來管理它們的生命週期，而不使用原生棧和堆。

　　而這個所謂的 **Value** ，從 V8 引擎的頭文件 [v8.h](http://code.google.com/p/v8/source/browse/trunk/include/v8.h#1417) 中的各種繼承關係中可以看出來，其實就是 JavaScript 中各種對象的基類。

　　在瞭解了這件事之後，我們大致能明白上面那段函數的申明的意思就是說，我們寫一個 `Hello` 函數，其返回的是一個不定類型的值。

> **注意：** 我們只能返回特定的類型，即在 Handle 託管下的 String 啊 Integer 啊等等等等。

##### Arguments

　　這個就是傳入這個函數的參數了。我們都知道在 `Node.js` 中，參數個數是亂來的。而這些參數傳進去到 `C++` 中的時候，就轉變成了這個 `Arguments` 類型的對象了。

　　具體的用法我們在後面再說，在這裏只需要明白這個是個什麼東西就好。（爲毛要賣關子？因爲 `Node.js` 官方文檔中的[例子](https://github.com/rvagg/node-addon-examples)就是分開來講的，我現在只是講第一個 `Hello World` 的例子而已( ´థ౪థ）σ
  
#### 添磚加瓦

　　接下去我們就開始添磚加瓦了。就最簡單的兩句話：

{% code cpp %}
Handle<Value> Hello(const Arguments& args)
{
    HandleScope scope;
    return scope.Close(String::New("world"));
}
{% endcode %}

　　這兩句話是什麼意思呢？大致的意思就是返回一個 `Node.js` 中的字符串 `"world"`。

##### HandleScope

　　同參考自[這裏](http://cnodejs.org/topic/4f16442ccae1f4aa270010c5)。

> Handle 的生命週期和 C++ 智能指針不同，並不是在 C++ 語義的 scope 內生存（即{} 包圍的部分），而需要通過 HandleScope 手動指定。HandleScope 只能分配在棧上，HandleScope 對象聲明後，其後建立的 Handle 都由 HandleScope 來管理生命週期，HandleScope 對象析構後，其管理的 Handle 將由 GC 判斷是否回收。

　　所以呢，我們得在需要管理他的生命週期的時候申明這個 `Scope` 。好的，那麼爲什麼我們的代碼不這麼寫呢？

{% code cpp %}
Handle<Value> Hello(const Arguments& args)
{
    HandleScope scope;
    return String::New("world");
}
{% endcode %}

　　因爲當函數返回時，`scope` 會被析構，其管理的Handle也都將被回收，所以這個 `String` 就會變得沒有意義。

　　所以呢 V8 就想出了個神奇的點子——`HandleScope::Close(Handle<T> Value)` 函數！這個函數的用處就是關閉這個 Scope 並且把裏面的參數轉交給上一個 Scope 管理，也就是進入這個函數前的 Scope。

　　於是就有了我們之前的代碼 `scope.Close(String::New("world"));`。

##### String::New

　　這個 `String` 類所對應的就是 `Node.js` 中原生的字符串類。繼承自 `Value` 類。與此類似，還有：

+ Array
+ Integer
+ Boolean
+ Object
+ Date
+ Number
+ Function
+ ...

　　這些東西有些是繼承自 `Value`，有些是二次繼承。我們這裏就不多做研究，自己可以看看 V8 的代碼（至少是頭文件）研究研究或者看看這個[手冊](http://bespin.cz/~ondras/html/classv8_1_1Value.html#a70d4afaccc7903e6a01f40a46ad04188)。

　　而這個 `New` 呢？[這裏](http://bespin.cz/~ondras/html/classv8_1_1String.html)可以看的。就是新建一個 `String` 對象。

　　至此，這個主要函數我們就解析完畢了。

#### 導出對象

　　我們來溫習一下，如果是在 `Node.js` 裏面寫的話，我們怎麼導出函數或者對象什麼的呢？

{% code javascript %}
exports.hello = function() {}
{% endcode %}

　　那麼，在 `C++` 中我們該如何做到這一步呢？

##### 初始化函數

　　首先，我們寫個初始化函數：

{% code cpp %}
void init(Handle<Object> exports)
{
    //... 嗷嗷待寫你妹啊！#ﾟÅﾟ）⊂彡☆))ﾟДﾟ)･∵
}
{% endcode %}

　　這是龜腚！函數名什麼的無所謂，但是傳入的參數一定是一個 `Handle&lt;Object>`，代表我們下面將要在這貨上導出東西。

　　然後，我們就在這裏面寫上導出的東西了：

{% code cpp %}
void init(Handle<Object> exports)
{
    exports->Set(String::NewSymbol("hello"),
        FunctionTemplate::New(Hello)->GetFunction());
}
{% endcode %}

　　大致的意思就是說，爲這個 `exports` 對象添加一個字段叫 `hello`，所對應的東西是一個[函數](http://bespin.cz/~ondras/html/classv8_1_1FunctionTemplate.html)，而這個函數就是我們親愛的 `Hello` 函數了。

　　用僞代碼寫直白點就是：


{% code cpp %}
void init(Handle<Object> exports)
{
    exports.Set("hello", function hello);
}
{% endcode %}

　　大功告成！

　　（大功告成你妹啊！閉嘴( ‘д‘⊂彡☆))Д´)

##### 真·導出

　　這纔是最後一步，我們最後要申明，這個就是導出的入口，所以我們在代碼的末尾加上這一行：

{% code cpp %}
NODE_MODULE(hello, init)
{% endcode %}

　　納了個尼？！這又是什麼東西？

　　彆着急，這個 `NODE_MODULE` 是一個宏，它的意思呢就是說我們採用 `init` 這個初始化函數來把要導出的東西導出到 `hello` 中。那麼這個 `hello` 哪來呢？

　　**它來自文件名！**對，沒錯，它來自文件名。你並不需要事先申明它，你也不必擔心不能用，總之你的這個最終編譯好的二進制文件名叫什麼，這裏的 `hello` 你就填什麼，當然要除去後綴名了。

　　詳見[官方文檔](http://nodejs.org/api/addons.html#addons_hello_world)。

> Note that all Node addons must export an initialization function:
> 
> {% code cpp %}
void Initialize (Handle<Object> exports);
NODE_MODULE(module_name, Initialize)
{% endcode %}
> There is no semi-colon after NODE_MODULE as it's not a function (see node.h).
>
> The module_name needs to match the filename of the final binary (minus the .node suffix).

### 編譯 (๑•́ ₃ •̀๑)

　　來吧，讓我們一起編譯吧！

　　我們再新建一個類似於 `Makefile` 的歸檔文件吧——`binding.gyp`。

　　並且在裏面添加這樣的[代碼](https://github.com/TooTallNate/node-gyp#the-bindinggyp-file)：

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

　　爲什麼這麼寫呢？可以參考 `node-gyp` 的[官方文檔](http://code.google.com/p/gyp/wiki/GypUserDocumentation#Skeleton_of_a_typical_Chromium_.gyp_file)。

#### configure

　　在文件搞好之後，我們要在這個目錄下面執行這個命令了：

{% code shell %}
$ node-gyp configure
{% endcode %}

　　如果一切正常的話，應該會生成一個 `build` 的目錄，然後裏面有相關文件，也許是 **M$ Visual Studio** 的 `vcxproj` 文件等，也許是 `Makefile` ，視平臺而定。

#### build

　　`Makefile` 也生成好之後，我們就開始構造編譯了：

{% code shell %}
$ node-gyp build
{% endcode %}

　　等到一切編譯完成，纔算是真正的大功告成了！不信你去看看 `build/Release` 目錄，下面是不是有一個 `hello.node` 文件了？沒錯，這個就是 C++ 等下要給 Node.js 撿的肥皂！

### 搞基吧！Node ヽ(✿ﾟ▽ﾟ)ノ C++

　　我們在剛纔那個目錄下新建一個文件 `jianfeizao.js`：

{% code javascript %}
var addon = require("./build/Release/hello");
console.log(addon.hello());
{% endcode %}

　　看到沒！看到沒！出來了出來了！Node.js 和 C++ 搞基的結果！這個 `addon.hello()` 就是我們之前在 C++ 代碼中寫的 `Handle<Value> Hello(const Arguments& args)` 了，我們現在就已經把它返回的值給輸出了。
  
## 洗洗睡吧，下節更深入

　　時間不早了，今天就寫到這裏了，至此爲止大家都能搞出最基礎的 **Hello world** 的 C++ 擴展了吧。下一次寫的應該會更深入一點，至於下一次是什麼時候，我也不知道啦其實。
　　（喂喂喂，擼主怎麼可以這麼不負責！(ｏﾟﾛﾟ)┌┛Σ(ﾉ´*ω*`)ﾉ