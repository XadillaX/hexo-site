title: C++单件模式：Singleton学习笔记
date: 2010-11-13 15:44:15
tags: [ 老博客备份归档, C++, 设计模式 ]
category: 老博客备份归档
---

　　单件模式（Singleton）是一种用于确保整个应用程序中只有一个类实例且这个实例所占资源在整个应用程序中是共享时的程序设计方法（根据实际情况，可能需要几个类实例）。在某些情况下，这种程序设计方法是很有用处的。

　　在小小地学习了一下C++的单件模式之后，突然联想到PHP的ThinkPHP的MVC框架，觉得这就是一个单件模式的很好实例吧？

　　我上次在PUDN上载了一个HGE的RPG Demo，里面就用了Singleton模式还有ObjectFactory模式写的。没看懂，于是问了谷歌。

> Singleton可以说是《Design Pattern》中最简单也最实用的一个设计模式。那么，什么是Singleton？
顾名思义，Singleton就是确保一个类只有唯一的一个实例。Singleton主要用于对象的创建，这意味着，如果某个类采用了Singleton模式，则在这个类被创建后，它将有且仅有一个实例可供访问。很多时候我们都会需要Singleton模式，最常见的比如我们希望整个应用程序中只有一个连接数据库的Connection实例；又比如要求一个应用程序中只存在某个用户数据结构的唯一实例。我们都可以通过应用Singleton模式达到目的。
>
> 一眼看去，Singleton似乎有些像全局对象。但是实际上，并不能用全局对象代替Singleton模式，这是因为：其一，大量使用全局对象会使得程序质量降低，而且有些编程语言例如C#，根本就不支持全局变量。其二，全局对象的方法并不能阻止人们将一个类实例化多次：除了类的全局实例外，开发人员仍然可以通过类的构造函数创建类的多个局部实例。而Singleton模式则通过从根本上控制类的创建，将”保证只有一个实例”这个任务交给了类本身，开发人员不可能再有其它途径得到类的多个实例。这一点是全局对象方法与Singleton模式的根本区别。
>
> <p style="text-align: right;">——摘自百度百科（我不是有意在谷歌找百度的）</p>

　　我在看了这个RPG Demo的Pattern里的Singleton之后，仿照着自己写了一个最简单的Singleton模板实例。

　　***思想就是，在Singleton中建立一个静态对象，然后以后就用 `Singleton::Instance()` 来调用这个静态对象。***

　　***而作为模板就是可以 `class A : public Singleton` 来让A继承Singleton的属性，那么我们就可以直接用 
`A::Instance()` 来访问A这个静态对象了。这个就是这段Singleton代码的主要思想了。***

　　先是建立了一个空工程，往里面放了：
  
　　Singleton.h

```cpp
#pragma once
#ifndef SINGLETON_H
#define SINGLETON_H

template<class T>
class Singleton
{
public:
    static T& Instance();

protected:
    Singleton(){}
    virtual ~Singleton(){}

/**
 * 防止拷贝复制
 */
private:
    Singleton(const Singleton &);
    Singleton & operator = (const Singleton &);
};

template<class T>
T& Singleton::Instance()
{
    /** 建立一个静态对象 */
    static T instance;
    return instance;
}

#endif
```

　　TestSingleton.h

```cpp
#pragma once

#ifndef TESTSINGLETON_H
#define TESTSINGLETON_H

#include "Singleton.h"
#include <iostream>
using namespace std;

class TestSingleton;

/** 从Singleton继承本类 */
class TestSingleton : public Singleton
{
private:
    int count;

public:
    TestSingleton(void);
    virtual ~TestSingleton(void);
    void AddCount(){ count++; }
    void CoutCount(){ cout << count << endl; }
};

#endif
```

　　TestSingleton.cpp
  
```cpp
#include "TestSingleton.h"

TestSingleton::TestSingleton(void)
: count(0)
{
}

TestSingleton::~TestSingleton(void)
{
}
```

　　main.cpp

```cpp
#include "TestSingleton.h"
using namespace std;

int main()
{
    for(int i = 0; i < 100; i++)
    {
        /** 单件对象count值加1 */
        TestSingleton::Instance().AddCount();
        /** 输出此单件对象的count值 */
        TestSingleton::Instance().CoutCount();
    }

    return 0;
}
```

