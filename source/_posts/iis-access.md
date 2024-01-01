title: Win7 64bit：IIS 不能连接 Access！？解决方案。
date: 2010-10-29 11:39:38
tags: [ 老博客备份归档, IIS ]
category: 老博客备份归档
---
　　今天凌晨在搞我的新项目。不过当我写好 `conn.asp` 之后，发现无法连接数据库。也就是说数据库无法打开。

　　一直从十二点搞到四点，一直以为是我的进程出问题了，不断调试。后来越来越觉得不对劲，最后我把网站指向以前机子里的一些 ASP 进程。最后发现，原来所有页面都无法连上数据库。我想也许是权限问题，所以我把一些文档夹的权限弄来弄去，结果还是不行。

　　接下来就是去网上搜了。开始也是怎么也搜不到，因为我忽略了一个非常重要的问题：我用的是 64 位的系统！

　　好吧，在IIS里，应用进程池貌似 64 位的不能连数据库。于是有这幺一个方案。

　　打开IIS里的应用进程池：

![Missing](https://dm.nbut.ac.cn/xcoder/archive/missing.jpg)


　　如图所示，选中 Classic .NET AppPool，然后是到右边栏里选择“设置应用进程池默认设置”。

![Missing](https://dm.nbut.ac.cn/xcoder/archive/missing.jpg)


　　最后在“常规”里将“激活32位应用进程”设置为True即可正常访问Access数据库了。

![Missing](https://dm.nbut.ac.cn/xcoder/archive/missing.jpg)
