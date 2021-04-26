# KeeWeb for utools

KeePass是一款开源的密码管理工具。而这是一款基于keeweb的utools密码管理插件。

支持快速检索网站密码

可使用 `ctrl + t` 实现用户名和密码的快速输入

更多快捷方式请看设置

> 如果不想每次打开都需要输入密码，可关闭utools的`隐藏插件后完全退出`

[开源代码](https://github.com/qinyongliang/keeweb)

预览

![](https://i.loli.net/2020/10/20/8rt27ETqRfGi4we.png)
![](https://i.loli.net/2020/10/20/dYH2nIgryopvkcS.png)

## 自动输入

![屏幕录制.gif](https://i.loli.net/2020/10/20/DZM3mRKF6g57pnE.gif)

> 选中某条记录后，按`CTRL+T`实现自动输入

## 超级面板自动输入

![autoType.gif](https://i.loli.net/2021/03/22/XNf2uaWGl1D4gRB.gif)

## 全局快捷键自动输入

需要在 `设置` --> `全局快捷键` 中添加快捷键，功能关键字为： `自动填充`

## 更新日志

### 0.5.1

修复新建密码文件不能保存到坚果云的bug

### 0.5.0

1. 实现唤起超级面板 自动填充 用户密码

> 支持网址匹配和应用匹配，建议将应用名填入 `备注` 字段

> 应用名称可在填充时的界面中找到。


### 0.4.1

1. 修复windows下没有自动获取并检索当前网址
 
> 感谢 [anrgct](https://github.com/anrgct)


### 0.4.0

1. 实现第三方插件：ChromeKeePass
2. 升级数据结构

### 0.3.0

1. 合并上游代码
2. 添加拼音搜索