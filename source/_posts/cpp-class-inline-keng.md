title: C++中类成员函数 inline 的坑
date: 2014-04-05 16:55:57
tags: [ Programming, C++ ]
category: Programming
---

　　今天我来讲一讲 `C++` 中类成员函数 `inline` 修饰符的一个坑。

　　这个坑是我在尝试着写我的第一个 `Node.js` 扩展 `simpleini` 时候遇到的。

　　因为只是尝试着写，所以懒得自己实现，于是网上找了个开源的 `C++` 阅读 ini 文件的项目，名不见经传，叫 [miniini](http://miniini.tuxfamily.org/)。

　　好了，问题来了，当我写好我的源文件的时候，然后写好了我的 `binding.gyp` ，总之一切大功告成开始编译的时候—— `Windows` 下没问题，`MacOS` 下也可以正常运行，但是在 `Linux` 下就出问题了：

```sh
node: symbol lookup err: .../simpleIni.node: undefined symbol: _ZNK10INISection10ReadStringEPKcRS1_
```

　　大致的意思呢就是说找不到 `INISection` 的 `ReadString` 函数符号。

　　又是怀着崇敬的心情去 [SO](http://stackoverflow.com/questions/22868307/undefined-symbol-in-node-js-c-addon-under-linux-why) 求解了。

　　最后的解答大概[如下](http://isocpp.org/wiki/faq/inline-functions#inline-member-fns)：

> 内联成员函数的声明看起来像一个非内联函数的声明：
>```cpp
class Fred {
public:
    void f(int i, char c);
};
```

> 但是你的内敛成员函数定义前面又加了 `inline` 这个关键字时，你必须把这个定义放到头文件中：
>```cpp
inline
void Fred::f(int i, char c)
{
    // ...
}
```

> 这么做的原因就是为了避免链接器 `unresolved external` 的发生。如果你不这么做，这个错误就将会在你从另外一个 `.cpp` 文件中调用它时出现。

　　好嘛，原来是原作者自己写的代码有问题啊。但是不得不说一下又涨姿势了。C++还真是有千奇百怪的坑和错误啊。

　　最后的解决方案大致就是把函数定义放到头文件中去，或者在函数声明前面也加上 `inline` 关键字。