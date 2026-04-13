

** canvascomponents **

- drawOriginLine() 
    関数
    - canvasの原点にX軸とY軸を描画する
    
- calculateFunction(number : t )
    関数
    tに対して対応するxとyを返す
    return {y: number, x: number}

- drawFunction(number : dt)
    関数
    tを最大値までdt刻みで繰り返して、線を描画する。
    毎回tを引数に入れてcalculateFunctionを呼び出す。前の点と現在の点を結ぶ線を描画する。
    