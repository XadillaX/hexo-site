title: 让我们一起来起花名吧
date: 2016-02-24 13:40:36
tags: [ 阿里巴巴, 花名 ]
---

## 起因

起因是我一个叫『小龙』的好基友由于某些原因离职去了一家跟阿里一样有着『花名文化』的公司，于是开始为花名犯愁。

结合之前妹纸『弍纾』在起花名的时候也遇到了同样的困扰，于是决定用 Node.js 写个『一本正经乱起花名』的程序。

## 准备

### Chinese Random Name

首先起花名的原理就是胡乱随机一串字出来胡乱拼。

于是准备应该有 [chinese-random-name](https://github.com/XadillaX/chinese-random-name)，一个随机生成中文名的包。

使用它很简单，先把它 `require` 进来：

```js
const randomName = require("chinese-random-name");
```

#### 基本用法

如果你需要随机生成一个名字只需要 `randomName.generate()` 就可以了；如果你要随机一个姓那么就 `randomName.surnames.getOne()`；如果你只需要获得名字，这里面就有点门道了。

#### 高级用法

你可以随机生成一个名（不带姓的） `randomName.names.get()`；你也可以指定名字的字数，一二三：

```js
randomName.names.get1();
randomName.names.get2();
randomName.names.get3();
```

或者！

又或者！

然后或者！

你可以指定每个字的五行哦！

什么意思呢？比如你想给孩子起个名，然后孩子命里五行缺金，那么就可以：

```js
randomName.names.get2("金金");
```

然后你就可能得到一个『**紫铨**』，两个字都是属金的。那么如果你孩子姓李，就叫李紫铨；如果孩子姓王，就叫王紫铨；如果姓爱新觉罗，那么就叫爱新觉罗·紫铨。

有木有想给我装得这个逼打个 82 分呢？剩下的就交给 666 吧。(ง •̀_•́)ง

### Nomnom

这个包是用来解析命令行参数的。虽然市面上有挺多别的的，比如 [commander](https://www.npmjs.com/package/commander) 等，不过我还是最习惯 [nomnom](https://www.npmjs.com/package/nomnom)，用称手了就不想换了。

虽然它的 GitHub Repo 下面有这么一段话。

> Nomnom is deprecated. Check out https://github.com/tj/commander.js, which should have most, if not all of the capability that nomnom had. Thank you!

不过再怎么说 nomnom 也是当年 [substack](https://github.com/substack/node-optimist) 大神推荐的啊。(ಡωಡ)

### Colorful

这个包是用来上色的。

毕竟五行是有颜色的哇。

```javascript
const color = require("colorful");
console.log(color.red("（*/∇＼*）"));
```

那么在你的终端就好看到一个红色的 `（*/∇＼*）`。

### Is Chinese

用来判断是不是中文的包。

作为一个起名的命令行程序，你总得好好传参才行吧，总不能你随便传个咸鸭蛋🐣我也好好处理吧。

于是就用 [is-chinese](https://www.npmjs.com/package/is-chinese) 来判断某个字符串是不是纯中文。

这个包是由前阿里小伙伴，CNode 站长[唐少](https://github.com/alsotang)写的。

用起来也很简单，只要 `isChinese("什么你要判断什么")` 就可以了。

### 集合

```sh
$ npm install --save -d chinese-random-name
$ npm install --save -d nomnom
$ npm install --save -d colorful
$ npm install --save -d is-chinese
```

+ **chinese-random-name**: https://github.com/XadillaX/chinese-random-name
+ **nomnom**: https://github.com/harthur/nomnom
+ **colorful**: https://github.com/lepture/colorful
+ **is-chinese**: https://github.com/alsotang/is-chinese

## 开工

其结果在[这里](https://github.com/BoogeeDoo/hua)。

### 解析命令行参数

首先效果是这样的：

```sh
$ hua --help

Usage: hua [options]

Options:
-p PREFIX, --prefix PREFIX          to specify a prefix.
-s SUFFIX, --suffix SUFFIX          to specify a suffix.
-5 WUXING, --five-elements WUXING   the file elements (Wuxing) of huaming.
-c COUNT, --count COUNT             the count of huaming  [10]
```

使用者可以自己想一个前缀或者后缀，然后自定义（或者也可以不指定）两个字的五行，以及指定一次性生成多少个花名。

比如想要生成以 `龙` 字为前缀的花名，就可以 `$ hua --prefix 龙`，得到结果可以是这样的：

```sh
 * 龙幼
 * 龙巡
 * 龙躬
 * 龙仇
 * 龙锤
 * 龙镒
 * 龙拾
 * 龙央
 * 龙些
 * 龙悠
```

如果想两个字分别所属金和谁，就可以 `$ hua --five-elements 金水` 来起花名：

```sh
 * 倩娥
 * 雀效
 * 黍棓
 * 姹溶
 * 馨沙
 * 宫闲
 * 裕混
 * 俗封
 * 绸娥
 * 瑞淦
```

想要得到这样一个命令行参数，我们可以用 `nomnom` 来解决。

```javascript
var opts = require("nomnom")
    .script("hua")
    .option("prefix", {
        abbr: "p",
        help: "to specify a prefix.",
        metavar: "PREFIX"
    })
    .option("suffix", {
        abbr: "s",
        help: "to specify a suffix.",
        metavar: "SUFFIX"
    })
    .option("five-elements", {
        abbr: "5",
        help: "the file elements (Wuxing) of huaming.",
        metavar: "WUXING"
    })
    .option("count", {
        abbr: "c",
        help: "the count of huaming",
        metavar: "COUNT",
        default: 10
    })
    .parse();
```

上面的这段代码分别指定了脚本名为 `hua`，然后指定了 `prefix` / `suffix` / `five-elements` 和 `count` 四个参数，并把解析好的参数赋值给 `opts` 变量。

> 由于我希望这个包在通常的 Node.js 下都可以跑，所以没有用 `let` 之类的东西。

### 花名类

接下去要写一个花名类，这个类不只是可以在 CLI 之中使用，也可以让别人作为一个包来引入。然后实际上这个类就是要对 `chinese-random-name` 进行一个封装。

#### 构造函数

```js
var Hua = function(options) {
    this.options = options;

    // Do something...
};
```

首先这个 `options` 就是之前由 `nomnom` 解析出来的参数，当然有些参数是可选的。

接下去我们要在构造函数也就是 `Hua` 里面格式化前缀或者后缀（如果有的话），将他们弄成只有一个汉字的格式。

```javascript
if(options.prefix) {
    options.prefix = options.prefix[0];
    if(!isChinese(options.prefix)) delete options.prefix;
}

if(options.suffix) {
    options.suffix = options.suffix[0];
    if(!isChinese(options.suffix)) delete options.suffix;
}
```

前后缀弄好之后要对五行进行分析了。

如果有前后缀那么忽略五行参数。

```javascript
if(options.prefix && options.suffix) {
    delete options["file-elements"];
}
```

如果有前缀，那么忽略传进来的五行的第一个五行；如果有后缀那么忽略第二个字的五行。

```javascript
var wuxing = "金木水火土";

.
.
.

} else if(options.prefix) {
    options["five-elements"] = options["five-elements"].substr(1, 1);
    if(-1 === wuxing.indexOf(options["five-elements"])) {
        delete options["five-elements"];
    }
} else if(options.suffix) {
    options["five-elements"] = options["five-elements"].substr(0, 1);
    if(-1 === wuxing.indexOf(options["five-elements"])) {
        delete options["five-elements"];
    }
}
```

如果前后缀都没有，那么要格式化一下该参数，使其仅剩两个有效的五行汉字。

```javascript
} else {
    options["five-elements"] = options["five-elements"].substr(0, 2).split("");
    for(var i = 0; i < options["five-elements"].length; i++) {
        // 如果是无效五行或者冰没有这个字的话，随机一个五行出来
        if(-1 === wuxing.indexOf(options["five-elements"][i])) {
            options["five-elements"][i] = wuxing[Math.floor(Math.random() * 5)];
        }
    }

    // 字数不够，随机来凑
    while(options["five-elements"].length < 2) {
        options["five-elements"].push(wuxing[Math.floor(Math.random() * 5)]);
    }

    options["five-elements"] = options["five-elements"].join("");
}
```

以上的这些逻辑都写在构造函数里面，如果想要完整的构造函数可以看 `hua` 的 [hua.js](https://github.com/BoogeeDoo/hua/blob/09f1bc7eae14faaa9e881392d3811a6073d94b1c/lib/hua.js#L14-L55) 文件。

#### 生成一个花名

生成一个花名其实就是调用 `randomName.names.get` 系列函数们了。

+ **有前后缀：**直接返回前缀加后缀。
+ **有前缀：**返回前缀加 `get1`。
+ **有后缀：**返回 `get1` 加后缀。
+ **没有前后缀：**直接返回 `get2`。

> **注意：**以上情况都会传进（哪怕是 `undefined`）五行参数。

所以 `generateOne` 函数长[这样](https://github.com/BoogeeDoo/hua/blob/09f1bc7eae14faaa9e881392d3811a6073d94b1c/lib/hua.js#L67-L83)：

```javascript
Hua.prototype.generateOne = function() {
    if(this.options.prefix && this.options.suffix) {
        return this.options.prefix + this.options.suffix;
    }

    if(this.options.prefix) {
        debug(this.options["five-elements"]);
        return this.options.prefix + randomName.names.get1(this.options["five-elements"]);
    }

    if(this.options.suffix) {
        debug(this.options["five-elements"]);
        return randomName.names.get1(this.options["five-elements"]) + this.options.suffix;
    }

    return randomName.names.get2(this.options["five-elements"]);
};
```

#### 生成 Count 个花名

还记得 CLI 的 `count` 参数么？因为为了方便，我们可以批量生成花名，所以就需要生成 Count 个花名的函数了。

实际上就是一个循环调用 `generateOne` 的函数而已。

```javascript
Hua.prototype.generate = function(count) {
    if(!count) count = this.options.count || 10;

    var result = [];
    for(var i = 0; i < count; i++) {
        result.push(this.generateOne());
    }
    return result;
};
```

### CLI 文件

刚刚那个 `nomnom` 解析就在这个文件里面，然后接下去就是实例化一个 `Hua` 对象，然后生成 `count` 个花名。

```javascript
var hua = new Hua(opts);
var result = hua.generate();
```

最后把花名输出来就好了。

```javascript
for(var i = 0; i < result.length; i++) {
    console.log(" * " + result[i]);
}
```

#### 桥豆麻袋！

> 说好的五行颜色呢？！

好像是的哦，我们要在输出之前给 `result` 上个色儿。

遍历 `result` 里面的花名每个字，获取它的五行属性，然后涮上色儿。

`chinese-random-name` 暴露了字典中每个字的五行属性，只需要赋值一下就好了。

```javascript
var dict = require("chinese-random-name").names.dict;
```

然后逐一对比。最后对应金木水火土的颜色值分别为：

```javascript
var definedColors = [
    220, 83, 26, 197, 59
];
```

> 220 为黄色，代表金；83 为绿色，代表木；26 蓝色代表水；197 红色代表火；59 灰色代表土。
>
> 如果那个字无法找到属性，则不上色，保持默认。

```javascript
result = result.map(function(name) {
    var withColor = "";

    for(var i = 0; i < 2; i++) {
        for(var j = 0; j < wuxing.length; j++) {
            var wx = wuxing[j];
            if(wx === " ") {
                withColor += name[i];
                break;
            }

            if(dict[wx].indexOf(name[i]) !== -1) {
                var color = new Color(name[i]);
                color.fgcolor = definedColors[j];
                withColor += color.toString();
                break;
            }
        }
    }

    return withColor;
});
```

至此我们的 CLI 就写好了，最后别忘了在 [hua](https://github.com/BoogeeDoo/hua/blob/09f1bc7eae14faaa9e881392d3811a6073d94b1c/bin/hua) 这个 CLI 文件顶部加上一句话。

```bash
#!/usr/bin/env node
```

这代表到时候如果要 `./hua` 的时候这个脚本是用 Node.js 来跑的。

## 收拾

本来想好好写篇起花名的牢骚，结果不知不觉写成了给初心者看的初级教程了，泪目 ( •̥́ ˍ •̀ू )

不嫌弃的就这么看看吧。

最后这里给出我写好的这个 `hua` 程序。

```sh
$ [sudo] npm install -g huaming
```

然后就能在命令行下面跑了，跑法上面几章有介绍过。它的 Repo 在[这里](https://github.com/BoogeeDoo/hua)。

最后希望这个包在你们起花名的时候还真有那么一丢丢的用处。
