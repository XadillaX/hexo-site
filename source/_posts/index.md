title       : 浙江大学XPlan项目新闻爬虫手机屏幕适配文档
category    : Programming
date        : 2013-12-28
tags        : [ Node.js, XPlan ]
---

## 前言

**XPlan** 是一个“基于校园强关系的社交应用”的开发代号。其中有一个功能是从学校网站上通过网络爬虫（Web Crawler）形式将学校新闻抓取到XPlan自身的数据库当中。

而这里出现的一个问题就是学校网站上面的文章是通过类似于 [`KindEditor`](http://kindeditor.net/)、[`UEditor`](http://ueditor.baidu.com/website/)这类**在线富文本编辑器**生成的代码。

这类代码有几个共性：

  1. 代码有大量冗余、多重无用嵌套。
  2. 非常低的代码可读性。
  3. 在PC浏览器中表现力不错，往往能以低效的代码实现预期排版。
  
所以这些富文本编辑器可以在PC各大内核浏览器中表现良好，但是不便人工修改代码。

而 **XPlan** 确是一个由智能手机主导的应用，新闻将会通过一个 **WebView** 体现出来。所以就需要一定的方法将这些脏乱的代码适配成手机屏幕下表现力良好的代码。

## 预处理

在这里，我们将新闻的代码锁定在新闻内容排版，而排除了其它类似于新闻标题、新闻作者等其它信息。

以我们浙江大学软件学院为例，我们爬取的新闻内容代码将如下：

{% code html %}
<div class="vid_wz">
    ...
</div>
{% endcode %}

所有内容将被包括在这个类型为 `vid_wz` 的 `div` 当中。

这时，我们将其包括在一个自己实现定义好的模板当中。该模板与新闻内容将会形成一个完整的网页，包括完整的 `html`、`head`、`body` 等标签。

{% code html %}
<!DOCTYPE html>
<html>
<head>
    <title>新闻内页</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
</head>
    
<body>
    <article id="_xplan-wrapper">
        <div class="vid_wz">
            ...
        </div>
    </article>
</body>
</html>
{% endcode %}

这里需要注意的一点的就是其中的一个 `meta` 标签：

{% code html %}
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
{% endcode %}

它的意思是定义 `viewport` 的一些属性，实现了初步的手机网页适配。

### Viewport

手机浏览器是把页面放在一个虚拟窗口（即 `viewport`）中，用户可以通过平移和缩放来看网页的不同部分。

通过 `viewport` 我们能对页面的一些缩放进行手机适配。

我们所需要做的仅是在 `head` 中插入一个 `meta` 标签，命名为 `viewport`，然后定义好其 `content`。

`content` 的语法如下：

#### width

控制 `viewport` 的宽度，可以指定一个值或者特殊的值，如 `device-width` 为设备宽度。

#### height

与 `width` 相对应，指定高度

#### initial-scale

初始缩放，即页面初始缩放程度。这是一个浮点值，是页面大小的一个乘数。例如，如果你设置初始缩放为 `1.0`，那么页面在展现的时候就会以分辨率的1:1来展现。如果你设置为`2.0`，那么这个页面就会放大为2倍。

#### maximum-scale

最大放大倍数。

#### user-scaleble

用户调整缩放，即用户是否能改变页面缩放程度。如果为 `yes` 即为可以， `no` 为不可以。

## Cheerio模块*

由于 **XPlan** 的后端是基于 `node.js` 构架的，所以 **cheerio** 模块是一个 `node.js` 专有的模块。

它的作用是将一段HTML代码转换为一棵DOM元素树。

在其官网上是这么诠释的：为服务端定制的快速、灵活、轻量级实现的 jQuery 内核。通常熟悉 jQuery 使用的开发者应该会对其使用方法比较熟悉。

所以在我们做接下去适配修改的之前，我们需要将我们刚才生成的完整HTML代码 转换为一棵我们可以操作的DOM元素树。

{% code javascript %}
var cheerio = require("cheerio");
$ = cheerio.load(...);
{% endcode %}

这时我们便能以熟悉的jQuery模式对其进行操作了，如：

{% code javascript %}
$("p").html("hello foo!");
{% endcode %}

## Bootstrap

Bootstrap是Twitter推出的一个开源的用于前端开发的工具包。它有一个非常好的响应式的页面风格，使其在个尺寸屏幕上表现良好。

为了能更好适应屏幕，我们决定采用其自带的栅格系统，于是刚才的页面模板就有了新的变化：

{% code html %}
<!DOCTYPE html>
<html>
<head>
    <title>新闻内页</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
</head>
    
<body>
    <article class="container" id="_xplan-wrapper">
        <div class="row">
            <div class="col-md-12">
                <div class="vid_wz">...</div>
            </div>
        </div>
    </article>
</body>
</html>
{% endcode %}

首先最外框的 `container`，用其包裹的元素将实现居中对齐。在不同的媒体查询阈值范围内都为 `container` 设置了 `width`，用以匹配栅格系统。

`row` 是一行栅格系统的外包元素。一行可以有12个栅格。

以 `.col-md-` 开头的栅格的最大 `container` 宽度为970，最大列宽为78，并能自适应屏幕。

## 细节处理

在完成了以上操作以后，我们将对各元素进行微调处理。

好在在手机浏览器或者 `WebView` 中，对各种字体的设置不是非常敏感，所以我们仍然可以不处理一些关于字体变更的设置，以减轻开发量。

这里距几个微调的例子。

### &lt;img />

在新闻当中，图片充当的基本上是新闻照片的角色，在手机当中以单行出现为佳。

而 Bootstrap 当中本身就有元素类型来让图片元素响应屏幕宽度，并可以加上圆角边框。

所以我们需要做的就是为所有图片加上响应的类型：

{% code javascript %}
$("img").addClass("img-thumbnail");
$("img").addClass("img-responsive");
$("img").removeAttr("style");
{% endcode %}

> **注意：** 最后的一个移除 `img` 元素自带的 `style` 属性是因为在文章发布的时候，有可能会被富文本编辑器自动加上一些宽高、边框等信息。为了统一所有图片风格以及让响应式生效，需要将其 `style` 属性全部移除。

下面是是适配前与适配后的对比：

![适配前](/images/xplan-news-1.jpg)
![适配后](/images/xplan-news-2.jpg)

### &lt;table>&lt;/table>

对于 `table` 元素也需要对它进行自适配，不然很有可能会溢出屏幕，使其多出了一个横向的滚动条。

{% code javascript %}
$("table").removeAttr("style");
$("table").removeAttr("border");

$("table").addClass("table");
$("table").addClass("table-bordered");
$("table").addClass("table-striped");
{% endcode %}

上面两句是移除 `table` 的原有的一些风格信息以及属性。后面是为其加上 Bootstrap 特有的 `table` 类型。

当然，更多的 `table` 元素还需要其它更多操作。不过就目前为止，**XPlan** 还没有着手关于 `table` 的更深一层容错处理。不过这里可以提供一个思路。

比如说 [这篇文章中](http://www.cst.zju.edu.cn/index.php?c=Index&a=detail&catid=72&id=1885)，不知道是谁给的在线富文本编辑器勇气，使其下面几张图片都各自被一个 `table` 及其子元素所包含。更有甚者，有一篇文章的一个段落被一个 `table` 所包容，并且在其左侧还有一个看不见的 `td` 元素。

我们可以提供的思路就是如果一个 `table` 只有一行一列就直接将其内容取出并删除该 `table` 。

### &lt;a />

超链接元素是一个新闻与用户互动的比较重要的元素之一。我们需要保持其美观性。

举几个例子来说，我们可以将超链接以一个类按钮的形式出现：

{% code javascript %}
$("a").removeAttr("style");
$("a").addClass("btn btn-default btn-xs btn-info");
{% endcode %}

然后我们甚至可以对其做一些细微的词汇修改。

比如当新闻发布者上传了一个附件然后不负责任地直接将文件名贴上的时候，我们可以贴心地将其显示文字改为“下载附件”。

再比如发布者直接以URL形式显示一个超链接的时候，我们可以贴心地将其改变为“打开链接”等等。

{% code javascript %}
$("a").each(function(idx, elem) {
    if($(this).html().match(/.*\.(doc|xls|ppt|docx|xlsx|pptx)/)) {
        $(this).html("<i class='glyphicon glyphicon-paperclip'></i> 下载附件");
        $(this).removeClass("btn-info");
        $(this).addClass("btn-warning");
    } else if($(this).html().match(/http.*\/\/.*/)) {
        $(this).html("<i class='glyphicon glyphicon-flag'></i> 打开链接");
        $(this).removeClass("btn-info");
        $(this).addClass("btn-warning");
    }
});
{% endcode %}

然后我们再处理几个由于误操作而增加的错误链接，如在经上面操作后，还存在着url与显示内容相关的超链接可以直接取消，如这类：

{% code html %}
让我们荡<a href="起双桨">起双桨</a>
{% endcode %}

## 结束语

至此，当下版本的 **XPlan** 的新闻爬虫手机屏幕适配基本完成。其中当然还存在着一些细节处理和显示错误处理的不足，但是已经定下了基本的适配思路。

我们还在探索更好的适配方法，而当下的适配形式暂时已经可以满足了我们项目的需求。
