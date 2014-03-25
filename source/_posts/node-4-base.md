title       : 一起撸Node.JS（壹）——基本语法和类型
date        : 2013-08-16
category    : NodeJS
tags        : [ Node.js, JavaScript, 一起撸Node.JS ]
---

**Node.js** 的基础是 **JavaScript** 这门 ***脚本语言***。而大多数的脚本语言一个共同的特点就是“[弱类型](http://zh.wikipedia.org/wiki/%E9%A1%9E%E5%9E%8B%E7%B3%BB%E7%B5%B1#.E5.BC.B7.E5.9E.8B.E5.88.A5.E5.92.8C.E5.BC.B1.E5.9E.8B.E5.88.A5)”。

　　不同于 **PHP** 的是，**PHP** 就是是有了新变量也无需申明，而 **JavaScript** 则还是需要 `var` 来申明一下的。而这个 `var` 涵盖了 **C++** 中的`int`、`string`、`char`等一切类型的含义，甚至是 `function`。

　　本篇以及后篇的所有内容都是在 **Linux** 或者 **Cygwin** 下用 **vim** 进行编辑（若不是则请自行转变成你自己的方法），然后在命令行下进行查看结果的。


<!-- 我是小小分割符 -->
## 基本语法

### 变量声明

在 **C/C++** 中，我们这么声明变量的：

{% code c++ %}
void foo() {}

int a = 0;
char b = 'a';
float c = 1.0f;
void (*d)() = foo;  ///< 忘了是不是这么写的了，总之是函数指针
{% endcode %}

而在 **Node.js** 中则是这样的：

{% code javascript %}
function foo() {}

var a = 0;
var b = 'a';
var c = 1.0;
var d = foo;
{% endcode %}

所以，无论是什么类型的变量，在 **Node.js** 中都是以一个 `var` 来解决的。

### 循环语句

#### for...i

这个循环语句基本上跟 **C/C++** 一样，都是

{% code c++ %}
for(int i = 0; i < foo; i++)
{
    //...
}
{% endcode %}

而鉴于 **Node.js** 是弱类型，所以只需要：

{% code javascript %}
for(var i = 0; i < foo; i++) {
    //...
}
{% endcode %}

#### for...in

这是一种后有型的循环语句，类似于 **PHP** 的 `foreach`。

比如我们有一个 **JSON对象** 如下：

{% code javascript %}
var foo = {
    "hello"     : "world",
    "node"      : "js",
    "blahblah"  : "bar"
};
{% endcode %}

这个时候我们就可以用 `for...in` 来循环遍历了：

{% code javascript %}
for(var key in foo) {
    console.log(key + ": " + foo[key]);
}
{% endcode %}

我们如果在命令行中打入下面的命令：

{% code sh %}
$ node foo.js
{% endcode %}

屏幕上就会显示下面的内容了：

{% code sh %}
hello: world
node: js
blahblah: bar
{% endcode %}

> **提示**：由上可知，`for...in` 语句是用来遍历 **JSON对象**、**数组**、**对象**的键名的，而不提供键值的遍历。如果要获取键值，只能通过

{% code javascript %}
foo[<当前键名>]
{% endcode %}

的形式来获取。这个跟 **PHP** 的 `foreach` 还是有一定区别的。

#### while...do, do...while

这个就不多做解释了，跟其它语言没什么大的区别，无非就是如果有变量声明的话，需要用 `var` 就够了。

### 运算符

#### +, -, *, /

这几个运算符也就这样，要注意的是 `+`。它既可以作用于字符串，也可以作用于数值运算。弱类型语言虽然说类型是弱的，数字有时候可以以字符串的形态出现，字符串有时候可以用数值的形态出现，但是在必要的时候也还是要说一下它是什么类型的，我们可以用下面的代码去看看结果：

{% code javascript %}
var a = "1";
var b = 2;
console.log(a + b);
console.log(parseInt(a) + b);
{% endcode %}

> 这里的 `parseInt` 是 **Node.js** 的一个内置函数，作用是将一个字符串解析成 `int` 类型的变量。

上面的代码执行结果是

{% code sh %}
12
3
{% endcode %}

第一个 `console.log` 结果是 `12`，由于 `a` 是字符串，所以 `b` 也被系统以字符串的姿态进行加操作，结果就是将两个字符串黏连在一起就变成了 `12`。而第二个 `console.log` 结果是 `3`，是因为我们将第一个 `a` 转变为了 `int` 类型，两个 `int` 型的变量相加即数值相加，结果当然就是 `3` 了。

#### ==, ===, !=, !==

这里有一点要解释，当这个逻辑运算符长度为 `2` 的时候（`==`, `!=`），只是判断外在的值是不是一样的，而不会判断类型。如

{% code javascript %}
var a = 1, b = "1";
console.log(a == b);
{% endcode %}

它输出的结果就是 `true`。但是如果我们在中间判断的时候再加上一个等号，那么就是严格判断了，需要类型和值都一样的时候才会是 `true`，否则就是 `false`。也就是说

{% code javascript %}
var a = 1, b = "1";
console.log(a === b);
{% endcode %}

的时候，返回的结果就是 `false` 了，因为 `a` 是 `int` 型的，而 `b` 则是字符串。

> 顺带着就把条件语句讲了吧，其实这里的 `if` 跟别的语言没什么两样，就是几个逻辑运算符两个等号三个等号的问题。所以就不多做累述了。

#### typeof

这里我姑且把它当成是一个运算符而不是函数了。

这个运算符的作用是判断一个变量的类型，会返回一个字符串，即类型名，具体的执行下面的代码就知道了：

{% code javascript %}
function foo() {}

var a = 0;
var b = '嘘~蛋花汤在睡觉。';
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

这里的执行结果就将会是：

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

在 **JavaScript** 中，有三个特殊的值，如标题所示。其中第一个大家可能都比较熟悉吧，**C/C++** 里面也有，不过是大写的，其本质就是一个

{% code c++ %}
#define NULL 0
{% endcode %}

而在 **JavaScript** 中，这三个值所代表的意义都不同。

#### null

`null` 是一种特殊的 **object**，大致的意思就是空。比如说：

{% code javascript %}
var a = null;
{% endcode %}

大家都能看懂，就不多做解释了。但是跟 **C/C++** 不同的是，这个 `null` 跟 `0` 不相等。

#### undefined

这个东西的意思就是说这个变量未声明。为了能够更好地区分 `null`，我们的样例代码如下写：

{% code javascript %}
var a = {
    "foo"       : null
};
console.log(a["foo"]);
console.log(a["bar"]);
{% endcode %}

上面的代码中，我们让 `a["foo"]` 的值为空，即 `null`。而压根没有声明 `a["bar"]` 这个东西，它连空都不是。输出的结果大家都差不多应该猜到了：

{% code sh %}
null
undefined
{% endcode %}

#### NaN

这是一个空的数值，是一个特殊的 `number`。它的全称是 `Not a Number`。有点奇怪，大家可以理解为 **不是数字形态，或者数值出错的 `number` 类型变量**。

多在浮点型数值运算错误（如被0除）的情况下出现，甚至可以是用户自己让一个变量等于 `NaN` 以便返回一个错误值让大家知道这个函数运算出错了云云。

### 小杂碎

其它剩余的语句也跟已存在的其它语言差不多，比如说 `break` 啊、`switch` 啊、`continue` 啊等等等等。

## 变量类型

这一节主要讲的是 **JavaScript** 对象，其它类型差不多一带而过吧。

### 基础类型

**Node.js** 包含的基础类型差不多有如下几个：

  + number
  + string
  + boolean
  + array

其中前三种类型可以直接赋值，而 `array` 的赋值只是一个引用赋值而已，在新变量中改变某个值的话旧变量的值也会改变，直接可以试试下面的代码：

{% code javascript %}
var foo = [ 1, 2, 3 ];
var bar = foo;
bar[0] = 3;
console.log(foo);
{% endcode %}

它得出的结果是：

{% code sh %}
[ 3, 2, 3 ]
{% endcode %}

也就是说 `array` 要是复制出一个新的数组的话，不能用直接赋值的方法，而必须“**[深拷贝](#深拷贝)**”。

这里有必要讲一下 `array` 的三种创建方法。

第一种：

{% code javascript %}
var dog = new Array();
dog[0] = "嘘~";
dog[1] = "蛋花汤";
dog[2] = "在睡觉";
{% endcode %}

第二种：

{% code javascript %}
var dog = new Array( "嘘~", "蛋花汤", "在睡觉" );
{% endcode %}

第四种：

{% code javascript %}
var dog = [
    "嘘~",
    "蛋花汤",
    "在睡觉"
];
{% endcode %}

我个人比较喜欢第三种写法，比较简洁。

### JSON对象

这里我把 **JSON对象** 单独拎出来而不是把它归类为 **JavaScript对象**，如果觉得我有点误人子弟就可以直接跳过这一节了。

本人对于 **JSON对象** 和 **JavaScript** 对象的区分放在 **是否只用来存储数据，而并非是一个类的实例化**。其实 **JSON** 的本质便是 **JavaScript Object Notation**。

> 更多有关 **[JSON](http://zh.wikipedia.org/wiki/JSON)** 的信息请自行百科。

在 **Node.js** 中声明一个 **JSON对象** 非常简单：

{% code javascript %}
var dog = {
    "pre"       : "嘘~",
    "sub"       : {
        "name"  : "蛋花汤",
        "act"   : "在睡觉",
        "time"  : 12
    },

    "suf"       : [ "我说了", "它在睡觉", "就是在睡觉" ]
};
{% endcode %}

有两种方式能得到 **JSON对象** 中的某个键名的键值，第一种是用点连接，第二种是用中括号：

{% code javascript %}
dog.pre;
dog["pre"];
{% endcode %}

> **试试看**：现在你自己动手试试看，用 `for...in` 的形式遍历一遍上面的 `JSON对象`。别忘了用上 `typeof` 喵~

### 类（对象）的基础

严格意义上来讲，**Node.js** 的类不能算是类，其实它只是一个函数的集合体，加一些成员变量。它的本质其实是一个函数。

不过为了通俗地讲，我们接下去以及以后都将其称为“类”，实例化的叫“对象”。

因为类有着很多 **函数** 的特性，或者说它的本质就是一个 **函数**，所以这里面我们可能一不留神就顺带着把函数基础给讲了。

#### 类的声明和实例化

声明一个类非常简单，大家不要笑：

{% code javascript %}
function foo() {
    //...
}
{% endcode %}

好了，我们已经写好了一个 `foo` 类了。

> 真的假的？！真的。

不信？不信你可以接下去打一段代码看看：

{% code javascript %}
var bar = new foo();
{% endcode %}

别看它是一个函数，如果以这样的形式（`new`）写出来，它就是这个类的实例化。

而这个所谓的 `foo()` 其实就是这个 `foo()` 类的构造函数。

#### 成员变量

成员变量有好两种方法。

第一种就是在类的构造函数或者任何构造函数中使用 `this.<变量名>` 。你可以在任何时候声明一个成员变量，在外部不影响使用，反正就算在还未声明的时候使用它，也会有一个 `undefined` 来撑着。所以说这就是第一种方法：

{% code javascript %}
function foo() {
    this.hello = "world";
}
{% endcode %}

> **注意**：只有在加了 `this` 的时候才是调用类的**成员变量**，否则只是函数内的一个局部变量而已。要分清楚有没有 `this` 的时候变量的作用范围。

第二种方法就是在构造函数或者任何成员函数外部声明，其格式是 `<类名>.prototype.<变量名>`：

{% code javascript %}
function foo() {
    //...
}

foo.prototype.hello = "world";
{% endcode %}

无聊上面哪种方法都是对成员变量的声明，我们可以看看效果：

{% code javascript %}
var bar = new foo();
console.log(bar.hello);
{% endcode %}

甚至你可以这么修改这个类：

{% code javascript %}
function foo() {
    this.hello = "world";
}

foo.prototype.hello = "蛋花汤";
{% endcode %}

然后再用上面的代码输出。

> 想想看为什么输出的还是 `world` 而不是 `蛋花汤`。

#### 构造函数

我们之前说过了这个 `foo()` 实际上是一个 **构造函数**。那么显然我们可以给构造函数传参数，所以就有了下面的代码：

{% code javascript %}
// 代码2.1
function foo(hello) {
    if(hello === undefined) {
        this.hello = "world";
    } else {
        this.hello = hello;
    }
}
{% endcode %}

我们看到上面有一个奇葩的判断 `if(hello === undefined)`，这个判断有什么用呢？第一种可能，就是开发者很蛋疼地特意传进去一个 `undefined` 进去，这个时候它是 `undefined` 无可厚非。

还有一种情况。我们一开始就说了 **JavaScript** 是一门弱类型语言，其实不仅仅是弱类型，它的传参数也非常不严谨。你可以多传或者少传（只要保证你多传或者少传的时候可以保证程序不出错，或者逻辑不出错），原则上都是可以的。多传的参数会被自动忽略，而少传的参数会以 `undefined` 补足。

看看下面的代码就明白了：

{% code javascript %}
// 上接代码2.1
var bar1 = new foo();
var bar2 = new foo("蛋花汤");
{% endcode %}

请自行输出一下两个 `bar` 的 `hello` 变量，会发现一个是 **world** 一个是 **蛋花汤**。显而易见，我们的第一个 `bar1` 在声明的时候，被 **Node.js** 自动看成了：

{% code javascript %}
var bar1 = new foo(undefined);
{% endcode %}

所以就有了它是 **world** 一说。

还有就是在这个构造函数中，我们看到了传进去的参数是 `hello` 而这个类中本来就有个成员变量就是 `this.hello`。不过我们之前说过了有 `this` 和没 `this` 的时候作用域不同，那个参数只是作用于构造函数中，而加了 `this` 的那个则是成员变量。用一个 `this` 就马上区分开来他们了，所以即使同名也没关系。

#### 成员函数

##### 成员函数声明

成员函数的声明跟成员变量的第二种声明方法差不多，即 `<类名>.prototype.<函数名> = <函数>;`

{% code javascript %}
// 上接代码2.1
function setHello(hello) {
    this.hello = hello;
}
foo.prototype.setHello = setHello;

bar1.setHello("鸡蛋饼");
{% endcode %}

上面这段代码显而易见，我们实现了 `foo` 类的 `setHello` 函数，能通过它修改 `foo.hello` 的值。

但是这么写是不是有点麻烦？接下去我要讲一个 **JavaScript** 函数重要的特性了。

#### ★ 匿名函数

很多时候我们的某些函数只在一个地方被引用或者调用，那么我们为这个函数起一个名字就太不值了，没必要，所以我们可以临时写好这个函数，直接让引用它的人引用它，调用它的人调用它。所以函数可以省略函数名，如：

{% code javascript %}
function(hello) {
    this.hello = hello;
}
{% endcode %}

至于怎么引用或者调用呢？如果是上面的那个类需要引用的话，就是写成这样的：

{% code javascript %}
foo.prototype.setHello = function(hello) {
    this.hello = hello;
}
{% endcode %}

这样的写法跟 **[2.3.3.1. 成员函数声明](#成员函数声明)** 是一个效果的，而且省了很多的代码量。而且实际上，基本上的类成员函数的声明都是采用这种匿名函数的方式来声明的。

至于说怎么样让匿名函数被调用呢？这通常用于传入一个只被某个函数调用的函数时这样写。

比如我们有一个函数的原型是：

{% code javascript %}
/**
 * 我们将传入a，b两个变量，
 * 在算出a+b的值后，交由func(num)
 * 去进行输出
 */
function sumab(a, b, func) {
    var c = a + b;
    func(a, b, c);
}
{% endcode %}

比如我们有两个版本的输出函数，一个是中文输出，一个是英文输出，那么如果不用匿名函数时候是这么写的：

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

执行一遍这段代码，输出的结果将会是：

{% code sh %}
1 + 2 的值是：3
3 plus 4 is 7
{% endcode %}

这样的代码如果采用匿名函数的形式则将会是：

{% code javascript %}
sumab(1, 2, function(a, b, sum) {
    console.log(a + " + " + b + " 的值是：" + sum);
});
sumab(3, 4, function(a, b, sum) {
    console.log(a + " plus " + b + " is " + sum);
});
{% endcode %}

这种形式通常使用于回调函数。回调机制算是 **Node.js** 或者说 **JavaScript** 的精髓。在以后的篇章会做介绍。

#### 成员函数声明的匿名函数声明方式

虽然上一节讲过了，不过还是再讲一遍吧。

通常我们声明类的成员函数时候都是用匿名函数来声明的，因为反正那个函数也就是这个类的一个成员函数而已，不会在其它地方被单独引用或者调用，所以就有了下面的代码：

{% code javascript %}
// 上接代码2.1
foo.prototype.setHello = function(hello) {
    this.hello = hello;
}
{% endcode %}

这样我们就使得 `foo` 类有了 `setHello` 这个函数了。

#### 类的随意性

这个又是我胡扯的。所谓类的随意性即 **JavaScript** 中你可以在任何地方修改你的类，这跟 **Ruby** 有着一定的相似之处。

比如说 `string` ，它其实也是一个类，有着诸如 `length` 这样的成员变量，也有 `indexOf`、`substr` 等成员函数。但是万一我们觉得这个 `string` 有些地方不完善，想加自己的方法，那么可以在你想要的地方给它增加一个函数，比如：

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

这个函数的意思就是填充一个字符串，使其变成 `sb` 的化身。

我们来测试一下：

{% code javascript %}
var str = "嘘~蛋花汤在睡觉。";
console.log(str.sb());
{% endcode %}

你将会得到这样的结果：

{% code sh %}
sbsbsbsbs
{% endcode %}

> 你跟你的电脑说“嘘~蛋花汤在睡觉。”，你的电脑会骂你四次半傻逼。（赶快砸了它）

## 附

### 深拷贝

所谓深拷贝就是自己新建一个数组或者对象，把源数组或者对象中的基础类型变量值一个个手动拷过去，而不是只把源数组或者对象的引用拿过来。所以这就涉及到了一个递归的调用什么的。

下面是我实现的一个深拷贝函数，大家可以写一个自己的然后加入到自己的 **Node.js** 知识库中。

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

### 系统默认对象参考手册

  + **字符串**：[http://www.w3school.com.cn/js/jsref_obj_string.asp](http://www.w3school.com.cn/js/jsref_obj_string.asp)
  + **数字**: [http://www.w3school.com.cn/js/jsref_obj_number.asp](http://www.w3school.com.cn/js/jsref_obj_number.asp)
  + **数组**: [http://www.w3school.com.cn/js/jsref_obj_array.asp](http://www.w3school.com.cn/js/jsref_obj_array.asp)
  + **布尔**: [http://www.w3school.com.cn/js/jsref_obj_boolean.asp](http://www.w3school.com.cn/js/jsref_obj_boolean.asp)
  + **日期**: [http://www.w3school.com.cn/js/jsref_obj_date.asp](http://www.w3school.com.cn/js/jsref_obj_date.asp)
  + **数学库**：[http://www.w3school.com.cn/js/jsref_obj_math.asp](http://www.w3school.com.cn/js/jsref_obj_math.asp)
