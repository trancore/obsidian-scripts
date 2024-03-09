class SendToSlack {
  #FS = require("node:fs");
  /** Obsidianディレクトリまでの絶対パス */
  #ABSOLUTE_PATH_TO_OBSIDIAN = "";
  /** リンクを保管しているcsvファイルの相対パス */
  #RELATIVE_CSV_PATH = "";
  /** ファイル内のリンクを抽出するための正規表現 */
  #REG_EXP_LINK = "";
  /** 送信先のSlack App(Incoming Webhooks)のURL */
  #SLACK_URL = "";

  /**
   * pathのファイル内に記載されているURLをslackに送信する。
   * @param {string} path
   */
  sendToSlack(path) {
    // リンクを記載しているファイルまでの絶対パス
    const absolutePath = this.#ABSOLUTE_PATH_TO_OBSIDIAN + "/" + path;
    // ファイル内のコンテンツを取得する
    const contents = this.#FS.readFileSync(absolutePath, {
      encoding: "utf8",
    });

    // コンテンツ内のcardlinkのみを取得する
    const contentsCardLinkList = contents.match(this.#REG_EXP_LINK);

    // コンテンツ内にリンクがない場合は処理を終了
    if (contentsCardLinkList === null) {
      return;
    }

    // cardlinkをオブジェクトに変換する
    const contentsLinkList = contentsCardLinkList.map((cardlink) => {
      const propertyList = cardlink.split("\n");

      const url = propertyList.find((property) => property.includes("url: "));
      const urlStringOfIndex = url?.indexOf(": ") + 2;

      const title = propertyList.find((property) =>
        property.includes("title: ")
      );
      const titleStringOfIndex = title?.indexOf(": ") + 2;

      const description = propertyList.find((property) =>
        property.includes("description: ")
      );
      const descriptionStringOfIndex = description?.indexOf(": ") + 2;

      const favicon = propertyList.find((property) =>
        property.includes("favicon: ")
      );
      const faviconStringOfIndex = favicon?.indexOf(": ") + 2;
      const faviconUrl = favicon?.substring(faviconStringOfIndex);
      const shortFavicon = faviconUrl?.substring(0, faviconUrl?.indexOf("?"));

      const image = propertyList.find((property) =>
        property.includes("image: ")
      );
      const imageStringOfIndex = image?.indexOf(": ") + 2;
      const imageUrl = image?.substring(imageStringOfIndex);
      const shortImage = imageUrl?.substring(0, imageUrl?.indexOf("?"));

      return {
        url: url?.substring(urlStringOfIndex) || "",
        title: title?.substring(titleStringOfIndex).slice(1, -1) || "",
        description:
          description?.substring(descriptionStringOfIndex).slice(1, -1) || "",
        favicon: shortFavicon === "" ? faviconUrl : shortFavicon,
        image: shortImage === "" ? imageUrl : shortImage,
      };
    });

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
    const csvUrlList = csvRecords.map((csvRecord) => csvRecord["url"]);

    // csvファイルに無い（まだslackに送っていない）URL配列
    const sendedCardlinkList = contentsLinkList.filter(
      (contentsLink) => !csvUrlList.includes(contentsLink.url)
    );

    // slackに送るリンクがない場合は、処理を終了
    if (sendedCardlinkList.length === 0) {
      return;
    }

    //　Slackへ送るテンプレート（Blocks kit）
    // https://app.slack.com/block-kit-builder/T0322TQRSR0#%7B%22blocks%22:%5B%5D%7D
    const payload = {
      text: "",
      blocks: sendedCardlinkList.map((cardlink) => {
        const shortDescription =
          cardlink.description.length > 102
            ? cardlink.description.substring(0, 102).concat("", "...")
            : cardlink.description;

        if (cardlink.image || cardlink.favicon) {
          return {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*<${cardlink.url}|${cardlink.title}>*\n${shortDescription}`,
            },
            accessory: {
              type: "image",
              image_url: cardlink.image || cardlink.favicon,
              alt_text: cardlink.title,
            },
          };
        }
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*<${cardlink.url}|${cardlink.title}>*\n${shortDescription}`,
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
    xml.send(`payload=${JSON.stringify(payload)}`);

    // csvファイルに存在しないリンクを追加する
    const stream = this.#FS.createWriteStream(
      `${this.#ABSOLUTE_PATH_TO_OBSIDIAN}${this.#RELATIVE_CSV_PATH}`
    );
    stream.write(csvData.trim());
    sendedCardlinkList.forEach((sendUrl, index) => {
      stream.write("\n" + (csvRecords.length + 1 + index) + "," + sendUrl.url);
    });

    stream.end();

    new Notice("送信完了");
  }
}
