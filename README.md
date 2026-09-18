# My4F Fast v3.1

Cache-busted UI correction.

- iPhoneでページ全体を720pxの固定コンテンツ幅として表示し、横スクロールを許可
- v2の「スマホ幅へ押し込む」CSSを廃止
- 文字サイズを縮小し、Streamlitに近い情報密度へ
- ドーナツ内に ticker / Four Gods名 + 比率を直接表示
- 月次リターンは5列固定で全列表示
- CSS/JSファイル名を変更 + query versionを付け、GitHub Pages/Safariの古いCSSキャッシュを回避
- kirin_snapshot.jsonの研究データは変更していない
- snapshot内で null の値（2026-05/04 SPY/TQQQ）は捏造せず「—」表示

Fast frontendには戦略計算ロジックを追加していません。
