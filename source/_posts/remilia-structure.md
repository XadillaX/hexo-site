title: Remilia 結構圖
date: 2015-01-08 16:47:17
tags: [ Remilia, 蕾米莉亞 ]
---

## 蕾米莉亞？

其實這是花瓣的一個入庫系統結構圖，蕾米莉亞是這個項目的名字。

## 結構圖

![Remilia](pic.jpg)

設計得不好，純屬做歸檔。

其中 SanaeHDCS 是另一套系統，給 RemiliaHDPS 提供數據的。

### Data Layer

主要分爲 Bathtub，Dryer，Vampire 三個部分。

#### Bathtub 浴缸

由 SanaeHDCS 提供的數據，存儲在 MongoDB 當中。

#### Dryer 吹轟雞

將 Bathtub 出來的溼數據變成乾貨的解析器，根據不同的數據用不同的規則進行解析。

#### Vampire 血族

全名其實是 Vampire Coffin，只不過把這個寫到項目裏面看着貌似不是很吉利，於是取了前半部分。吹轟機處理好的幹活會存儲在這邊，實際上也是
MongoDB 裏面。然後 Vampire 提供給外部接口，讓其能夠用正確的姿勢獲取正確的乾貨數據。

### Fake Internet

一個視窗。

### Fake Koumakan

假的紅魔館，裏面一堆 Puppet。

> 每個 Puppet 都有自己的屬性、人格、作息時間和生活。

## 01 / 12 / 2015

重新設計了 Remilia 結構圖。

![Remilia](new.jpg)

## 最後

好吧還是我的腦洞太大了。我知道你們看着這貨不知所云。

好吧忘了這個東西吧，我只是無聊發一篇而已。

