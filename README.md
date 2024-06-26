﻿# 概要

このリポジトリは、Obsidian をもっと便利に使うために私が開発した script 集になります。

Obsidian で JavaScript を実行するには、[CustomJS](https://github.com/saml-dev/obsidian-custom-js)、[DataView](https://github.com/blacksmithgu/obsidian-dataview) を使うことで実現することができました。

これについては、記事にする予定なので、詳細はそこで説明させていただきます。

（TODO：記事を作成する）

# send-to-slack.js

## 概要

Obsidian で作成した、あるファイルに記載されているリンクを slack に送信するための script です。

この script には事前に、Slack App の Incoming Webhooks を作成しておく必要があります。

また、同じリンクを何度も送らないように、それらのリンクを CSV ファイルで保管する想定で開発しています。

CSV は「No, url」の 2 つのヘッダを想定しています。

## 使い方

````javascript
```dataviewjs
const { SendToSlack } = customJS
const path = dv.current().file.path

const btn = dv.el("button", "Slackへ送信")
btn.onclick = function() {
	SendToSlack.sendToSlack(path)
}
```; ←（カンマは不要です）
````

これを Obsidian に記載することでボタンが配置でき、そのボタンを押下することで`SendToSlack`メソッドを実行できます。

処理の詳細は、コードにコメントを残していますので、そちらをご参照ください。

## ⚠️ 注意点

- 一度に大量の記事は送信できないので、5 個ずつ送信してください。
- youtube は送信できません。
- スマートフォンアプリでは、使えません。

# toc.js

## 概要

Markdown 形式で記載したノートの目次(table of contents: toc)を表示する script です。

Markdown 記法での`#`, `##`, `###`, `####`を検出することで、リストのリンクに変換して表示を行います。

ただ、そもそも Obsidian の機能として目次を表示する機能があったので、それを使ったほうが良いです。。。

## 使い方

````javascript
```dataviewjs
const { TableOfContents } = customJS
const name = dv.current().file.name
const path = dv.current().file.path
const toc = TableOfContents.getTOC(path, name)

dv.header(3, "目次");
dv.paragraph(toc.markdownList);

```; ←（カンマは不要です）
````

例えば、上記のコードをファイルの先頭に記載するだけで目次を表示することできます。
