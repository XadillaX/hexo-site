title: 关于 Online Judge System 的编译延时的一种解决方案
date: 2010-12-08 01:47:27
tags: [ 老博客备份归档, Online Judge ]
category: 老博客备份归档
---

在 OJ 里，编译是评测的第一步。

通常情况下，大家都是用 bat 文件加命令行进行编译的。但这里不好控制时间。如果用一个线程去监控这个编译进程，进程结束就下一步的话，未免有点小题大做了。

我采用的是下面一种“文件锁”的方法：

在创建 bat 文件的同时创建一个“文件锁”文件，如 `.lock`。

然后在 bat 文件的最后一行加入一句 `del .lock` 即可。而在程序中你只要在运行 bat 之后来一句

```cpp
while(0 == access(“.lock”, 0));
```

这样就可以做到延时了。等到文件锁被删除之后，就表示文件编译完成。

当然，有可能编译时间过久，那这里也可以从 `while` 下文章，加一个条件，如果时间到了，则删掉这个进程即可。

下面是部分的实现代码：

```cpp
/** 这段代码就是生成bat文件的代码 */
bool NCompiler::MakeBat(const char *cmd)
{
    FILE *fp;
    FILE *lock;                     ///< 编译锁文件
    if(NULL == (fp = fopen(BAT_FILENAME, "w+")) ||
        NULL == (lock = fopen(LOCK_FILENAME, "w+")))
    {
        fclose(fp);
        fclose(lock);
        return false;
    }
    
    /** 输出编译命令 */
    fprintf(fp, "%s", cmd);
    
    /** 测试编译锁时的延时指令 */
    //fprintf(fp, "ping 127.0.0.1\n");

    /** 输出删除编译锁命令 */
    fprintf(fp, "del %s\n", LOCK_FILENAME);
    
    fclose(fp);
    fclose(lock);
    
    return true;
}
```
