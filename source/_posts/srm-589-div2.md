title       : TopCoder SRM 589 DIV 2
category    : Programming
date        : 2013-08-31
tags        : [ TopCoder, SRM ]
---

　　好久没撸 **TC** 了，手都生了。前两天刚折腾好 **LinuxMint** + **Cinnamon**，顺便手贱把 **TC** 环境配好了。

　　随便进去扯了一套最新的 **SRM** 来搞，全跑完之后才发现原来这场比赛还处于 **System Running** 阶段。于是知道了比赛一结束还在 **Running** 的时候你就已经可以自己拉出来做了。小绿名大家不要笑。


<!-- 我是小小分割符 -->

## Summary

　　这次 **DIV 2** 的难度一般，一道签到题加两道普通的 **DP**。

　　[Code on GitHub](https://github.com/XadillaX/xadillax-topcoder/tree/master/code/SRM589-DIV2).

## 250pt - Goose Tattarrattat

题意很简单，就是给你一个字符串，问你最少改变多少字符让字符串所有字符都一样。

签到题，找最多的字符跟总长度一减就OK了。

{% code cpp %}
#define SIZE(x) ((int)(x.size()))
#define LENGTH(x) ((int)(x.length()))
class GooseTattarrattatDiv2 
{
public:
    int getmin(string S);
};

int GooseTattarrattatDiv2::getmin(string S)
{
    int maxsame = 0;
    map<char, int> mp;
    for(int i = 0; i < LENGTH(S); i++)
    {
    	mp[S[i]]++;
    	maxsame = max(maxsame, mp[S[i]]);
    }
    
    return LENGTH(S) - maxsame;
}
{% endcode %}

## 500pt - Gears

有 ***N*** 个齿轮围成一圈，相邻两个齿轮要反方向转才能正常运转不卡到其它轮子。你要从中间拿掉几个齿轮（留空了就不影响其左边的左边的齿轮），问最少拿掉几个使得所有齿轮能正常转。

我们建两个二维 ***dp*** 数组，或者一个三维 ***dp*** 数组：

{% code cpp %}
dp[i][0|1][0|1]
{% endcode %}

第一维 `i` 代表当前是第 `i` 个齿轮。第二维若是 `0` 则表示这个齿轮拿走，若是 `1` 代表留下。第三维若是 `0` 则代表第一个齿轮拿走，`1` 代表第一个齿轮留下。整个数组的每个元素就代表该齿轮留下或者拿走且第一个齿轮是留下或者拿走的情况下的最少拿走齿轮数。

所以我们能得到几个状态转移方程：

> ### 第一个齿轮

{% code cpp %}
dp[i][0][0] = 1;
dp[i][0][1] = INF;
dp[i][1][1] = 0;
dp[i][1][0] = INF;
{% endcode %}

> ### 第二个齿轮
> 
> 如果与第一个同向那么就有了一留一走或者两个都走的情况。否则就是四种情况都可以。

{% code cpp %}
if(与第一个齿轮同向)
{
    dp[1][0][1] = 1;
    dp[1][1][0] = 1;
    dp[1][0][0] = 2;
    dp[1][1][1] = INF;
}
else 
{
    dp[i][0][0] = 2;
    dp[i][0][1] = 1;
    dp[i][1][0] = 1;
    dp[i][1][1] = 0;
}
{% endcode %}

> ### 之后的所有齿轮
> 
> 若该齿轮与前一个齿轮方向相同 ，那么该齿轮留下的时候，前一个齿轮必须得走，那么就是 `dp[i - 1][0][?]`;该齿轮走的时候，前一个齿轮可走可留，就是 `dp[i - 1][0|1][?] + 1` 的稍微小一点那个。
> 
> 若方向不相同 ，那么就是该齿轮留下的时候，前一个齿轮也可以留下。

{% code cpp %}
if(与前一个齿轮同向)
{
    dp[i][1][0] = dp[i - 1][0][0];
    dp[i][1][1] = dp[i - 1][0][1];

    dp[i][0][0] = min(dp[i - 1][1][0], dp[i - 1][0][0]) + 1;
    dp[i][0][1] = min(dp[i - 1][1][1], dp[i - 1][1][0]) + 1;
}
else 
{
    dp [i][1][0] = min(dp[i - 1][0][0], dp[i - 1][1][0]);
    dp [i][1][1] = min(dp[i - 1][0][1], dp[i - 1][1][1]);

    dp [i][0][0] = min(dp[i - 1][1][0], dp[i - 1][0][0]) + 1;
    dp [i][0][1] = min(dp[i - 1][1][1], dp[i - 1][1][1]) + 1;
}
{% endcode %}

最后若最后一个齿轮与第一个齿轮同向，那么在 `dp[i - 1][0][0]`、`dp[i - 1][0][1]`、`dp[i - 1][1][0]` 中挑一个。若不同向，那么多了个 `dp[i - 1][1][1]` 这个选择。

下面就是代码了：

{% code cpp %}
class GearsDiv2 
{
public:
    int getmin(string Directions);
};

int GearsDiv2::getmin(string Directions)
{
    int dp[100][2][2];
    for(int i = 0; i < LENGTH(Directions); i++)
    {
        if(i == 0)
        {
            dp[i][0][0] = 1;
            dp[i][0][1] = 10000000;
            dp[i][1][1] = 0;
            dp[i][1][0] = 10000000;
        }
        else
        if(i == 1)
        {
            if(Directions[i] == Directions[i - 1])
            {
                dp[i][0][1] = 1;
                dp[i][1][0] = 1;
                
                dp[i][0][0] = 2;
                dp[i][1][1] = 10000000;
            }
            else
            {
                dp[i][0][0] = 2;
                dp[i][0][1] = 1;
                dp[i][1][0] = 1;
                dp[i][1][1] = 0;
            }
        }
        else
        if(Directions[i] == Directions[i - 1])
        {
            dp[i][1][0] = dp[i - 1][0][0];
            dp[i][1][1] = dp[i - 1][0][1];
            
            dp[i][0][0] = min(dp[i - 1][1][0], dp[i - 1][0][0]) + 1;
            dp[i][0][1] = min(dp[i - 1][1][1], dp[i - 1][0][1]) + 1;
        }
        else
        {
            dp[i][1][0] = min(dp[i - 1][0][0], dp[i - 1][1][0]);
            dp[i][1][1] = min(dp[i - 1][0][1], dp[i - 1][1][1]);
            
            dp[i][0][0] = min(dp[i - 1][1][0], dp[i - 1][0][0]) + 1;
            dp[i][0][1] = min(dp[i - 1][1][1], dp[i - 1][1][1]) + 1;
        }
    }
    
    int ans;
    int mi = LENGTH(Directions) - 1;
    if(Directions[mi] == Directions[0])
    {
        ans = min(dp[mi][0][0], min(dp[mi][1][0], dp[mi][0][1]));
    }
    else
    {
        ans = min(min(dp[mi][0][0], dp[mi][1][1]), min(dp[mi][0][1], dp[mi][1][0]));
    }
    
    return ans;
}
{% endcode %}

## 1000pt - Flipping Bits

给你一个 **01串** 与一个正整数 ***M***。**01串** 有如下三种操作:

+ 随便反转一位（0 -> 1, 1 -> 0）。
+ 将开头 `k * M` 位反转。k 可以是任何正整数。
+ 将末尾 `k * M` 位反转。k 可以是任何正整数。

问最少需要几步将整个字符串变成都是 `1`。

这又是一个 **DP** 的题目。

我们先设有 ***G*** 组，一组 ***M*** 个 `01字符`。那么就能有

{% code cpp %}
dp1[i][0|1]
dp2[i][0|1]
{% endcode %}

其中 `i` 代表第 `i` 组，第二维如果是 `0` 就代表这一组采用一位位反转的操作将这组全变成 `1`，如果是 `1` 则将整组全部反转再采用一位位反转的操作将这组全变成 `1` 。至于 `dp1` 和 `dp2` 则代表从头到尾和从尾到头。

由于只有 `0` 和 `1` 反转，那么一组反转两次就能还原原状——这是一个非常重要的性质。

如果某一组采用**整组反转**的操作，若前一组也是**整组反转**，那么就相当于操作次数不变，只是将前一组的反转范围延续到这一组；若前一组是**非整组反转**，那么就相当于从头到这一组反转之后，前面的所有组再反转回去——相当于是多了两次操作。于是就有了（先只拿 `dp1` 作为例子）：

{% code cpp %}
dp1[i][1] = min(
    dp[i - 1][0] + 这一组1的数量 + 2,
    dp[i - 1][1] + 这一组1的数量 
);
{% endcode %}

如果某一组采用**非整组反转**，那么操作次数就是前一组的**整组反转**或者**非整组反转**的操作次数加上这一组 `0` 的数量：

{% code cpp %}
dp1[i][0] = min(
    dp[i - 1][0] + 这一组0的数量,
    dp[i - 1][0] + 这一组0的数量
);
{% endcode %}

用上面的转移方程把正反向都求了一遍之后，我们就可以求总答案了，总答案就是我们枚举中间只有**操作1**的段的首尾，加上该中间段前部分的 ***dp*** 答案和其后部分的 ***dp*** 答案，取出最小值就是了。

{% code cpp %}
class FlippingBitsDiv2 
{
public:
    int getmin(vector <string> S, int M);
    
    string str;
    int group;
    int tn1[2600], tnsum1[2600];
    int tn2[2600], tnsum2[2600];
    
    int dp1[2600][2];
    int dp2[2600][2];
    
    int calcsum(int l, int r)
    {
        if(l > r) return 0;
        int tot = tnsum1[r] - tnsum1[l - 1];
        return tot;
    }
};

int FlippingBitsDiv2::getmin(vector <string> S, int M)
{
    str = "";
    for(int i = 0; i < SIZE(S); i++) str += S[i];
    group = LENGTH(str) / M;
    ZERO(tn1);
    ZERO(tn2);
    
    // init.
    for(int i = 0; i < group; i++)
    {
        int op = i * M;
        int ed = op + M;
        for(int j = op; j < ed; j++)
        {
            if(str[j] == '0') tn1[i]++, tn2[group - i - 1]++;
        }
        
        dp1[i][0] = 100000;
        dp1[i][1] = 100000;
        dp2[i][0] = 100000;
        dp2[i][1] = 100000;
    }
    
    // tnsum
    for(int i = 0; i < group; i++)
    {
        if(i == 0) tnsum1[0] = tn1[0], tnsum2[0] = tn2[0];
        else
        {
            tnsum1[i] = tnsum1[i - 1] + tn1[i];
            tnsum2[i] = tnsum2[i - 1] + tn2[i];
        }
    }
    
    // dp.
    for(int i = 0; i <= group; i++)
    {
        if(i == 0)
        {
            dp1[i][0] = dp1[i][1] = dp2[i][0] = dp2[i][1] = 0;
        }
        else
        if(i == 1)
        {
            // head -> tail
            dp1[i][0] = tn1[i - 1];
            dp1[i][1] = 1 + (M - tn1[i - 1]);
            
            // tail -> head
            dp2[i][0] = tn2[i - 1];
            dp2[i][1] = 1 + (M - tn2[i - 1]);
        }
        else
        {
            // head -> tail
            dp1[i][0] = min(
                dp1[i - 1][0] + tn1[i - 1],
                dp1[i - 1][1] + tn1[i - 1]
            );
            dp1[i][1] = min(
                dp1[i - 1][0] + 2 + (M - tn1[i - 1]),
                dp1[i - 1][1] + (M - tn1[i - 1])
            );
            
            // tail -> head
            dp2[i][0] = min(
                dp2[i - 1][0] + tn2[i - 1],
                dp2[i - 1][1] + tn2[i - 1]
            );
            dp2[i][1] = min(
                dp2[i - 1][0] + 2 + (M - tn2[i - 1]),
                dp2[i - 1][1] + (M - tn2[i - 1])
            );
        }
    }
    
    int minans = 100000000;
    for(int i = 0; i <= group; i++)
    {
        for(int j = 0; j <= group - i; j++)
        {
            int zzl = i;
            int zzr = group - j - 1;
            
            minans = min(minans,
                min(dp1[i][0], dp1[i][1]) +
                min(dp2[j][0], dp2[j][1]) +
                calcsum(zzl, zzr)
                );
        }
    }
    
    return minans;
}
{% endcode %}