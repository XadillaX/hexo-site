title: 一次 macOS 下 C++ 的 STL 踩坑记录
date: 2018-12-07 18:51:27
tags: [ Node.js, C++, macOS, STL ]
---

## 背景

最近有在做 RocketMQ 社区的 Node.js SDK，是基于 RocketMQ 的 C SDK 封装的 Addon，而 C 的 SDK 则是基于 C++ SDK 进行的封装。

然而，却出现了一个诡异的问题，就是当我在消费信息的时候，发现在 macOS 下得到的消息居然是乱码，也就是说 Linux 下居然是正常的。

## 重现

> 首先我们要知道一个函数是 `const char* GetMessageTopic(CMessageExt* msg)`，用于从一个 `msg` 指针中获取它的 Topic 信息。

乱码的代码可以有好几个版本，是我在排查的时候做的各种改变：

```cpp
// 往 JavaScript 的 `object` 对象中插入键名为 `topic` 的值为 `GetMessageTopic`

// 第一种写法：乱码
Nan::Set(
  object, // v8 中的 JavaScript 层对象
  Nan::New("topic").ToLocalChecked(),
  Nan::New(GetMessageTopic(msg)).ToLocalChecked()
);

// 另一种写法：乱码
const char* temp = GetMessageTopic(msg);
Nan::Set(
  object, // v8 中的 JavaScript 层对象
  Nan::New("topic").ToLocalChecked(),
  Nan::New(temp).ToLocalChecked()
);

// 第三种写法：乱码
string GetMessageColumn(CMessageExt* msg, char* name)
{
  // ...

  const char* orig = GetMessageTopic(msg);
  int len = strlen(orig);
  char temp[len + 1];
  memcpy(temp, orig, sizeof(char) * (len + 1));
  return temp;
}

const char* temp = GetMessageColumn(msg, "topic");
Nan::Set(
  object, // v8 中的 JavaScript 层对象
  Nan::New("topic").ToLocalChecked(),
  Nan::New(temp).ToLocalChecked()
);
```

并且很诡异的是，当我在调试第三种写法的时候，我发现在 `const char* orig = GetMessageTopic(msg);` 这一部的时候 `orig` 的值是正确的。而一步步单步运行下去，一直到 `memcpy` 执行结束的时候，`orig` 内存块里面的字符串居然被莫名其妙修改成乱码了。

参考如下：

![](https://s1.ax1x.com/2018/12/07/F3KN59.gif)

这就不能忍了。

当我锲而不舍的时候，发现当我改成这样之后，返回的值就对了：

```cpp
string GetMessageColumn(CMessageExt* msg, char* name)
{
  // ...

  const char* orig = GetMessageTopic(msg);
  int len = strlen(orig);
  int i;
  char temp[len + 1];
  for(i = 0; i < len + 1; i++)
  {
    temp[i] = orig[i];
  }

  // 做一些其它操作

  return temp;
}

const char* temp = GetMessageColumn(msg, "topic");
Nan::Set(
  object, // v8 中的 JavaScript 层对象
  Nan::New("topic").ToLocalChecked(),
  Nan::New(temp).ToLocalChecked()
);
```

但问题在于，在“其它操作”中，`orig` 还是会变成一堆乱码。当前返回能正确的原因是因为我在它变成乱码之前，用可以“不触发”变成乱码的操作先把 `orig` 的字符串给赋值到另一个字符数组中，最后返回那个新的数组。

问题看似解决了，但是这种诡异、危险的行为始终是我心中的一颗丧门钉，不处理总之是慌的。

## RocketMQ C++ SDK 源码查看

在排查的过程中，我去看了 RocketMQ 的 C++ 和 C SDK 的实现，我把重要的内容摘出来：

```cpp
class MQMessage {
public:
  string::string getTopic() const {
    return m_topic;
  }

  ...

private:
  string m_topic;

  ...
}

// MQMessageExt 是继承自 MQMessage

const char* GetMessageTopic(CMessageExt *msg) {
    ...
    return ((MQMessageExt *) msg)->getTopic().c_str();
}
```

我们阅读一下这段代码，在 `GetMessageTopic` 中，先得到了一个 `getTopic` 的 STL 字符串，然后调用它的 `c_str()` 返回 `const char*`。一切看起来是那么美好，没有问题。

但我后来在多次调试的时候发现，对于同一个 `msg` 进行调用 `GetMessageTopic` 得到的指针居然不一样！我是不是发现了什么新大陆？

诚然，`msg->getTopic()` 返回了一个字符串对象，并且是通过拷贝构造从 `m_topic` 那边来的。依稀记得大学时候看的 STL 源码解析，根据 STL 字符串的 Copy-On-Write 来说，我没做任何改变的情况下，它们不应该是同源的吗？

**事实证明，我当时的这个“想当然”就差点让我查不出问题来了。**

## 柳暗花明

在我捉鸡了好久之后一直毫无头绪之后，在参考资料 1 中获得了灵感，我开始打开脑洞（请原谅我这个坑还找了很久，毕竟我主手武器还是 Node.js），会不会现在的 String 都不是 Copy-On-Write 了？但是 Linux 下又是正常的哇。

后来我在网上找是不是有人跟我遇到一样的问题，最后还是找到了端倪。

> 不同的 stl 标准库实现不同， 比如 CentOS 6.5 默认的 stl::string 实现就是 『Copy-On-Write』， 而 macOS（10.10.5）实现就是『Eager-Copy』。

说得白话一点就是，不同库实现不一样。Linux 用的是 libstdc++，而 macOS 则是 libc++。而 libc++ 的 String 实现中，是不写时拷贝的，一开始赋值就采用深拷贝。也就是说就算是两个一样的字符串，在不同的两个 String 对象中也不会是同源。

其实深挖的话内容还有很多的，例如《Effective STL》中的第 15 条也有提及 String 实现有多样性；以及大多数的现代编译器中 String 也都有了 Short String Optimization 的特性；等等。

## 回到乱码 Bug

得到了上面的结论之后，这个 Bug 的原因就知道了。

`((MQMessageExt *) msg)->getTopic()` 得到了一个函数中的栈内存字符串变量。

+ 在 Linux 中，就算是栈内存变量，但是它的 `c_str()` 还是源字符串指向的指针，所以函数声明周期结束，这个栈内存中的字符串被释放，`c_str()` 指向的内存还坚挺着；
+ 在 macOS 下，由于字符串是栈内存分配的，字符串又是深拷贝，所以 `c_str()` 的生命周期是跟着字符串本身来的，一旦函数调用结束，该字符串就被释放了，相应地 `c_str()` 对应内存中的内容也被释放。

综上所述，在 macOS 下，我通过 `GetMessageTopic()` 得到的内容其实是一个已经被释放内存的地址。虽然通过 `for` 可以趁它的内存块被复制之前赶紧抢救出来，但是这种操作一块已经被释放的内存行为总归是危险的，因为它的内存块随时可能被覆盖，这也就是之前乱码的本质了。

## 更小 Demo 验证

对于 STL 在这两个平台上不同的行为，我也抽出了一个最小化的 Demo，各位看官可以在自己的电脑上试试看：

```cpp
#include <stdio.h>
#include <string>
using namespace std;

string a = "123";

string func1()
{
    return a;
}

int main()
{
    printf("0x%.8X 0x%.8X\n", a.c_str(), func1().c_str());
    return 0;
}
```

上面的代码在 Linux 下（如 Ubuntu 14.04）运行会输出两个一样的指针地址，而在 macOS 下执行则输出的是两个不一样的指针。

## 小结

在语言、库的使用中，我们不能去使用一个没有明确在文档中定义的行为的“特性”。例如文档中没跟你说它用的是 Copy-On-Write 技术，也就说明它可能在未来任何时候不通知你就去改掉，而你也不容易去发现它。你就去用已经定义好的行为即可，就是说 `c_str()` 返回的是字符串的一个真实内容，我们就要认为它是跟随着 String 的生命周期，哪怕它其中有黑科技。

毕竟，下面这个才是 C++ reference 中提到的定义，我们不能臆想人家一定是 COW 行为：

> Returns a pointer to a null-terminated character array with data equivalent to those stored in the string.
>
> The pointer is such that the range `[c_str(); c_str() + size()]` is valid and the values in it correspond to the values stored in the string with an additional null character after the last position.

这一样可以引申到 JavaScript 上来，例如较早的 ECMAScript 262 第三版对于一个对象的定义中，键名在对象中的顺序也是未定义的，当时就不能讨巧地看哪个浏览器是怎么样一个顺序来进行输出，毕竟对于未定义的行为，浏览器随时改了你也不能声讨它什么。

好久没写文了，码字能力变弱了。

以上。

## 参考资料

1. 《[Why does calling c_str() on a function that returns a string not work?](https://stackoverflow.com/questions/27627413/why-does-calling-c-str-on-a-function-that-returns-a-string-not-work/50490703#50490703)》
2. 《[Why a new C++ Standard Library for C++11?](https://libcxx.llvm.org/#why)》
3. 《Effective STL》第 15 条：注意 String 实现的多样性
4. 《[C++ 之 stl::string 写时拷贝导致的问题](https://yanyiwu.com/work/2016/01/30/copy-on-write-stl.html)》
5. 《[C++ 再探 String 之eager-copy、COW 和 SSO 方案](https://www.cnblogs.com/cthon/p/9181979.html)》
6. 《[C++ Short String Optimization stackoverflow 回答集锦以及我的思考](https://www.jianshu.com/p/10e6564536ed)》
