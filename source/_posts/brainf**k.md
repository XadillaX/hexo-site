title: 用 Javascript 实现一个简易 BrainF**k 解释器
date: 2014-10-08 11:42:32
tags: [ JavaScript, 解释器, BrainFuck ]
category: Programming
---

　　首先祝贺自己在 [CodeWars](http://www.codewars.com/users/XadillaX) 升级到 3 Kyu，以及感谢 @[Bolt_白衣苍狗](http://www.html-js.com/card/473) 童鞋让我知道有 CodeWars 这么个好玩的东西。

　　虽然里面水题居多，不过在上班比较空闲的档口 #**带薪刷题**# 的感觉还是蛮不错的。

## 话唠一下

　　高中的时候就跟 @[MatRush](http://www.lvchaoshuai.com/) 发现了一个名字超级好玩的编程语言叫 [BrainF**k](http://en.wikipedia.org/wiki/Brainfuck)，它比较搞脑筋，因为所有的编程操作都是集合在操作符里面，然后控制指针偏移和内存值的修改来进行一系列操作。

　　这与后面发现的 [HVM](http://www.hacker.org/hvm/)（Hack Virtual Machine）有异曲同工之妙。其实之前也出过一个“[实现一个简易 HVM 解释器](http://acm.nbut.edu.cn/Problem/view.xhtml?id=1062)”的题目，所以在 CodeWars 看到这个题目的时候还感觉蛮亲切的。

## 问题描述

　　问题很简单，就是让你实现一个函数来解释一句 BrainF**k 的语句，并且根据输入数据来输出相应的内容。

　　至于这题所需的 BrainF**k 的语法，大致如下：

+ `>`: 指针右移一位。
+ `<`: 指针左移一位。
+ `+`: 当前指针所指的内存值加一，以 255 为界，溢出为 0，即 `255 + 1 = 0`。
+ `-`: 当前指针所指的内存值减一，以 0 为界，溢出为 255，即 `0 - 1 = 255`。
+ `.`: 输出当前指针所指的值，即输出该值 ASCII 码所对应的字符。
+ `,`: 从输入取一个字符转为 ASCII 码存入当前指针所指的内存。
+ `[`: 若当前指针所指的值为 0，则命令跳到该 `[` 匹配的结束 `]` 符号位置的下一位置的指令。
+ `]`: 若当前指针所指的值不为 0，则指令向前跳到该 `]` 匹配到的 `[` 符号位置的下一位置的指令。

　　举个例子：

```brainfuck
,+[-.,+]
```

　　上面的句子大致就是说：

1. 获取输入到当前指针。
2. 当前指针值加一。
3. 如果当前指针的值为 0，那么跳到结束位置；否则下一步。
4. 当前指针值减一。
5. 输出当前指针的值（综上所述，就是输出输入的值）。
6. 获取输入到当前指针。
7. 当前指针值加一。
8. 若当前指针值不为 0，那么跳到 `[` 后面的位置——即第四步。

　　说白了，就是不断获取输入的值，如果输入的值是 255，那么就跳出循环，否则原样输出。

## 开始实现

　　明白了上面的题意之后就可以开始实现了，步骤大致上就是逐位遍历指令，然后一个 `switch` 来处理各种指令即可。

　　**CodeWars** 给了你一个函数原型，你在里面实现代码就好了：

```javascript
function brainLuck(code, input){
  return output;
}
```

### 前趋工作

　　在开始之前，我们做一些初始化工作，比如申明几个变量什么的：

+ 输入数据当前的位置，也就是说读取几个之后，这个位置要偏移几位。
+ 当前指令的位置。
+ 当前指针的位置。
+ “伪内存块”的值，用一个数组表示，默认一个 `[ 0 ]`。
+ 需要 `return` 的字符串，即输出的值。
+ 某个括号匹配的括号的指令下标的这么一个映射数组。

　　所以接下去我们要把架子填成这样：

```javascript
function brainLuck(code, input) {
    var inputPos = 0;
    var commandPos = 0;
    var pointerPos = 0;
    var bytes = [ 0 ];
    var output = "";
    var matching = getMatchingBra(code);    ///< 人家才不是罩罩呢，我是 Brackets 的缩写
}
```

#### 括号匹配函数

　　上面的 `getMatchingBra` 就是我们要实现的一个括号匹配函数了，思想就是用栈。

　　碰到前括号就把这个前括号的下标入栈；碰到后括号，就把栈顶元素即前括号的下标推出，这个时候括号匹配数组的这个前括号下标的值就是当前后括号的下标，而后括号下标的值就是前括号的下标了。

```javascript
/**
 * 你才是 Bra ／/( ◕‿‿◕ )＼
 */
function getMatchingBra(code) {
    var stack = [];
    var bra = [];
    for(var i = 0; i < code.length; i++) bra.push(-1);
    for(var i = 0; i < code.length; i++) {
        if(code[i] === '[') {
            stack.push(i);
        } else if(code[i] === ']') {
            bra[i] = stack.pop();
            bra[bra[i]] = i;
        }
    }
    return bra;
}
```

　　有了这个数组就可以随便跳了，如果指令第 `i` 位是一个括号（不管前括号还是后括号），那么它的匹配括号下标就是 `matching[i]` 了。

### 各种指令的处理

　　要处理指令的话实际上就是一个 `while` 语句不断循环指令，然后判断当前指令是什么然后做相应的事，最后指令位置加一就好了：

```javascript
while(commandPos < code.length) {
    switch(code[commandPos]) {
        case '>': {}
        case '<': {}
        case '+': {}
        case '-': {}
        case '.': {}
        case ',': {}
        case '[': {}
        case ']': {}
    }
    commandPos++;
}
```

#### >

　　指针右移的话就把指针位置加一，如果内存数组还没当前指针位置的值的话 `push` 一个 `0` 就好了：

```javascript
case '>': {
    if(undefined === bytes[++pointerPos]) bytes.push(0);
    break;
}
```

#### <

　　左移就是减一，如果位置小于 0，那么内存数组从前推入一个值，并让指针等于 0。

```javascript
case '<': {
    if(--pointerPos < 0) {
        bytes.unshift(0);
        pointerPos = 0;
    }
    break;
}
```

#### +

　　没什么好说的，内存加一就好了。

```javascript
case '+': {
    bytes[pointerPos] = (bytes[pointerPos] + 1) % 256;
    break;
}
```

#### -

　　减一。

```javascript
case '-': {
    bytes[pointerPos]--;
    if(bytes[pointerPos] < 0) bytes[pointerPos] = 0;
    break;
}
```

#### .

　　输出的话直接往 `output` 字符串里面加上当前指针的值就好了，注意要 ASCII 转变之后的字符。

```javascript
case '.': {
    output += String.fromCharCode(bytes[pointerPos]);
    break;
}
```

#### ,

　　输入的话就让 `input` 当前位置的值变成 ASCII 存进当前指针，然后输入位置加一就好了。

```javascript
case ',': {
    bytes[pointerPos] = input.charCodeAt(inputPos++);
    break;
}
```

#### [

　　由于之前已经做好了匹配数组，所以我们只需要判断当前指针是不是 0，然后如果是就跳到匹配括号处。

```javascript
case '[': {
    commandPos = !bytes[pointerPos] ? matching[commandPos] : commandPos;
    break;
}
```

#### ]

　　同上，只不过条件改一下而已。

```javascript
case ']': {
    commandPos = bytes[pointerPos] ? matching[commandPos] : commandPos;
    break;
}
```

### 善后工作

　　上面的函数体完成之后，我们只需要在最后把 `output` 给返回就好了：

```javascript
return output;
```

## 肢体组装

　　完成了上面七零八落的肢体之后，我们要把五马分尸的代码给凑回去，所以最后就长这个样子了：

```javascript
function getMatchingBra(code) {
    var stack = [];
    var bra = [];
    for(var i = 0; i < code.length; i++) bra.push(-1);
    for(var i = 0; i < code.length; i++) {
        if(code[i] === '[') {
            stack.push(i);
        } else if(code[i] === ']') {
            bra[i] = stack.pop();
            bra[bra[i]] = i;
        }
    }
    return bra;
}

function brainLuck(code, input) {
    var inputPos = 0;
    var commandPos = 0;
    var pointerPos = 0;
    var bytes = [ 0 ];
    var output = "";
    var matching = getMatchingBra(code);
    
    while(commandPos < code.length) {
        switch(code[commandPos]) {
            case '>': {
                pointerPos++;
                if(undefined === bytes[pointerPos]) {
                    bytes.push(0);
                }
                break;
            }
            case '<': {
                pointerPos--;
                if(0 > pointerPos) {
                    bytes.unshift(0);
                    pointerPos = 0;
                }
                break;
            }
            case '+': {
                bytes[pointerPos] = (bytes[pointerPos] + 1) % 256;
                break;
            }
            case '-': {
                bytes[pointerPos]--;
                if(bytes[pointerPos] < 0) bytes[pointerPos] = 0;
                break;
            }
            case '.': {
                output += String.fromCharCode(bytes[pointerPos]);
                break;
            }
            case ',': {
                var temp = input.charCodeAt(inputPos++);
                bytes[pointerPos] = temp;
                break;
            }
            case '[': {
                if(!bytes[pointerPos]) {
                    commandPos = matching[commandPos];
                }
                break;
            }
            case ']': {
                if(bytes[pointerPos]) {
                    commandPos = matching[commandPos];
                }
                break;
            }
        }
        commandPos++;
    }
    
    return output;
}
```

## 题后语

　　艾玛，忘了放题目链接了：[http://www.codewars.com/kata/526156943dfe7ce06200063e](http://www.codewars.com/kata/526156943dfe7ce06200063e)。以及大家如果有兴趣的话也可以去试试看写个 [HVM](http://acm.nbut.edu.cn/Problem/view.xhtml?id=1062) 看看。

　　实际上本文实现的东西实用性几乎没有，只不过是抛砖引玉，让大家在做一些模拟题逻辑（或者说是简单模拟逻辑）的时候理清思路、按部就班，切忌自己乱了思路和逻辑。

