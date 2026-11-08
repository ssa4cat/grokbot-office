# Grok Bot 工作室

亮色、乾淨的虛擬辦公室。團隊、區域與協作線都寫在一份設定檔裡，網站本身是靜態的，不需要 ClawProwl Gateway 或任何後端。

2D 是平面配置圖，3D 是可以旋轉的辦公室。點機器人可以看職責。

## 來源與授權

視覺骨架來自 [ClawProwl](https://github.com/clawprowl/clawprowl)（React 19、Vite、Tailwind、SVG 2D 辦公室、React Three Fiber 3D 辦公室），以**複製原始碼**的方式放進這個倉庫，不是 git submodule。

ClawProwl 採 MIT License，著作權為 Copyright (c) 2026 OpenClaw。本倉庫保留上游的 [`LICENSE`](./LICENSE)。本專案在那個基礎上改成靜態工作室，並換成 Grok Bot 的團隊與介面（繁體中文）。

## 本地執行

需要 Node.js 22 以上。

```bash
npm install
npm run dev
```

開發伺服器在 <http://localhost:5180/>。

```bash
npm run build
npm run preview
```

`npm run build` 會做型別檢查，並把靜態網站輸出到 `dist/`。

## 放在子路徑

預設的 Vite `base` 是相對路徑 `./`。這樣 `dist/` 裡的 JS 與 CSS 會用相對網址，放在網站根目錄或子路徑都可以開。路由使用 hash（`#/`），不需要伺服器重寫。

本機若要模擬 GitHub Pages 的絕對路徑：

```bash
VITE_BASE=/grokbot-office/ npm run build
npm run preview
```

開頭要有 `/`，結尾也要有 `/`。預覽網址是 `http://localhost:5180/grokbot-office/`。

## GitHub Pages

公開網址：<https://ssa4cat.github.io/grokbot-office/>

網站內容在 `gh-pages` 分支的根目錄，不是用 GitHub Actions 的 `deploy-pages`。[`.github/workflows/build.yml`](.github/workflows/build.yml) 會在兩種情況更新這個分支：

- push 到 `main`（合併進主分支之後）
- 在 GitHub Actions 頁面手動 Run workflow

流程是：`npm ci`，再用 `VITE_BASE=/grokbot-office/` 建置，在 `dist/` 放一個 `.nojekyll`（避免 GitHub Pages 忽略底線開頭的檔案），然後用 `peaceiris/actions-gh-pages@v4` 和 `GITHUB_TOKEN` 把 `dist/` 的內容推到 `gh-pages`。workflow 的權限是 `contents: write`。

若 Pages 的 Source 還沒指到這個分支，網址不會更新。需要能改設定的人到 **Settings → Pages → Build and deployment**，Source 選 **Deploy from a branch**，分支選 `gh-pages`、資料夾選 `/ (root)`。這個倉庫的 workflow 不會改 Settings。

## 怎麼加一個機器人

只改 [`src/data/team.json`](src/data/team.json)，然後重新整理開發伺服器（正式環境要重新 `npm run build`）。不用改 React 元件。

在 `agents` 加一筆。`zone` 如果已經有對應區域，機器人會坐進那一區；如果這個 `zone` id 還沒有區域，系統會自動補一個同名區域。

```json
{
  "id": "proofreader",
  "name": "校對",
  "role": "校對",
  "zone": "editing",
  "status": "idle",
  "accent": "#0ea5e9",
  "accessory": "glasses",
  "summary": "交稿前再對一次專有名詞。"
}
```

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | 是 | 英文或數字，整份檔案不能重複。協作線用這個 id。 |
| `name` | 是 | 畫面上的名字。 |
| `zone` | 是 | 對應 `zones[].id`。沒有這個區域時會自動補一區。 |
| `summary` | 是 | 點開側欄時看到的職責。 |
| `role` | 否 | 職稱，顯示在名字旁邊。 |
| `status` | 否 | 預設 `idle`。可用 `idle`、`thinking`、`tool_calling`、`speaking`、`spawning`、`error`、`offline`。目前不會自己變，改檔案才會變。 |
| `accent` | 否 | 天線、披風這類配色，CSS 顏色。 |
| `accessory` | 否 | `cape`、`headset`、`pencil`、`glasses`、`beret`、`cap`、`badge`、`goggles`、`pointer`（簡報筆）。 |

同一區可以放多個機器人，會並排。

## 怎麼加一個區域

在 `zones` 加一筆。不寫 `col` / `row` 時，會自動排到下一個空位，然後把機器人的 `zone` 指到新的 `id`。

```json
{
  "id": "archive",
  "name": "檔案室",
  "summary": "存放定稿與圖檔",
  "accent": "#94a3b8",
  "furnishing": "desk"
}
```

想自己排位置再加這些整數（從 0 開始）：

| 欄位 | 說明 |
| --- | --- |
| `col` / `row` | 欄與列。寫了其中一個就算指定位置。 |
| `colSpan` / `rowSpan` | 佔幾格，預設 1。 |
| `furnishing` | 家具。可用 `desk`、`research`、`writing`、`editing`、`studio`、`review`、`command`、`workstation`、`lab`、`slides`。不填就是普通桌子。 |

`office.columns` 是每一列有幾欄，預設 4，範圍 1 到 8。區域變多時會自動多一列，畫面跟著變高。

位置重疊、id 重複、或協作線指到不存在的機器人，畫面會改顯示錯誤，告訴你要改哪裡。

休息角和咖啡吧是辦公室固定的裝飾，不在 `zones` 裡。要讓某位機器人負責那裡，就另外加一個區域。

## 怎麼畫協作線

`links` 的 `from` / `to` 都是機器人 `id`。

- `kind: "flow"`：往下交件。
- `kind: "return"`：虛線，退回重做。
- `pipeline`：哪一條產線。不填是 `article`（文章線，畫在工位之間）。`slides` 是簡報線，改走辦公室下方的通道，不會穿過文章區。

文章線：資料蒐集員 → 筆桿 → 總編 → 畫師 → 藝術總監 → 幕僚長。退回是總編 → 筆桿、藝術總監 → 畫師。

簡報線和文章線分開：筆桿 → 簡報師 → 畫師。退件是總編 → 簡報師、藝術總監 → 簡報師。簡報師做的是 `.pptx`／Google Slides，包含架構、版型系統和數據圖表，人在簡報室。

Lumi 和 dr eggbot 不在這兩條線上。Lumi 是通用助理；dr eggbot 在團隊要擴編、需要新機器人時才上場。若要讓他們連上某人，在 `links` 加一筆即可。

## 已知限制

- 沒有即時後端。狀態、對話、工具呼叫都不會自己更新。
- 頻道、供應商、排程、技能市集、WhatsApp 綁定、對 Gateway 發訊息這些畫面沒有掛進路由。相關原始碼還留在倉庫裡（沿用 ClawProwl），但這個網站不會連 WebSocket，也不會載入那些頁面。
- 2D 是平面配置圖；比較接近參考圖的立體辦公室在 3D 模式。3D 需要 WebGL。
- 改 `team.json` 之後，開發模式重新整理；要更新 `dist/` 必須再建置一次。
- 中文使用系統字型（蘋方、微軟正黑、Noto Sans CJK）。系統沒有中文字型時，字會缺漏。
