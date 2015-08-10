title: 初探 MySQL 的 Binlog
date: 2015-08-10 11:39:53
tags: [ MySQL, Binary Log, Binlog ]
---

　　花瓣網的搜索架構需要重構，尤其是在索引建立或者更新層面。

　　目前的一個架構導致的結果就是時間越久，數據本體與搜索引擎索引中的數據越不同步，相差甚大。

　　新的一個架構打算從 MySQL 的 Binlog 中讀取數據更新、刪除、新增等歷史記錄，並把相應信息提取出來丟到隊列中慢慢去同步。

　　所以我就在這裏小小去了解一下 Binlog。

## 準備工作

### 什麼是 Binlog

　　MySQL Server 有四種類型的日誌——Error Log、General Query Log、Binary Log 和 Slow Query Log。

　　第一個是錯誤日誌，記錄 mysqld 的一些錯誤。第二個是一般查詢日誌，記錄 mysqld 正在做的事情，比如客戶端的連接和斷開、來自客戶端每條 Sql Statement 記錄信息；如果你想準確知道客戶端到底傳了什麼瞎 [嗶嗶] 玩意兒給服務端，這個日誌就非常管用了，不過它非常影響性能。第四個是慢查詢日誌，記錄一些查詢比較慢的 SQL 語句——這種日誌非常常用，主要是給開發者調優用的。

　　剩下的第三種就是 Binlog 了，包含了一些事件，這些事件描述了數據庫的改動，如建表、數據改動等，也包括一些潛在改動，比如 `DELETE FROM ran WHERE bing = luan`，然而一條數據都沒被刪掉的這種情況。除非使用 Row-based logging，否則會包含所有改動數據的 SQL Statement。

　　那麼 Binlog 就有了兩個重要的用途——複製和恢復。比如主從表的複製，和備份恢復什麼的。

### 啓用 Binlog

　　通常情況 MySQL 是默認關閉 Binlog 的，所以你得配置一下以啓用它。

　　啓用的過程就是修改配置文件 `my.cnf` 了。

　　至於 `my.cnf` 位置請自行尋找。例如通過 OSX 的 `brew` 安裝的 `mysql` 默認配置目錄通常在

> /usr/local/Cellar/mysql/$VERSION/support-files/my-default.cnf

　　這個時候需要將它拷貝到 `/etc/my.cnf` 下面。

> 詳見 <[StackOverflow - MySQL 'my.cnf' location?](http://stackoverflow.com/questions/10757169/mysql-my-cnf-location)>。

　　緊接着配置 `log-bin` 和 `log-bin-index` 的值，如果沒有則自行加上去。

```ini
log-bin=master-bin
log-bin-index=master-bin.index
```

　　這裏的 `log-bin` 是指以後生成各 Binlog 文件的前綴，比如上述使用 `master-bin`，那麼文件就將會是 `master-bin.000001`、`master-bin.000002` 等。而這裏的 `log-bin-index` 則指 binlog index 文件的名稱，這裏我們設置爲 `master-bin.index`。

　　如果上述工作做完之後重啓 MySQL 服務，你可以進入你的 MySQL CLI 驗證一下是否真的啓用了。

```sh
$ mysql -u $USERNAME ...
```

　　然後在終端裏面輸入下面一句 SQL 語句：

```sql
SHOW VARIABLES LIKE '%log_bin%';
```

　　如果結果裏面出來這樣類似的話就表示成功了：

```sh
+---------------------------------+---------------------------------------+
| Variable_name                   | Value                                 |
+---------------------------------+---------------------------------------+
| log_bin                         | ON                                    |
| log_bin_basename                | /usr/local/var/mysql/master-bin       |
| log_bin_index                   | /usr/local/var/mysql/master-bin.index |
| log_bin_trust_function_creators | OFF                                   |
| log_bin_use_v1_row_events       | OFF                                   |
| sql_log_bin                     | ON                                    |
+---------------------------------+---------------------------------------+
6 rows in set (0.00 sec)
```

　　更多的一些相關配置可以參考這篇《[MySQL 的 binary log 初探](http://blog.csdn.net/jolly10/article/details/13998761)》。

### 隨便玩玩

　　然後你就可以隨便去執行一些數據變動的 SQL 語句了。當你執行了一堆語句之後就可以看到你的 Binlog 裏面有內容了。

　　如上表所示，`log_bin_basename` 的值是 `/usr/local/var/mysql/master-bin` 就是 Binlog 的基礎文件名了。

　　那我們進去看，比如我的這邊就有這麼幾個文件：

![Binlog 文件](binlog-files.jpg)

　　很容易發現，裏面有 `master-bin.index` 和 `master-bin.000001` 兩個文件，這兩個文件在上文中有提到過了。

　　我們打開那個 `master-bin.index` 文件，會發現這個索引文件就是一個普通的文本文件，然後列舉了各 binlog 的文件名。而 `master-bin.000001` 文件就是一堆亂碼了——畢竟人家是二進制文件。

## 結構解析

### 索引文件

　　索引文件就是上文中的 `master-bin.index` 文件，是一個普通的文本文件，以換行爲間隔，一行一個文件名。比如它可能是：

```
master-bin.000001
master-bin.000002
master-bin.000003
```

　　然後對應的每行文件就是一個 Binlog 實體文件了。

### Binlog 文件

　　Binlog 的文件結構大致由如下幾個方面組成。

#### 文件頭

　　文件頭由一個四字節 Magic Number，其值爲 `1852400382`，在內存中就是 `"\xfe\x62\x69\x6e"`，參考 MySQL 源碼的 [log_event.h](://github.com/mysql/mysql-server/blob/a2757a60a7527407d08115e44e889a25f22c96c6/sql/log_event.h#L187)，也就是 `'\0xfe' 'b' 'i' 'n'`。

　　與平常二進制一樣，通常都有一個 Magic Number 進行文件識別，如果 Magic Number 不吻合上述的值那麼這個文件就不是一個正常的 Binlog。

#### 事件

　　在文件頭之後，跟隨的是一個一個事件依次排列。每個事件都由一個事件頭和事件體組成。

　　事件頭裏面的內容包含了這個事件的類型（如新增、刪除等）、事件執行時間以及是哪個服務器執行的事件等信息。

　　第一個事件是一個事件描述符，描述了這個 Binlog 文件格式的版本。接下去的一堆事件將會按照第一個事件描述符所描述的結構版本進行解讀。最後一個事件是一個銜接事件，指定了下一個 Binlog 文件名——有點類似於鏈表裏面的 `next` 指針。

　　根據《[High-Level Binary Log Structure and Contents](High-Level Binary Log Structure and Contents)》所述，不同版本的 Binlog 格式不一定一樣，所以也沒有一個定性。在我寫這篇文章的時候，目前有三種版本的格式。

* v1，用於 MySQL 3.2.3
* v3，用於 MySQL 4.0.2 以及 4.1.0
* v4，用於 MySQL 5.0 以及更高版本

　　實際上還有一個 v2 版本，不過只在早期 4.0.x 的 MySQL 版本中使用過，但是 v2 已經過於陳舊並且不再被 MySQL 官方支持了。

> **通常我們現在用的 MySQL 都是在 5.0 以上的了，所以就略過 v1 ~ v3 版本的 Binlog，如果需要了解 v1 ~ v3 版本的 Binlog 可以自行前往上述的《High-level...》文章查看。**

##### 事件頭

　　一個事件頭有 19 字節，依次排列爲四字節的時間戳、一字節的當前事件類型、四字節的服務端 ID、四字節的當前事件長度描述、四字節的下個事件位置（方便跳轉）以及兩字節的標識。

　　用 ASCII Diagram 表示如下：

```
+---------+---------+---------+------------+-------------+-------+
|timestamp|type code|server_id|event_length|next_position|flags  |
|4 bytes  |1 byte   |4 bytes  |4 bytes     |4 bytes      |2 bytes|
+---------+---------+---------+------------+-------------+-------+
```

　　也可以字節編造一個結構體來解讀這個頭：

```c
struct BinlogEventHeader
{
    int   timestamp;
    char  type_code;
    int   server_id;
    int   event_length;
    int   next_position;
    char  flags[2];
};
```

> 如果你要直接用這個結構體來讀取數據的話，需要加點手腳。
>
> 因爲默認情況下 GCC 或者 G++ 編譯器會對結構體進行字節對齊，這樣讀進來的數據就不對了，因爲 Binlog 並不是對齊的。爲了統一我們需要取消這個結構體的字節對齊，一個方法是使用 `#pragma pack(n)`，一個方法是使用 `__attribute__((__packed__))`，還有一種情況是在編譯器編譯的時候強制把所有的結構體對其取消，即在編譯的時候使用 `fpack-struct` 參數，如：
>
> ```sh
$ g++ temp.cpp -o a -fpack-struct=1
```

　　根據上述的結構我們可以明確得到各變量在結構體裏面的偏移量，所以在 MySQL 源碼裏面（[libbinlogevents/include/binlog_event.h](https://github.com/mysql/mysql-server/blob/5.7/libbinlogevents/include/binlog_event.h#L353)）有下面幾個常量以快速標記偏移：

```c
#define EVENT_TYPE_OFFSET    4
#define SERVER_ID_OFFSET     5
#define EVENT_LEN_OFFSET     9
#define LOG_POS_OFFSET       13
#define FLAGS_OFFSET         17
```

　　而具體有哪些事件則在 [libbinlogevents/include/binlog_event.h#L245](https://github.com/mysql/mysql-server/blob/5.7/libbinlogevents/include/binlog_event.h#L245) 裏面被定義。如有個 `FORMAT_DESCRIPTION_EVENT` 事件的 `type_code` 是 15、`UPDATE_ROWS_EVENT` 的 `type_code` 是 31。

　　還有那個 `next_position`，在 v4 版本中代表從 Binlog 一開始到下一個事件開始的偏移量，比如到第一個事件的 `next_position` 就是 4，因爲文件頭有一個字節的長度。然後接下去對於事件 n 和事件 n + 1 來說，他們有這樣的關係：

> next_position(n + 1) = next_position(n) + event_length(n)

　　關於 flags 暫時不需要了解太多，如果真的想了解的話可以看看 MySQL 的[相關官方文檔](http://dev.mysql.com/doc/internals/en/event-flags.html)。

##### 事件體

　　事實上在 Binlog 事件中應該是有三個部分組成，`header`、`post-header` 和 `payload`，不過通常情況下我們把 `post-header` 和 `payload` 都歸結爲事件體，實際上這個 `post-header` 裏面放的是一些定長的數據，只不過有時候我們不需要特別地關心。想要深入瞭解可以去查看 MySQL 的官方文檔。

　　所以實際上一個真正的事件體由兩部分組成，用 ASCII Diagram 表示就像這樣：

```
+=====================================+
| event  | fixed part (post-header)   |
| data   +----------------------------+
|        | variable part (payload)    |
+=====================================+
```

　　而這個 `post-header` 對於不同類型的事件來說長度是不一樣的，同種類型來說是一樣的，而這個長度的預先規定將會在一個“格式描述事件”中定好。

##### 格式描述事件

　　在上文我們有提到過，在 Magic Number 之後跟着的是一個格式描述事件（Format Description Event），其實這只是在 v4 版本中的稱呼，在以前的版本里面叫起始事件（Start Event）。

　　在 v4 版本中這個事件的結構如下面的 ASCII Diagram 所示。

```
+=====================================+
| event  | timestamp         0 : 4    |
| header +----------------------------+
|        | type_code         4 : 1    | = FORMAT_DESCRIPTION_EVENT = 15
|        +----------------------------+
|        | server_id         5 : 4    |
|        +----------------------------+
|        | event_length      9 : 4    | >= 91
|        +----------------------------+
|        | next_position    13 : 4    |
|        +----------------------------+
|        | flags            17 : 2    |
+=====================================+
| event  | binlog_version   19 : 2    | = 4
| data   +----------------------------+
|        | server_version   21 : 50   |
|        +----------------------------+
|        | create_timestamp 71 : 4    |
|        +----------------------------+
|        | header_length    75 : 1    |
|        +----------------------------+
|        | post-header      76 : n    | = array of n bytes, one byte per event
|        | lengths for all            |   type that the server knows about
|        | event types                |
+=====================================+
```

　　這個事件的 `type_code` 是 15，然後 `event_length` 是大於等於 91 的值的，這個主要取決於所有事件類型數。

　　因爲從第 76 字節開始後面的二進制就代表一個字節類型的數組了，一個字節代表一個事件類型的 `post-header` 長度，即每個事件類型固定數據的長度。
 
　　那麼按照上述的一些線索來看，我們能非常快地寫出一個簡單的解讀 Binlog 格式描述事件的代碼。

> 如上文所述，如果需要正常解讀 Binlog 文件的話，下面的代碼編譯時候需要加上 `-fpack-struct=1` 這個參數。

```c++
#include <cstdio>
#include <cstdlib>

struct BinlogEventHeader
{
    int  timestamp;
    unsigned char type_code;
    int  server_id;
    int  event_length;
    int  next_position;
    short flags;
};

int main()
{
    FILE* fp = fopen("/usr/local/var/mysql/master-bin.000001", "rb");
    int magic_number;
    fread(&magic_number, 4, 1, fp);

    printf("%d - %s\n", magic_number, (char*)(&magic_number));

    struct BinlogEventHeader format_description_event_header;
    fread(&format_description_event_header, 19, 1, fp);

    printf("BinlogEventHeader\n{\n");
    printf("    timestamp: %d\n", format_description_event_header.timestamp);
    printf("    type_code: %d\n", format_description_event_header.type_code);
    printf("    server_id: %d\n", format_description_event_header.server_id);
    printf("    event_length: %d\n", format_description_event_header.event_length);
    printf("    next_position: %d\n", format_description_event_header.next_position);
    printf("    flags[]: %d\n}\n", format_description_event_header.flags);

    short binlog_version;
    fread(&binlog_version, 2, 1, fp);
    printf("binlog_version: %d\n", binlog_version);

    char server_version[51];
    fread(server_version, 50, 1, fp);
    server_version[50] = '\0';
    printf("server_version: %s\n", server_version);
    
    int create_timestamp;
    fread(&create_timestamp, 4, 1, fp);
    printf("create_timestamp: %d\n", create_timestamp);

    char header_length;
    fread(&header_length, 1, 1, fp);
    printf("header_length: %d\n", header_length);

    int type_count = format_description_event_header.event_length - 76;
    unsigned char post_header_length[type_count];
    fread(post_header_length, 1, type_count, fp);
    for(int i = 0; i < type_count; i++) 
    {
        printf("  - type %d: %d\n", i + 1, post_header_length[i]);
    }

    return 0;
}
```

　　這個時候你得到的結果有可能就是這樣的了：

```
1852400382 - �binpz�
BinlogEventHeader
{
    timestamp: 1439186734
    type_code: 15
    server_id: 1
    event_length: 116
    next_position: 120
    flags[]: 1
}
binlog_version: 4
server_version: 5.6.24-log
create_timestamp: 1439186734
header_length: 19
  - type 1: 56
  - type 2: 13
  - type 3: 0
  - type 4: 8
  - type 5: 0
  - type 6: 18
  - ...
```

　　一共會輸出 40 種類型（從 1 到 40），如官方文檔所說，這個數組從 `START_EVENT_V3` 事件開始（`type_code` 是 1）。

##### 跳轉事件

　　跳轉事件即 `ROTATE_EVENT`，其 `type_code` 是 4，其 `post-header` 長度爲 8。

　　當一個 Binlog 文件大小已經差不多要分割了，它就會在末尾被寫入一個 `ROTATE_EVENT`——用於指出這個 Binlog 的下一個文件。

　　它的 `post-header` 是 8 字節的一個東西，內容通常就是一個整數 `4`，用於表示下一個 Binlog 文件中的第一個事件起始偏移量。我們從上文就能得出在一般情況下這個數字只可能是四，就偏移了一個魔法數字。當然我們講的是在 v4 這個 Binlog 版本下的情況。

　　然後在 `payload` 位置是一個字符串，即下一個 Binlog 文件的文件名。

##### 各種不同的事件體

　　由於篇幅原因這裏就不詳細舉例其它普通的不同事件體了，具體的詳解在 [MySQL 文檔](http://dev.mysql.com/doc/internals/en/event-data-for-specific-event-types.html)中一樣有介紹，用到什麼類型的事件體就可以自己去查詢。

## 小結

　　本文大概介紹了 Binlog 的一些情況，以及 Binlog 的內部二進制解析結構。方便大家造輪子用——不然老用別人的輪子，只知其然而不知其所以然多沒勁。

　　好了要下班了，就寫到這裏過吧。

## 參考

1. [MySQL's binary log 結構簡介](http://my.oschina.net/leejun2005/blog/75273)，目測原文在 [TaobaoDBA](http://www.taobaodba.com/html/474_mysqls-binary-log_details.html)（已無法訪問）
2. [MySQL Binlog 的介紹](http://www.linuxidc.com/Linux/2014-09/107095.htm)
3. [MySQL 的 binary log 初探](http://blog.csdn.net/jolly10/article/details/13998761)
4. [High-Level Binary Log Structure and Contents](http://dev.mysql.com/doc/internals/en/binary-log-structure-and-contents.html) and related official documents
5. [#pragma pack vs -fpack-struct for Intel C](http://stackoverflow.com/questions/21912098/pragma-pack-vs-fpack-struct-for-intel-c)
