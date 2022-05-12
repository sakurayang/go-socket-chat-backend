# go-socket-chat-backend
> TCP/IP 课程的作业

## 运行环境

- Node >= 16

### 运行

```shell
yarn
# or
npm i

# 修改配置文件
vim src/config.js

node src/app.js
```

## 路由接口

### websocket 路径

`/ws`

**连接详细指南请参照 (#socket 连接)[#socket 连接] **

### 参数概述

- `:id` 指具体的房间 id，必定为字符串，并只包含 `[a-zA-Z0-9]` 。
- `:name` 指房间名字，会被储存为 URI 编码。如 `房间` 将会被储存为 `%B7%BF%BC%E4`。

### 内容格式

`Room 格式`

| 名称     |      类型       | 说明         |
|:-------|:-------------:|:-----------|
| id     |    String     | 房间 id      |
| name   |    String     | 房间名字       |
| sub    | Array<String> | 子房间的 id 列表 |
| parent |    String     | 父房间        |

**当父房间存在时，子房间的长度必定为 0， 反之亦然**

### 获取房间列表

- 路径 `/room`
- 方法 `GET`
- 返回 `JSON`

| 名称    |     类型      | 说明                           |
|:------|:-----------:|:-----------------------------|
| rooms | Array<Room> | `Room` 的内容格式请参照(内容格式)[#内容格式] |

返回示例：

```json
{
    "rooms": [
        {"id":"JxEz3RnxkH","name":"aaa","sub":["Y37JjrENTV"],"parent":""},
        {"id":"Y37JjrENTV","name":"bbb","sub":[],"parent":"JxEz3RnxkH"}
    ]
}
```

### 创建房间

- 路径 `/room/:name`
- 方法 `PUT`
- 返回 `JSON`

调用参数：

| 名称     |   类型   | 说明              | 是否必须  |
|:-------|:------:|:----------------|:-----:|
| parent | String | 父房间的id          | False |


调用示例

`curl -X PUT /room/room_name?parent=[parent_id]`

当创建成功时将返回一个无 `err` 属性的 JSON

| 名称    |     类型      | 说明                           |
|:------|:-----------:|:-----------------------------|
| rooms | Array<Room> | `Room` 的内容格式请参照(内容格式)[#内容格式] |
| err   |   String    | 错误详情， 当成功时此项不存在              |

返回示例

```json
{
    "rooms" : [
        {"id":"JxEz3RnxkH","name":"aaa","sub":["Y37JjrENTV"],"parent":""},
        {"id":"Y37JjrENTV","name":"bbb","sub":[],"parent":"JxEz3RnxkH"},
        {"id":"BtaeGXxJ93","name":"room_name","sub":[],"parent":""}
    ]
}
```
失败时：

```json
{
    "rooms": [
        {"id":"JxEz3RnxkH","name":"aaa","sub":["Y37JjrENTV"],"parent":""},
        {"id":"Y37JjrENTV","name":"bbb","sub":[],"parent":"JxEz3RnxkH"}
    ],
    "err": "name duplicate"
}
```
失败时将返回 HTTP 503

当父房间 id 不存在时， 错误信息为 `parent id not exist` 。

### 删除房间

- 路径 `/room/:id`
- 方法 `DELETE`
- 返回 `JSON`

调用示例

`curl -X DELETE /room/<room id>`

当删除成功时将返回一个无 `err` 属性的 JSON

| 名称    |     类型      | 说明                           |
|:------|:-----------:|:-----------------------------|
| rooms | Array<Room> | `Room` 的内容格式请参照(内容格式)[#内容格式] |
| err   |   String    | 错误详情， 当成功时此项不存在              |

返回示例

```json
{
    "rooms" : [
        {"id":"JxEz3RnxkH","name":"aaa","sub":["Y37JjrENTV"],"parent":""},
        {"id":"Y37JjrENTV","name":"bbb","sub":[],"parent":"JxEz3RnxkH"}
    ]
}
```
失败时：

```json
{
    "rooms": [
        {"id":"JxEz3RnxkH","name":"aaa","sub":["Y37JjrENTV"],"parent":""},
        {"id":"Y37JjrENTV","name":"bbb","sub":[],"parent":"JxEz3RnxkH"}
    ],
    "err": "id not exist"
}
```
失败时将返回 HTTP 503

### 获取系统状态（没做完，不能用）

- 路径 `/status`
- 方法 `GET`
- 返回 `JSON`

返回格式

| 名称     |   类型   | 说明   |
|:-------|:------:|:-----|
| rooms  | Number | 房间数量 |
| online | Number | 在线人数 |

返回示例
```json
{
    "status":{
        "online": 0,
        "rooms": 0
    }
}
```

:warning: **<span style="color:red">本接口尚未完工，恒返回 0</span>**

## socket 连接

步骤：
1. 使用任何 websocket 客户端连接至服务器
2. 在连接完成后发送初始化消息
3. 等待服务端返回 ok 后，再发送常规消息
4. 每五分钟发送一次心跳包，服务端收到后将会返回目前的状态信息
5. 退出时请发送退出消息

### 消息格式

| 字段名  |   类型   | 说明                 |            是否必须             |
|:-----|:------:|:-------------------|:---------------------------:|
| type | String | 参见下方 `消息类型`        |              是              |
| name | String | 用户名                |              是              |
| time | Number | 时间戳                |              是              |
| room | String | 房间号                | 仅第一次连接和退出时必须，后续的将会被忽略，但建议加上 |
| msg  | String | 消息，消息格式参见下方 `特殊消息` |  消息类型 `pub` 时必须，其余情况将会被忽略   |


### 消息类型

- `sub` 订阅 / 加入房间
- `pub` 发布消息
- `unsub` 解订 / 退出房间
- `heart` 心跳包

### 特殊消息

- 文件上传消息： \[file: <文件url>, <文件名>, <文件大小>\]
- 图片消息：\[pic: <图片url>\]
- 服务端广播消息：\[notice: <消息内容>\]

**注：服务端广播消息仅能通过服务端广播发送，若客户端发送此类消息将会被丢弃。**

示例：

在调用文件上传接口后，服务端将返回文件url，文件名和文件大小，将这三个消息放入上述格式中进行传输

```json
{
    "type": "pub",
    "time": 1000000000,
    "room": "xxxxxx",
    "name": "yyyyyy",
    "msg": "[file:https://file.url/asdghfyq2qw.zip,name.zip,1037461]"
}
```

服务端广播消息包含以下两种
- xxxxx加入房间
- xxxx退出房间
