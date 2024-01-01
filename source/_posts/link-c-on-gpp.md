title: 在 C++ 中链接 C 的 文件
date: 2014-12-10 15:30:32
tags: [ C++ ]
---

## 原因

由于某些原因，我写了个很搓的[内存池](https://github.com/XadillaX/xmempool)（C 版本的）。

然后我想到了把之前写的一个 Node.js 包 [thmclrx](https://github.com/XadillaX/thmclrx) 的更挫的“伪·内存池”用新写的内存池去替换掉。(❛◡❛✿)

然后问题就来了，我貌似不能控制 node-gyp 去用 G++ 编译 `*.c` 文件，这样的话所有文件编译好之后链接 `*.o` 文件会出问题。虽然链接的时候没报错，但是使用的时候就会报这么个错 (;´༎ຶД༎ຶ`)：

```sh
➜ thmclrx git:(master) ✗ node test/test.js
dyld: lazy symbol binding failed: Symbol not found: __Z16xmem_create_poolj
  Referenced from: /Users/.../code/huaban/thmclrx/build/Release/thmclrx.node
  Expected in: dynamic lookup

dyld: Symbol not found: __Z16xmem_create_poolj
  Referenced from: /Users/.../code/huaban/thmclrx/build/Release/thmclrx.node
  Expected in: dynamic lookup

[1]    52501 trace trap  node test/test.js
```

大致意思就是说在我编译好链接好的 `thmclrx.node` 中找不到 `__Z16xmem_create_poolj` 这个符号，也就是说 `xmempool.o` 这个用 C 编译出来的文件并没有正确被链接。

## 假想方案

### 假想一

一开始我想找的是“如何在 node-gyp 中手动选择编译器”，即不让机器自动选择 GCC 去编译 `*.c` 文件。后来无果。ル||☛_☚|リ

### 假想二

再后来我想开了，于是决定让编译的时候去识别我在跟 C 说话还是跟 C++ 说话。(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧

## 解决方案

于是我找到了这么个帖子：http://grokbase.com/t/gg/nodejs/14amregx72/linking-c-sources-files-in-cc-files

他貌似也遇到了跟我相似的问题。下面这个提问者自己提出了这样的回答：

> Nevermind, found my own answer after finally hitting the right google search terms.
>
> Added
>
> ```cpp
#ifdef __cplusplus
extern "C" {
#endif

//... source code here...

#ifdef __cplusplus
}
#endif
```

> So that the CPP compiler would know I was talking C and not CPP :)

答案的大意就是在你的 C 头文件中添加上面 blahblah 一大段宏，好让 C++ 的编译器知道它是在跟 C 的中间文件交流而不是 C++，这样的话链接的时候就能正常接轨了。于是我在我的新版 [xmempool](https://github.com/XadillaX/xmempool/commit/b06351836c9b51952a3d98c438df6626dda8738c) 的头文件里面就已经添加上了这两段话了。

## 事后烟

其实以前我也老在别的项目里面看到这个 `#ifdef __cplusplus` 的宏定义，只不过以前不知道什么意思。

今天通过这么一件事情终于知道了它的用途了，新技能 get √。

ε(*´･∀･｀)зﾞ

