title: 用 Javascript 實現一個簡易 BrainF**k 解釋器
date: 2014-10-08 11:42:32
tags: [ Javascript, 解釋器, BrainFuck ]
category: Programming
---

　　首先祝賀自己在 [CodeWars](http://www.codewars.com/users/XadillaX) 升級到 3 Kyu，以及感謝 @[Bolt_白衣蒼狗](http://www.html-js.com/card/473) 童鞋讓我知道有 CodeWars 這麼個好玩的東西。

　　雖然裏面水題居多，不過在上班比較空閒的檔口 #**帶薪刷題**# 的感覺還是蠻不錯的。

## 話嘮一下

　　高中的時候就跟 @[MatRush](http://www.lvchaoshuai.com/) 發現了一個名字超級好玩的編程語言叫 [BrainF**k](http://en.wikipedia.org/wiki/Brainfuck)，它比較搞腦筋，因爲所有的編程操作都是集合在操作符裏面，然後控制指針偏移和內存值的修改來進行一系列操作。

　　這與後面發現的 [HVM](http://www.hacker.org/hvm/)（Hack Virtual Machine）有異曲同工之妙。其實之前也出過一個“[實現一個簡易 HVM 解釋器](http://acm.nbut.edu.cn/Problem/view.xhtml?id=1062)”的題目，所以在 CodeWars 看到這個題目的時候還感覺蠻親切的。

## 問題描述

　　問題很簡單，就是讓你實現一個函數來解釋一句 BrainF**k 的語句，並且根據輸入數據來輸出相應的內容。

　　至於這題所需的 BrainF**k 的語法，大致如下：

+ `>`: 指針右移一位。
+ `<`: 指針左移一位。
+ `+`: 當前指針所指的內存值加一，以 255 爲界，溢出爲 0，即 `255 + 1 = 0`。
+ `-`: 當前指針所指的內存值減一，以 0 爲界，溢出爲 255，即 `0 - 1 = 255`。
+ `.`: 輸出當前指針所指的值，即輸出該值 ASCII 碼所對應的字符。
+ `,`: 從輸入取一個字符轉爲 ASCII 碼存入當前指針所指的內存。
+ `[`: 若當前指針所指的值爲 0，則命令跳到該 `[` 匹配的結束 `]` 符號位置的下一位置的指令。
+ `]`: 若當前指針所指的值不爲 0，則指令向前跳到該 `]` 匹配到的 `[` 符號位置的下一位置的指令。

　　舉個例子：

```brainfuck
,+[-.,+]
```

　　上面的句子大致就是說：

1. 獲取輸入到當前指針。
2. 當前指針值加一。
3. 如果當前指針的值爲 0，那麼跳到結束位置；否則下一步。
4. 當前指針值減一。
5. 輸出當前指針的值（綜上所述，就是輸出輸入的值）。
6. 獲取輸入到當前指針。
7. 當前指針值加一。
8. 若當前指針值不爲 0，那麼跳到 `[` 後面的位置——即第四步。

　　說白了，就是不斷獲取輸入的值，如果輸入的值是 255，那麼就跳出循環，否則原樣輸出。

## 開始實現

　　明白了上面的題意之後就可以開始實現了，步驟大致上就是逐位遍歷指令，然後一個 `switch` 來處理各種指令即可。

　　**CodeWars** 給了你一個函數原型，你在裏面實現代碼就好了：

```javascript
function brainLuck(code, input){
  return output;
}
```

### 前趨工作

　　在開始之前，我們做一些初始化工作，比如申明幾個變量什麼的：

+ 輸入數據當前的位置，也就是說讀取幾個之後，這個位置要偏移幾位。
+ 當前指令的位置。
+ 當前指針的位置。
+ “僞內存塊”的值，用一個數組表示，默認一個 `[ 0 ]`。
+ 需要 `return` 的字符串，即輸出的值。
+ 某個括號匹配的括號的指令下標的這麼一個映射數組。

　　所以接下去我們要把架子填成這樣：

```javascript
function brainLuck(code, input) {
    var inputPos = 0;
    var commandPos = 0;
    var pointerPos = 0;
    var bytes = [ 0 ];
    var output = "";
    var matching = getMatchingBra(code);    ///< 人家纔不是罩罩呢，我是 Brackets 的縮寫
}
```

#### 括號匹配函數

　　上面的 `getMatchingBra` 就是我們要實現的一個括號匹配函數了，思想就是用棧。

　　碰到前括號就把這個前括號的下標入棧；碰到後括號，就把棧頂元素即前括號的下標推出，這個時候括號匹配數組的這個前括號下標的值就是當前後括號的下標，而後括號下標的值就是前括號的下標了。

```javascript
/**
 * 你纔是 Bra ／/( ◕‿‿◕ )＼
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

　　有了這個數組就可以隨便跳了，如果指令第 `i` 位是一個括號（不管前括號還是後括號），那麼它的匹配括號下標就是 `matching[i]` 了。

### 各種指令的處理

　　要處理指令的話實際上就是一個 `while` 語句不斷循環指令，然後判斷當前指令是什麼然後做相應的事，最後指令位置加一就好了：

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

　　指針右移的話就把指針位置加一，如果內存數組還沒當前指針位置的值的話 `push` 一個 `0` 就好了：

```javascript
case '>': {
    if(undefined === bytes[++pointerPos]) bytes.push(0);
    break;
}
```

#### <

　　左移就是減一，如果位置小於 0，那麼內存數組從前推入一個值，並讓指針等於 0。

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

　　沒什麼好說的，內存加一就好了。

```javascript
case '+': {
    bytes[pointerPos] = (bytes[pointerPos] + 1) % 256;
    break;
}
```

#### -

　　減一。

```javascript
case '-': {
    bytes[pointerPos]--;
    if(bytes[pointerPos] < 0) bytes[pointerPos] = 0;
    break;
}
```

#### .

　　輸出的話直接往 `output` 字符串裏面加上當前指針的值就好了，注意要 ASCII 轉變之後的字符。

```javascript
case '.': {
    output += String.fromCharCode(bytes[pointerPos]);
    break;
}
```

#### ,

　　輸入的話就讓 `input` 當前位置的值變成 ASCII 存進當前指針，然後輸入位置加一就好了。

```javascript
case ',': {
    bytes[pointerPos] = input.charCodeAt(inputPos++);
    break;
}
```

#### [

　　由於之前已經做好了匹配數組，所以我們只需要判斷當前指針是不是 0，然後如果是就跳到匹配括號處。

```javascript
case '[': {
    commandPos = !bytes[pointerPos] ? matching[commandPos] : commandPos;
    break;
}
```

#### ]

　　同上，只不過條件改一下而已。

```javascript
case ']': {
    commandPos = bytes[pointerPos] ? matching[commandPos] : commandPos;
    break;
}
```

### 善後工作

　　上面的函數體完成之後，我們只需要在最後把 `output` 給返回就好了：

```javascript
return output;
```

## 肢體組裝

　　完成了上面七零八落的肢體之後，我們要把五馬分屍的代碼給湊回去，所以最後就長這個樣子了：

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

## 題後語

　　艾瑪，忘了放題目鏈接了：[http://www.codewars.com/kata/526156943dfe7ce06200063e](http://www.codewars.com/kata/526156943dfe7ce06200063e)。以及大家如果有興趣的話也可以去試試看寫個 [HVM](http://acm.nbut.edu.cn/Problem/view.xhtml?id=1062) 看看。

　　實際上本文實現的東西實用性幾乎沒有，只不過是拋磚引玉，讓大家在做一些模擬題邏輯（或者說是簡單模擬邏輯）的時候理清思路、按部就班，切忌自己亂了思路和邏輯。

