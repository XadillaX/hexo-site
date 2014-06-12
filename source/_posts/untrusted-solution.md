title: Untrusted - 游戏题解
date: 2014-06-12 11:08:34
tags: [ Javascript, untrusted, 游戏 ]
---

　　[Trusted](http://alexnisnevich.github.io/untrusted/) 是一个代码解谜游戏，用 Javascript 来过关的。

　　昨天凌晨花了仨小时通关了这个游戏，在这里就粗粗做一下题解吧，好几题都是 Hack 过去的。（不要脸，( ﾟДﾟ)σ

## Ceil Block A

　　这有点像教学关吧，总之先拿到那台电脑你就能操作了。拿到电脑后你就能修改地图内部黑色底色的代码了。

　　这个时候你只需要把中间设置墙的代码去掉就可以了，或者注释掉：

```javascript
//for(y = 3; y <= map.getHeight() - 10; y++) {
//    map.placeObject(5, y, 'block');
//    map.placeObject(map.getWidth() - 5, y, 'block');
//}
//
//for(x = 5; x <= map.getWidth() - 5; x++) {
//    map.placeObject(x, 3, 'block');
//    map.placeObject(x, map.getHeight() - 10, 'block');
//}
```

　　然后 `<ctrl-5>` 重新执行——哒哒～墙就消失了，赶紧到蓝色的出口处吧。

## The Long Way Out

　　代码大致是给你创建了一个迷宫，并且出口处四面用围墙围起来。

　　我用了一个比较 Hack 的方法，在第一个黑色区域的最上方把 `maze.create` 重定向到自己的一个空函数，这样下面调用创建迷宫的函数就不会被执行，这个时候再执行的话迷宫就不见了：

```javascript
maze.create = function() {};
```

　　迷宫不见了还不靠谱，因为还有一个出口四周有墙——那就自己再建一个出口呗，在第二个黑色区域写上建立一个新出口的代码即可：

```javascript
map.placeObject(0, 0, "exit"); 
```

> 勇敢的少年啊，快去创造奇迹！

## Validation Engaged

　　这题的要求是在还存在着一定量『壁』的情况下你能到达出口，也就是说纯粹地删除它加『壁』的代码是不行的，那我们做点改动就 OK 了。把『壁』往外移动，直到把人和出口都是在『壁』内。

> 那一天，人类终于回想起曾经一度被他们所支配的恐怖，还有囚禁于鸟笼中的那份屈辱。

```javascript
for(y = 0; y <= map.getHeight() - 3; y++) {
    map.placeObject(5, y, 'block');
    map.placeObject(map.getWidth() - 5, y, 'block');
}

for(x = 0; x <= map.getWidth() - 5; x++) {
    map.placeObject(x, 3, 'block');
    map.placeObject(x, map.getHeight() - 3, 'block');
}
```

## Multiplicity

　　嘛嘛，这是第二关的简化版——直接再搞一个出口就 OK 了。

```javascript
map.placeObject(20, 10, 'exit');
```

## Minesweeper

　　这是一个雷区，你不碰雷就好。从代码里面看出来有个 `map.setSquareColor` 函数可以设置某个格子的颜色。那好办，我们在设置一个地雷后把它用别的颜色标记出来就好了，然后重新执行只要你不是色盲都能安全通过。

```javascript
map.setSquareColor(x, y, "#ff7800");
```

## Drones 101

　　这题大概就是说有个痴汉会跟你靠近，然后把你先奸后杀。

　　但是痴汉很笨，在他的必经之路用墙堵住他就不会继续动了。

```javascript
map.placeObject(30, 12, 'block');
map.placeObject(31, 11, 'block');
```

## Colors

　　这个是那个卖相不错的电话机的教学关卡。所以大致的意思是设置了打电话的回调函数即可。ε٩(๑> ₃ <)۶з

　　分析代码可知，要通过那几个长得跟菊花一样的带色儿的墙你就要跟那个菊花颜色一样。所以电话机的回调函数大致是让你自己变色就好了。

　　按照顺序所见，如果人是绿色的通过之后要变成红色，然后再变成黄色再绿色。于是写以下的变色过程就可以了：

```javascript
var player = map.getPlayer();

var color = player.getColor();
switch(color) {
    case "#0f0":
        player.setColor("#f00");
        break;
    case "#f00":
        player.setColor("#ff0");
        break;
    case "#ff0":
        player.setColor("#0f0");
        break;
}
```

　　重新执行捡起电话机，然后通过绿菊花之后按 `Q` 使用电话机让自己变色儿就好了。

> “哎呀，天！他是惦记弟弟了。……可我还不知道呢！那么这是他老人家的狗？很高兴。……你把它带去吧。……这条小狗怪不错的。……挺伶俐。……一口就把这家伙的手指咬破了！哈哈哈哈！……咦，你干吗发抖？呜呜，……呜呜。……它生气了，小坏蛋，……好一条小狗……”

## Into the Woods

　　森林里面有树和墙，我也懒得想或者写代码了。（明明是自己想不出来#ﾟÅﾟ）⊂彡☆))ﾟДﾟ)･∵

　　总之我是尽可能向出口靠近，然后到死路了赶紧打电话让森林重新生成一遍，如此循环往复直到出口。

## Fording the River

　　23333333333333！做这题的时候差点没把自己浏览器卡死。

　　大致的意思是河的上面有一条船，你直接遇水会死，要上船。但是船貌似不跟你走啊 QAQ。

　　而且设定写着只能有一条 `raft`。

　　咱就来个偷天换日，自己造诺亚方舟铺满整条河（因为懒得计算）。

　　首先定义诺亚方舟的类型：

```javascript
map.defineObject("noah", {
    'type': 'dynamic',
    'symbol': 'a',
    'color': '#420',
    'transport': true,
    'behavior': function(me) {
    }
});
```

　　然后呢把它铺满整条大河吧：

```javascript
for(var x = 0; x < map.getWidth(); x++) {
    for(var y = 5; y < 15; y++) {
        map.placeObject(x, y, 'noah');
    }
}
```

> 一条大河，两岸宽，风吹稻花香两岸。（喂喂喂，小心卡死_(┐「ε:)_

## Ambush

　　后来我去 `Untrusted` 的 repo 去看题解，发现他们都是去驱使这群痴汉干嘛干嘛。我感觉我的最简单暴力了——直接废了他们。

　　其实呢只要把碰撞函数重写一遍，这堆痴汉马上就变得人畜无害，你走过去人家还行礼呢233333333333

　　仔细看一下我们要完成的部分在 `behavior` 里面，所以在这里面用 `this` 是妥妥生效的。

```javascript
this.onCollision = function() {};
```

> 看我碎蛋大粉拳！（忽然觉得下身一阵疼痛  |Д`)ノ⌒●～*

## Robot

　　你走一步机器人走一步，也是教学关卡。

　　机器人能往下走就往下走，能往右走就往右走就拿到钥匙了，最后你再追上机器人把钥匙抢过来就好了。因为机器人是可以穿过紫翔色的那扇门的。

```javascript
if(me.canMove("down")) me.move("down");
else me.move("right");
```

> 站住，保护费。你不装 X 我们还是好朋友。

## Robot Nav

　　我居然无聊到自己把路线数出来了。

```javascript
var road = "ddddrrrrrrrrrrrrrrrrrrrrrrrrrrrrrruurrrrrrrrrrrrrrrrrddddddd";
this.cur = this.cur === undefined ? 0 : (this.cur + 1);

if(this.cur >= road.length) return;

if(road[this.cur] === "d") me.move("down");
if(road[this.cur] === "r") me.move("right");
if(road[this.cur] === "u") me.move("up");
```

## Robot Maze

　　好吧作者早就想到了有人会无聊地去数。

　　嘛嘛，就如作者所愿写个最基础的 DFS 了事吧。

```javascript
var direct = {
    "d": "down",
    "u": "up",
    "l": "left",
    "r": "right"
};

// dfs...
if(undefined === this.dfs) {
    this.ans = "";
    this.step = 0;

    var vis = [];
    for(var i = 0; i < 100; i++) {
        vis.push([]);
        for(var j = 0; j < 100; j++) vis[i].push(false);
    }

    var dir = [
        [ 0, -1, "u", "#f00" ],
        [ 0, 1, "d", "#0f0" ],
        [ -1, 0, "l", "#00f" ],
        [ 1, 0, "r", "#fff" ]
    ];

    this.dfs = function(x, y) {
        if(x === map.getWidth() - 2 && y === 8) {
            return true;
        }
        vis[y][x] = true;

        for(var i = 0; i < 4; i++) {
            var newx = x + dir[i][0];
            var newy = y + dir[i][1];

            if(newx < 0 || newy < 0 ||
                newx >= map.getWidth() ||
                newy >= map.getHeight() ||
                vis[newy][newx] ||
                map.getObjectTypeAt(newx, newy) === "block"
                ) continue;

            var oldans = this.ans;
            this.ans += dir[i][2];

            if(!this.dfs(newx, newy)) {
                this.ans = oldans;
            } else {
                map.setSquareColor(x, y, dir[i][3]);

                return true;
            }
        }

        return false;
    };

    this.dfs(1, 1);
    this.ans += "dd";
}

if(this.step >= this.ans.length) return;
me.move(direct[this.ans[this.step++]]);
```

> 红魔馆的地下室一样呢。反正是机器人多走几步路没事，没必要用 BFS 求最优解2333333333

## Crisps Contest

　　刚才那仨 2B 机器人引领你拿到了仨颜色的钥匙在这边派上用场了。

　　钻红菊花你需要有红钥匙，并且用了之后会少掉。其它颜色也一样。最终你要拿到 `A` 所代表的 `theAlgorithm` 走到出口。

> 等等！啊咧？绿钥匙的通过判定有个地方可以修改？就是你通过绿菊花的时候需要有绿钥匙并且你可以选择你丢弃的东西。丢什么好呢？电脑？不行不行，过关还靠它呢。电话机？以后肯定要用到。其它颜色钥匙？那你肯定会被锁在某个地方出不来。那就只有丢弃 `theAlgorithm` 了——反正只要拿到 `theAlgorithm` 之后不再通过绿菊花就没事了。

　　于是只要把绿菊花的通过判断函数里面可修改的区域改成 `theAlgorithm` 就好了。

　　最后走的顺序大概是：

> 进左上角的门拿到<span style="color: yellow;">黄药屎</span>和<span style="color: blue;">蓝药屎</span>出来。然后右上角把<span style="color: red;">**红**</span>和<span style="color: blue;">**蓝**</span>拿出来。然后向下直捣黄龙，左黄菊花进拿到 `theAlgorithm` 蓝菊花通过拿到<span style="color: yellow;">黄药屎</span>然后再黄菊花出。
>
> 大功告成！走向胜利的出口吧！
>
> **自古红蓝出 CP！**

## Exceptional Crossing

　　又是过河啊，这次你只能是死了，因为你的编辑区域只有在 `player.killedBy()` 里面。

> 《订制死神》：这个时候让死神笑就可以了。

　　让我们一起来玩坏它吧！在里面填上 `) = (0` 就好了。什么什么看不懂？你填进去看一下整句话就知道了：

```javascript
player.killedBy() = (0);
```

　　然后死神就会被你玩坏了。你走过去的时候这句话执行出错了2333333

## Lasers

　　有很多隐藏线，你人必须要跟隐藏线的颜色一致才能通过，然后目前所有线都用白色给画出来。

　　目测作者的意思是让你把硬编码的白色改成隐藏线的颜色，这样就能把线的颜色给标记出来，然后再给电话机写个函数就是让你自己的人变色。

　　不过我还是用了个 Hack 的方法——

　　第一条线他要画就画，咱不碰它就好了，只不过在第一条线画完的后面我们把这个画线函数给 Hack 掉：

```javascript
// using canvas to draw the line
var ctx = map.getCanvasContext();
ctx.beginPath();
ctx.strokeStyle = 'white';
ctx.lineWidth = 5;
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();

createLaser = abc;
```

　　接下去是在第二片区域写下自己的画线函数吧，这题最下方检测了线的数量不能少于 25 条。么事，爷高兴画 100 条都么问题，因为我都把它缩在左上角了 2333333

```javascript
function abc() {
    for(var i = 0; i < 25; i++) {
        map.createLine([1, 1], [2, 2], function(player) {
            //... Ahahaha
        });

        var ctx = map.getCanvasContext();
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.moveTo(1, 1);
        ctx.lineTo(2, 2);
        ctx.stroke();
    }
}
```

## Pointers

　　有好多传送门，每次执行随机生成传送位置，有些传送门会把你传到二小姐的地下室然后被吃掉。

　　我也懒得多动脑筋或者画线什么的，直接对两个都是传送门的 CP 标记一样的随机颜色就好了，最后跟着颜色走到出口去（有个坑就是有时候这个地图本身就是死局，所以得多试几次重新执行 இдஇ

```javascript
var dict = "0123456789ABCDEF";
if(t1.getType() === "teleporter" && t2.getType() === "teleporter") {
    var color = "#" + dict[Math.ceil(Math.random() * 15)] +
        dict[Math.ceil(Math.random() * 15)] +
        dict[Math.ceil(Math.random() * 15)];

    map.setSquareColor(t1.getX(), t1.getY(), color);
    map.setSquareColor(t2.getX(), t2.getY(), color);
}
```

## Super Dr. Eval Bros

　　好吧本意是让你设置一个 `timer` 然后一直跳啊跳的。

　　不过呢，定一个新方块给自己搭一座桥就是了：

```javascript
map.defineObject("❤", {
    impassable: function() {
        return true;
    },
    symbol: "❤"
});
map.placeObject(20, 12, "❤");
map.placeObject(21, 12, "❤");
map.placeObject(22, 12, "❤");
map.placeObject(23, 12, "❤");
map.placeObject(24, 12, "❤");
map.placeObject(25, 12, "❤");
map.placeObject(26, 12, "❤");
map.placeObject(27, 12, "❤");
map.placeObject(28, 12, "❤");
map.placeObject(29, 12, "❤");
```

> 你只要打个电话桥就会出现的。

## Document Object Madness

　　好神奇！好奇葩！我键盘 `hjkl` 乱按一通就过了。

## Boss Fight

　　打 Boss 了。

　　好吧我承认我 Cheat 了——原谅我用了 `console.log`。

> 因为当我打开控制台的时候下面的语句出现在我的眼里：
>
> > ***If you can read this, you are cheating!***
> >
> > ***But really, you don't need this console to play the game. Walk around using arrow keys (or Vim keys), and pick up the computer (⌘). Then the fun begins!***

　　嘛嘛，无论如何，过关了就好。

　　这题呢是要让所有的 `boss` 给毁灭掉即可—— 当所有的 `boss` 毁灭之后会爆出任务道具 `theAlgorithm` 然后就能通关了。

　　后来我发现可以让子弹消灭 `boss`。但是我当时没这么做。

　　我先弄了堵墙把子弹挡住先：

```javascript
map.defineObject("保命的", {
    impassable: function() {
        return true;
    },
    symbol: "❤",
    onCollision: function() {
    }
});

for(var i = 0; i < map.getWidth(); i++) {
    map.placeObject(i, 9, "保命的");
}
```

　　这下你就能捡到电话机了——然后给电话机写回调函数。

　　怎么说呢，当你每用一次电话机，我就把当前存在于屏幕的 `boss` 和 `bullet` 给分开罗列，然后把 `boss` 的 `_destroy`（警察叔叔，就是这个函数是我 `console.log` 出来的）给嫁接到 `bullet` 的 `_destroy` 去。

　　这样会出现什么样的结果呢？——当子弹碰到墙的时候就会销毁，这个时候会触发 `_destroy` 函数，但是这个时候的 `_destroy` 函数已经会变成了 `boss` 的了，也就是说这个时候子弹不会被销毁反而是某一个 `boss` 的 `_destroy` 函数被调用然后被销毁了。

　　再怎么说这都是 Hack 的办法，所以并不会触发 `boss` 的 `onDestroy` 函数也就是说即使所有 `boss` 都没了也不会出现 `theAlgorithm` 这玩意儿。

> 自己动手丰衣足食！

　　敌人不给我们我们就自己造呗！反正通关判定是——`boss` 数量为 `0` 且你有 `theAlgorithm` 这个道具。

　　所以说当所有 `boss` 都被销毁之后，我们自己去 `map.replaceObject` 一个 `theAlgorithm` 道具即可。

```javascript
map.getPlayer().setPhoneCallback(function() {
    var bosses = [];
    var bullets = [];
    var objects = map.getDynamicObjects();
    for(var i = 0; i < objects.length; i++) {
        if(objects[i].getType() == "boss") {
            bosses.push(objects[i]);
        } else {
            bullets.push(objects[i]);
        }
    }
    for(var i = 0; i < Math.min(bosses.length, bullets.length); i++) {
        bullets[i]._destroy = bosses[i]._destroy;
    }

    if(bosses.length === 0) {
        map.placeObject(map.getPlayer().getX(), map.getPlayer().getY() + 1,
            'theAlgorithm');
    }
});
```

　　以上代码写完后就开始打 `boss` 吧！赶紧去拿到电话机，然后你会发现打一个电话 `boss` 就少一堆，那感觉倍爽儿！

## End of the Line

　　马上要通关了。这里是个坑，开始我还以为这里就是真·通关了 QAQ。

　　随后看看后面还是有关卡啊。但是我突然发现 `<ctrl+0>` 跳出来的 menu 左边多出了文件夹！然后进去随意翻看了。

　　最后发现原来是要修改 `scripts/objects.js` 文件→＿→。

　　好吧，分析通关验证来看，这一关的 `map.finalLevel` 为 `true`。所以我们只需要把 `scripts/objects.js` 文件里面的：

```javascript
if(!game.map.finalLevel) {
    game._moveToNextLevel();
}
```

给改成如果是 `finalLevel` 就跑到下一关去就可以了：

```javascript
if(game.map.finalLevel) {
    game._moveToNextLevel();
}
```

## Credits

　　由于事先文章结构没有写好，就接这关的坑位来小结吧 0. 0。（反正人家只是序幕章了

　　好的，其实也什么总结的，但是总觉得得有这么个小结才对。

　　找工作啊找工作——有想要我的请联系我 2333333333

　　联系资料在 [CV](http://xcoder.in/curriculumvitae/) 里面。
