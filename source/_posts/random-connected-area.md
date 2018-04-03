title: 随机生成指定面积单连通区域
date: 2018-04-01 17:54:45
tags: [ 算法, JavaScript ]
category: 算法
---

最近在知乎上看到一个问题，「[随机生成指定面积单连通区域？](https://www.zhihu.com/question/269483551/answer/354477009)」，感觉还挺有意思的，于是整理一下写一篇新文章。

## 问题阐述

如下图所示，在 10x10 的区域中，随机生成面积为 6 的单连通区域，该「随机」包括「位置随机」以及「形状随机」。

![示意图](example.jpg)

注意：

1. 单连通区域定义是该区域每一个区块上下左右至少连着另一个区块；
2. 采用周期性结构，超出右边移到最左边，以此类推。

> 其中点 2 可以分采用和不采用周期性结构分别讨论。

## 随便说说

这个问题，我不知道原题提问者想要做什么事。但是就这题本身而言，我们可以拿它去生成一个随机地图，例如：

> 建造、等待的沙盒类手游，游戏中有一个空岛，玩家能在上面建造自己的建筑然后等待各种事件完成。**空岛形状随机生成，并且都联通且面积一定，这样每个玩家进去的时候就能得到不同地形**。

## 解决一下

在得知了问题原题之后，我们就可以照着题目的意思开始解决了。

### DFS

其实这么一个问题一出现，脑子里面就瞬间涌出几个词汇：[DFS](https://en.wikipedia.org/wiki/Depth-first_search)、[Flood fill](https://en.wikipedia.org/wiki/Flood_fill)、[并查集](https://zh.wikipedia.org/wiki/%E5%B9%B6%E6%9F%A5%E9%9B%86)等等。

那么其实这最粗暴的办法相当于你假想有一个连通区域，然后你去 Flood fill 它——至于墙在哪，在递归的每一个节点的时候**随机一下搜索方向的顺序就可以了**。

#### 实现外壳

我们先实现一个类的框架吧（我是 Node.js 开发者，自然用 JavaScript 进行 Demo 的输出）。

```javascript
const INIT = Symbol("init");

class Filler {
    /**
     * Filler 构造函数
     * @constructor
     * @param {Number} length 地图总宽高
     * @param {Number} needArea 需要填充的区域面积
     */
    constructor(length, needArea) {
        this.length = length;
        this.needArea = needArea;
    }

    /**
     * 初始化地图
     */
    [INIT]() {
        /**
         * 为了方便，地图就用一个二维字符数组表示
         *
         *   + . 代表空地
         *   + x 代表填充
         */
        this.map = [];
        this.count = 0;
        for(let i = 0; i < this.length; i++) {
            let row = [];
            for (let j = 0; j < this.length; j++) row.push(".");
            this.map.push(row);
        }
     }

     /**
      * 填充递归函数
      * @param {Number} x 坐标 X 轴的值
      * @param {Number} y 坐标 Y 轴的值
      * @return 填充好的地图二维数组
      */
     fill(x, y) {
        // 待实现
     }
}
```

#### 非周期性实现

有了架子之后，我们就可以实现递归函数 `fill` 了，整理一下流程如下：

1. 随机一个起点位置，并以此开始递归搜索；
2. `fill(x, y)` 进入递归搜索：
    1. 如果需要初始化地图就调用 `this[INIT]()`；
    2. `this.count++`，表示填充区域面积加了 `1`，并在数组中将该位置填充为 `x`；
    3. `this.count` 是否等于所需要的面积：
        1. 若等于，则返回当前的地图状态；
        2. 若不等于，则继续 2.4；
    4. 随机四个方向的顺序；
    5. 对四个方向进行循环：
        1. `x`、`y` 轴的值按当前方向走一个算出新的坐标值 `newX` 和 `newY`；
        2. 判断坐标是否合法（越界算非法）：
            1. 若非法则回 2.5 继续下一个方向；
            2. 若合法则继续 2.5.3；
        3. 递归 `fill(newX, newY)` 得到结果，若有结果则返回；
    6. 若循环完四个方向都还没返回结果则会跳到这一步来，这个时候进行状态还原，递归跳回上一层进行下一个状态的搜索。

> 在这里「状态还原」表示把 `this.count--` 还原回当前坐标填充前的状态，并且把当前填充的 `'x'` 给还原回 `'.'`。

照着上面的流程很快就能得出代码结论：

```javascript
const _ = require("lodash");

class Filler {
    ...

    fill(x, y) {
        // 初始化地图
        const needInit = !arguments[2];
        if(needInit) this[INIT]();

        // 如果当前坐标已被填充，则返回空
        if(this.map[x][y] === "x") return;

        // 填充当前坐标
        this.count++;
        this.map[x][y] = "x";

        // 填充满了则返回当前地图
        if(this.count === this.needArea) return Object.assign([], this.map);

        // 随机四个方向的顺序
        const dirs = _.shuffle([ [ 0, 1 ], [ 0, -1 ], [ 1, 0 ], [ -1, 0 ] ]);

        // 循环四个方向
        for(let i = 0; i < 4; i++) {
            const dir = dirs[i];
            let newX = x + dir[0];
            let newY = y + dir[1];

            // 判断边界
            {
                if(newX < 0 || newX >= this.length || newY < 0 || newY >= this.length) continue;
            }

            // 进入下一层递归并得到结果
            const ret = this.fill(newX, newY, true);

            // 若结果非空则返回结果
            if(ret) return ret;
        }

        // 状态还原
        this.count--;
        this.map[x][y] = ".";
    }
}
```

这么一来，类就写好了。接下去我们只要实现一些交互的代码，就可以看效果了。

> [点我](https://jsfiddle.net/XadillaX/x2ur8kvj/)进入 JSFiddle 看效果。

如果懒得进入 JSFiddle 看，也可以看看下面的几个截图：

![](10x10-1.png)
<small>10x10 填 50 效果图</small>

![](10x10-2.png)
<small>10x10 填 6 效果图</small>

![](50x50-1.png)
<small>50x50 填 50 效果图</small>

#### 周期性实现

其实原题说了一个条件，那就是**采用周期性结构，超出右边移到最左边，以此类推**。

而我们前文的代码其实是照着非周期性结构来实现的。不过如果我们要将其改成周期性实现也很简单，只需要把前文代码中边界判断的那一句代码改为周期性计算的代码即可，也就是说要把这段代码：

```javascript
// 判断边界
{
    if(newX < 0 || newX >= this.length || newY < 0 || newY >= this.length) continue;
}
```

改为：

```javascript
// 周期性计算
{
    if(newX < 0) newX = this.length - 1;
    if(newX >= this.length) newX = 0;
    if(newY < 0) newY = this.length - 1;
    if(newY >= this.length) newY = 0;
}
```

这个时候出来的效果就是这样的了：

![](10x10-zqx-1.png)
<small>10x10 填 50 周期性效果图</small>

#### 抛弃状态还原

至此为止 DFS 的代码基本上完成了。不过目前来说，当然这个算法的一个缺陷就是，当需要面积与总面积比例比较大的时候，有可能陷入搜索的死循环（或者说效率特别低），因为要不断复盘。

所以我们可以做点改造——由于我们不是真的为了搜索到某个状态，而只是为了填充我们的小点点，那么 DFS 中比较经典的「状态还原」就不需要了，也就是说：

```javascript
this.count--;
this.mat[x][y] = ".";
```

这两行代码可以删掉了，用删掉上面两行代码的代码跑一下，我用 50x50 填充 800 格子的效果：

| ![](800-1.png) | ![](800-2.png) | ![](800-3.png) | ![](800-4.png) |
|----------------|----------------|----------------|----------------|

继续之前的 50x50 填充 50：

| ![](50-1.png) | ![](50-2.png) | ![](50-3.png) | ![](50-4.png) |
|----------------|----------------|----------------|----------------|

### 生成「胖胖的」区域

上面 DFS 的方法，由于每次都要走完一条路，虽然会转弯导致黏连，但在填充区域很小的情况下，很容易生成“瘦瘦的区域”。

这里再给出另一个方法，一个 `for` 搞定的，思路如下：

1. 先随机一个起始点，并将该点加入边界池；
2. 循环 N - 1 次（N 为所需要填充的面积）：
    1. 从边界池中随机取出一个边界；
    2. 算出与其接壤的四个点，取出还未被填充的点；
    3. 在取出的点中随机一个将其填充；
    4. 填充后计算改点接壤的四个点是否有全都是已经填充了的，若不是，则将该坐标加入边界池；
    5. 拿着刚才计算的接壤的四个点，分别判断其是否周边四个点都已被填充，若是且该点在边界池中，则从边界池拿走；
    6. 回到第二大步继续循环；
3. 返回填充好的结果。

给出代码 Demo：

```javascript
function random(max) {
    return Math.round(Math.random() * max);
}

class Filler2 {
    constructor(length, needArea) {
        this.length = length;
        this.needArea = needArea;
    }

    _getContiguous(frontier) {
        return Filler2.DIRS.map(dir => ({
            x: frontier.x + dir[0],
            y: frontier.y + dir[1]
        }));
    }

    fill() {
        const mat = [];
        for (let i = 0; i < this.length; i++) {
            let row = [];
            for (let j = 0; j < this.length; j++) row.push(".");
            mat.push(row);
        }

        const start = {
            x: random(this.length - 1),
            y: random(this.length - 1)
        };
        mat[start.x][start.y] = "x";

        let frontierCount = 1;
        const frontiers = {
            [`${start.x}:${start.y}`]: true
        };

        for (let i = 1; i < this.needArea; i++) {
            // 取出一个边界
            const randIdx = random(frontierCount - 1);
            const frontier = Object.keys(frontiers)[randIdx].split(":").map(n => parseInt(n));

            // _getContiguous 算出接壤坐标，filter 去除无用坐标
            const newCoors = this._getContiguous({
                x: frontier[0],
                y: frontier[1]
            }).filter(coor => {
                if (coor.x < 0 || coor.y < 0 || coor.x >= this.length || coor.y >= this.length) return false;
                if (mat[coor.x][coor.y] === "x") return false;
                return true;
            });

            // 随机取一个坐标
            const newCoor = newCoors[random(0, newCoors.length - 1)];

            // 填充进去
            mat[newCoor.x][newCoor.y] = "x";

            // 获取接壤坐标
            const contiguousOfNewCoor = this._getContiguous(newCoor).filter(coor => {
                if (coor.x < 0 || coor.y < 0 || coor.x >= this.length || coor.y >= this.length) return false;
                return true;
            });

            // 若有一个接壤点为空，就认为当前坐标是边界，若是边界则把当前坐标加入对象
            if (contiguousOfNewCoor.reduce((ret, coor) => {
                    if (mat[coor.x][coor.y] === "x") return ret;
                    return true;
                }, false)) {
                frontiers[`${newCoor.x}:${newCoor.y}`] = true;
                frontierCount++;
            }

            // 再检查接壤的坐标是否继续为边界
            for (let i = 0; i < contiguousOfNewCoor.length; i++) {
                const cur = contiguousOfNewCoor[i];

                const isFrontier = this._getContiguous(cur).filter(coor => {
                    if (coor.x < 0 || coor.y < 0 || coor.x >= this.length || coor.y >= this.length) return false;
                    return true;
                }).reduce((ret, coor) => {
                    if (mat[coor.x][coor.y] === "x") return ret;
                    return true;
                }, false);

                // 若不是边界的话，只管删除
                if (!isFrontier && frontiers[`${cur.x}:${cur.y}`]) {
                    delete frontiers[`${cur.x}:${cur.y}`];
                    frontierCount--;
                }
            }
        }

        // 一圈下来，就出结果了
        return mat;
    }
}

Filler2.DIRS = [ [ 0, 1 ], [ 0, -1 ], [ 1, 0 ], [ -1, 0 ] ];
```

> **注意：**上面的代码是我一溜烟写出来的，所以并没有后续优化代码简洁度，其实很多地方的代码可以抽象并复用的，懒得改了，能看就好了。用的时候就跟之前 DFS 代码一样 `new` 一个 `Filler2` 出来并 `fill` 就好了。
>
> 效果依然可以去 [JSFiddle](https://jsfiddle.net/XadillaX/36f6obca/) 看。

或者也可以直接看效果图：

| ![](fat-800-1.png) | ![](fat-800-2.png) | ![](fat-800-3.png) | ![](fat-800-4.png) |
|----------------|----------------|----------------|----------------|
<center><small>50x50 填充 800 胖胖的区域</small></center>

| ![](fat-50-1.png) | ![](fat-50-2.png) | ![](fat-50-3.png) | ![](fat-50-4.png) |
|----------------|----------------|----------------|----------------|
<center><small>50x50 填充 50 胖胖的区域</small></center>

显而易见，跟之前 DFS 生成出来的奇形怪状相比，这种算法生成的连通区域更像是一块 Mainland，而前者则更像是一个洼地沼泽或者丛林。

### 结合一下？

前面两种算法，一个是生成瘦瘦的稀奇古怪的面积，一个是生成胖胖的区域。有没有办法说在生成胖胖的区域的情况下允许一定的稀奇古怪的形状呢？

其实将两种算法结合一下就好了。结合的做法有很多，这里举一个例子，大家可以自己再去想一些出来。

1. 首先将需要的区域对半分（即配比 1 : 1），例如如果需要 800，就分为 400 跟 400。（为了长得好看，其实这个比例可以自行调配）
2. 将前一半的区域用 `for` 生成胖胖的区域；
3. 将剩下的区域随机几次，每次随机一个剩下所需要的面积以内的数，将这个数字作为 DFS 所需要生成的面积量，并从边界数组中随机取一个边界坐标并计算其合法接壤坐标开始进行 DFS 得到结果；
4. 循环第 3 步知道所需区域面积符合要求为止。

> **注意：**为了保证每次 DFS 一开始的时候都能取到最新的边界坐标，在 DFS 流程中的时候每标一个区域填充也必须走一遍边界坐标更新的逻辑。

具体代码就不放文章里面解析了，大家也可以到 [JSFiddle](https://jsfiddle.net/XadillaX/0bnzpw8d/) 中去观看。

或者也可以直接看效果图：

| ![](mix-800-1.png) | ![](mix-800-2.png) | ![](mix-800-3.png) | ![](mix-800-4.png) |
|----------------|----------------|----------------|----------------|
<center><small>50x50 填充 800 混合区域（配比 3 : 1）</small></center>

| ![](mix-50-1.png) | ![](mix-50-2.png) | ![](mix-50-3.png) | ![](mix-50-4.png) |
|----------------|----------------|----------------|----------------|
<center><small>50x50 填充 50 胖胖的区域（配比 4 : 1）</small></center>

### 还能更丧心病狂吗？

结合了两种算法，我们得到了一个我认为可能会更好看一点的区域。

此外，我们还能继续「丧心病狂」一点，例如两种方式交替出现，流程如下：

1. 指定特定方法和面积，奇数次用 `for`，偶数次用 DFS；
    2. 如果是 `for` 则随机一个 `Math.min(剩余面积, 总面积 / 4)` 的数字；
    3. 如果是 DFS 则随机一个 `Math.min(剩余面积, 总面积 / 10)` 的数字；
2. 从边界数组中取一个坐标，并从合法接壤坐标中取一个坐标出来；
3. 以第 2 步取出的坐标为起点，使用第 1 步指定的方法生成第 1 步指定的面积的单连通区域；
4. 如果生成面积仍小于指定面积，则回到第 1 步继续循环，否则返回当前结果。

依旧是给出 [JSFiddle 的预览](https://jsfiddle.net/XadillaX/5rx7vdzL/)。

或者也可以直接看效果图：

| ![](frenzied-800-1.png) | ![](frenzied-800-2.png) | ![](frenzied-800-3.png) | ![](frenzied-800-4.png) |
|----------------|----------------|----------------|----------------|
<center><small>50x50 填充 800 丧病区域</small></center>

| ![](frenzied-50-1.png) | ![](frenzied-50-2.png) | ![](frenzied-50-3.png) | ![](frenzied-50-4.png) |
|----------------|----------------|----------------|----------------|
<center><small>50x50 填充 800 丧病区域</small></center>

> **注意：**这里只给出思路，具体配比和详细流程大家可以继续优化。

## 几张效果对比图

最后，这里给出几张 10x10 填 50 的效果图放一起对比一下。

| ![](f-50-dfs.png) | ![](f-50-cycle.png) | ![](f-50-dfs-without-back.png) | ![](f-50-cycle-without-back.png) | ![](f-50-fat.png) | ![](f-50-mix.png) | ![](f-50-frenzied.png) |
|----------------|----------------|----------------|----------------|-|-|-|
| <center><small>DFS</small></center> | <center><small>周期性 DFS</small></center> | <center><small>非还原 DFS</small></center> | <center><small>非还原周期性 DFS</small></center> | <center><small>胖胖的</small></center> | <center><small>结合</small></center> | <center><small>更丧病</small></center> |

以及，几张 50x50 填充 800 面积的效果图对比。

| ![](too-slow.png) | ![](too-slow.png) | ![](f-800-dfs-without-back.png) | ![](f-800-cycle-without-back.png) | ![](f-800-fat.png) | ![](f-800-mix.png) | ![](f-800-frenzied.png) |
|----------------|----------------|----------------|----------------|-|-|-|
| <center><small>DFS</small></center> | <center><small>周期性 DFS</small></center> | <center><small>非还原 DFS</small></center> | <center><small>非还原周期性 DFS</small></center> | <center><small>胖胖的</small></center> | <center><small>结合</small></center> | <center><small>更丧病</small></center> |

## 小结

本文主要还是讲了，如何随机生成一个指定面积的单连通区域。从一开始拍脑袋就能想到 DFS 开始，延伸到胖胖的区域，然后从个人认为「图不好看」开始，想办法如何结合一下两种算法使其变得更自然。

针对同一件事的算法们并非一成不变或者不可结合的。不是说该 DFS 就只能 DFS，该 `for` 就只能 `for`，稍微结合一下也许食用效果更佳哦。

哦对了，在这之前还有一个例子就是我在三年多前写的主题色提取的文章《[图片主题色提取算法小结](https://xcoder.in/2014/09/17/theme-color-extract/#%E6%88%91%E6%98%AF%E6%80%8E%E4%B9%88%E5%81%9A%E7%9A%84)》，其中就讲到我最后的方法就是结合了八叉树算法和最小差值法，使其在提取比较贴近的颜色同时又能够规范化提取出来的颜色。

总之就是多想想，与诸君共勉。
