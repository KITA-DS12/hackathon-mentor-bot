# メンターガイド

## 🚀 メンター登録

### 登録
```
/mentor-register
```
- 名前、自己紹介、ステータスを設定

### 登録解除
```
/mentor-unregister
```

## 📋 メンター向けコマンド

| コマンド | 機能 |
|---------|------|
| `/mentor-register` | メンター登録 |
| `/mentor-unregister` | 登録解除 |
| `/mentor-list` | メンター一覧表示 |
| `/mentor-questions` | **質問一覧・管理（重要）** |
| `/mentor-status` | ステータス変更 |
| `/mentor-health` | システム状態確認 |

## 📊 質問管理（重要）

### `/mentor-questions` で確認
- **📊 チャンネル別統計**: 複数チャンネルの質問分布を表示
- **🚨 要注意質問**: 担当者不在・24時間以上経過
- **🟡 待機中**: 対応待ちの新しい質問
- **🟠 中断中**: 一時中断された質問
- **🔵 対応中**: 現在対応中の質問

### 定期チェック推奨
- **朝**: 要注意質問をチェック
- **昼**: 新しい待機中質問を確認
- **夕**: 長期未完了質問の確認

## 📈 ステータス管理

### `/mentor-status` で変更
- **🟢 available**: 対応可能（積極的に対応）
- **🟡 busy**: 忙しい（緊急時のみ）
- **🔴 offline**: 対応不可（メンション対象外）

## 🔔 質問対応の流れ

### 1. 通知受信
- **メンターチャンネル**で質問通知を受信
- 通知には質問内容とチーム情報が含まれます

### 2. 対応開始
「対応開始」ボタンをクリック：
- 質問が「対応中」に変更
- **質問元のチームチャンネル**で自動スレッド作成
- 質問者とメンターがスレッドに招待

### 3. チームチャンネルでの対応
- **質問投稿されたチームチャンネル**のスレッド内で対応
- 「中断」「完了」ボタンで状態管理
- チームメンバーも会話を確認可能

### 4. 対応完了
「完了」ボタンまたは質問者の「✅ 解決済み」ボタンで：
- 質問が「完了」状態に変更
- 質問者にDM通知

## 🏢 マルチチャンネル対応の特徴

### 通知システム
- **一元通知**: 全チャンネルの質問がメンターチャンネルに通知
- **詳細情報**: 質問内容、チーム名、チャンネル情報を表示
- **シンプルUI**: 「対応開始」と「質問を見る」ボタンで効率的な対応
- **直接リンク**: 「質問を見る」ボタンで元の質問に直接ジャンプ

### 対応場所
- **スレッド場所**: 質問投稿されたチームチャンネル内
- **チーム透明性**: チームメンバー全員が対応過程を確認可能
- **コンテキスト保持**: チーム固有の技術スタックや課題に対応

### メンター管理
- **統合管理**: `/mentor-questions`で全チャンネルの質問を一覧表示
- **チャンネル統計**: 複数チャンネル間の質問分布と状況を把握
- **効率的対応**: メンターチャンネルから全体状況を把握
- **適切な引き継ぎ**: チャンネル情報を含めた詳細な引き継ぎ

## 🔧 トラブルシューティング

### よくある問題
- **対応開始ボタンが押せない**: 他メンターが既に対応中
- **スレッド作成されない**: 元チャンネルの権限を確認
- **質問内容不明**: 「質問を見る」ボタンで元の質問を確認
- **チャンネルアクセス不可**: 管理者にチャンネル招待を依頼

### 注意点
- **チャンネル権限**: 対応するチームチャンネルへの参加が必要
- **通知場所**: 質問通知はメンターチャンネル、対応はチームチャンネル

---

## ⚡ まとめ

1. `/mentor-register` で登録
2. `/mentor-questions` で質問確認
3. 「対応開始」→チームチャンネルで対応
4. 「完了」で終了

効果的なメンタリングで、全チームの成功をサポートしましょう！🎉