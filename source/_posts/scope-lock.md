title: 线程安全——Scope Lock模式
date: 2012-09-8 01:31:59
tags: [ 老博客备份归档, C++, ScopeLock, 线程安全, 线程死锁 ]
category: 老博客备份归档
---

　　***嘛，本文是建立在M$的Visual Studio基础上的，linux☭勿喷。***

　　我最先用到 ScopeLock 模式是在自己开发 **XAE引擎** 的时候。在里面用到挺多的线程函数，那么如何解决临界区就成了一个重要的课题。可能大家想，不就一个线程锁临界区什么的么，一个 `EnterCriticalSection` 和一个 `LeaveCriticalSection` 不就解决了么？

　　其实不然。在 **M$** 中，最常用的当然就是 `CRITICAL_SECTION` 了，但是如果临界区上锁却木有解锁呢？这就会发生死锁现象。对于一个粗心的程序猿来说这样的错误还是有机率发生的。就算你足够细心，还是有时候会一失足成千古恨。

　　所以就有了这么一种方法来杜绝这种死锁的产生—— `ScopeLock`。

　　那么什么叫 `ScopeLock`？

　　我们试想一下如果有这么一个类——在构造的时候，你传进去一个 `CRITICAL_SECTION` 的引用并且将其 `EnterCriticalSection` 进入到临界区。当它析构的时候，我们直接 `LeaveCriticalSection` 就好了。

　　也许你会问，这样的一个类会有什么用呢？

　　那么我下面演示一段简单的 ScopeLock 代码先吧：

```cpp
struct ScopeLock
{
    CRITICAL_SECTION& m_cs;

    ScopeLock(CRITICAL_SECTION cs) : m_cs(cs)
    {
        EnterCriticalSection(&m_cs);
    }

    ~ScopeLock()
    {
        LeaveCriticalSection(&m_cs);
    }
};

int i;
CRITICAL_SECTION cs;

// ...假设我们已经初始化好了这个临界区

void ScopeLockTest()
{
    ScopeLock oLock(cs);
    i = 0;
}
```

　　我们可以发现，当我们刚进入 `ScopeLockTest` 函数的时候，声明了一个 `oLock` 对象，这个时候运行 `oLock` 的构造函数，也就是进入了 `cs` 这个临界区。而当 `ScopeLockTest` 函数运行完毕要退出这个函数的时候，`oLock` 对象的生命周期也就走到了尽头，对应的，它将会执行析构函数，那么就自然而然地退出了 `cs` 临界区。

　　其实无论 `ScopeLockTest` 这个函数怎么写，哪怕是中间有一些 `if` 判断直接 `return` 掉，只要是 `ScopeLockTest` 这个函数执行完毕，`oLock` 就会自动析构，从而达到了解锁过程。那么不管粗心还是细心的童鞋们都不用为忘记退出临界区而烦恼了。

　　而且 `ScopeLock` 模式只是一种思想，并不是对于 **M$** 的临界区的一种专用性物品。例如在QT里，我们一样可以用 `ScopeLock` 来对线程的一些 `MutexLock` 之类的东西进行操作。

　　上面所写的例子只是思路的一种形成，并不是一个完整的ScopeLock类（结构体），虽然说它现在已经可以用了。你可以在上面完善，加上自己的东西，使其能确确实实在项目中使用。由于代码的关联性，我单单发出我的 `ScopeLock` 的话会缺少很多关联的东西，所以咱就不发了，思路在这里，相信谁都能写出自己的一个 `ScopeLock` 吧。