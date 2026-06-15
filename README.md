# 型抜き／糖片雕刻小遊戲 v5

## 遊玩方式
1. 選擇難度：簡單／困難／神之試煉。
2. 點擊「開始雕刻」。
3. 在白色安全區域按住滑鼠或手指，沿著輪廓拖曳。
4. 抵達藍色 `#0050FF` 終點即成功。
5. 碰到黑色區域或中途放手即失敗。

## 圖片替換
請替換 `images` 內的檔案：

- `easy_candy.png` / `easy_mask.png`
- `hard_candy.png` / `hard_mask.png`
- `god_candy.png` / `god_mask.png`
- `success.png`
- `gameover.png`

圖片尺寸建議維持：`500 x 300px`。

## mask 顏色規則
- 白色：安全區域
- 黑色：失敗區域
- 藍色 `#0050FF`：終點
- 紅色：起點提示，也視為安全區域

v5 改成同時支援 Pointer / Mouse / Touch 事件，並把移動與放開事件綁在整份文件上，避免在 Wix iframe 或部分瀏覽器中拖曳無反應。
