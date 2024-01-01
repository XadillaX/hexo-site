title: CodeForces Round 128 DIV2
date: 2012-07-4 11:38:59
tags: [ 老博客备份归档, CodeForces ]
category: 老博客备份归档
---

　　这次玩脱了。好不容易四题都做出来，却因为小细节挂了两题。

## Description

### Two Problems

　　题意就是说，CF有两题，每题初始分A和B，然后每题在每分钟会扣DA和DB分。给你比赛总时间T，问你某个人可不可能拿到X分。（注意可能做出一题、两题或者一题也没做出）

　　(0 ≤ x ≤ 600; 1 ≤ t, a, b, da, db ≤ 300且保证及时比赛时间到了各题的分数也不会小于0)

### Game on Paper

　　有一个 N*N 方格纸。在上面的方格里一格格涂黑。每一步涂一格一共涂 m 次，给定 xi 和 yi。问最少涂几步方格纸里会出现一个 3*3 的正方形。

　　(1 ≤ n ≤ 1000, 1 ≤ m ≤ min(n· n, 105))

### Photographer

　　照相内存卡里有d容量。其中高质量照片占a容量、低质量占b容量。然后有n个顾客，每个顾客需要xi张高质量照片和yi张低质量照片。摄影师如果给一个人拍照了，就应该满足他所有要求（即给xi张高质量照片和yi张低质量照片）。问摄影师最多能给几个人拍照。

　　(1 ≤ n ≤ 105, 1 ≤ d ≤ 109, 1 ≤ a ≤ b ≤ 104, 0 ≤ xi, yi ≤ 105)

### Hit Ball

　　封闭房间里，从房间的一头最底下的中间以某个方向踢球（一定是网对面踢），问踢到另一头的墙上的时候，x、z各是多少。

　　(各座标以及向量都是小于等于100的正整数)

![Hit Ball](hit-ball.png)

### Transportation

　　还没看。

## Analysis

### Two Problems

　　这题只要注意几个trick就行了：可以做出0题、1题或者2题。直接两个for枚举各题在几分钟内做出来，然后做一下0题、1题的特殊判断就好了。

### Game on Paper

　　在每次涂的时候，以当前涂的点位中心，设它为九宫格的其中一个位置（一共九种位置），对于每种位置，都判断其对应的九宫格是不是 3*3 的黑色就好了。(我做的时候在设位置的时候 x - 1, y - 1 手贱敲成了 x - 1, y - 2，lock 之后才发现。悲剧)

### Photographer

　　贪心。对于每个人将其所需的总容量算出来再进行递增排序。最后求的时候推荐累减的方式判断，因为我累加然后用 int 最后爆范围了。

### Hit Ball

　　首先拿出空间几何的线面相交模板。然后来一个 `while`，每次循环的时候判断当前所在的点与方向适量形成的直线与 (X, 0, Z) 面的交点在不在终点墙壁大小的范围内。若不是则说明中途撞墙了判断方向向量：x &lt; 0则线面相交判断是不是撞左墙，若是则 x 正负值变一下；x > 0 则线面相交判断是不是撞右墙，若是则 x 正负值变一下。z &lt; 0则判断是不是以求抢地，若是则 z 正负变一下。最后 z > 0 则判断是不是撞天花板，若是则z正负值变一下。然后以球撞击的点为新的起点，与新的方向向量形成新的直线，继续下一次循环。因为房间大小最大是 100 * 100 * 100，而方向向量各方向是 1 到 100 的整数，不是小数，则撞击次数不会很多，直接 `while` 撞击也不会超。

## Code

### Two Problems

```cpp
#include <iostream>
using namespace std;

int main()
{
    int x, t, a, b, da, db;
    while(~scanf("%d%d%d%d%d%d", &x, &t, &a, &b, &da, &db))
    {
        bool flag = false;
        for(int i = 0; i < t; i++)
        {
            if(x == a - i * da)
            {
                flag = true;
                break;
            }

            for(int j = 0; j < t; j++)
            {
                if(x == b - j * db)
                {
                    flag = true;
                    break;
                }

                if(x == a - i * da + b - j * db)
                {
                    flag = true;
                    break;
                }
            }
            if(flag) break;
        }
        if(0 == x) flag = true;

        printf("%s\n", flag ? "YES" : "NO");
    }

    return 0;
}
```

### Game on Paper

```cpp
#include <iostream>
using namespace std;

bool mat[1015][1015];

bool check2(int sx, int sy)
{
    for(int i = 0; i < 3; i++)
    {
        for(int j = 0; j < 3; j++)
        {
            //if(i == 1 && j == 1) continue;

            if(!mat[sx + i][sy + j]) return false;
        }
    }

    return true;
}

bool check(int x, int y)
{
    if(check2(x, y)) return true;
    if(check2(x, y - 1)) return true;
    if(check2(x, y - 2)) return true;
    if(check2(x - 1, y)) return true;
    if(check2(x - 1, y - 1)) return true;
    if(check2(x - 1, y - 2)) return true;
    if(check2(x - 2, y)) return true;
    if(check2(x - 2, y - 1)) return true;
    if(check2(x - 2, y - 2)) return true;

    return false;
}

int main()
{
    int n, m;
    int x, y;
    while(~scanf("%d%d", &n, &m))
    {
        int ans = -1;
        memset(mat, 0, sizeof(mat));
        for(int i = 0; i < m; i++)
        {
            scanf("%d%d", &x, &y);
            mat[x + 1][y + 1] = true;

            if(ans == -1)
            {
                if(check(x + 1, y + 1))
                {
                    ans = i + 1;
                }
            }
        }

        printf("%d\n", ans);
    }

    return 0;
}
```

### Photographer

```cpp
#include <iostream>
#include <algorithm>
using namespace std;

struct client
{
    int id;
    int memo;
};

bool cmp(client a, client b)
{
    return a.memo < b.memo;
}

client c[100005];

int main()
{
    int n;
    __int64 d;
    int a, b;
    int x, y;

    while(~scanf("%d%I64d", &n, &d))
    {
        scanf("%d%d", &a, &b);
        for(int i = 0; i < n; i++)
        {
            scanf("%d%d", &x, &y);
            c[i].id = i + 1;
            c[i].memo = a * x + b * y;
        }

        sort(c, c + n, cmp);
        __int64 sum = 0L;
        int maxi = -1;
        for(int i = 0; i < n; i++)
        {
            if(sum + c[i].memo <= d) sum += c[i].memo, maxi = i;
            else break;
        }

        printf("%d\n", maxi + 1);
        for(int i = 0; i <= maxi; i++)
        {
            printf("%d%c", c[i].id, i == maxi ? '\n' : ' ');
        }
    }

    return 0;
}
```

### Hit Ball

```cpp
#include <iostream>
#include <math.h>
using namespace std;
#define eps 1e-8
#define zero(x) (((x)>0?(x):-(x))<eps)
struct point3{double x,y,z;};
struct line3{point3 a,b;};
struct plane3{point3 a,b,c;};

point3 xmult(point3 u,point3 v){
    point3 ret;
    ret.x=u.y*v.z-v.y*u.z;
    ret.y=u.z*v.x-u.x*v.z;
    ret.z=u.x*v.y-u.y*v.x;
    return ret;
}

point3 subt(point3 u,point3 v){
    point3 ret;
    ret.x=u.x-v.x;
    ret.y=u.y-v.y;
    ret.z=u.z-v.z;
    return ret;
}

point3 pvec(plane3 s){
    return xmult(subt(s.a,s.b),subt(s.b,s.c));
}

point3 intersection(line3 l,plane3 s){
    point3 ret=pvec(s);
    double t=(ret.x*(s.a.x-l.a.x)+ret.y*(s.a.y-l.a.y)+ret.z*(s.a.z-l.a.z))/
        (ret.x*(l.b.x-l.a.x)+ret.y*(l.b.y-l.a.y)+ret.z*(l.b.z-l.a.z));
    ret.x=l.a.x+(l.b.x-l.a.x)*t;
    ret.y=l.a.y+(l.b.y-l.a.y)*t;
    ret.z=l.a.z+(l.b.z-l.a.z)*t;
    return ret;
}

int main()
{
    double a, b, m;
    double vx, vy, vz;

    while(~scanf("%lf%lf%lf%lf%lf%lf", &a, &b, &m, &vx, &vy, &vz))
    {
        /** 5 walls */
        plane3 door, lw, rw, top, ground;
        door.a.x = 0, door.a.y = 0, door.a.z = 0;
        door.b.x = 1, door.b.y = 0, door.b.z = 0;
        door.c.x = 0, door.c.y = 0, door.c.z = 1;
        lw.a.x = 0, lw.a.y = 0, lw.a.z = 0;
        lw.b.x = 0, lw.b.y = 1, lw.b.z = 0;
        lw.c.x = 0, lw.c.y = 0, lw.c.z = 1;
        rw.a.x = a, rw.a.y = 0, rw.a.z = 0;
        rw.b.x = a, rw.b.y = 1, rw.b.z = 0;
        rw.c.x = a, rw.c.y = 0, rw.c.z = 1;
        ground.a.x = 0, ground.a.y = 0, ground.a.z = 0;
        ground.b.x = a, ground.b.y = 0, ground.b.z = 0;
        ground.c.x = a / 2, ground.c.y = m, ground.c.z = 0;
        top.a.x = 0, top.a.y = 0, top.a.z = b;
        top.b.x = a, top.b.y = 0, top.b.z = b;
        top.c.x = a / 2, top.c.y = m, top.c.z = b;

        line3 l;

        l.a.x = a / 2;
        l.a.y = m;
        l.a.z = 0;

        l.b.x = (a / 2) + vx;
        l.b.y = m + vy;
        l.b.z = vz;

        point3 v;
        v.x = vx, v.y = vy, v.z = vz;

        point3 myans;
        while(true)
        {
            point3 ans, ans1, ans2, ans3, ans4;
            memset(&ans1, 0, sizeof(point3));
            memset(&ans2, 0, sizeof(point3));
            memset(&ans3, 0, sizeof(point3));
            memset(&ans4, 0, sizeof(point3));

            ans = intersection(l, door);
            if(ans.x >= 0 && ans.z >= 0 && ans.x <= a && ans.z <= b)
            {
                myans = ans;
                break;
            }

            point3 totans;

            if(v.x < 0)
            {
                ans1 = intersection(l, lw);
                if(ans1.z >= 0 && ans1.z <= b)
                {
                    v.x = -v.x;
                    totans = ans1;
                }
            }
            else
            if(v.x > 0)
            {
                ans2 = intersection(l, rw);
                if(ans2.z >= 0 && ans2.z <= b)
                {
                    v.x = -v.x;
                    totans = ans2;
                }
            }

            if(v.z > 0)
            {
                ans3 = intersection(l, top);
                if(ans3.x >= 0 && ans3.x <= a)
                {
                    v.z = -v.z;
                    totans = ans3;
                }
            }
            else
            if(v.z < 0)
            {
                ans4 = intersection(l, ground);
                if(ans4.x >= 0 && ans4.x <= a)
                {
                    v.z = -v.z;
                    totans = ans4;
                }
            }

            l.a = totans;
            l.b = totans;
            l.b.x += v.x;
            l.b.y += v.y;
            l.b.z += v.z;
        }

        printf("%.10lf %.10lf\n", myans.x, myans.z);
    }

    return 0;
}
```
