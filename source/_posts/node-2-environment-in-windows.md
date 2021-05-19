title       : 一起撸Node.JS（负贰）——环境
category    : NodeJS
date        : 2013-08-15
tags        : [ Node.js, JavaScript, 一起撸Node.js ]
---

　　由于[Linux]({{ page.url }}#linux-环境)中的环境搭建比较简单，所以草草略过。

　　其实[Windows]({{ page.url }}#windows-环境)下也不算麻烦，但是这里会讲一定量的别的环境的搭建。


<!-- 我是小小分割符 -->
## Linux 环境

讲到这个就很简单了，跟着下面的 **bash** 操作即可：

{% code sh %}
$ cd /usr/local/bin
$ wget http://nodejs.org/dist/v0.00.00/node-v0.00.00-linux-x00.tar.gz
$ tar zxf node-v0.00.00-linux-x00.tar.gz
$ cd node-v0.00.00-linux-x00
{% endcode %}

> 其中将上方的 **v0.00.00** 替换成 **Node.js** 最新的版本号，把 **x00** 替换成你自己电脑的位数。
>
> 也可以直接去官网 [http://nodejs.org/download/](http://nodejs.org/download/) 找到相应的地址。

最后将其的连接加入到 `/usr/bin` 下即可。

{% code sh %}
$ cd bin
$ ln node /usr/bin
$ ln npm /usr/bin
{% endcode %}

> **注意**： 该用 `sudo` 的地方就用 `sudo` 或者 `su` 。

至此，**Linux** 下的 **Node.js** 环境基本搭建完毕。

## Windows 环境

### Cygwin 安装和配置

***Cygwin*** 是一个在 ***Windows*** 平台上运行的 ***Unix*** 模拟环境。对于学习 ***Unix/Linux*** 操作环境，或者从 ***Unix*** 到 ***Windows*** 的应用程序移植，或者进行某些特殊的开发工作，尤其是使用 ***GNU工具集*** 在 ***Windows*** 上进行嵌入式系统开发，非常有用。

#### Cygwin 安装

我们先跑到 **Cygwin** 的官网上去把东西下来：

> [http://cygwin.com/install.html](http://cygwin.com/install.html)
>
> > 注意，最好下 **x86** 的包，因为我们之后要讲一个 `cyg-apt` 的脚本插件，这是一个能让 **Cygwin** 能跟 **Linux** 一样通过脚本从源安装软件包的脚本。为了方便修改，我们将其下成 **x86** 的版本。

然后就是安装步骤了。

<center>![从网络安装](http://blog-xcoder-in.qiniudn.com/cygwin-install-1.png)</center>
<center><small>[图2.1]</small></center>

到 **[图2.1]** 这个步骤的时候，选择默认的 `Install from Internet` 即可。

<center>![选择安装路径](http://blog-xcoder-in.qiniudn.com/cygwin-install-2.png)</center>
<center><small>[图2.2]</small></center>

在 **[图2.2]** 的时候选一个安装路径。

> **注意**：尽可能让这个安装路径简单，而不要是类似于
>
> `c:\Program Files\blahblah`
>
> 这样的文件路径。

<center>![本地包路径](http://blog-xcoder-in.qiniudn.com/cygwin-install-3.png)</center>
<center><small>[图2.3]</small></center>

**[图2.3]** 的时候选一个本地包的路径，我这里选的是 `e:\cygwin\tmp`。

<center>![直连](http://blog-xcoder-in.qiniudn.com/cygwin-install-4.png)</center>
<center><small>[图2.4]</small></center>

**[图2.4]** 选择直接连接。

<center>![163](http://blog-xcoder-in.qiniudn.com/cygwin-install-5.png)</center>
<center><small>[图2.5]</small></center>

我们国内的用户源还是选择 `163` 的速度比较快。所以在 **[图2.5]** 这一步的时候就直接选用默认的 `163` 的源了。如果不是默认的话，请选中它。

在 **Select Package** 也就是选择预安装的软件的时候，把下列表中的软件包勾选起来：

> + **wget**: 在 **Utils** 中
> + **vim**: 在 **Editors** 中
> + **gcc**: 在 **Devel** 中
> + **gcc-g++**: 在 **Devel** 中
> + **make**: 在 **Devel** 中
> + **cmake**: 在 **Devel** 中

若是这些选项已经被选起来了就不用再选了，如果没有选起来则把它选中。

勾选好了之后就可以下一步安装了，直至安装完毕，你就可以打开你的 **Cygwin** 了。

<center>![Cygwin](http://blog-xcoder-in.qiniudn.com/cygwin-install-6.png)</center>
<center><small>[图2.6]</small></center>

> **提示**：你可以点击窗口左上角的小图片，然后里面的 **Options** 中，你可以调整你自己的 **Cygwin** 外观。

### vim 配置

上一步我们已经选中了 **vim** ，也就是说我们已经在 **Cygwin** 中装上了 **vim**。但是由于这里的 **vim** 默认配置非常蛋疼，所以我们得改一下。

在你的 **Cygwin** 中一句句输入下面的命令：

{% code sh %}
$ cd /home/<你自己的用户名>
$ wget http://blog-xcoder-in.qiniudn.com/.vimrc
$ mkdir .vim
$ cd .vim
$ mkdir colors
$ cd colors
$ wget http://blog-xcoder-in.qiniudn.com/molokai.vim
{% endcode %}

这样你的 **vim** 就用上了上面的那个地址的配置文件，当然你也可以编辑你自己的配置文件或者说从网上下别的配置文件以满足你的个性化需求。

**vim** 配置以及使用请参照：[https://wiki.archlinux.org/index.php/Vim](https://wiki.archlinux.org/index.php/Vim)

> 事无巨细问 **ArchWiki**。
> <div style="text-align: right;">*-- [kalxd](https://github.com/kalxd)*</div>

### apt-cyg

> apt-cyg is a command-line installer for Cygwin which cooperates with Cygwin Setup and uses the same repository. The syntax is similar to apt-get.
>
> <div style="text-align: right;">*-- From apt-cyg googlecode page*</div>

总之意思就是说 `apt-cyg` 是类似于 **Linux** 中的 `apt-get`， `yum`, `zypper` 等命令行软件包安装器一样，可以通过

+ `apt-cyg install <package names>` 来安装软件包
+ `apt-cyg remove <package names>` 来移除软件包
+ `apt-cyg update` 来更新 setup.ini
+ `apt-cyg show` 来列出已安装的软件包
+ `apt-cyg find <pattern(s)>` 来查找符合条件的软件包
+ `apt-cyg describe <pattern(s)>` 来描述符合条件的软件包
+ `apt-cyg packageof <commands or files>` 来定位其父软件包

#### apt-cyg 安装

其实也不能说是安装，纯粹是把脚本从网络上拷到自己的 **Cygwin** 的环境目录中。

在你的 **Cygwin** 中输入以下命令：

{% code sh %}
$ cd /usr/local/bin
$ wget http://apt-cyg.googlecode.com/svn/trunk/apt-cyg
{% endcode %}

这样你就“安装”好了 **apt-cyg** 了。不过这里用的是默认的源，所有东西都是默认的。

如果你现在已经心安理得或者不想折腾了可以跳过 **[2.1.3.2. apt-cyg 修改](#apt-cyg-修改)**，如果你想把源换成 `163` 的话那么稍微看一下吧。

#### apt-cyg 修改

接下去我们要对 **apt-cyg** 做一些编辑。

你有下面两个选择：

1. 如果你想学习 **vim** 操作或者你已经熟悉了，那么直接使用 `vim apt-cyg` 来进行编辑。
2. 如果你是懒人还是想要直接编辑的话，请跑到你的 **Cygwin** 的安装目录，找到 **usr** 文件夹，飞进 **local/bin** 目录中去，用你自己喜欢的文本编辑器打开并编辑。

大约是 `68` 行上下吧，有一句是：

{% code bash %}
  mirror=ftp://mirror.mcs.anl.gov/pub/cygwin
{% endcode %}

将其改成：

{% code bash %}
  mirror=http://mirrors.163.com/cygwin
{% endcode %}

还有就是大概在 `98` 行和 `105` 行左右：

{% code bash %}
    wget -N $mirror/setup.bz2
    ...
    wget -N $mirror/setup.ini
{% endcode %}

修改成：

{% code bash %}
    wget -N $mirror/x86/setup.bz2
    ...
    wget -N $mirror/x86/setup.ini
{% endcode %}

至此，你的 **Cygwin** 环境基本完成，以后可以再慢慢完善。

### Node.js 安装

这个就很简单了，打开 **[Node.js](http://nodejs.org/download/)** 官网下载安装即可。

> 选择 **Windows Installer (.msi)** 或者 **Windows Binary (.exe)**。

安装好后就能直接在 **Cygwin** 里面使用了。

## 真·Hello World

现在，无论你是 **Linux** 用户还是 **Windows** 用户，都可以用一样的步骤来完成下面的 `Hello World` 了。

随便跑一个目录里面新建一个文件并且用 **vim** 编辑：

{% code sh %}
$ vim hello.js
{% endcode %}

在里面输入下面的东西：

{% code javascript %}
console.log("Hello world!");
{% endcode %}

然后退出 **vim** 执行：

{% code sh %}
$ node hello.js
{% endcode %}

终于，**真·Hello world** 出现在了你的眼前，而不需要借助 **[IDEOne](http://ideone.com/)** 了。

***To be continued...***
