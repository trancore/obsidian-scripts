class SendToSlack {
  #FS = require("node:fs");
  /** Obsidianディレクトリまでの絶対パス */
  #ABSOLUTE_PATH_TO_OBSIDIAN = "";
  /** リンクを保管しているcsvファイルの相対パス */
  #RELATIVE_CSV_PATH = "";
  /** ファイル内のリンクを抽出するための正規表現 */
  #REG_EXP_LINK = /^(https:).*/gm;
  /** 送信先のSlack App(Incoming Webhooks)のURL */
  #SLACK_URL = "";
  // テスト用
  // "";

  /**
   * pathのファイル内に記載されているURLをslackに送信する。
   * @param {string} path https://~~~
   */
  sendToSlack(path) {
    // リンクを記載しているファイルまでの絶対パス
    const absolutePath = this.#ABSOLUTE_PATH_TO_OBSIDIAN + "/" + path;
    // ファイル内のコンテンツを取得する
    const contents = this.#FS.readFileSync(absolutePath, {
      encoding: "utf8",
    });

    // コンテンツ内のリンクのみを取得する
    const contentsLinkList = contents.match(this.#REG_EXP_LINK);

    // リンクを保管しているcsvファイルを読み込む
    const csvData = this.#FS.readFileSync(
      `${this.#ABSOLUTE_PATH_TO_OBSIDIAN}${this.#RELATIVE_CSV_PATH}`,
      { encoding: "utf8" }
    );
    // 改行文字で分割し、各行を配列に変換する
    const csvRows = csvData.trim().split("\n");
    // ヘッダー行を取得し、列の名前を取得する
    const csvHeaders = csvRows[0].split(",");
    // データ行を取得し、オブジェクトの配列に変換する
    const csvRecords = csvRows.slice(1).map((csvRow) => {
      const values = csvRow.split(",");
      const record = {};
      csvHeaders.forEach((csvHeader, index) => {
        record[csvHeader] = values[index];
      });
      return record;
    });
    // csvファイル内のURLのみを抽出した配列
    const csvUrlList = csvRecords.map((csvRecord) => csvRecord["URL"]);
    // csvファイルに無い（まだslackに送っていない）URL配列
    const sendedUrlList = contentsLinkList.filter(
      (contentsLink) => !csvUrlList.includes(contentsLink)
    );

    // slackに送るリンクがない場合は、処理を終了
    if (sendedUrlList.length === 0) {
      return;
    }

    //　Slackへ送るテンプレート（Blocks kit）
    // https://app.slack.com/block-kit-builder/T0322TQRSR0#%7B%22blocks%22:%5B%5D%7D
    const data = {
      text: "",
      blocks: sendedUrlList.map((url) => {
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${url}>`,
          },
        };
      }),
    };

    // Slackへの送信処理
    const xml = new XMLHttpRequest();
    xml.open("POST", this.#SLACK_URL, true);
    xml.setRequestHeader(
      "content-type",
      "application/x-www-form-urlencoded;charset=UTF-8"
    );
    xml.send(`payload=${JSON.stringify(data)}`);

    // csvファイルに存在しないリンクを追加する
    const stream = this.#FS.createWriteStream(
      `${this.#ABSOLUTE_PATH_TO_OBSIDIAN}${this.#RELATIVE_CSV_PATH}`
    );
    stream.write(csvData.trim());
    sendedUrlList.forEach((sendUrl, index) => {
      stream.write("\n" + (csvRecords.length + 1 + index) + "," + sendUrl);
    });

    stream.end();
  }
}
