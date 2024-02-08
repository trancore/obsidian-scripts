class TableOfContents {
  /**
   * Table of Contents（目次）の取得
   * @param path Obsidianのルートディレクトリを基準としたファイルの相対パス
   * @param fileName ファイル名
   */
  getTOC(path, fileName) {
    const fs = require("node:fs");

    // ファイル内のコンテンツを取得する
    const ABSOLUTE_PATH_TO_OBSIDIAN = "";
    const absolutePath = ABSOLUTE_PATH_TO_OBSIDIAN + path;
    const contents = fs.readFileSync(absolutePath, { encoding: "utf8" });

    // コンテンツ内の見出しのみを取得する
    const REG_EXP_HEADING = /^(# |## |### |#### ).*/gm;
    const headingList = contents.match(REG_EXP_HEADING);

    // obsidianでの内部リンク方法
    // [[{fileName}# {headingName}|{name}]]
    // 例：[[ObsidianのnoteをJavaScriptで解析する#前提|test]]
    const REG_EXP_HEADING_TITLE = /^(# |## |### |#### )/gm;
    const headingTitleList = headingList.map((heading) => {
      return heading.replace(REG_EXP_HEADING_TITLE, "");
    });

    return { headingList, headingTitleList };
  }
}
