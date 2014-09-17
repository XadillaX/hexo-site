title: 图片主题色提取算法小结
date: 2014-09-17 11:34:54
tags: [ Algorithm, Theme Color ]
---

> 所谓主题色提取，就是对于一张图片，近似地提取出一个调色板，使得调色板里面的颜色能组成这张图片的主色调。

　　以上定义为我个人胡诌的。

　　大家不要太把我的东西当成严谨的文章来看，很多东西什么的都是我用我自己的理解去做，并没有做多少考证。

　　解析中都会以 Node.js 来写一些小 Demo。

## 引子

　　写该文章主要是为了对我这几天对于『主题色提取』算法研究进行一个小结。

　　花瓣网需要做一件事，就是把图片的主题色提取出来加入到花瓣网搜索引擎的索引当中，以供用户搜索。

　　于是有了一个需求：提取出图片中在某个规定调色板中的颜色，加入到搜索引擎。

　　接下去就开始解析两种不同的算法以及在这种业务场景当中的应用。

## 算法解析

### ~~魔法数字法~~

　　这个算法大家可以忽略，可能是我使用的姿势不对，总之提取出来（也许它根本就不是这么用的）的东西错误很大。

　　不过看一下也好开阔下眼界，尤其是我这种想做游戏又不小心掉进互联网的坑里的蒟蒻来说。

　　首先该算法我是从[这里](http://dev.gameres.com/Program/Visual/Other/256color.htm)找到的。想当年我还是经常逛 [GameRes](http://www.gameres.com/) 的。ヾ(;ﾟ;Д;ﾟ;)ﾉﾞ

　　然后辗转反侧最终发现这段代码是提取自 [Allegro](https://github.com/liballeg/allegro5/blob/4.3/src/color.c#L268-L328) 游戏引擎。

　　具体我也就不讲了，毕竟找不到资料，只是粗粗瞄了眼代码里面有几个魔法数字（在游戏和算法领域魔法数字倒是非常常见的），也没时间深入解读这段代码。

　　我把它翻译成了 Node.js，然后放在了 [Demo](https://github.com/XadillaX/theme-color-test/blob/master/version1/magicnumber.js) 当中。大家有兴趣可以自己去看看。

### 八叉树提取法

　　这个算法在颜色量化中比较常见的。

> 该算法最早见于 1988 年，***M. Gervautz*** 和 ***W. Purgathofer*** 发表的论文***《A Simple Method for Color Quantization: Octree Quantization》***当中。其时间复杂度和空间复杂度都有很大的优势，并且保真度也是非常的高。

　　大致的思路就是对于某一个像素点的颜色 **R / G / B** 分开来之后，用二进制逐行写下。

　　如 `#FF7800`，其中 **R** 通道为 `0xFF`，也就是 `255`，**G** 为 `0x78` 也就是 `120`，**B** 为 `0x00` 也就是 `0`。

　　接下去我们把它们写成二进制逐行放下，那么就是：

```
R: 1111 1111
G: 0111 1000
B: 0000 0000
```

　　**RGB** 通道逐列黏合之后的值就是其在某一层节点的子节点编号了。每一列一共是三位，那么取值范围就是 `0 ~ 7` 也就是一共有八种情况。这就是为什么这种算法要开八叉树来计算的原因了。

　　举个例子，上述颜色的第一位黏合起来是 `100(2)`，转化为十进制就是 4，所以这个颜色在第一层是放在根节点的第五个子节点当中；第二位是 `110(2)` 也就是 6，那么它就是根节点的第五个儿子的第七个儿子。

　　于是我们有了这样的一个节点结构：

```javascript
var OctreeNode = function() {
    this.isLeaf = false;
    this.pixelCount = 0;
    this.red = 0;
    this.green = 0;
    this.blue = 0;

    this.children = new Array(8);
    for(var i = 0; i < this.children.length; i++) this.children[i] = null;

    // 这里的 next 不是指兄弟链中的 next 指针
    // 而是在 reducible 链表中的下一个节点
    this.next = null;
};
```

+ `isLeaf`: 表明该节点是否为叶子节点。
+ `pixelCount`: 在该节点的颜色一共插入了几次。
+ `red`: 该节点 **R** 通道累加值。
+ `green`: **G** 累加值。
+ `blue`: **B** 累加值。
+ `children`: 八个子节点指针。
+ `next`: ***reducible*** 链表的下一个节点指针，后面会作详细解释，目前可以先忽略。

#### 插入颜色

　　根据上面的理论，我们大致就知道了往八叉树插入一个像素点颜色的步骤了。

　　就是每一位 **RGB** 通道黏合的值就是它在树的那一层的子节点的编号。

　　大致可以看下图：

![八叉树插入](http://www.microsoft.com/msj/archive/wicked1.gif)
<small>图片来源：http://www.microsoft.com/msj/archive/S3F1.aspx</small>

　　由此可以推断，在没有任何颜色合并的情况下，插入一种颜色最坏的情况下是进行 64 次检索。

> **注意：**我们将会把该颜色的 RGB 分量分别累加到该节点的各分量值中，以便最终求平均数。

　　大致的流程就是从根节点开始 DFS，如果到达的节点是叶子节点，那么分量、颜色总数累加；否则就根据层数和该颜色的第层数位颜色黏合值得到其子节点序号。若该子节点不存在就创建一个子节点并与该父节点关联，否则就直接搜下一层去。

　　创建的时候根据层数来确定它是不是叶子节点，如果是的话需要标记一下，并且全局的叶子节点数要加一。

　　还有一点需要注意的就是如果这个节点不是叶子节点，就将其丢到 ***reducible*** 相应层数的链表当中去，以供之后颜色合并的时候用。关于颜色合并的内容后面会进行解释。

　　下面是创建节点的代码：

```javascript
function createNode(idx, level) {
    var node = new OctreeNode();
    if(level === 7) {
        node.isLeaf = true;
        leafNum++;
    } else {
        // 将其丢到第 level 层的 reducible 链表中
        node.next = reducible[level];
        reducible[level] = node;
    }

    return node;
}
```

　　以及下面是插入某种颜色的代码：

```javascript
function addColor(node, color, level) {
    if(node.isLeaf) {
        node.pixelCount++;
        node.red += color.r;
        node.green += color.g;
        node.blue += color.b;
    } else {
        // 由于 js 内部都是以浮点型存储数值，所以位运算并没有那么高效
        // 在此使用直接转换字符串的方式提取某一位的值
        //
        // 实际上如果用位运算来做的话就是这样子的：
        //   https://github.com/XadillaX/thmclrx/blob/7ab4de9fce583e88da6a41b0e256e91c45a10f67/src/octree.cpp#L91-L103
        var str = "";
        var r = color.r.toString(2);
        var g = color.g.toString(2);
        var b = color.b.toString(2);
        while(r.length < 8) r = '0' + r;
        while(g.length < 8) g = '0' + g;
        while(b.length < 8) b = '0' + b;

        str += r[level];
        str += g[level];
        str += b[level];
        var idx = parseInt(str, 2);

        if(null === node.children[idx]) {
            node.children[idx] = createNode(node, idx, level + 1);
        }

        if(undefined === node.children[idx]) {
            console.log(color.r.toString(2));
        }

        addColor(node.children[idx], color, level + 1);
    }
}
```

#### 合并颜色

　　这一步就是八叉树的空间复杂度低和保真度高的另一个原因了。

> 勿忘初心。

　　我们用这个算法做的是颜色量化，或者说我要拿它提取主题色、调色板，所以肯定是提取几个有代表性的颜色就够了，否则茫茫世界中 **RRGGBB** 一共有 419430400 种颜色，怎么归纳？

　　我们可以让指定一棵八叉树不超过多少多少叶子节点（也就是最后能归纳出来的主题色数），比如 8，比如 16、64 或者 256 等等。

　　所以当叶子节点数超过我们规定的叶子节点数的时候，我们就要合并其中一个节点，将其所有子节点的数据都合并到它身上去。

　　举个例子，我们有一个节点有八个子节点，并且都是叶子节点，那么我们把八个叶子节点的通道分量全累加到该节点中，颜色总数也累加到该节点中，然后删除八个叶子节点并把该节点设置为叶子节点。那么一下子我们就合并了八个节点有木有！

　　为什么这些节点可以被合并呢？

　　我们来看看某个节点下的子节点颜色都有神马相似点吧——它们的三个分量前七位（或者说如果已经不是最底层的节点的话那就是前几位）是相同的，那么比如说刚才的 `FF7800`，跟它同级并且拥有相同父节点（也就是它的兄弟节点）的颜色都是什么呢：

```
R: 1111 111(0,1)
G: 0111 100(0,1)
B: 0000 000(0,1)
```

　　整合出来一看：

```
FE7800
FE7801
FE7900
FE7901
FF7800
FF7801
FF7900
FF7901
```

　　怎么样？是不是确实很相近？这就是八叉树的精髓了，所有的兄弟节点肯定是在一个相近的颜色范围内。

　　所以说我们要合并就先去最底层的 ***reducible*** 链表中寻找一个可以合并的节点，把它从链表中删除之后合并叶子节点并且删除其叶子节点就好了：

```javascript
function reduceTree() {
    // 找到最深层次的并且有可合并节点的链表
    var lv = 6;
    while(null === reducible[lv]) lv--;

    // 取出链表头并将其从链表中移除
    var node = reducible[lv];
    reducible[lv] = node.next;

    // 合并子节点
    var r = 0;
    var g = 0;
    var b = 0;
    var count = 0;
    for(var i = 0; i < 8; i++) {
        if(null === node.children[i]) continue;
        r += node.children[i].red;
        g += node.children[i].green;
        b += node.children[i].blue;
        count += node.children[i].pixelCount;
        leafNum--;
    }

    // 赋值
    node.isLeaf = true;
    node.red = r;
    node.green = g;
    node.blue = b;
    node.pixelCount = count;
    leafNum++;
}
```

　　这样一来，就合并了一个最深层次的节点了，如果满打满算的话，一次合并最多会烧掉 7 个节点（我大 FFF 团壮哉）。

#### 建树

　　上面的函数都有了，我们可以开始建树了。

　　实际上建树的过程就是遍历一遍传入的像素颜色信息，对于每个颜色都插入到八叉树当中；并且每一次插入之后都判断下叶子节点数有没有溢出，如果满出来的话需要及时合并。

```javascript
function buildOctree(pixels, maxColors) {
    for(var i = 0; i < pixels.length; i++) {
        // 添加颜色
        addColor(root, pixels[i], 0);

        // 合并叶子节点
        while(leafNum > maxColors) reduceTree();
    }
}
```

　　整棵树建好之后，我们应该得到了最多有 `maxColors` 个叶子节点的高保真八叉树。其根节点为 `root`。

#### 主题色提取

　　有了这么一棵八叉树之后我们就可以从里面提取我们想要的东西了。

　　主题色提取实际上就是把八叉树当中剩下的叶子节点 ***RGB*** 通道分量求平均，求出来的就是近似的主题色了。（也许有更好的，不是求平均的方法能获得更好的主题色结果，但是我没有深入去研究，欢迎大家一起来指正 (❀╹◡╹)）

　　于是我们深度遍历这棵树，每遇到叶子节点，就求出颜色加入到我们所存结果的数组或者任意数据结构当中了：

```javascript
function colorsStats(node, object) {
    if(node.isLeaf) {
        var r = parseInt(node.red / node.pixelCount).toString(16);
        var g = parseInt(node.green / node.pixelCount).toString(16);
        var b = parseInt(node.blue / node.pixelCount).toString(16);
        if(r.length === 1) r = '0' + r;
        if(g.length === 1) g = '0' + g;
        if(b.length === 1) b = '0' + b;

        var color = r + g + b;
        if(object[color]) object[color] += node.pixelCount;
        else object[color] = node.pixelCount;
        
        return;
    }

    for(var i = 0; i < 8; i++) {
        if(null !== node.children[i]) {
            colorsStats(node.children[i], object);
        }
    }
}
```

#### 算法小结

　　八叉树主题色提取算法提取出来的主题色是一个无固定调色板（Non-palette）的颜色群，它有着对原图的尽量保真性，但是由于没有固定的调色板，有时候对于搜索或者某种需要固定值来解释的场景中还是欠了点火候。但是活灵活现非它莫属了。比如某种图片格式里面预先存调色板然后存各像素的情况下，我们就可以用八叉树提取出来的颜色作为该图片调色板，能很大程度上对这张图片进行保真，并且图片颜色也减到一定的量。

　　该算法的完整 Demo 大家可以在我的 [Github](https://github.com/XadillaX/theme-color-test/blob/master/version3/octree.js) 当中找到。

### 最小差值法

　　这是一个非常简单又实用的算法。

　　大致的思想就是给定一个调色板，过来一个颜色就跟调色板中的颜色一一对比，取最小差值的那个调色板里的颜色作为这个颜色的代表。

　　对比的过程就是分别将 **R / G / B** 通道的值两两相减取绝对值，将三个差相加，得到的这个值就是颜色差值了。

　　反正最后就是调色板中哪个颜色跟对比的颜色差值最小，就拿过来就是了。

```javascript
var best = 0;
var bestv = pal[0];
var bestr = Math.abs(r - bestv.r) + Math.abs(g - bestv.g) + Math.abs(b - bestv.b);

for(var j = 1; j < pal.length; j++) {
    var p = pal[j];
    var res = Math.abs(r - p.r) + Math.abs(g - p.g) + Math.abs(b - p.b);
    if(res < bestr) {
        best = j;
        bestv = pal[j];
        bestr = res;
    }
}

r = pal[best].r.toString(16);
g = pal[best].g.toString(16);
b = pal[best].b.toString(16);

if(r.length === 1) r = "0" + r;
if(g.length === 1) g = "0" + g;
if(b.length === 1) b = "0" + b;

if(colors[r + g + b] === undefined) colors[r + g + b] = -1;
colors[r + g + b]++;
```

## 我是怎么做的

　　八叉树的缺点我在之前的八叉树小结中提到过了，就是颜色不固定。对于需要有一定固定值范围的主题色提取需求来说不是那么合人意。

　　而最小差值法的话又太古板了。

　　于是我的做法是将这两种算法都过一遍。

　　比如我要将一张图片提取出少于 256 种颜色，我会用八叉树过滤一遍得出保证的两百多种颜色，然后拿着这批颜色和其数量再扔到最小插值法里面将颜色规范化一遍，得出的最终结果可能就是我想要的结果了。

　　这期间第二步的效率可以忽略不计，毕竟如果是上面的需求的话第一步的结果也就那么两百多种颜色。

　　这个方法我已经实现并且用在我自己的颜色提取包 ***[thmclrx](https://github.com/XadillaX/thmclrx)*** 里了。大致的代码可以看[这里](https://github.com/XadillaX/thmclrx/blob/7ab4de9fce583e88da6a41b0e256e91c45a10f67/lib/x.js#L95-L145)。

## 主题色提取 Node.js 包——thmclrx

　　在这几天的辛勤劳作下，总算完成了某种意义上我的第一个 Node.js C++ Addon。

　　跟算法相关（八叉树、最小差值）的计算全放在了 [C++ 层](https://github.com/XadillaX/thmclrx/tree/master/src)进行计算。大家有兴趣的可以去读一下并且帮忙指出各种各样的缺点，算是抛砖引玉了。

　　这个包的 Repo 在 Github 上面：

> https://github.com/XadillaX/thmclrx

　　文档自认为还算完整吧。并且也可以通过

```sh
$ npm install thmclrx
```

　　进行安装。

## 本文小结

　　进花瓣两个月了，这一次终于如愿以偿地碰触到了一点点的『算法相关』的活。（我不会告诉你这不是我的任务，是我从别人手中抢来的 2333333 *ଘ(੭*ˊᵕˋ)੭* ੈ✩‧₊˚

　　总之几种算法和实现在上方介绍了，具体需要怎么用还是要看大家自己了。我反正大致找到了我使用的途径，那你们呢。( ´･･)ﾉ(._.`)

