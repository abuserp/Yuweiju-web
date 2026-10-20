客人数据包
==========

在标题页点击「载入 .json」导入客人包，数据保存在当前浏览器中。
example-pack.json 是格式示例；optional-guests.json 是四组可选来客。
两者均不默认加载。网站部署时，可在 index.json 数组中添加要自动加载的文件名。
同 id 的包会被后来加载的包覆盖。

剧情与效果
----------
guests 定义特殊客人，regulars 定义常客。
appear 设置出现日期、默契门槛、权重、冷却与到访条件。
stages 按到访顺序定义剧情；lines 是台词，effects 是完成接待后的奖励。
未完成接待不播放剧情、不推进到访次数。
剧情回想不会应用奖励或修改进度。

素材
----
Q 版帧序列位于 art/<素材 id>/，在 js/assets.js 的 MANIFEST 中登记。
双人客人用 sprites 数组按 members 的顺序指定素材 id。
内置对话立绘使用 WebP，位于 avg/<角色目录>/；台词用 char 指定角色目录，look 指定不含扩展名的差分名。
自定义图片也可以用 portrait 直接指定 PNG、WebP 等图片路径。路径及文件名大小写须与实际文件一致。
