title: 在 C++ 中鏈接 C 的 文件
date: 2014-12-10 15:30:32
tags: [ C++ ]
---

## 原因

由於某些原因，我寫了個很搓的[內存池](https://github.com/XadillaX/xmempool)（C 版本的）。

然後我想到了把之前寫的一個 Node.js 包 [thmclrx](https://github.com/XadillaX/thmclrx) 的更挫的“僞·內存池”用新寫的內存池去替換掉。(❛◡❛✿)

然後問題就來了，我貌似不能控制 node-gyp 去用 G++ 編譯 `*.c` 文件，這樣的話所有文件編譯好之後鏈接 `*.o` 文件會出問題。雖然鏈接的時候沒報錯，但是使用的時候就會報這麼個錯 (;´༎ຶД༎ຶ`)：

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

大致意思就是說在我編譯好鏈接好的 `thmclrx.node` 中找不到 `__Z16xmem_create_poolj` 這個符號，也就是說 `xmempool.o` 這個用 C 編譯出來的文件並沒有正確被鏈接。

## 假想方案

### 假想一

一開始我想找的是“如何在 node-gyp 中手動選擇編譯器”，即不讓機器自動選擇 GCC 去編譯 `*.c` 文件。後來無果。ル||☛_☚|リ

### 假想二

再後來我想開了，於是決定讓編譯的時候去識別我在跟 C 說話還是跟 C++ 說話。(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧

## 解決方案

於是我找到了這麼個帖子：http://grokbase.com/t/gg/nodejs/14amregx72/linking-c-sources-files-in-cc-files

他貌似也遇到了跟我相似的問題。下面這個提問者自己提出了這樣的回答：

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

答案的大意就是在你的 C 頭文件中添加上面 blahblah 一大段宏，好讓 C++ 的編譯器知道它是在跟 C 的中間文件交流而不是 C++，這樣的話鏈接的時候就能正常接軌了。於是我在我的新版 [xmempool](https://github.com/XadillaX/xmempool/commit/b06351836c9b51952a3d98c438df6626dda8738c) 的頭文件裏面就已經添加上了這兩段話了。

## 事後煙

其實以前我也老在別的項目裏面看到這個 `#ifdef __cplusplus` 的宏定義，只不過以前不知道什麼意思。

今天通過這麼一件事情終於知道了它的用途了，新技能 get √。

ε(*´･∀･｀)зﾞ

