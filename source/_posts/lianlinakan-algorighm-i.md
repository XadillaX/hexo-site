title: 连连看核心算法小分享——1
date: 2011-05-16 12:30:12
tags: [ 老博客备份归档, C++, HGE ]
category: 老博客备份归档
---

　　**注：这篇文章我到现在也没有填第二篇的坑。数据没了重新从 Capture 里面取出来，看看舍不得，于是把这篇文章也拿回来了。权当纪念吧，以及当时和 `Kalxd` 的对话。**

## 正文

　　刚忙完邀请赛，蹭了块铜。刚才在逛别人博客的时候看别人的文章，突然心血来潮想记一些东西。

　　连连看是我学HGE做的第一个小游戏，素材用的是QQ的。时间大概是去年国庆吧。好吧，废话不多说，就讲讲连连看怎么找到能消的两块吧。

　　首先来回顾一下消方块的规则，一共有三种可能性：

1. 直线消除（包括水平或者垂直）
2. 一个拐角消除
3. 两个拐角消除

　　嗯，接下去我们就针对每种可能性开始写代码。

　　首先讲讲一些定义：

　　座标结构体，这个结构体包含了x、y的值以及一些座标中常用的函数。

```cpp
/**
 * @brief 地图座标结构体
 *
 * 地图座标结构体，包含x轴值、y轴值
 * 以及一些操作函数。
 */
struct CoorType {
    int x;                                          ///< x轴
    int y;                                          ///< y轴

    /**
     * 重载构造函数
     * 将x、y值各初始化为-1
     */
    CoorType()
    {
        x = -1, y = -1;
    }

    /**
     * 构造函数重载
     * 将x、y各赋值为b、a
     * @param a 将要赋值的y轴数值
     * @param b 将要赋值的x轴数值
     */
    CoorType(int a, int b)
    {
        y = a, x = b;
    }

    /**
     * 设置座标
     * 将x、y各赋值为b、a
     * @param a 将要赋值的y轴数值
     * @param b 将要赋值的x轴数值
     */
    void Set(int a, int b)
    {
        y = a, x = b;
    }

    /**
     * 运算符"+="重载
     * 将此座标与另一座标相加
     * @param &a 另一座标
     * @return 返回结果座标值
     */
    CoorType & operator += (const CoorType &a)
    {
        y += a.y, x += a.x;
        return *this;
    }

    /**
     * 重载运算符"!="
     * 判断与另一座标是否表示同一个值
     * @param &a 另一座标
     * @return 返回布尔类型表示是否相等
     */
    bool operator != (const CoorType &a)
    {
        if(y != a.y || x != a.x) return false;
        else return true;
    }

    /**
     * 判断此座标是否合法
     * 若出界则不合法
     * @return 返回布尔类型表示是否合法
     */
    bool isIll()
    {
        if(y >= 0 && x >= 0 && y < MAP_HEIGHT && x < MAP_WIDTH) return true;
        else return false;
    }
};
```

　　然后是关于地图数组的定义：

```cpp
int Map[MAP_HEIGHT][MAP_WIDTH];
```

　　接着是路径结构体：

```cpp
/**
 * @brief 路线结构体
 *
 * 合法路线结构体
 * 储存最多四个点（起点终点和两个转折点）
 */
struct PointPath {
    bool bExist;                                    ///< 是否有路径
    int Num;                                        ///< 驻点个数
    CoorType Points[4];                             ///< 各驻点
};
```

　　接着可以正式开始了。首先我们来想一下，哪些条件各符合上面三种情况的哪一种。对于一条直线的，显然是x相等或者y相等；对于有一个转折点的话，我们只需要判断起点横向画线（或者纵向），然后终点纵向画线（或者横向），然后从起点到交点以及从交点到终点各可行不；对于两个转折点，其中一个转折点的x或者y跟起点的x或者y相等，另一个转折点跟终点的x或者y相等。于是这两个转折点就根据这样的性质进行枚举。因为连连看的地图比较小，所以这种O(n^2)的时间复杂度不碍事。

　　为了方便，我们写一个 `Abled(CoorType, CoorType, bool, bool);` 函数来进行判断两个点（当然两点是在同一直线上的）是否有同路（即中间没有东西挡着）。我们先放着这个Abled不管，先实现寻路过程吧。

　　我是用一个CMapSearch类来实现的，声明如下：

```cpp
/**
 * @brief 地图搜索类
 *
 * 根据指定地图搜索出各合法路径。
 */
class CMapSearch
{
private:
    int Map[MAP_HEIGHT][MAP_WIDTH];                                             ///< 地图数据矩阵
    PointPath dis[MAP_HEIGHT][MAP_WIDTH][MAP_HEIGHT][MAP_WIDTH];                ///< 路径数组
    STLMap grap;                                                                ///< STL映射
    CoorType dir[4];                                                            ///< 常量座标增量
    PointPath Hint;                                                             ///< 提示时用的合法路径

    /**
     * @brief 两点寻径
     *
     * 对(x1, y1)和(x2, y2)进行寻径
     * @param x1 第一个座标的x轴
     * @param y1 第一个座标的y轴
     * @param x2 第二个座标的x轴
     * @param y2 第二个座标的y轴
     * @return 返回一个路线结构体的值，若不存在路径，则结构体的bExist为假
     * @see Abled
     */
    PointPath DoSearch(int y1, int x1, int y2, int x2);

public:
    /**
     * @brief 构造函数
     *
     * @param _Map[][Map_Width] 地图矩阵
     */
    CMapSearch(int _Map[][MAP_WIDTH]);

    /**
     * @brief 析构函数
     */
    ~CMapSearch(void);

    /**
     * @brief 载入地图
     * 从矩阵中载入地图到对象
     *
     * @param _Map[][Map_Width] 地图矩阵
     */
    void LoadMap(int _Map[][MAP_WIDTH]);

    /**
     * @brief 搜索地图
     * 对整个地图进行搜索每两个相同方块之间的路径
     *
     * @return 如果存在至少一条路径则返回真，否则为假，用于是否重列
     * @see CreateSTLMap
     * @see DoSearch
     */
    bool Search();

    /**
     * @brief 创建map映射
     * 创建一个方块ID的映射，对每个ID创建一条的该ID的方块在地图中的各座标的链表
     */
    void CreateSTLMap();

    /**
     * @brief 判断是否有障碍
     * 对于a、b两座标（在同一直线）进行判断期间是否有方块障碍而导致不能连线
     *
     * @param a 座标a（头座标）
     * @param b 座标b（尾座标）
     * @param head 若包括头座标则为true，否则为false
     * @param tail 若包括尾座标则为true，否则为false
     * @return 若有障碍则返回false，否则为true
     */
    bool Abled(CoorType a, CoorType b, bool head = false, bool tail = false);

    /**
     * @brief 得到路径
     * 得到两个座标的连线具体路径
     *
     * @param y1 第一个座标的y轴
     * @param x1 第一个座标的x轴
     * @param y2 第二个座标的y轴
     * @param x2 第二个座标的x轴
     * @return 返回一个路线结构体，表示该两个座标直接的路线
     */
    PointPath GetPath(int y1, int x1, int y2, int x2);

    /**
     * @brief 得到提示路径
     * 得到一条提示的路径的相应两个方块
     *
     * @param &a 接受第一个方块ID的变量
     * @param &b 接受第二个方块ID的变量
     */
    void GetRandomHint(int &a, int &b);
};
```

　　然后我这个分享里所讲的算法就是DoSearch和Abled函数了，因为其它函数就是用于“提示”道具的。在DoSearch中我们先定义两个临时变量，一个是返回值（一个PointPath），四个座标变量：

```cpp
PointPath ans;
CoorType a(y1, x1), b(y2, x2), c, d;
```

　　其中a、b表示起点和终点，c、d表示可能用到的两个转折点。

　　首先我们先来判断直线情况吧，这种情况比较简单：

```cpp
//如果是直线
if(a.x == b.x || a.y == b.y)
{
    if(Abled(a, b, true, true))
    {
        ans.bExist = true;
        ans.Num = 2;
        ans.Points[0] = a, ans.Points[1] = b;
        return ans;
    }
}
```

　　对于这种情况，我们只需直接判断a、b直接有没有通路就好，如果有通路我们就将结果记录到ans中并返回即可。

　　而有一个转折点、两个转折点的情况以及Abled函数将在下一篇文章中小分享一下。
  
## 回忆时间

　　然后下面就是在这篇文章里面我跟 `Kalxd` 的对话了，想想现在真是沧海桑田啊。

　　CSS 样式早已经不在了，截图里面是一篇白板

![评论回忆](comment.png)
