title: 关于jQuery中“animate()”函数对颜色变化的支持
date: 2012-12-24 09:20:16
tags: [ 老博客备份归档, Javascript, jQuery ]
category: 老博客备份归档
---

　　最近在做一个汽车团购网的项目，由于老大力求简洁，所以界面做得有些小清新。不过得说一下页面不是我设计的，是一位美工同志。

　　废话不多说，直接切入正题吧——

　　我要做得就是让下面一段代码生效：

```javascript
$("#yourid").stop().animate({ "backgroundColor" : "#rrggbb", "color" : "#rrggbb" }, "fast");
```

　　但是，很遗憾，一点也没有动。本来效果应该跟这个版本的xcoder博客的天头导航条一样有个动态效果（只不过xcoder的导航条是透明度变化，而项目中我想让它背景色变化）。

　　原因是什么呢？死月上网查了很久，找到的东西都很简单地说明了一下，貌似都可以。嘛，也许是jQuery新版本不支持这个特性了吧。

　　最后，死月在jQuery的官方文档中找到了下面这段话——
  
> All animated properties should be animated to ***a single numeric value***, except as noted below; most properties that are non-numeric cannot be animated using basic jQuery functionality (For example, width, height, or left can be animated but background-color cannot be, unless the [jQuery.Color()](https://github.com/jquery/jquery-color) plugin is used). Property values are treated as a number of pixels unless otherwise specified. The units em and % can be specified where applicable.
>
> <p style="text-align: right">—— [jQuery官方文檔 .animate()](http://api.jquery.com/animate/)</p>

　　大致的意思就是说所有动画属性都必须是一个单数字值，所以说大多数非数字的属性是不能被动画化的。例如高度、宽度等可以被动画化，但是背景色就不信了。<span style="color: red;">***除非你用了jQuery.Color()插件***</span>。

　　所以说问题找到了，我们必须得用一个jQuery.Color()插件来对一些颜色进行动画操作。

　　话不多说，我们去下一个jQuery.Color()插件。把它加在我们的页面中，然后就可以用如下方式来进行动画操作了：

```javascript
$(this).stop().animate({
    "backgroundColor" : jQuery.Color("rrggbb"),
    "color" : jQuery.Color("rrggbb")
}, "fast");
```