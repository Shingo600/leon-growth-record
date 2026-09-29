# Outings Add-on UI Generation Prompt

Tool: built-in imagegen
Output: `outings-addon-ui-v1.png`
Purpose: design reference, not a real facility search result.

```text
Use case: ui-mockup
Asset type: high fidelity Japanese mobile web app design concept board, two portrait screens side by side.
Primary request: Design the new standalone add-on tab おでかけ for レオン成長記録, a family dog diary app. Left screen is 探す, right screen is 行きたい. This is a design reference before implementation, not a real search result.
Composition: landscape board, approximately 1536x1024 or larger equivalent; two complete tall readable mobile app screens with generous margins, no device hardware, flat front view. Each screen approximately 390 CSS pixels wide; do not crop buttons. Small board caption at bottom "UIイメージ / 施設名・内容はサンプル".
Visual language: existing app soft warm ivory/beige background #F8F5EF, white softly rounded cards, dark brown text #2F2A25, delicate warm-gray borders, indigo #4F46E5 selected states and primary CTA, refined Japanese sans-serif. Generous 44px+ touch targets. Minimal thin outline icons. No real facility photos, no map, no star ratings, no fake verified badges. Tiny friendly black-white-tan dog line illustration near heading only.
Both screens header: small "レオン成長記録", main title "おでかけ", subtitle "レオンと、どこ行こう？".
Two-part segmented control "探す" / "行きたい". Left active 探す; right active 行きたい.
Left screen content, in order:
Compact white search card: label "エリア", filled text "横浜市周辺" with location pin icon; category chips "ドッグラン" selected, "公園・散歩", "カフェ"; condition chips "大型犬" and "駐車場" selected, "屋内" unselected; optional input hint "希望をひとこと"; wide indigo button "AIで探す" with small search icon.
Results heading "おすすめの場所" and small count "3件", tiny note "検索結果の出典付き".
First card "サンプル・みどりドッグラン"; eyebrow "ドッグラン / 横浜市"; short description "広い屋外エリアで、のびのび遊びたい日に。"; chips "大型犬：対応" "駐車場：あり"; small text "出典：施設サイト"; two clearly separated buttons "サイトを見る ↗" and outlined heart "保存".
A small secondary row "ほかの候補を見る".
Right screen: selected 行きたい. Small heading "気になる場所を、次のおでかけに。" and count "保存した場所 2件".
Card 1 same sample dog run with small dog-park outline icon, title, "ドッグラン / 横浜市", chips, user memo area with label "メモ" and text "次の週末に行ってみたい"; small "保存日：9/28"; wide "サイトを見る ↗" button and discreet "保存を解除".
Card 2 "サンプル・こもれびカフェ", "犬同伴カフェ / 横浜市"; muted amber chip "大型犬：要確認"; body "テラス席の利用条件はサイトで確認。"; source "出典：紹介サイト"; date; same buttons. No fabricated actual URL.
Both screens mobile bottom navigation is a horizontally scrollable strip, not nine tiny compressed tabs. Show only visible segment "健康" "特訓" "費用" "おでかけ" "設定"; おでかけ selected indigo soft capsule; subtle left fade indicates previous tabs off-screen. Bottom nav white with thin top border, safe-area whitespace.
Typography must be clear, correct Japanese. Restrained realistic product UI, no decorative marketing mockup or huge hero, no gradients, no glassmorphism. Maintain consistency between screens. No billing/configuration/technical text in product screens.
```
