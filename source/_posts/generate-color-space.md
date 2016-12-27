title: 如何生成一个覆盖广的色板
date: 2014-10-16 11:00:54
tags: [ HSL, RGB, 色板, Palette, Color Space, 色彩空间 ]
category: Programming
---

## 用途

　　在主题色提取的过程中，要把颜色加入搜索引擎。但是如果是真彩色任意值加进去的话，对于搜索的时候来说无疑是一个复杂的操作。搜索条件要各种计算距离什么的。

　　于是一个妥协的做法就是提供一套调色板，保证所有颜色都被吸纳到调色板中的某一色值当中。

　　那么这个时候调色板的覆盖率以及距离什么的就比较重要了。本文就讲如何生成一套看起来还不错的自用“标准色板”。

## Windows 色板

　　一开始我用了一套 256 色的色板，不知道哪里搞来的 Windows 色板。

　　由于颜色太多，不好贴代码，我就直接把链接贴过来了：

> [点我萌萌哒 ฅ(๑*д*๑)ฅ!!](https://github.com/XadillaX/thmclrx/blob/4a5bff429f25294af7111de800063ffd90cce1d8/src/common.cpp#L29)

　　这一套色板大致的效果如下：

<style>
#standard-256 {
    line-height: 10px;
    padding: 0;
    margin: 0;
}
#standard-256 span {
    width: 40px;
    height: 20px;
    display: inline-block;
}
</style>

<div class="well"><div id="standard-256"></div></div>

<script src="http://blog.xcoder.in/theme-color-slide/palette.js"></script>
<script>
$(function()
{
    for (var i = 0; i < palette.length; i++)
    {
        var block = "<span style=\"background: rgba(" +
            palette[i][0] + ", " + palette[i][1] + ", " +
            palette[i][2] + ", 1);\"></span>";
        $("#standard-256").append(block);
    }
});
</script>

## 生成更好的色板

　　我指的更好并不一定真的比之前找到的 256 色要好，毕竟上面那个是人家智慧和劳动的结晶。我指的更好是颜色更多，但是偏差又不会太大。

　　理论上我们能按照那种规则生成比真彩色少的任意种数的色板。

### 相关的色彩模式

　　这里有必要重新普及下 N 多种色彩模式中的其中两种，也就是我们今天生成一个色板所用到的两种模式。

#### RGB 色彩模式

　　这个大家都已经耳熟能详了，无非是 RGB 通道中的分量结合起来生成的一种颜色。

> RGB 色彩模式是工业界的一种颜色标准，是通过对红 (R)、绿 (G)、蓝 (B)三个颜色通道的变化以及它们相互之间的叠加来得到各式各样的颜色的，RGB 即是代表红、绿、蓝三个通道的颜色，这个标准几乎包括了人类视力所能感知的所有颜色，是目前运用最广的颜色系统之一。
>
> 使用 RGB 模型为图像中每一个像素的 RGB 分量分配一个 0 ~ 255 范围内的强度值。RGB 图像只使用三种颜色，就可以使它们按照不同的比例混合，在屏幕上呈现 16777216 (`256 * 256 * 256`) 种颜色。

#### HSL 色彩模式

> HSL 色彩模式是工业界的一种颜色标准，是通过对色相 (H)、饱和度 (S)、明度 (L) 三个颜色通道的变化以及它们相互之间的叠加来得到各式各样的颜色的，HSL 即是代表色相，饱和度，明度三个通道的颜色，这个标准几乎包括了人类视力所能感知的所有颜色，是目前运用最广的颜色系统之一。

　　HSL 色彩模式就是今天的主角了。我们将会用 HSL 生成一张类似下图的色板，而色板的粒度将会与你决定色板的颜色数量相关：

![HSL Color Space](SqfinPalette-RealColorWheel-RGB-14inwide72dpi-1024x437.png)

### 代码实现

　　为了简化代码，我们暂时不考虑饱和度，也就是说所有颜色让它饱和度都为 **100%**。

　　而且实际上色相是在一个圆里面的 0° ~ 360°，那么也就是说我们只需要做两步就是了：

1. 色相 0° ~ 360° 循环；
2. 以及明度 0% ~ 100% 循环。

　　在这里我定了一个步长：色相以 10° 为一个步长，明度以 5% 为一个步长。并且剔除 RGB 相等的黑白灰色。

> 当然这里步长完全可以按照自己的喜好来。

　　我们以前端的 Javascript 为例，能想到下面的一段代码：

```javascript
var count = 0;
$(function() {
    for(var i = 19; i >= 0; i--) {
        for(var j = 0; j < 36; j++) {
            $("#palette").append("<div class='color'></div>");
            $(".color").eq(count++).css("background-color", "hsl(" + (j * 10) + ", " + "100%, " + parseInt(((i + 1) / 21) * 100) + "%)");
        }
        $("#palette").append("<div style='clear: both;'></div>");
    }
});
```

　　这里需要注意的是，实际上我明度的步长是 `(100 / 22)`。然后 `0` 和 `100` 这两个明度我们另外拎出来，所以只取了 1 ~ 21 的明度。

　　剩下的就是跟刚才说的一样，各色相的各明度生成一个 HSL 颜色赋值给 `background-color`。

　　接下去我们生成一个灰色条的色板，专治灰黑白。这个时候实际上我们可以直接用 RGB 搞定：

```javascript
$("#palette").append("<br />");
for(var i = 0; i < 36; i++) {
    $("#palette").append("<div class='color'></div>");
    var val = parseInt(((19 - i) / 19) * 255);
    $(".color").eq(count++).css("background-color", "rgb(" + val + ", " + val + ", " + val + ")");
}
```

　　最后把颜色输出到一个数组就好了。

> 这里有一点 happy 的是，就算你是用 HSL 来搞的背景色，用 ***jQuery*** 的 `$(foo).css("background-color")` 获取到的仍然是 RGB 值。

```javascript
var colors = [];
$(".color").each(function() {
    var result = /rgb\((\d+), (\d+), (\d+)\)/.exec($(this).css("background-color"));
    colors.push({ r: parseInt(result[1]), g: parseInt(result[2]), b: parseInt(result[3]) });
});

$("textarea").val(JSON.stringify(colors));
```

　　所以最后我们还需要初始的 HTML 了：

```html
<textarea></textarea>
<div id="palette"></div>
<div style="clear: both;"></div>
```

　　效果的话这里能看到：

+ http://blog.xcoder.in/hsl-color-space/
+ http://runjs.cn/code/spahru8w

## 小结

　　用 HSL 生成的色彩空间（色板）一个是表现力好，相对于 RGB 来说，好像更好知道如何去生成分部比较 OK 的一个色彩空间。

　　但是也有一个缺点，当我们不去管饱和度的时候，实际上我们还是丢失了一部分的颜色。好在本身我们生成色板也只是为了合并颜色，可以通过 k-D 树来快速寻找某个颜色在色板中是属于哪种色块的。当然，目前我们就是这么做的。

## 参考资料

+ [Color Wheel Palette](http://websafecolorcodes.com/colors-palette/color-wheel-palette/)
+ [Refer Image](http://www.waldronconstructionllc.com/wp-content/uploads/2012/03/SqfinPalette-RealColorWheel-RGB-14inwide72dpi-1024x437.png)
+ [Algorithm](http://codeforartists.com/samples/cfa-color-palette-hsl.php)

