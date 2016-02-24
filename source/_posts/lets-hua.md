title: 讓我們一起來起花名吧
date: 2016-02-24 13:40:36
tags: [ 阿里巴巴, 花名 ]
---

## 起因

起因是我一個叫『小龍』的好基友由於某些原因離職去了一家跟阿里一樣有着『花名文化』的公司，於是開始爲花名犯愁。

結合之前妹紙『弍紓』在起花名的時候也遇到了同樣的困擾，於是決定用 Node.js 寫個『一本正經亂起花名』的程序。

## 準備

### Chinese Random Name

首先起花名的原理就是胡亂隨機一串字出來胡亂拼。

於是準備應該有 [chinese-random-name](https://github.com/XadillaX/chinese-random-name)，一個隨機生成中文名的包。

使用它很簡單，先把它 `require` 進來：

```js
const randomName = require("chinese-random-name");
```

#### 基本用法

如果你需要隨機生成一個名字只需要 `randomName.generate()` 就可以了；如果你要隨機一個姓那麼就 `randomName.surnames.getOne()`；如果你只需要獲得名字，這裏面就有點門道了。

#### 高級用法

你可以隨機生成一個名（不帶姓的） `randomName.names.get()`；你也可以指定名字的字數，一二三：

```js
randomName.names.get1();
randomName.names.get2();
randomName.names.get3();
```

或者！

又或者！

然後或者！

你可以指定每個字的五行哦！

什麼意思呢？比如你想給孩子起個名，然後孩子命裏五行缺金，那麼就可以：

```js
randomName.names.get2("金金");
```

然後你就可能得到一個『**紫銓**』，兩個字都是屬金的。那麼如果你孩子姓李，就叫李紫銓；如果孩子姓王，就叫王紫銓；如果姓愛新覺羅，那麼就叫愛新覺羅·紫銓。

有木有想給我裝得這個逼打個 82 分呢？剩下的就交給 666 吧。(ง •̀_•́)ง

### Nomnom

這個包是用來解析命令行參數的。雖然市面上有挺多別的的，比如 [commander](https://www.npmjs.com/package/commander) 等，不過我還是最習慣 [nomnom](https://www.npmjs.com/package/nomnom)，用稱手了就不想換了。

雖然它的 GitHub Repo 下面有這麼一段話。

> Nomnom is deprecated. Check out https://github.com/tj/commander.js, which should have most, if not all of the capability that nomnom had. Thank you!

不過再怎麼說 nomnom 也是當年 [substack](https://github.com/substack/node-optimist) 大神推薦的啊。(ಡωಡ)

### Colorful

這個包是用來上色的。

畢竟五行是有顏色的哇。

```javascript
const color = require("colorful");
console.log(color.red("（*/∇＼*）"));
```

那麼在你的終端就好看到一個紅色的 `（*/∇＼*）`。

### Is Chinese

用來判斷是不是中文的包。

作爲一個起名的命令行程序，你總得好好傳參才行吧，總不能你隨便傳個鹹鴨蛋🐣我也好好處理吧。

於是就用 [is-chinese](https://www.npmjs.com/package/is-chinese) 來判斷某個字符串是不是純中文。

這個包是由前阿里小夥伴，CNode 站長[唐少](https://github.com/alsotang)寫的。

用起來也很簡單，只要 `isChinese("什麼你要判斷什麼")` 就可以了。

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

## 開工

其結果在[這裏](https://github.com/BoogeeDoo/hua)。

### 解析命令行參數

首先效果是這樣的：

```sh
$ hua --help

Usage: hua [options]

Options:
-p PREFIX, --prefix PREFIX          to specify a prefix.
-s SUFFIX, --suffix SUFFIX          to specify a suffix.
-5 WUXING, --five-elements WUXING   the file elements (Wuxing) of huaming.
-c COUNT, --count COUNT             the count of huaming  [10]
```

使用者可以自己想一個前綴或者後綴，然後自定義（或者也可以不指定）兩個字的五行，以及指定一次性生成多少個花名。

比如想要生成以 `龍` 字爲前綴的花名，就可以 `$ hua --prefix 龍`，得到結果可以是這樣的：

```sh
 * 龍幼
 * 龍巡
 * 龍躬
 * 龍仇
 * 龍錘
 * 龍鎰
 * 龍拾
 * 龍央
 * 龍些
 * 龍悠
```

如果想兩個字分別所屬金和誰，就可以 `$ hua --five-elements 金水` 來起花名：

```sh
 * 倩娥
 * 雀效
 * 黍棓
 * 奼溶
 * 馨沙
 * 宮閒
 * 裕混
 * 俗封
 * 綢娥
 * 瑞淦
```

想要得到這樣一個命令行參數，我們可以用 `nomnom` 來解決。

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

上面的這段代碼分別指定了腳本名爲 `hua`，然後指定了 `prefix` / `suffix` / `five-elements` 和 `count` 四個參數，並把解析好的參數賦值給 `opts` 變量。

> 由於我希望這個包在通常的 Node.js 下都可以跑，所以沒有用 `let` 之類的東西。

### 花名類

接下去要寫一個花名類，這個類不只是可以在 CLI 之中使用，也可以讓別人作爲一個包來引入。然後實際上這個類就是要對 `chinese-random-name` 進行一個封裝。

#### 構造函數

```js
var Hua = function(options) {
    this.options = options;

    // Do something...
};
```

首先這個 `options` 就是之前由 `nomnom` 解析出來的參數，當然有些參數是可選的。

接下去我們要在構造函數也就是 `Hua` 裏面格式化前綴或者後綴（如果有的話），將他們弄成只有一個漢字的格式。

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

前後綴弄好之後要對五行進行分析了。

如果有前後綴那麼忽略五行參數。

```javascript
if(options.prefix && options.suffix) {
    delete options["file-elements"];
}
```

如果有前綴，那麼忽略傳進來的五行的第一個五行；如果有後綴那麼忽略第二個字的五行。

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

如果前後綴都沒有，那麼要格式化一下該參數，使其僅剩兩個有效的五行漢字。

```javascript
} else {
    options["five-elements"] = options["five-elements"].substr(0, 2).split("");
    for(var i = 0; i < options["five-elements"].length; i++) {
        // 如果是無效五行或者冰沒有這個字的話，隨機一個五行出來
        if(-1 === wuxing.indexOf(options["five-elements"][i])) {
            options["five-elements"][i] = wuxing[Math.floor(Math.random() * 5)];
        }
    }

    // 字數不夠，隨機來湊
    while(options["five-elements"].length < 2) {
        options["five-elements"].push(wuxing[Math.floor(Math.random() * 5)]);
    }

    options["five-elements"] = options["five-elements"].join("");
}
```

以上的這些邏輯都寫在構造函數裏面，如果想要完整的構造函數可以看 `hua` 的 [hua.js](https://github.com/BoogeeDoo/hua/blob/09f1bc7eae14faaa9e881392d3811a6073d94b1c/lib/hua.js#L14-L55) 文件。

#### 生成一個花名

生成一個花名其實就是調用 `randomName.names.get` 系列函數們了。

+ **有前後綴：**直接返回前綴加後綴。
+ **有前綴：**返回前綴加 `get1`。
+ **有後綴：**返回 `get1` 加後綴。
+ **沒有前後綴：**直接返回 `get2`。

> **注意：**以上情況都會傳進（哪怕是 `undefined`）五行參數。

所以 `generateOne` 函數長[這樣](https://github.com/BoogeeDoo/hua/blob/09f1bc7eae14faaa9e881392d3811a6073d94b1c/lib/hua.js#L67-L83)：

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

#### 生成 Count 個花名

還記得 CLI 的 `count` 參數麼？因爲爲了方便，我們可以批量生成花名，所以就需要生成 Count 個花名的函數了。

實際上就是一個循環調用 `generateOne` 的函數而已。

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

剛剛那個 `nomnom` 解析就在這個文件裏面，然後接下去就是實例化一個 `Hua` 對象，然後生成 `count` 個花名。

```javascript
var hua = new Hua(opts);
var result = hua.generate();
```

最後把花名輸出來就好了。

```javascript
for(var i = 0; i < result.length; i++) {
    console.log(" * " + result[i]);
}
```

#### 橋豆麻袋！

> 說好的五行顏色呢？！

好像是的哦，我們要在輸出之前給 `result` 上個色兒。

遍歷 `result` 裏面的花名每個字，獲取它的五行屬性，然後涮上色兒。

`chinese-random-name` 暴露了字典中每個字的五行屬性，只需要賦值一下就好了。

```javascript
var dict = require("chinese-random-name").names.dict;
```

然後逐一對比。最後對應金木水火土的顏色值分別爲：

```javascript
var definedColors = [
    220, 83, 26, 197, 59
];
```

> 220 爲黃色，代表金；83 爲綠色，代表木；26 藍色代表水；197 紅色代表火；59 灰色代表土。
>
> 如果那個字無法找到屬性，則不上色，保持默認。

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

至此我們的 CLI 就寫好了，最後別忘了在 [hua](https://github.com/BoogeeDoo/hua/blob/09f1bc7eae14faaa9e881392d3811a6073d94b1c/bin/hua) 這個 CLI 文件頂部加上一句話。

```bash
#!/usr/bin/env node
```

這代表到時候如果要 `./hua` 的時候這個腳本是用 Node.js 來跑的。

## 收拾

本來想好好寫篇起花名的牢騷，結果不知不覺寫成了給初心者看的初級教程了，淚目 ( •̥́ ˍ •̀ू )

不嫌棄的就這麼看看吧。

最後這裏給出我寫好的這個 `hua` 程序。

```sh
$ [sudo] npm install -g huaming
```

然後就能在命令行下面跑了，跑法上面幾章有介紹過。它的 Repo 在[這裏](https://github.com/BoogeeDoo/hua)。

最後希望這個包在你們起花名的時候還真有那麼一丟丟的用處。
