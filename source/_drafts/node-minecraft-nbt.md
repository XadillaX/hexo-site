title: 一起用 Node.js 剖析 Minecraft 的 NBT 文件——上
date: 2015-01-22 10:05:39
tags: [ NBT, Minecraft, Node.js, MC ]
---

## 起因

想写这篇博文好久了，一直木有抽出时间来——因为太忙了。什么『Sanae』啊，什么『Remilia』啊等等等等。

不过今天趁着需要被 Review 一大段代码的空档，抽出点时间来写一下这篇文章。

事情的起因大概是因为花瓣这边与又拍云那边的 Minecraft 合服引起的，大家都希望保留自己的资源以及地标建筑，于是决定把地图文件座标平移放到一个世界。于是涉及到了解析 Minecraft 的[地图文件](https://github.com/XadillaX/mcregion)。

这个地图文件里面的 Chunk 体就是一段被压缩过的 NBT 格式二进制内容，详情可以参见 Minecraft 的 WIKI 中的[这一段](http://minecraft.gamepedia.com/Region_file_format#Chunk_Data)。

> Chunk data begins with a (big-endian) four-byte length field which indicates the exact length of the remaining chunk data in bytes. The following byte indicates the compression scheme used for chunk data, and the remaining (length-1) bytes are the compressed chunk data.
>
> Minecraft always pads the last chunk's data to be a multiple-of-4096B in length (so that the entire file has a size that is a multiple of 4KiB). Minecraft will not accept files in which the last chunk is not padded. Note that this padding is not included in the length field.

然后我就开始了解析 NBT 文件之旅了。

本来我是想直接用 C++ 来进行解析的，毕竟对内存的操作各种方便。但是后来考虑到还要让力叔帮忙用 NW 写一个低效的各种编辑器，于是还是采用了 Node.js 来解析。

## NBT 文件

### 什么是 NBT

NBT 全称为 ***Named Binary Tag***，即二进制命名标签，主要用于 Minecraft 的各种文件、数据的持久化存储。解析出来的结果有点类似于 JSON，实际上就是一棵标签树。

### 格式详解

既然 NBT 是一种 `Tag` 类的东西，那么基础当然就是标签了。据 WIKI 所述，自 [Minecraft Beta](http://minecraft.gamepedia.com/Minecraft_Beta) 1.3 之后，随着铁毡的引入，一共有 19133 种标签，而原先只有 19132 种。实际上 [Minecraft Indev](http://minecraft.gamepedia.com/Minecraft_Indev) 中只有 0 ~ 10 这 11 种标签。

我们今天所讲的也仅是针对这 11 种标签以及第 12 种 Integer 型数组标签进行解析。

NBT 中的一个标签体就是 NBT 这棵标签树的一个组成部分。一个标签的第一个字节为这个标签的种类 ID，将会在下文中对 0 ~ 11 种不同的标签进行简述。然后接下去会紧跟着两个字节，这两个字节的内容代表了这个标签名的长度（UTF8 格式下的）,虽然 Minecraft 自己从来木有在标签名里面乱入空格，实际上这个标签名是支持空格的。然后接下去的 N 个字节是根据不同的标签种类跟随着该类型标签特有的内容体。
