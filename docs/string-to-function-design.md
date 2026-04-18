# StringToFunction / SetAllFunctions 設計方針

## 概要

`ControlRowString` で入力された文字列（x(t)、y(t)、z(t)）を、実際に描画で使う関数 `(t: number) => number` に変換して `functionNum.current` に反映する。

---

## 1. StringToFunction(str: string): ((t: number) => number) | false

文字列を `(t: number) => number` な関数に変換する。変換できない場合は `false` を返す。

### 処理フロー

1. **括弧の対応チェック**
   - `(` の数と `)` の数が一致しなければ `false`

2. **空白除去**
   - `str.replaceAll(/\s/g, "")`

3. **トークン検証**
   - 以下の区切り文字・キーワードで `split` してトークン列を得る
     - 演算子: `(` `)` `*` `/` `-` `+` `^`
     - Math関数: `abs acos acosh asin asinh atanh cbrt ceil cos cosh exp expm1 floor log log1p log10 log2 round sign sin sinh sqrt tan tanh trunc`
     - 定数: `PI` `E`
   - 各トークンが **数値** または **`t`** または **空文字列** のいずれかであることを確認
   - それ以外のトークンが1文字以上あれば `false`（未知の識別子）

4. **文字列変換**
   - `^` → `**`
   - Math関数・定数を `Math.sin` `Math.PI` などに置換

5. **eval で関数化**
   ```ts
   return eval(`(t) => ${str}`) as (t: number) => number
   ```

### 現在の実装の問題点

`StringToFunction` の実装には `return false` がバリデーション直後に置かれており、eval に到達しない。実装時はこの `return false` を除去すること。

---

## 2. SetAllFunctions()

x / y / z の3つの文字列をまとめて変換し、全て成功したときだけ `functionNum.current` に反映する。

```
SetAllFunctions():
  fx = StringToFunction(x)
  fy = StringToFunction(y)
  fz = StringToFunction(z)

  if fx === false || fy === false || fz === false:
    // エラー表示（任意）
    return

  functionNum.current.x = fx
  functionNum.current.y = fy
  functionNum.current.z = fz
```

**重要:** 3つすべてが有効な場合のみ更新する。1つでも無効なら現在の関数を維持する。

---

## 3. トリガー方法

`SetAllFunctions` を呼ぶタイミングは以下のいずれか（実装者が選ぶ）:

| 方法 | メリット | デメリット |
|------|----------|------------|
| 「適用」ボタン | 意図的に確定できる | 一手間増える |
| Enter キー (`ControlRowString` 側で `onKeyDown` 検知) | スムーズ | 入力中に誤発動しない注意が必要 |
| 両方対応 | UX が良い | 実装量が増える |

現在のコードにはリセットボタン (`handleReset`) が既にある。「適用」ボタンを同じ `button-group` に追加するのが最も自然。

---

## 4. 関連するコードの場所

| 要素 | 場所 |
|------|------|
| `StringToFunction` | `drawfunction.tsx:202` |
| `functionNum` ref | `drawfunction.tsx:38` |
| x/y/z state | `drawfunction.tsx:32–34` |
| ボタン描画 | `drawfunction.tsx:255–257` |
| `ControlRowString` | `src/canvascomponents/ControlRowString.tsx` |
