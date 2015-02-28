title: 一起用 Node.js 剖析 Minecraft 的 NBT 文件——上
date: 2015-01-22 10:05:39
tags: [ NBT, Minecraft, Node.js, MC ]
---

## 起因

想寫這篇博文好久了，一直木有抽出時間來——因爲太忙了。什麼『Sanae』啊，什麼『Remilia』啊等等等等。

不過今天趁着需要被 Review 一大段代碼的空檔，抽出點時間來寫一下這篇文章。

事情的起因大概是因爲花瓣這邊與又拍雲那邊的 Minecraft 合服引起的，大家都希望保留自己的資源以及地標建築，於是決定把地圖文件座標平移放到一個世界。於是涉及到了解析 Minecraft 的[地圖文件](https://github.com/XadillaX/mcregion)。

這個地圖文件裏面的 Chunk 體就是一段被壓縮過的 NBT 格式二進制內容，詳情可以參見 Minecraft 的 WIKI 中的[這一段](http://minecraft.gamepedia.com/Region_file_format#Chunk_Data)。

> Chunk data begins with a (big-endian) four-byte length field which indicates the exact length of the remaining chunk data in bytes. The following byte indicates the compression scheme used for chunk data, and the remaining (length-1) bytes are the compressed chunk data.
>
> Minecraft always pads the last chunk's data to be a multiple-of-4096B in length (so that the entire file has a size that is a multiple of 4KiB). Minecraft will not accept files in which the last chunk is not padded. Note that this padding is not included in the length field.

然後我就開始瞭解析 NBT 文件之旅了。

本來我是想直接用 C++ 來進行解析的，畢竟對內存的操作各種方便。但是後來考慮到還要讓力叔幫忙用 NW 寫一個低效的各種編輯器，於是還是採用了 Node.js 來解析。

## NBT 文件

### 什麼是 NBT

NBT 全稱爲 ***Named Binary Tag***，即二進制命名標籤，主要用於 Minecraft 的各種文件、數據的持久化存儲。解析出來的結果有點類似於 JSON，實際上就是一棵標籤樹。

### 格式詳解

既然 NBT 是一種 `Tag` 類的東西，那麼基礎當然就是標籤了。據 WIKI 所述，自 [Minecraft Beta](http://minecraft.gamepedia.com/Minecraft_Beta) 1.3 之後，隨着鐵氈的引入，一共有 19133 種標籤，而原先只有 19132 種。實際上 [Minecraft Indev](http://minecraft.gamepedia.com/Minecraft_Indev) 中只有 0 ~ 10 這 11 種標籤。

我們今天所講的也僅是針對這 11 種標籤以及第 12 種 Integer 型數組標籤進行解析。

NBT 中的一個標籤體就是 NBT 這棵標籤樹的一個組成部分。一個標籤的第一個字節爲這個標籤的種類 ID，將會在下文中對 0 ~ 11 種不同的標籤進行簡述。然後接下去會緊跟着兩個字節，這兩個字節的內容代表了這個標籤名的長度（UTF8 格式下的）,雖然 Minecraft 自己從來木有在標籤名裏面亂入空格，實際上這個標籤名是支持空格的。然後接下去的 N 個字節是根據不同的標籤種類跟隨着該類型標籤特有的內容體。
