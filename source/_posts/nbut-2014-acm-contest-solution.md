title: 「NBUT 2014 校赛·网络同步赛」题解
date: 2014-05-05 15:08:39
tags: [ ACM, 算法 ]
category: ACM
---

　　这次比赛由 [Hungar](http://blog.163.com/surgy_han/)，[8Mao](http://www.cnblogs.com/Wine93/) 以及我负责的。明明都读研了，还诈尸回来出题——归结起来大概是因为各种面试不顺吧，想来虐虐学弟妹们怒刷存在感。结果网络赛还是被虐得死去活来。（果然我是蒟蒻 (◓Д◒)✄╰⋃╯

　　好了废话不多说，还是直接上题解吧。

## Minecraft Server Bug

　　题意大概就是说一排岩浆和水，你要拿一桶水和岩浆，并且水的下标小于岩浆。

　　为了更便于理解，我们从后往前做。首先将序列读进来之后从后往前遍历——若是岩浆，那么岩浆数加一，如果是水，那么这桶水能选择后面岩浆的任意一桶，也就是说答案加上当前的岩浆数即可。

> 注意用 `__int64`。

```cpp
#include <iostream>
using namespace std;

int main()
{
    int n;
    char ch[1000005];
    while(~scanf("%d\n", &n))
    {
        char tmp;
        for(int i = 0; i < n; i++)
        {
            scanf("%c%c", ch + i, &tmp);
        }
        
        __int64 ans = 0;
        int cnt = 0;
        for(int i = n - 1; i >= 0; i--)
        {
            if(ch[i] == 'L') cnt++;
            else ans += (__int64)cnt;
        }
        
        printf("%I64d\n", ans);
    }
    
    return 0;
}
```

## Beautiful Walls

　　一堵墙，每单位高度不定。你需要选择其中任意连续的墙，使得你选择的墙每单位的高度都是唯一的——问有多少种选法。

　　先求出总的种数，然后求不满足的数量，最后用总数减去不满足数即为答案。

```cpp
#include <iostream>
#include <cstring>
using namespace std;
#define lint long long
#define N 100005
int p[N], A[N];
lint solution(lint n)
{
    memset(p, -1, sizeof(p));
    lint ans = n * (n + 1) / 2, Max = 0;
    for(lint i=0; i < n; ++i)
    {
        if(~p[A[i]])
        {
            if(Max < p[A[i]]) Max = p[A[i]];
            p[A[i]] = i + 1;
        }
        else
        {
            p[A[i]] = i + 1;
        }
        ans -= Max;
    }
    return ans;
}

int main()
{
    int n, x;
    while(~scanf("%d", &n))
    {
        for(int i = 0; i < n; ++i)
        {
            scanf("%d", A + i);
        }
        printf("%lld\n", solution(n));
    }
    return 0;
}
```