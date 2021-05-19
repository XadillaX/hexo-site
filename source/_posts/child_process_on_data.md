title: 请务必给 child_process 加上 on('data') 处理
date: 2020-09-03 16:18
tags: [ Node.js, stream ]
category: Programming
---

好吧，我承认我标题党了。其实里面有很多分支条件的，是 `child_process` 模块中与 `stdio` 参数相关的函数需要加上 `on('data')` 事件处理。

哪些与 `stdio` 相关呢？如 `child_process.spawn()` 中 `options` 就有个可选参数 `stdio`，你可以指定其为 `inherit`、`pipe`、`ignore` 等。

怎么算加上 `on('data')` 事件处理呢？监听这个事件算一个，将 `stdio` 指定为类似 `ignore` 这类操作也是算的。

接下去我就以 `child_process.spawn()` 为例展开讲吧。

## `child_process.spawn(command[, args][, options])`

我们先来看看 `child_process.spawn()` 函数：

+ `command`：要执行的命令；
+ `[,args]`：执行命令时的命令行参数；
+ `[,options]`：扩展选项。

我们不关心前面的内容，只关心 `options` 中的 `stdio` 属性。

`options.stdio` 可以是一个数组，也可以直接是一个字符串。

如果 `options.stdio` 是一个数组，则它指定了子进程对应序号的 `fd` 应该是什么。默认不配置的情况下，`spawn()` 出来的子进程对象（设为 `child`）中会有 `child.stdin`、`child.stdout` 和 `child.stderr` 三个 `Stream` 对象，而子进程的 `stdin`、`stdout` 和 `stderr` 三个 `fd` 会通过管道会被重定向到该三个流中——相当于 `options.stdio` 配置了 `'pipe'`。

如果 `options.stdio` 是一个字符串，则代表子进程前三个 `fd` 都是该字符串对应的含义。如 `'pipe'` 与 `[ 'pipe', 'pipe', 'pipe' ]` 等价。

数组中的每个 `fd` 都可以是下面的类型（无耻摘录文档）：

+ `'pipe'`：在两个进程之间建立管道。在当前进程中，该管道以 `child.stdio[]` 流暴露；而 `child.stdin`、`child.stdout` 和 `child.stderr` 分别对应 `child.stdio[0-2]`。子进程的对应 `fd` 会被重定向到当前进程的对应流中；
+ `'ipc'`：在两个进程之间建立 IPC 信道，主子进程通过 IPC 互通有无（前提是两个进程都得是 Node.js 进程），不过该类型不应用于 `std*`，而应该是数组中后续的 `fd` 中；
+ `'ignore'`：将 `/dev/null` 给到对应的 `fd`；
+ `'inherit'`：字面意思是继承当前进程，该配置会将子进程的对应 `fd` 通过当前进程的流重定向到当前进程对应的 `fd` 中，不过只有前三项（`stdin`、`stdout` 和 `stderr`）会生效，后续 `fd` 若配置了 `inherit` 等同于 `ignore`；
+ `Stream`：直接是与子进程相关的 TTY、文件、Socket、管道等可读或者可写流对象，该流对象底层的 `fd` 会与子进程对应的 `fd` 进行共享，不过前提是流中得有个底层的文件描述符，像一个未打开的文件流对象就还没有对应的描述符；
+ 正整数：与 `Stream` 类似，对应的是一个文件描述符；
+ `null` / `undefined`：保持对应 `fd` 的默认值，前三个 `fd` 默认为 `pipe`，之后的为 `ignore`。

了解了之后，我们就可以做限定了，本文标题的意思即 `pipe` 这类需要消费子进程 `stdio` 的操作我们需要真的消费才行。

其实原因也在文档中写明了，我会在本文的最后再放出来。

先开始做实验吧。

## 实验一下

我们先准备子进程文件：

```js
// child.js
'use strict';

let str = '123';
// let str = Array(1000000).fill('0000000000').join('');
console.log(str);
```

> 文件中有两句 `str` 声明，一句为注释。当我们要用短字符串的时候，就用原代码；当我们要用长字符串的时候，两句源码与注释互相替换一下。

### 短字符串测试

我们写如下的主进程代码：

```js
// index.js
'use strict';

const cp = require('child_process');
const child = cp.spawn('node', [ 'child.js' ]);
child.on('exit', () => {
  console.log('hello');
  process.exit(0);
});
```

运行一下 `$ node index.js`。一切正常，我们的 `'hello'` 也被输出了。没问题。然后在上面的代码中加入：

```js
child.stdout.on('data', () => {});
```

再运行一下，似乎没什么变化。脱裤子放屁。我们再加点料吧：

```js
// index.js
'use strict';

const cp = require('child_process');
const child = cp.spawn('node', [ 'child.js' ]);
let data = '';
child.stdout.on('data', chunk => data += chunk.toString());
child.on('exit', () => {
  console.log(data);
  process.exit(0);
});
```

再运行一下，把 `'123'` 输出了。一切如我们所料一样。

### 长字符串测试

接下去，我们要注释掉子进程的短字符串，把长字符串放出来吧。

首先是「短字符串测试」中的最后一段代码，即有 `chunk => data += chunk.toString()` 这段代码的文件。运行一下 `$ node index.js` 看结果。

嚯，输出了一堆的 `'0'`，就像这样：

![undefined](https://dm.nbut.ac.cn/xcoder/2020/09/03/1599034425612-a69c7c25-5914-4f41-84c9-e2576649cc1b.png)

看着太心烦了，把 `data` 相关的代码去掉吧，`stdout` 的 `data` 事件监听改回这样：

```js
child.stdout.on('data', () => {});
```

然后在 `console.log` 那里也改回 `'hello'`。再运行一遍，世界清净了，只剩 `hello`。

**到目前为止，一切看起来都还算正常。**

#### 翻车记录

接下去要开始翻车了，我们把 `child.stdout.on` 这一整句去掉，让主进程代码恢复成最初的样子，顺便加点料：

```js
// index.js
'use strict';

const cp = require('child_process');
const child = cp.spawn('node', [ 'child.js' ]);
child.on('exit', () => {
  console.log('hello');
  process.exit(0);
});

let i = 1;
setInterval(() => {
  console.log(`噢，死月真是个沙雕呢。 x${i++}`);
}, 100);
```

`$ node index.js`，按下手中的回车键执行吧：

![沙雕](https://dm.nbut.ac.cn/xcoder/2020/09/03/1599035285611-893903f4-8b62-4670-a391-fdc7e62efbee.gif)

> 「**噢，死月真是个沙雕呢。**」之连环暴击。

我们的程序卡住了。上面的源码很短，一眼就能看出来是因为没执行到 `process.exit(0)` 才卡住的。没执行到 `process.exit()` 的原因其实是因为没有触发 `child.on('exit')` 事件，再往上推，则是子进程没有退出。

不信他没退出的话，在「死月沙雕」的期间看看进程存活状态就知道了。

```bash
$ ps aux | grep node
xadillax 3844947  1.5  0.0 552184 31384 pts/202  Sl+  16:30   0:00 node index.js
xadillax 3844954  1.1  0.1 612436 41620 pts/202  Sl+  16:30   0:00 node child.js
```

## 动手 GDB 一下

先不看答案，我们动手 GDB 一下看看卡哪了。大家编一个 Node.js 的 Debug 版本也要好久，为了简化过程，我们用 C 写一个最简单的子进程就能做好这个实验。

```c
// child.c
#include <stdio.h>

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    for (int i = 0; i < 1000000; i++) printf("0000000000");
    return 0;
}
```

然后编译一下：

```bash
$ gcc child.c -g
```

生成了 `a.out`，然后改一下 JavaScript 主进程源码的 `spawn()` 函数：

```javascript
const child = cp.spawn('/tmp/lab/a.out');
```

跑起来之后肯定依旧是沙雕一日游。这个时候我们拿到 PID 进行 GDB 一下吧。

```bash
$ ps aux | grep a.out
xadillax 3848598  0.0  0.0   2488   588 pts/202  S+   16:46   0:00 /tmp/lab/a.out
$ gdb
(gdb) attach 3848598
...
(gdb) bt
#0  0x00007f066486c057 in __GI___libc_write (fd=1, buf=0x5654950b12a0, nbytes=4096) at ../sysdeps/unix/sysv/linux/write.c:26
#1  0x00007f06647ed00d in _IO_new_file_write (f=0x7f06649476a0 <_IO_2_1_stdout_>, data=0x5654950b12a0, n=4096) at fileops.c:1176
#2  0x00007f06647eead1 in new_do_write (to_do=4096, data=0x5654950b12a0 '0' <repeats 200 times>..., fp=0x7f06649476a0 <_IO_2_1_stdout_>) at libioP.h:948
#3  _IO_new_do_write (to_do=4096, data=0x5654950b12a0 '0' <repeats 200 times>..., fp=0x7f06649476a0 <_IO_2_1_stdout_>) at fileops.c:426
#4  _IO_new_do_write (fp=0x7f06649476a0 <_IO_2_1_stdout_>, data=0x5654950b12a0 '0' <repeats 200 times>..., to_do=4096) at fileops.c:423
#5  0x00007f06647ed835 in _IO_new_file_xsputn (n=10, data=<optimized out>, f=<optimized out>) at libioP.h:948
#6  _IO_new_file_xsputn (f=0x7f06649476a0 <_IO_2_1_stdout_>, data=<optimized out>, n=10) at fileops.c:1197
#7  0x00007f06647d4af2 in __vfprintf_internal (s=0x7f06649476a0 <_IO_2_1_stdout_>, format=0x565493233004 "0000000000", ap=ap@entry=0x7ffddfc84640, mode_flags=mode_flags@entry=0) at ../libio/libioP.h:948
#8  0x00007f06647bfebf in __printf (format=<optimized out>) at printf.c:33
#9  0x000056549323216f in main () at child.c:4
(gdb) frame 9
#9  0x000056549323216f in main () at child.c:4
4           for (int i = 0; i < 1000000; i++) printf("0000000000");
```

我们看到是卡在 `child.c` 的第 4 行 `printf` 了。它上面的执行栈也是一路 `printf` 卡到底。

现在我们知道了，当我们不处理这些文章开始说的事件时候，子进程**有可能**会卡在形如 `printf` 等往 `stdout`、`stderr` 这些 `fd` 写的操作上。

## Unix Domain Socket 缓冲区

我们回过头去看看，我们的实验代码主子进程之间是通过什么来联立 `stdout` 的。根据最开始的文档摘录，噢，原来是 `pipe` 呢！

![undefined](https://dm.nbut.ac.cn/xcoder/2020/09/03/1599037067323-e4e0645e-ef18-4352-9f9b-d0ced7e9fa3d.png)

通常情况下，Linux 下的管道缓冲区为 65536 字节。然而 Node.js 子进程 `stdio` 的值若为 `pipe`，则其实是建立了一个 Unix Domain Socket。

也就是说，子进程的 `stdout` 是一条与主进程之间建立起来的 Unix Domain Socket。其两端的进程均将该管道看做一个文件，子进程负责往其中写内容，而主进程则从中读取。

让我们把视线放到工地上。

![undefined](https://dm.nbut.ac.cn/xcoder/2020/09/03/1599037696714-18946a94-db52-4edb-9230-a885d4579414.png)

管道是有大小的。如果我们堵住管道的出口，那么我们一直往管道里面灌水，最终会导致水灌不进去堵住了。这句话同样适用于我们上面的代码。

也就是说，我们最开始没有翻车的代码，因为输出的内容太少，占不满管道缓冲区，所以不会阻塞程序执行，最终得以安全退出；而后面翻车则是因为我们输出的内容太多了，导致不一会儿缓冲区就满了，而我们的主进程又没去消费，所以就翻车了。

## 主进程停止读取

为什么我们 `on('data')` 了就能消费，而不加就没消费呢。按理说 Node.js 都读过来，`emit` 了事，就能继续读下一趴了。其实不是的。

看看 Node.js 的判断 Readable Stream 是否要读取新内容的逻辑（[https://github.com/nodejs/node/blob/v12.18.3/lib/_stream_readable.js#L586-L621](https://github.com/nodejs/node/blob/v12.18.3/lib/_stream_readable.js#L586-L621)）。

```js
function maybeReadMore_(stream, state) {
  while (!state.reading && !state.ended &&
         (state.length < state.highWaterMark ||
          (state.flowing && state.length === 0))) {
    const len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // Didn't get any data, stop spinning.
      break;
  }
  state.readingMore = false;
}
```

前面其它正常的前提我们抛开不讲，如流正在读啊，还能读到数据啊什么的。

当 Readable Stream 内部的 Buffer 长度没到水位线（通常是 16384），或者其处于 `flowing` 状态且缓存没数据的时候，该流会继续从源读数据。

一个 Readable Stream 最开始的 `flowing` 状态是 `null`。也就是说在这个状态下，当达到缓存水位线之后，就不会继续读数据了。

那什么时候这个状态会变呢？在这里：[https://github.com/nodejs/node/blob/v12.18.3/lib/_stream_readable.js#L868-L897](https://github.com/nodejs/node/blob/v12.18.3/lib/_stream_readable.js#L868-L897)。

当你调用了 `stream.on()` 的时候，它会判断你这次调用所监听的事件。若事件是 `'data'` 且当前的 `flowing` 状态不为 `false` 的话：

```js
  if (ev === 'data') {
    // Update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0;

    // Try start flowing on next tick if stream isn't explicitly paused
    if (state.flowing !== false)
      this.resume();
  }
```

Readable Stream 就会执行 `resume()`。在 `resume()` 中（[https://github.com/nodejs/node/blob/v12.18.3/lib/_stream_readable.js#L955-L969](https://github.com/nodejs/node/blob/v12.18.3/lib/_stream_readable.js#L955-L969)）：

```js
// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  const state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    // We flow only if there is no one listening
    // for readable, but we still have to call
    // resume()
    state.flowing = !state.readableListening;
    resume(this, state);
  }
  state[kPaused] = false;
  return this;
};
```

会将 `flowing` 设置为 `true`。正如 Node.js 文档中说的一样：

> All Readable streams begin in paused mode but can be switched to flowing mode in one of the following ways:
>
> + Adding a 'data' event handler.
> + Calling the stream.resume() method.
> + Calling the stream.pipe() method to send the data to a Writable.

即所有的 Readable Stream 一开始都处于暂停状态，对其添加 `data` 事件才会开始切为 `flowing` 状态。而在暂停状态下，`stdio` 的 `pipe` 流会先缓存略大于或等于水位线的数据。

在暂停状态下，只有你添加了 `data` 事件处理器才会开始读取数据并丢给你；而如果你处于 `flowing` 状态，只移除消费者，那么这些数据就会丢失——因为流其实并没有暂停。

文档上虽说一开始处于暂停状态时我们没去监听数据，那么流就不会产生数据。**实际上在内部实现上是产生了数据，而这部分数据是被缓存起来了。**

## 念文档

好了，回到最开始。我之前说了“其实原因也在文档中写明了，我会在本文的最后再放出来”。现在是时间了，看看这里：[https://nodejs.org/api/child_process.html#child_process_child_process](https://nodejs.org/api/child_process.html#child_process_child_process)。

> By default, pipes for stdin, stdout, and stderr are established between the parent Node.js process and the spawned child. These pipes have limited (and platform-specific) capacity. If the child process writes to stdout in excess of that limit without the output being captured, the child process will block waiting for the pipe buffer to accept more data. This is identical to the behavior of pipes in the shell. Use the { stdio: 'ignore' } option if the output will not be consumed.

默认情况下，`spawn` 等会在 Node.js 进程与子进程间建立 `stdin`、`stdout` 和 `stderr` 的管道。管道容量有限（不同平台容量不同）。如果子进程往 `stdout` 写入内容，而另一端没有捕获导致管道满了的话，在管道腾出空间前，子进程就会一直阻塞。该行为与 Shell 中的管道一致。如果我们不关心输出内容的话，请设置 `{ stdio: 'ignore' }`。

看吧，就是这个理儿。如果我们将其设为 `ignore` 的话，其三个 `std*` 就会导到 `/dev/null` 去。

## 小结

所以标题的标题党就是这个意思。

你一旦建立了子进程，且其 `stdout` 之类的是一个 `pipe`，你就必须对它的数据负责。哪怕你只是监听了这个事件，里面写个空函数，Node.js 也会认为你消费了，不然 Node.js 会把子进程的数据一直挂载在它 `Stream` 的缓存中，最后到一个水位（大于 16384 的时候）之后就停止读取子进程数据了。然后就会导致子进程写阻塞。

**结论就是，你在 `child_process.spawn()` 一个进程的时候，请务必监听 `stdio` 里面各 Stream 的 `'data'` 事件。若你不关心输出，请将 `stdio` 设置为 `ignore` 或者 `inherit`。**
