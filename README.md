# 概要

このリポジトリは、Obsidian をもっと便利に使うために私が開発した script 集になります。

Obsidian で JavaScript を実行するには、[CustomJS](https://github.com/saml-dev/obsidian-custom-js)、[DataView](https://github.com/blacksmithgu/obsidian-dataview) を使うことで実現することができました。

これについては、記事にする予定なので、詳細はそこで説明させていただきます。

（TODO：記事を作成する）

# 環境変数

個人に依存するような変数や定数は、`Property`クラスを作って管理しています。

例えば、以下のように設定しています。

```javascript
class Proparty {
  static sendToSlack = {
    absolutePathToObsidian: "hoge",
    /** リンクを保管しているcsvファイルの相対パス */
    relativeCsvPath: "fuga",

    // ...etc
  };

  static toc = {
    absolutePathToObsidian: "hogefuga",

    // ...etc
  };
}
```

# send-to-slack.js

## 概要

Obsidian で作成した、あるファイルに記載されているリンクを slack に送信するための script です。

この script には事前に、Slack App の Incoming Webhooks を作成しておく必要があります。

また、同じリンクを何度も送らないように、それらのリンクを CSV ファイルで保管する想定で開発しています。

CSV は「No, URL」の 2 つのヘッダを想定しています。

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

# toc.js

## 概要

Markdown 形式で記載したノートの目次(table of contents: toc)を表示する script です。

Markdown 記法での`#`, `##`, `###`, `####`を検出することで、リストのリンクに変換して表示を行います。

（この README を書いているときに気づきましたが、`#`, `##`, `###`, `####`を上げることでインデントを順に下げる処理が入っていないことに気づきました。。いつか対応する予定です。。）

ただ、そもそも Obsidian の機能として目次を表示する機能があったので、それを使ったほうが良いです。。。

## 使い方

````javascript
```dataviewjs
const { TableOfContents } = customJS
const name = dv.current().file.name
const path = dv.current().file.path
const toc = TableOfContents.getTOC(path, name)

dv.list(toc.headingList.map((heading ,index) =>
    dv.sectionLink(name, heading, false, toc.headingTitleList[index])
));
```; ←（カンマは不要です）
````

例えば、上記のコードをファイルの先頭に記載するだけで目次を表示することできます。
