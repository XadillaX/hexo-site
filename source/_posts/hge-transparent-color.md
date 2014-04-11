title: 关于HGE的透明背景处理
date: 2011-9-13 12:12:32
tags: [ 老博客备份归档, C++, HGE ]
category: 老博客备份归档
---

　　嘛 = = 在做那个项目的动画预览器的时候，因为那引擎封装得太麻烦了，于是自己基于HGE再移植一遍，发现其中有一个SetTransparentColor函数，即设置透明色。

　　拿出来分享一下吧。

　　其实方法很简单，`HTEXTURE` 是纹理句柄，当你用 `Texture_Lock` 这个函数锁定这个纹理的时候，它的返回值就是这个纹理在内存中的首地址。也就是说接下来的 width * height 个地址中就是这个纹理的每一个像素了。既然要设置透明色，只要对于每个像素判断一下与运算一下就好了。

```cpp
HTEXTURE SetTransColor(HTEXTURE hTex, DWORD dwColor)
{
    /** 注：上面的dwColor代表的是RGB，不是ARGB */
    static HGE* hge = hgeCreate(HGE_VERSION);

    int size = hge->Texture_GetWidth(hTex) * hge->Texture_GetHeight(hTex);
    DWORD* dwTex = hge->Texture_Lock(hTex);
    for(int i = 0; i < size; i++)
    {
        if((dwTex[i] & 0x00FFFFFF) == dwColor)
        {
            dwTex[i] &= 0x00FFFFFF;
        }
    }
    hge->Texture_Unlock(hTex);

    return hTex;
}
```

　　嘛，这样一来，就透明了~
