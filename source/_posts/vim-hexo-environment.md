title: 搭建 VIM 下的 Hexo 编辑环境 
date: 2014-06-02 04:52:30
tags: [ vim, hexo ]
---

　　本文只讲两个函数，对于 `markdown` 如何高亮之类的问题还请自行谷歌。

　　然后请打开你自己的 `.vimrc` 文件。

## 预备工作

　　首先定义一个变量——你自己的 `hexo` 目录，如果要跨平台可以做个判断之类的，如下：

```vimrc
if has("win32")
    let g:hexoProjectPath="E:\\cygwin\\home\\XadillaX\\hexo"
else
    let g:hexoProjectPath="~/hexo/"
endif
```

## 几个函数

### 进入 Hexo 目录

　　这个函数大致就是让你进入你自己的 `Hexo` 路径：

```vimrc
fun! OpenHexoProjPath()
    execute "cd " . g:hexoProjectPath
endfun
```

### 打开一篇 Post

　　接下去就是一个打开 `Post` 的函数了：

```vimrc
function! OpenHexoPost(...)
    call OpenHexoProjPath()

    let filename = "source/_posts/" . a:1 . ".md"
    execute "e " . filename
endfunction
```

> 解析：上面的代码大意就是进入 Hexo 路径，然后设定好文件名，最后执行 `:e filename` 即可打开文件了。

### 新建一篇 Post

　　新建的流程跟打开相似，只不过首先要在 `Hexo` 目录下执行一遍 `hexo new FOO` 的命令而已，命令执行完毕之后再打开即可。

```vimrc
function! NewHexoPost(...)
    call OpenHexoProjPath()

    let filename = a:1
    execute "!hexo new " . filename

    call OpenHexoPost(a:1)
endfunction
```

## 指令映射

　　函数写好后我们最后把函数映射成类似于 `:e`, `:w` 之类的后面能跟着参数的指令即可。

　　以前木有接触过的同学可以参考一下[这里](http://vimdoc.sourceforge.net/htmldoc/usr_40.html#40.2)的文档。

### 打开指令

```vimrc
command -nargs=+ HexoOpen :call OpenHexoPost("<args>")
```

### 新建指令

```vimrc
command -nargs=+ HexoNew :call NewHexoPost("<args>")
```

## 使用方法

　　当你做完以上步骤的时候，你就可以无论在什么目录下在 VIM 里面通过下面的指令进行新建一篇日志了：

```vim
:HexoNew artical-name
```

　　以及下面的指令来打开一篇已存在的日志：

```vim
:HexoOpen artical-name
```

## 遗留问题

　　相信看到这里之后，大家也能自己写出一个生成的指令了，这里就不累述了，无非就是：

```vim
:!hexo generate
```

