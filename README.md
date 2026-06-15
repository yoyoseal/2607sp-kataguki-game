# 型抜き／糖片雕刻小遊戲 v6

## 測試方式
請不要直接雙擊 `index.html` 用 `file://` 開啟。建議使用 GitHub Pages，或在資料夾內啟動本機伺服器：

```bash
python -m http.server 8000
```

然後打開：

```text
http://localhost:8000
```

## 圖片規格
遊戲畫布固定為 500 × 300，整體 UI 約 500 × 400。

每個關卡需要一組：

- `images/easy_candy.png`
- `images/easy_mask.png`
- `images/hard_candy.png`
- `images/hard_mask.png`
- `images/god_candy.png`
- `images/god_mask.png`

結果圖片：

- `images/success.png`
- `images/gameover.png`

## mask 判定色

- 白色：可通過安全區
- 黑色／透明：失敗區
- 紅色：起點，必須從紅點按住出發
- 藍色 `#0050FF`：終點，碰到後成功

## 更新內容 v6

- UI 改為黑底、紅框、紅字
- 難度改為：簡單／困難／神之試煉
- 主選單顯示各關卡最佳時間
- 移除開始畫面提示文字
- 恢復「只能從紅點出發」判定
- 藍點為終點
