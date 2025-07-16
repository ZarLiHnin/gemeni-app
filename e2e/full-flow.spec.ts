import { test, expect } from "@playwright/test";

test("ログイン→セッション→チャット→ピン→ログアウトのE2E", async ({ page }) => {
  // 1. ログインページへ
  await page.goto("http://localhost:3000/auth");

  // メール・パスワード入力してログイン
  await page.getByPlaceholder("メールアドレス").fill("testuser@example.com");
  await page.getByPlaceholder("パスワード").fill("testpassword123");
  await page.getByRole("button", { name: "ログイン" }).click();

  // 2. チャット画面（または session list）に遷移
  await expect(page).toHaveURL("http://localhost:3000/");

  // 3. 「新しいセッション」ボタンを押す
  await page.getByRole("button", { name: "新しいセッション" }).click();

  // チャットページに遷移
  await expect(page).toHaveURL(/\/chat\/.*/);

  // 4. チャット入力 → 送信
  await page.getByPlaceholder("メッセージを入力...").fill("こんにちは");
  await page.getByRole("button", { name: "送信" }).click();

  // 5. 「📌 ホワイトボードへ送る」クリック
  await page.getByRole("button", { name: "ホワイトボード" }).click();

  // ボードに送られた通知などがあればチェック（オプション）

  // 6. ログアウト
  await page.getByRole("button", { name: "ログアウト" }).click();

  // ログインページに戻る
  await expect(page).toHaveURL("http://localhost:3000/auth");
});
