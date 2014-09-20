title       : 一起擼Node.JS（壹）——基本語法和類型
date        : 2013-08-16
category    : NodeJS
tags        : [ Node.js, JavaScript, 一起擼Node.JS ]
---

**Node.js** 的基礎是 **JavaScript** 這門 ***腳本語言***。而大多數的腳本語言一個共同的特點就是“[弱類型](http://zh.wikipedia.org/wiki/%E9%A1%9E%E5%9E%8B%E7%B3%BB%E7%B5%B1#.E5.BC.B7.E5.9E.8B.E5.88.A5.E5.92.8C.E5.BC.B1.E5.9E.8B.E5.88.A5)”。

　　不同於 **PHP** 的是，**PHP** 就是是有了新變量也無需申明，而 **JavaScript** 則還是需要 `var` 來申明一下的。而這個 `var` 涵蓋了 **C++** 中的`int`、`string`、`char`等一切類型的含義，甚至是 `function`。

　　本篇以及後篇的所有內容都是在 **Linux** 或者 **Cygwin** 下用 **vim** 進行編輯（若不是則請自行轉變成你自己的方法），然後在命令行下進行查看結果的。


<!-- 我是小小分割符 -->
## 基本語法

### 變量聲明

在 **C/C++** 中，我們這麼聲明變量的：

{% code c++ %}
void foo() {}

int a = 0;
char b = 'a';
float c = 1.0f;
void (*d)() = foo;  ///< 忘了是不是這麼寫的了，總之是函數指針
{% endcode %}

而在 **Node.js** 中則是這樣的：

{% code javascript %}
function foo() {}

var a = 0;
var b = 'a';
var c = 1.0;
var d = foo;
{% endcode %}

所以，無論是什麼類型的變量，在 **Node.js** 中都是以一個 `var` 來解決的。

### 循環語句

#### for...i

這個循環語句基本上跟 **C/C++** 一樣，都是

{% code c++ %}
for(int i = 0; i < foo; i++)
{
    //...
}
{% endcode %}

而鑑於 **Node.js** 是弱類型，所以只需要：

{% code javascript %}
for(var i = 0; i < foo; i++) {
    //...
}
{% endcode %}

#### for...in

這是一種後有型的循環語句，類似於 **PHP** 的 `foreach`。

比如我們有一個 **JSON對象** 如下：

{% code javascript %}
var foo = {
    "hello"     : "world",
    "node"      : "js",
    "blahblah"  : "bar"
};
{% endcode %}

這個時候我們就可以用 `for...in` 來循環遍歷了：

{% code javascript %}
for(var key in foo) {
    console.log(key + ": " + foo[key]);
}
{% endcode %}

我們如果在命令行中打入下面的命令：

{% code sh %}
$ node foo.js
{% endcode %}

屏幕上就會顯示下面的內容了：

{% code sh %}
hello: world
node: js
blahblah: bar
{% endcode %}

> **提示**：由上可知，`for...in` 語句是用來遍歷 **JSON對象**、**數組**、**對象**的鍵名的，而不提供鍵值的遍歷。如果要獲取鍵值，只能通過

{% code javascript %}
foo[<當前鍵名>]
{% endcode %}

的形式來獲取。這個跟 **PHP** 的 `foreach` 還是有一定區別的。

#### while...do, do...while

這個就不多做解釋了，跟其它語言沒什麼大的區別，無非就是如果有變量聲明的話，需要用 `var` 就夠了。

### 運算符

#### +, -, *, /

這幾個運算符也就這樣，要注意的是 `+`。它既可以作用於字符串，也可以作用於數值運算。弱類型語言雖然說類型是弱的，數字有時候可以以字符串的形態出現，字符串有時候可以用數值的形態出現，但是在必要的時候也還是要說一下它是什麼類型的，我們可以用下面的代碼去看看結果：

{% code javascript %}
var a = "1";
var b = 2;
console.log(a + b);
console.log(parseInt(a) + b);
{% endcode %}

> 這裏的 `parseInt` 是 **Node.js** 的一個內置函數，作用是將一個字符串解析成 `int` 類型的變量。

上面的代碼執行結果是

{% code sh %}
12
3
{% endcode %}

第一個 `console.log` 結果是 `12`，由於 `a` 是字符串，所以 `b` 也被系統以字符串的姿態進行加操作，結果就是將兩個字符串黏連在一起就變成了 `12`。而第二個 `console.log` 結果是 `3`，是因爲我們將第一個 `a` 轉變爲了 `int` 類型，兩個 `int` 型的變量相加即數值相加，結果當然就是 `3` 了。

#### ==, ===, !=, !==

這裏有一點要解釋，當這個邏輯運算符長度爲 `2` 的時候（`==`, `!=`），只是判斷外在的值是不是一樣的，而不會判斷類型。如

{% code javascript %}
var a = 1, b = "1";
console.log(a == b);
{% endcode %}

它輸出的結果就是 `true`。但是如果我們在中間判斷的時候再加上一個等號，那麼就是嚴格判斷了，需要類型和值都一樣的時候纔會是 `true`，否則就是 `false`。也就是說

{% code javascript %}
var a = 1, b = "1";
console.log(a === b);
{% endcode %}

的時候，返回的結果就是 `false` 了，因爲 `a` 是 `int` 型的，而 `b` 則是字符串。

> 順帶着就把條件語句講了吧，其實這裏的 `if` 跟別的語言沒什麼兩樣，就是幾個邏輯運算符兩個等號三個等號的問題。所以就不多做累述了。

#### typeof

這裏我姑且把它當成是一個運算符而不是函數了。

這個運算符的作用是判斷一個變量的類型，會返回一個字符串，即類型名，具體的執行下面的代碼就知道了：

{% code javascript %}
function foo() {}

var a = 0;
var b = '噓~蛋花湯在睡覺。';
var c = 1.0;
var d = foo;
var e = { "a" : a };
var f = [ 1, 2, 3 ];
var g = null;
var h = undefined;

console.log(typeof a);
console.log(typeof b);
console.log(typeof c);
console.log(typeof d);
console.log(typeof e);
console.log(typeof f);
console.log(typeof g);
console.log(typeof h);
{% endcode %}

這裏的執行結果就將會是：

{% code sh %}
number
string
number
function
object
object
object
undefined
{% endcode %}

### null, undefined, NaN

在 **JavaScript** 中，有三個特殊的值，如標題所示。其中第一個大家可能都比較熟悉吧，**C/C++** 裏面也有，不過是大寫的，其本質就是一個

{% code c++ %}
#define NULL 0
{% endcode %}

而在 **JavaScript** 中，這三個值所代表的意義都不同。

#### null

`null` 是一種特殊的 **object**，大致的意思就是空。比如說：

{% code javascript %}
var a = null;
{% endcode %}

大家都能看懂，就不多做解釋了。但是跟 **C/C++** 不同的是，這個 `null` 跟 `0` 不相等。

#### undefined

這個東西的意思就是說這個變量未聲明。爲了能夠更好地區分 `null`，我們的樣例代碼如下寫：

{% code javascript %}
var a = {
    "foo"       : null
};
console.log(a["foo"]);
console.log(a["bar"]);
{% endcode %}

上面的代碼中，我們讓 `a["foo"]` 的值爲空，即 `null`。而壓根沒有聲明 `a["bar"]` 這個東西，它連空都不是。輸出的結果大家都差不多應該猜到了：

{% code sh %}
null
undefined
{% endcode %}

#### NaN

這是一個空的數值，是一個特殊的 `number`。它的全稱是 `Not a Number`。有點奇怪，大家可以理解爲 **不是數字形態，或者數值出錯的 `number` 類型變量**。

多在浮點型數值運算錯誤（如被0除）的情況下出現，甚至可以是用戶自己讓一個變量等於 `NaN` 以便返回一個錯誤值讓大家知道這個函數運算出錯了云云。

### 小雜碎

其它剩餘的語句也跟已存在的其它語言差不多，比如說 `break` 啊、`switch` 啊、`continue` 啊等等等等。

## 變量類型

這一節主要講的是 **JavaScript** 對象，其它類型差不多一帶而過吧。

### 基礎類型

**Node.js** 包含的基礎類型差不多有如下幾個：

  + number
  + string
  + boolean
  + array

其中前三種類型可以直接賦值，而 `array` 的賦值只是一個引用賦值而已，在新變量中改變某個值的話舊變量的值也會改變，直接可以試試下面的代碼：

{% code javascript %}
var foo = [ 1, 2, 3 ];
var bar = foo;
bar[0] = 3;
console.log(foo);
{% endcode %}

它得出的結果是：

{% code sh %}
[ 3, 2, 3 ]
{% endcode %}

也就是說 `array` 要是複製出一個新的數組的話，不能用直接賦值的方法，而必須“**[深拷貝](#深拷貝)**”。

這裏有必要講一下 `array` 的三種創建方法。

第一種：

{% code javascript %}
var dog = new Array();
dog[0] = "噓~";
dog[1] = "蛋花湯";
dog[2] = "在睡覺";
{% endcode %}

第二種：

{% code javascript %}
var dog = new Array( "噓~", "蛋花湯", "在睡覺" );
{% endcode %}

第四種：

{% code javascript %}
var dog = [
    "噓~",
    "蛋花湯",
    "在睡覺"
];
{% endcode %}

我個人比較喜歡第三種寫法，比較簡潔。

### JSON對象

這裏我把 **JSON對象** 單獨拎出來而不是把它歸類爲 **JavaScript對象**，如果覺得我有點誤人子弟就可以直接跳過這一節了。

本人對於 **JSON對象** 和 **JavaScript** 對象的區分放在 **是否只用來存儲數據，而並非是一個類的實例化**。其實 **JSON** 的本質便是 **JavaScript Object Notation**。

> 更多有關 **[JSON](http://zh.wikipedia.org/wiki/JSON)** 的信息請自行百科。

在 **Node.js** 中聲明一個 **JSON對象** 非常簡單：

{% code javascript %}
var dog = {
    "pre"       : "噓~",
    "sub"       : {
        "name"  : "蛋花湯",
        "act"   : "在睡覺",
        "time"  : 12
    },

    "suf"       : [ "我說了", "它在睡覺", "就是在睡覺" ]
};
{% endcode %}

有兩種方式能得到 **JSON對象** 中的某個鍵名的鍵值，第一種是用點連接，第二種是用中括號：

{% code javascript %}
dog.pre;
dog["pre"];
{% endcode %}

> **試試看**：現在你自己動手試試看，用 `for...in` 的形式遍歷一遍上面的 `JSON對象`。別忘了用上 `typeof` 喵~

### 類（對象）的基礎

嚴格意義上來講，**Node.js** 的類不能算是類，其實它只是一個函數的集合體，加一些成員變量。它的本質其實是一個函數。

不過爲了通俗地講，我們接下去以及以後都將其稱爲“類”，實例化的叫“對象”。

因爲類有着很多 **函數** 的特性，或者說它的本質就是一個 **函數**，所以這裏面我們可能一不留神就順帶着把函數基礎給講了。

#### 類的聲明和實例化

聲明一個類非常簡單，大家不要笑：

{% code javascript %}
function foo() {
    //...
}
{% endcode %}

好了，我們已經寫好了一個 `foo` 類了。

> 真的假的？！真的。

不信？不信你可以接下去打一段代碼看看：

{% code javascript %}
var bar = new foo();
{% endcode %}

別看它是一個函數，如果以這樣的形式（`new`）寫出來，它就是這個類的實例化。

而這個所謂的 `foo()` 其實就是這個 `foo()` 類的構造函數。

#### 成員變量

成員變量有好兩種方法。

第一種就是在類的構造函數或者任何構造函數中使用 `this.<變量名>` 。你可以在任何時候聲明一個成員變量，在外部不影響使用，反正就算在還未聲明的時候使用它，也會有一個 `undefined` 來撐着。所以說這就是第一種方法：

{% code javascript %}
function foo() {
    this.hello = "world";
}
{% endcode %}

> **注意**：只有在加了 `this` 的時候纔是調用類的**成員變量**，否則只是函數內的一個局部變量而已。要分清楚有沒有 `this` 的時候變量的作用範圍。

第二種方法就是在構造函數或者任何成員函數外部聲明，其格式是 `<類名>.prototype.<變量名>`：

{% code javascript %}
function foo() {
    //...
}

foo.prototype.hello = "world";
{% endcode %}

無聊上面哪種方法都是對成員變量的聲明，我們可以看看效果：

{% code javascript %}
var bar = new foo();
console.log(bar.hello);
{% endcode %}

甚至你可以這麼修改這個類：

{% code javascript %}
function foo() {
    this.hello = "world";
}

foo.prototype.hello = "蛋花湯";
{% endcode %}

然後再用上面的代碼輸出。

> 想想看爲什麼輸出的還是 `world` 而不是 `蛋花湯`。

#### 構造函數

我們之前說過了這個 `foo()` 實際上是一個 **構造函數**。那麼顯然我們可以給構造函數傳參數，所以就有了下面的代碼：

{% code javascript %}
// 代碼2.1
function foo(hello) {
    if(hello === undefined) {
        this.hello = "world";
    } else {
        this.hello = hello;
    }
}
{% endcode %}

我們看到上面有一個奇葩的判斷 `if(hello === undefined)`，這個判斷有什麼用呢？第一種可能，就是開發者很蛋疼地特意傳進去一個 `undefined` 進去，這個時候它是 `undefined` 無可厚非。

還有一種情況。我們一開始就說了 **JavaScript** 是一門弱類型語言，其實不僅僅是弱類型，它的傳參數也非常不嚴謹。你可以多傳或者少傳（只要保證你多傳或者少傳的時候可以保證程序不出錯，或者邏輯不出錯），原則上都是可以的。多傳的參數會被自動忽略，而少傳的參數會以 `undefined` 補足。

看看下面的代碼就明白了：

{% code javascript %}
// 上接代碼2.1
var bar1 = new foo();
var bar2 = new foo("蛋花湯");
{% endcode %}

請自行輸出一下兩個 `bar` 的 `hello` 變量，會發現一個是 **world** 一個是 **蛋花湯**。顯而易見，我們的第一個 `bar1` 在聲明的時候，被 **Node.js** 自動看成了：

{% code javascript %}
var bar1 = new foo(undefined);
{% endcode %}

所以就有了它是 **world** 一說。

還有就是在這個構造函數中，我們看到了傳進去的參數是 `hello` 而這個類中本來就有個成員變量就是 `this.hello`。不過我們之前說過了有 `this` 和沒 `this` 的時候作用域不同，那個參數只是作用於構造函數中，而加了 `this` 的那個則是成員變量。用一個 `this` 就馬上區分開來他們了，所以即使同名也沒關係。

#### 成員函數

##### 成員函數聲明

成員函數的聲明跟成員變量的第二種聲明方法差不多，即 `<類名>.prototype.<函數名> = <函數>;`

{% code javascript %}
// 上接代碼2.1
function setHello(hello) {
    this.hello = hello;
}
foo.prototype.setHello = setHello;

bar1.setHello("雞蛋餅");
{% endcode %}

上面這段代碼顯而易見，我們實現了 `foo` 類的 `setHello` 函數，能通過它修改 `foo.hello` 的值。

但是這麼寫是不是有點麻煩？接下去我要講一個 **JavaScript** 函數重要的特性了。

#### ★ 匿名函數

很多時候我們的某些函數只在一個地方被引用或者調用，那麼我們爲這個函數起一個名字就太不值了，沒必要，所以我們可以臨時寫好這個函數，直接讓引用它的人引用它，調用它的人調用它。所以函數可以省略函數名，如：

{% code javascript %}
function(hello) {
    this.hello = hello;
}
{% endcode %}

至於怎麼引用或者調用呢？如果是上面的那個類需要引用的話，就是寫成這樣的：

{% code javascript %}
foo.prototype.setHello = function(hello) {
    this.hello = hello;
}
{% endcode %}

這樣的寫法跟 **[2.3.3.1. 成員函數聲明](#成員函數聲明)** 是一個效果的，而且省了很多的代碼量。而且實際上，基本上的類成員函數的聲明都是採用這種匿名函數的方式來聲明的。

至於說怎麼樣讓匿名函數被調用呢？這通常用於傳入一個只被某個函數調用的函數時這樣寫。

比如我們有一個函數的原型是：

{% code javascript %}
/**
 * 我們將傳入a，b兩個變量，
 * 在算出a+b的值後，交由func(num)
 * 去進行輸出
 */
function sumab(a, b, func) {
    var c = a + b;
    func(a, b, c);
}
{% endcode %}

比如我們有兩個版本的輸出函數，一個是中文輸出，一個是英文輸出，那麼如果不用匿名函數時候是這麼寫的：

{% code javascript %}
function zh(a, b, sum) {
    console.log(a + " + " + b + " 的值是：" + sum);
}

function en(a, b, sum) {
    console.log(a + " plus " + b + " is " + sum);
}

sumab(1, 2, zh);
sumab(3, 4, en);
{% endcode %}

執行一遍這段代碼，輸出的結果將會是：

{% code sh %}
1 + 2 的值是：3
3 plus 4 is 7
{% endcode %}

這樣的代碼如果採用匿名函數的形式則將會是：

{% code javascript %}
sumab(1, 2, function(a, b, sum) {
    console.log(a + " + " + b + " 的值是：" + sum);
});
sumab(3, 4, function(a, b, sum) {
    console.log(a + " plus " + b + " is " + sum);
});
{% endcode %}

這種形式通常使用於回調函數。回調機制算是 **Node.js** 或者說 **JavaScript** 的精髓。在以後的篇章會做介紹。

#### 成員函數聲明的匿名函數聲明方式

雖然上一節講過了，不過還是再講一遍吧。

通常我們聲明類的成員函數時候都是用匿名函數來聲明的，因爲反正那個函數也就是這個類的一個成員函數而已，不會在其它地方被單獨引用或者調用，所以就有了下面的代碼：

{% code javascript %}
// 上接代碼2.1
foo.prototype.setHello = function(hello) {
    this.hello = hello;
}
{% endcode %}

這樣我們就使得 `foo` 類有了 `setHello` 這個函數了。

#### 類的隨意性

這個又是我胡扯的。所謂類的隨意性即 **JavaScript** 中你可以在任何地方修改你的類，這跟 **Ruby** 有着一定的相似之處。

比如說 `string` ，它其實也是一個類，有着諸如 `length` 這樣的成員變量，也有 `indexOf`、`substr` 等成員函數。但是萬一我們覺得這個 `string` 有些地方不完善，想加自己的方法，那麼可以在你想要的地方給它增加一個函數，比如：

{% code javascript %}
String.prototype.sb = function() {
    var newstr = "";
    for(var i = 0; i < this.length; i++) {
        if(i % 2 === 0) newstr += "s";
        else newstr += "b";
    }

    return newstr;
};
{% endcode %}

這個函數的意思就是填充一個字符串，使其變成 `sb` 的化身。

我們來測試一下：

{% code javascript %}
var str = "噓~蛋花湯在睡覺。";
console.log(str.sb());
{% endcode %}

你將會得到這樣的結果：

{% code sh %}
sbsbsbsbs
{% endcode %}

> 你跟你的電腦說“噓~蛋花湯在睡覺。”，你的電腦會罵你四次半傻逼。（趕快砸了它）

## 附

### 深拷貝

所謂深拷貝就是自己新建一個數組或者對象，把源數組或者對象中的基礎類型變量值一個個手動拷過去，而不是隻把源數組或者對象的引用拿過來。所以這就涉及到了一個遞歸的調用什麼的。

下面是我實現的一個深拷貝函數，大家可以寫一個自己的然後加入到自己的 **Node.js** 知識庫中。

{% code javascript %}
function cloneObject(src) {
    var dest = {};
    for(var key in src) {
        if(typeof src === "object") dest[key] = cloneObject(src[key]);
        else dest[key] = src[key];
    }

    return dest;
}
{% endcode %}

### 系統默認對象參考手冊

  + **字符串**：[http://www.w3school.com.cn/js/jsref_obj_string.asp](http://www.w3school.com.cn/js/jsref_obj_string.asp)
  + **數字**: [http://www.w3school.com.cn/js/jsref_obj_number.asp](http://www.w3school.com.cn/js/jsref_obj_number.asp)
  + **數組**: [http://www.w3school.com.cn/js/jsref_obj_array.asp](http://www.w3school.com.cn/js/jsref_obj_array.asp)
  + **布爾**: [http://www.w3school.com.cn/js/jsref_obj_boolean.asp](http://www.w3school.com.cn/js/jsref_obj_boolean.asp)
  + **日期**: [http://www.w3school.com.cn/js/jsref_obj_date.asp](http://www.w3school.com.cn/js/jsref_obj_date.asp)
  + **數學庫**：[http://www.w3school.com.cn/js/jsref_obj_math.asp](http://www.w3school.com.cn/js/jsref_obj_math.asp)
