title: C++对象工厂模式：ObjectFactory学习笔记
date: 2010-11-17 15:49:45
tags: [ 老博客备份归档, C++, 设计模式 ]
category: 老博客备份归档
---

　　对象工厂，顾名思义，就是产生对象的一个“工厂”。根据传入的一个参数而产生相应的不同种类的对象。

　　用于批量生成同一个父类的不同子类的对象时用到。

　　本学习笔记基于Singleton（单件模式）基础上进行扩展。

　　看《C++单件模式：Singleton学习笔记》请点击[链接](/2010/11/13/singleton-learning/)。

　　对于工厂模式，网上有很多不同的实现方法。我这里是一个HGE的RPG Demo中所用的，这段代码本身写的非常的好，开始好些语句没看懂，虽然就这么几句话。花了一点时间去研究了其代码，并自己重新实现了一遍，加上了通俗易懂的注释。

　　工厂类以模板形式实现，基于Singleton：

```cpp
/**--------------------------------
 * 对象工厂模式(Object Factory)
 *
 * Code by XadillaX
 * http://www.xcoder.in
 * Created at 2010-11-17 1:33
 */
#ifndef OBJECTFACTORY_H
#define OBJECTFACTORY_H
#pragma once
#include <map>
#include <string>
#include "../单件模式/Singleton.h"

template<class T>
class ObjectFactory : public Singleton<ObjectFactory<T>>
{
public:
    typedef T* (*tCreator)();                               ///< 重定义对象生成函数指针
    typedef std::map<std::string, tCreator> tCreatorMap;    ///< 对象生成函数指针map

    /**
     * @brief 注册新“生产车间”
     * 将生成对象的函数加入对象工厂
     *
     * @param *name 类名称
     * @param procedure “生产”对象的函数
     * @return 是否成功注册
     */
    bool Register(char *type, tCreator procedure);

    /**
     * @brief 找到“生产车间”
     * 根据传入的类名返回相应的新对象的生成函数
     *
     * @param &type 类名
     * @return 相应的新对象的生成函数
     */
    T* Create(const std::string &type);

private:
    /** “生产车间”映射 */
    tCreatorMap _map;
};

template<class T>
bool ObjectFactory<T>::Register(char *type, tCreator procedure)
{
    string tmp(type);
    /** 将新函数加入map中 */
    _map[tmp] = procedure;
    return _map[tmp];
}

template<class T>
T* ObjectFactory<T>::Create(const std::string &type)
{
    /** 在映射中找到相应“生产车间” */
    tCreatorMap::iterator iter = _map.find(type);

    /** 检测“车间”是否存在 */
    if(iter != _map.end())
    {
        /** 让返回值为相应的“生产车间” */
        tCreator r = iter->second;

        /** 返回“生产车间” */
        return r();
    }

    return 0;
}

#endif
```

　　以上就是基于单件模式而实现的工厂模式了。

　　在样例中，我建立了一个基类Base，然后用A和B来继承它。

　　在一个for循环中，交替建立了A对象和B对象。这只是一个Demo，看不出有什么方便的，感觉用一个if来各自生成就好了，就像
  
```cpp
if(type == "A") p = new A();
else p = new B();
```

　　**当然，上面也是一种方法。但是，试想一下，我们将要创建的A、B、C、D、E、F、G类放到一个配置文件中，然后我们从配置文件中读取这些数据并创建相应的对象，并且这些对象的顺序是打乱的，你就要有n个if来判断了，而且扩展性不高。用一个对象工厂进行封装的话，俨然形成了一个静而有序的生产工厂，有秩序地管理着不同的对象车间，不觉得这是一件非常美妙的事情么？**

　　好了，话不多说，直接上Demo。

```cpp
#include <iostream>
#include "ObjectFactory.h"
using namespace std;
/** 基类 */
class Base;

/** Base类及其子类的对象工厂 */
typedef ObjectFactory<Base> BaseFactory;

class Base
{
public:
    Base(){};
    ~Base(){};
};

class A : public Base
{
public:
    A(){ cout << "An A object created." << endl; };
    ~A(){};
};

class B : public Base
{
public:
    B(){ cout << "A B object Created." << endl; }
    ~B();
};

/** 对象A的“生产车间” */
Base* ACreator()
{
    return new A();
}

/** 对象B的“生产车间” */
Base* BCreator()
{
    return new B();
}

/**
 * @brief 主函数
 */
int main()
{
    /** 将A、B的“生产车间”注册到对象工厂中 */
    bool AFlag = BaseFactory::Instance().Register("A", ACreator);
    bool BFlag = BaseFactory::Instance().Register("B", BCreator);

    /** 若注册失败则退出 */
    if(!AFlag || !BFlag) exit(0);

    Base *p;
    for(int i = 0; i < 10; i++)
    {
        string type = (i % 2) ? string("A") : string("B");

        /** p用相应“生产车间”进行生产 */
        p = BaseFactory::Instance().Create(type);

        delete p;
    }

    return 0;
}
```
