title: Cocos2d-x 3.1.1 开发环境搭建（Win篇）
date: 2014-06-07 19:34:02
tags: [ cocos2d ]
category: 游戏开发
---

　　由于偷懒，所以在此感谢 Etond 的指导（喂喂喂，明明是自己懒得看文档，明明 [`READEME.md`](README) 里面就有！(´≖◞౪◟≖)

　　另，在搭建环境的时候，最好保证你在<span style="background: #222;">墙外</span>。以及我默认觉得大家已经有了 `Python` 环境和 `JDK`。

## 前驱工作

　　先去 [cocos2d-x 官网](http://www.cocos2d-x.org/download)下压缩包，放到一个只有神知道的世界里面。

　　接下去需要安装仨东西：

### Android SDK

　　[这东西](http://developer.android.com/sdk/index.html#download)真尼玛大啊！我家的小水管真吃不起。

　　然后把 **adt-bundle-...zip** 这个包压缩到任意木有中文和空格的路径下面。

### NDK

　　[这小伙伴](http://developer.android.com/tools/sdk/ndk/index.html#download)也不小啊。都是 500M 的主儿啊（٩(ŏ﹏ŏ、)۶

　　也解压到一个地方不用管它。

### Ant

　　据说这货是阿帕奇出的？总之下载地址在[这里](http://ant.apache.org/bindownload.cgi)。

## 安装

　　哦对了你还得有个 Python 路径，这里就不累述了。接下去在命令行里面执行 Cocos2d 的 `setup.py` 文件即可：

```shell
/> py setup.py
```

　　接下去终端会停在下面一行：

```shell
Please enter the path of NDK_ROOT (or press Enter to skip):
```

　　在后面输入你放好的 NDK 目录即可。

　　如果下面又出现了：

```shell
Please enter the path of ANDROID_SDK_ROOT (or press Enter to skip):
```

　　你只需在里面输入你刚放好的 Android SDK 的目录即可。（注意是要刚才的 SDK 压缩包解压出来的 sdk 路径）

　　再如果下面还出现：

```shell
Please enter the path of ANT_ROOT (or press Enter to skip):
```

　　那么再把 Ant 的路径搞上去就好了。（又得注意这里得是 Ant 的 bin 目录）

　　最后确保终端（或者说命令行）里面出现如下字样：

```shell
Please restart the terminal or restart computer to make added system variables take effect
```

　　然后你把终端关了再开一个就好了。至此，大致就安装完毕了。

## 新建一个 Demo 项目

　　随意跑到一个目录下面执行下面的命令：

```shell
/> cocos new FirstGame -p in.xcoder.firstgame -l cpp -d FirstGame
```

> 大致意思就是说创建一个新的项目路径，叫 `FirstGame`，其包名叫 `in.xcoder.firstgame`，然后语言是 `cpp`，最后 `-d` 是路径。

　　命令详情帮助可以看 `cocos --help`。

### 编译 Demo

　　读标题，是 Win 篇。所以我们跑到项目路径下面的 `proj.win32` 目录下面用 M$ VS 打开 `FirstGame.sln` 就可以打开刚创建的模板项目了。

　　无论如何先编译看看吧！～

　　如何？跑起来了吧？

### 打包 Demo

　　这里就讲讲如何打包安卓的版本吧：

#### Debug 版本

　　跑到你的项目目录下面（即有 `.cocos-project.json` 文件的目录），然后执行下面的命令：

```shell
/> cocos run -p android
```

　　等工具编译打包完成就 OK 了。（记得要查安卓手机并且调试模式哦～）

#### Release 版本

　　如果要上传到 Google Play 之类的地方，需要有签名。所以发布 Release 版本之前，你先得搞好自己的签名。

##### Keytool

　　在终端跑到你的项目路径下面，然后执行：

```shell
/> keytool -genkey -v -keystore FirstGame.keystore -alias FirstGame -keyalg RSA -keysize 2048 -validaty 10000
```

　　照着命令行给的提示完成创建密钥即可。

##### 编译

　　生成之后啊就直接执行编译命令了：

```shell
/> cocos run -p android -m release
```

　　在里面呢最后会让你输入 `.keystore` 文件的路径。

　　我们输入相对路径，由于我们刚才把这个文件搞在项目根目录，所以我们只需要输入 `../FirstGame.keystore` 即可。接下去他会让你输入密码、别名和别名信息的密码。你都正确输入一遍他就会安安分分跑在你的手机里面了。

#### 仨版本的文件路径

　　上面都弄好之后，你的仨版本 `*.apk` 文件也就生成了。很多人可能很困惑，为什么是仨版本。因为其中 Release 版本还分带签名和没签名版本。

　　总之那个路径在 `publish/android` 下面，里面有仨 `*.apk` 文件，你拿出来发布就可以了。

## 小结

　　其实也没什么结不结的，这些东西你们自己去看看官方文档就好了。总之就这样了吧，以上。
