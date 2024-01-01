title: HGE做格斗游戏的热点图片碰撞检测法
date: 2011-10-18 15:22:21
tags: [ 老博客备份归档, C++, HGE ]
category: 老博客备份归档
---

　　碰撞检测始终是做2D游戏中的一个热点话题，我本人并没有做过这类游戏，所以一切只是理论而已，不过正打算做这么个小游戏练练手。

　　前几天在HGE的群里看到有人突然问到如何判断鼠标有没有点到人（点到纹理的透明区域不算），从而引申出了碰撞检测问题。

　　他的问题相对好实现，只要算出纹理所按的点是不是透明即可。

　　接下来我得做下碰撞检测的笔记：

　　碰撞检测最常用一个方法就是关节设置（当然我并没有做过），关节设置的话因为只是判断多边形的重叠状况，算法的复杂度低、效率高，虽然做工有点粗，但总体效果还是性价比比较高的一种方法。当然，这样的方法需要对每一帧的纹理都设置一个关节，对于人工的代价就稍微大了一些了，并且还要写个关节编辑器啊神马的，于是乎代码量又增加了。我这次是和同寝室木有一点基础的童鞋一起练手的，所以并没有打算引进这个方法。

　　于是我就用了另一种稍微“非主流”一些的方法了——逐像素判断。

　　但是逐像素判断还是有问题的——如果你的一个“效果”因为“温度过高”而不需要显示，直接隐藏，但又算伤害，这时纹理的逐像素就失去了意义。于是又有了个“臃肿”的办法，为需要“额外附加像素”的纹理另做一张图片，这张图片上有两种区域——热点区和非热点区。我们把需要“当做空气”的那些区域一律用某一种极其不常用的颜色覆盖，如 `ff00ff` 这种变态的粉色，然后其它区域的颜色就随你怎么搞了。我们载入的时候两张纹理一起载入，显示的时候显示正常的纹理，而在碰撞检测的时候用“热点图片”来进行逐像素检测。

　　与上面的关节设置法比较的话，人工的工作量我个人认为是大大地减少了，至于对于机器的执行能力来说，把时间复杂度提到了 `O(mn)` ，平方级的复杂度了，即纹理相交区域的宽和高。

　　我们来看一下这种碰撞检测的大体流程吧：

1. 获得两个精灵的矩形，并得到相交矩形。若无相交则直接返回 `false`。
2. 根据相交矩形，我们可以得到精灵1、2的纹理中需要检测的初始座标。
3. 将精灵1、精灵2的热点图片的相交区域的那一部分像素拷贝出来备用。（因为有可能两个纹理句柄是一样的，不好同时 `lock`）
4. 开始对于拷贝出来的像素信息逐一判断对应像素点是否都“不是空气”，若都“不是空气”则可以判断为碰撞。

　　当然以上的流程我们还可以优化一下，省去拷贝的那一段时间。我们可以直接 `hge->Texture_Lock()` 来进行得到两个纹理的像素信息的首指针，如果两个纹理其实只是一个纹理的话，则只需 `hge->Texture_Lock()` 一次，而另一个指针也只想 `hge->Texture_Lock` 即可，然后直接开始判断。

　　下面献上我这个函数的实现以及测试代码和素材：

```cpp
/**
 * @brief   Test the collision by the "hot" texture
 * @author  XadillaX
 * @email   admin@xcoder.in
 * @date    2011/10/18
 * @http://xcoder.in
 *
 * @param spr1 The first sprite to test the collision
 * @param x1 "x" of top-left corner of sprite 1
 * @param y1 "y" of top-left corner of sprite 1
 * @param spr2 The second sprite to test the collision
 * @param x2 "x" of top-left corner of sprite 2
 * @param y2 "y" of top-left corner of sprite 2
 * @param hot1 The "hot" texture for sprite 1. It will be the default texture of spr1 if it equal to 0
 * @param hot2 The "hot" texture for sprite 2. It will be the default texture of spr2 if it equal to 0
 * @param airColor The color which considered of "air"
 *
 * @return if they are collided, return true
 */
bool IsCollision(hgeSprite* spr1, float x1, float y1, hgeSprite* spr2, float x2, float y2, HTEXTURE hot1 = 0, HTEXTURE hot2 = 0, DWORD airColor = 0xffff00ff)
{
    /** Set the rect */
    hgeRect r1, r2;
    r1.Set(x1, y1, x1 + spr1->GetWidth(), y1 + spr1->GetHeight());
    r2.Set(x2, y2, x2 + spr2->GetWidth(), y2 + spr2->GetHeight());

    /** Test for the intersect of rectangles */
    if(r1.Intersect(&r2))
    {
        int x[] = { x1, x2, x1 + spr1->GetWidth(), x2 + spr2->GetWidth() };
        int y[] = { y1, y2, y1 + spr1->GetHeight(), y2 + spr2->GetHeight() };
        std::sort(x, x + 4);
        std::sort(y, y + 4);
        hgeRect r;

        /** Set the rectangle area where the two rectangles intersected. */
        r.Set(x[1], y[1], x[2], y[2]);

        /** The start point of sprite1 and sprite2. (From the intersected area) */
        int sx1, sy1, sx2, sy2;
        sx1 = x[1] - x1;
        sy1 = y[1] - y1;
        sx2 = x[1] - x2;
        sy2 = y[1] - y2;

        /** Get the "hotspot" of texture */
        HTEXTURE hTex1 = hot1;
        HTEXTURE hTex2 = hot2;
        if(hTex1 == 0) hTex1 = spr1->GetTexture();
        if(hTex2 == 0) hTex2 = spr2->GetTexture();

        float tx1, ty1, tw1, th1, tx2, ty2, tw2, th2;
        int w1 = hge->Texture_GetWidth(hTex1), w2 = hge->Texture_GetWidth(hTex2);
        spr1->GetTextureRect(&tx1, &ty1, &tw1, &th1);
        spr2->GetTextureRect(&tx2, &ty2, &tw2, &th2);

        DWORD* color1 = new DWORD[(x[2] - x[1]) * (y[2] - y[1])];
        DWORD* color2 = new DWORD[(x[2] - x[1]) * (y[2] - y[1])];
        DWORD* color;

        /** Copy the effectivearea of texture 1 */
        color = hge->Texture_Lock(hTex1, true);
        for(int i = 0; i < y[2] - y[1]; i++)
        {
            for(int j = 0; j < x[2] - x[1]; j++)
            { 
                color1[i * (x[2] - x[1]) + j] = color[((int)ty1 + sy1) * w1 + (int)tx1 + sx1 + i * w1 + j];
            } 
        } 
        hge->Texture_Unlock(hTex1);

        /** Copy the effectivearea of texture 2 */
        color = hge->Texture_Lock(hTex2, true);
        for(int i = 0; i < y[2] - y[1]; i++)
        {
            for(int j = 0; j < x[2] - x[1]; j++) 
            { 
                color2[i * (x[2] - x[1]) + j] = color[((int)ty2 + sy2) * w2 + (int)tx2 + sx2 + i * w1 + j]; 
            } 
        } 
        hge->Texture_Unlock(hTex2);

        /** Test for the collision */
        for(int i = 0; i < y[2] - y[1]; i++)
        {
            for(int j = 0; j < x[2] - x[1]; j++)
            {
                if(color1[i * (x[2] - x[1]) + j] != airColor && color2[i * (x[2] - x[1]) + j] != airColor)
                {
                    delete []color1;
                    delete []color2;

                    return true;
                }
            }
        }

        delete []color1;
        delete []color2;
        return false;
    }
    else return false;
}
```

[点击下载](src.rar)
