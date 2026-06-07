import './drawfunction.css'
import { useEffect, useRef, useState } from 'react'
import ControlRow from './ControlRow'
import ControlRowString from './ControlRowString'

// 数式プリセット集（z はカメラ前方に来るよう正の値へオフセット）
type Preset = {
  name: string
  x: string
  y: string
  z: string
  firstT: number
  maxT: number
  dt: number
}

const PRESETS: Preset[] = [
  {
    name: '回転リボン (J)',
    x: '100*cos(t)*sin(t/200*PI*J)',
    y: '100*cos(t/200*PI)',
    z: '100*sin(t)*sin(t/200*PI*J)+250',
    firstT: 0, maxT: 200, dt: 0.01,
  },
  {
    name: 'らせん (Helix)',
    x: '120*cos(t+J+t*J/500)',
    y: '6*t-240',
    z: '120*sin(t+J+t*J/500)+400',
    firstT: 0, maxT: 80, dt: 0.05,
  },
  {
    name: 'トーラス結び目',
    x: '100*(2+cos(3*t+J+t*J/300))*cos(2*t)',
    y: '100*(2+cos(3*t+J+t*J/300))*sin(2*t)',
    z: '100*sin(3*t+J+t*J/300)+400',
    firstT: 0, maxT: 7, dt: 0.005,
  },
  {
    name: 'リサージュ 3D',
    x: '200*sin(2*t+J+t*J/400)',
    y: '200*sin(3*t)',
    z: '150*sin(5*t+t*J/600)+400',
    firstT: 0, maxT: 7, dt: 0.005,
  },
  {
    name: '球面らせん',
    x: '200*sin(t/10)*cos(t+J+t*J/500)',
    y: '200*sin(t/10)*sin(t+J+t*J/500)',
    z: '200*cos(t/10)+400',
    firstT: 0, maxT: 63, dt: 0.03,
  },
  {
    name: 'バラ曲線 (Rose)',
    x: '200*cos(4*t+J+t*J/300)*cos(t)',
    y: '200*cos(4*t+J+t*J/300)*sin(t)',
    z: '100*sin(4*t+J+t*J/300)+400',
    firstT: 0, maxT: 7, dt: 0.005,
  },
]

function DrawFunction() {

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const canvasSize = { x: 1000, y: 1000 }


  const camera = useRef({
    x: 0, y: 0, z: 0,
    zx: 0, zy: 0,
    default: { x: 0, y: 0, z: 0, zx: 0, zy: 0 },
  })

  const keys = useRef({
    W: false, S: false, D: false, A: false,
    Space: false, Shift: false,
  })
  const isDragging = useRef(false)

  const MoveSpeed = 10

  const [firstT, setFirstT] = useState(0)
  const [maxT, setMaxT] = useState(200)
  const [dt, setDt] = useState(0.01)
  const [x, setX] = useState("100*cos(t)*sin(t/200*PI*J)")
  const [y, setY] = useState("100*cos(t/200*PI)")
  const [z, setZ] = useState("100*sin(t)*sin(t/200*PI*J)+250")
  const [dJ, setDJ] = useState(0.01)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isDrawAxis, setIsDrawAxis] = useState(false)
  const isDrawAxisRef = useRef(false)

  // 曲線上を動く点
  const [isDrawPoint, setIsDrawPoint] = useState(false)
  const isDrawPointRef = useRef(false)
  const traceT = useRef(0)

  // J 表示・制御
  const jDisplayRef = useRef<HTMLSpanElement>(null)
  const isAnimatingRef = useRef(true)
  const [isAnimating, setIsAnimating] = useState(true)
  const [jSetValue, setJSetValue] = useState(0)

  const functionNum = useRef({
    x: (t: number) => 100 * Math.sin(t * t),
    y: (t: number) => 100 * (1 - Math.sin(t)) * t,
    z: (t: number) => 100 * Math.sin(t) * Math.cos(t),
    J: 0,
    dJ: 0.01,
    isNumUp: true,
    FirstT: 0,
    MaxT: 200,
    dt: 0.01,
  })

  useEffect(() => {
    functionNum.current.FirstT = firstT
    functionNum.current.MaxT = maxT
    functionNum.current.dt = dt
    functionNum.current.dJ = dJ
  }, [firstT, maxT, dt, dJ])

  useEffect(() => {
    Setup()
    setAllFunction()
    FrameProcess()
  }, [])

  // ---- イベント登録 ------------------------------------------------

  function Setup() {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('mousedown', () => {
      isDragging.current = true
    })
    canvas.addEventListener('mouseup', () => {
      isDragging.current = false
    })
    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging.current) return
      camera.current.zx += e.movementX / 180 * Math.PI * 0.4
      camera.current.zy -= e.movementY / 180 * Math.PI * 0.4

      if (camera.current.zy > Math.PI / 2) camera.current.zy = Math.PI / 2
      if (camera.current.zy < -Math.PI / 2) camera.current.zy = -Math.PI / 2
    })
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      Object.assign(camera.current, camera.current.default)
    })

    canvas.addEventListener('keydown', (e) => {
      let handled = true
      switch (e.code) {
        case 'KeyW': keys.current.W = true; break
        case 'KeyS': keys.current.S = true; break
        case 'KeyD': keys.current.D = true; break
        case 'KeyA': keys.current.A = true; break
        case 'Space': keys.current.Space = true; break
        case 'ShiftLeft': keys.current.Shift = true; break
        default: handled = false
      }
      if (handled) e.preventDefault()
    })
    canvas.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': keys.current.W = false; break
        case 'KeyS': keys.current.S = false; break
        case 'KeyD': keys.current.D = false; break
        case 'KeyA': keys.current.A = false; break
        case 'Space': keys.current.Space = false; break
        case 'ShiftLeft': keys.current.Shift = false; break
      }
    })
  }

  function updateNum() {
    if (!isAnimatingRef.current) return
    if (functionNum.current.isNumUp) {
      functionNum.current.J += functionNum.current.dJ;
    } else {
      functionNum.current.J -= functionNum.current.dJ;
    }
  }

  // ---- カメラ移動 --------------------------------------------------

  function move() {
    const cam = camera.current
    const k = keys.current
    if (k.W) {
      cam.x += Math.sin(cam.zx) * MoveSpeed
      cam.z += Math.cos(cam.zx) * MoveSpeed
    }
    if (k.S) {
      cam.x -= Math.sin(cam.zx) * MoveSpeed
      cam.z -= Math.cos(cam.zx) * MoveSpeed
    }
    if (k.D) {
      cam.x += Math.cos(cam.zx) * MoveSpeed
      cam.z -= Math.sin(cam.zx) * MoveSpeed
    }
    if (k.A) {
      cam.x -= Math.cos(cam.zx) * MoveSpeed
      cam.z += Math.sin(cam.zx) * MoveSpeed
    }
    if (k.Space) cam.y += MoveSpeed
    if (k.Shift) cam.y -= MoveSpeed
  }


  // ---- 3D 描画 ----------------------------------------------------

  function drawFunction3d(fn: typeof functionNum.current, cam: typeof camera.current, ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    let beyondFlag = false

    for (let t = fn.FirstT; t <= fn.MaxT; t += fn.dt) {
      //カメラ位置による移動
      const x1 = fn.x(t) - cam.x
      const y1 = fn.y(t) - cam.y
      const z = fn.z(t) - cam.z

      //行列計算による回転
      const x2 = x1 * Math.cos(cam.zx) - z * Math.sin(cam.zx)
      const Z1 = z * Math.cos(cam.zx) + x1 * Math.sin(cam.zx)
      const y2 = y1 * Math.cos(cam.zy) - Z1 * Math.sin(cam.zy)
      const Z2 = Z1 * Math.cos(cam.zy) + y1 * Math.sin(cam.zy)

      //正射影
      const X = x2 * 380 / Z2
      const Y = y2 * 380 / Z2

      if (Z2 >= 0) {
        if (beyondFlag) {
          beyondFlag = false
        } else {
          ctx.lineTo(canvasSize.x / 2 + X, canvasSize.y / 2 - Y)
        }
        ctx.moveTo(canvasSize.x / 2 + X, canvasSize.y / 2 - Y)
      } else {
        beyondFlag = true
      }
    }
    ctx.stroke()
  }

  // 3D 座標を画面座標へ投影する。カメラ後方 (Z2 < 0) の点は null を返す。
  function project(px: number, py: number, pz: number, cam: typeof camera.current) {
    //カメラ位置による移動
    const x1 = px - cam.x
    const y1 = py - cam.y
    const z = pz - cam.z

    //行列計算による回転
    const x2 = x1 * Math.cos(cam.zx) - z * Math.sin(cam.zx)
    const Z1 = z * Math.cos(cam.zx) + x1 * Math.sin(cam.zx)
    const y2 = y1 * Math.cos(cam.zy) - Z1 * Math.sin(cam.zy)
    const Z2 = Z1 * Math.cos(cam.zy) + y1 * Math.sin(cam.zy)

    if (Z2 < 0) return null

    //正射影
    const X = x2 * 380 / Z2
    const Y = y2 * 380 / Z2
    return { X: canvasSize.x / 2 + X, Y: canvasSize.y / 2 - Y }
  }

  // 1 本の軸を sample 点に沿って描く（カメラ後方は途切れさせる）。
  function drawAxisLine(
    cam: typeof camera.current,
    ctx: CanvasRenderingContext2D,
    axis: 'x' | 'y' | 'z',
    color: string,
  ) {
    ctx.beginPath()
    ctx.strokeStyle = color
    let beyondFlag = false

    for (let t = -1000; t <= 1000; t += 1) {
      const px = axis === 'x' ? t : 0
      const py = axis === 'y' ? t : 0
      const pz = axis === 'z' ? t : 0
      const p = project(px, py, pz, cam)

      if (p) {
        if (beyondFlag) {
          beyondFlag = false
        } else {
          ctx.lineTo(p.X, p.Y)
        }
        ctx.moveTo(p.X, p.Y)
      } else {
        beyondFlag = true
      }
    }
    ctx.stroke()
  }

  function drawAxis(cam: typeof camera.current, ctx: CanvasRenderingContext2D) {
    const prevStroke = ctx.strokeStyle
    drawAxisLine(cam, ctx, 'x', '#e74c3c') // X 軸: 赤
    drawAxisLine(cam, ctx, 'y', '#2ecc71') // Y 軸: 緑
    drawAxisLine(cam, ctx, 'z', '#3498db') // Z 軸: 青
    ctx.strokeStyle = prevStroke
  }

  // 曲線上を t に沿って進む点を描く
  function drawMovingPoint(fn: typeof functionNum.current, cam: typeof camera.current, ctx: CanvasRenderingContext2D) {
    if (isAnimatingRef.current) {
      const span = fn.MaxT - fn.FirstT
      traceT.current += span / 300 // 約 5 秒で一周
      if (traceT.current > fn.MaxT) traceT.current = fn.FirstT
    }

    const t = traceT.current
    const p = project(fn.x(t), fn.y(t), fn.z(t), cam)
    if (!p) return

    // ほのかな光彩
    ctx.beginPath()
    ctx.fillStyle = 'rgba(255, 204, 0, 0.25)'
    ctx.arc(p.X, p.Y, 12, 0, Math.PI * 2)
    ctx.fill()
    // 本体
    ctx.beginPath()
    ctx.fillStyle = '#ffcc00'
    ctx.arc(p.X, p.Y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // ---- メインループ ------------------------------------------------

  function FrameProcess() {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.clearRect(0, 0, canvasSize.x, canvasSize.y)
      ctx.fillStyle = 'green'
      ctx.fillRect(canvasSize.x / 2 - 2, canvasSize.y / 2 - 2, 4, 4)
      drawFunction3d(functionNum.current, camera.current, ctx)
      move()
      updateNum()
      if (isDrawAxisRef.current) drawAxis(camera.current, ctx)
      if (isDrawPointRef.current) drawMovingPoint(functionNum.current, camera.current, ctx)

      if (jDisplayRef.current) {
        jDisplayRef.current.textContent = functionNum.current.J.toFixed(3)
      }
    }
    setTimeout(FrameProcess, 16)
  }


  function handleReset() {
    Object.assign(camera.current, camera.current.default)
    setFirstT(0); setMaxT(200); setDt(0.1)
  }

  function handleToggleAnimation() {
    isAnimatingRef.current = !isAnimatingRef.current
    setIsAnimating(isAnimatingRef.current)
  }

  function StringToFunction(str: string) {
    if (CountStringNum(str, '(') !== CountStringNum(str, ')')) return false
    str = str.replaceAll(/\s/g, "")
    const Strings = str.split(/\(|\)|\*|\/|\-|\+|\^|abs|acos|acosh|asin|asinh|atanh|cbrt|ceil|cos|cosh|exp|expm1|floor|log|log1p|log10|log2|random|round|sign|sin|sinh|sqrt|tan|tanh|trunc|PI|E/)
    for (let i = 0; i < Strings.length; i++) {
      if (isNumber(Strings[i]) || Strings[i] === "t" || Strings[i] === "" || Strings[i] === "J") continue;
      if (Strings[i].length >= 2) return false;
      return false;
    }
    str = str.replaceAll("J", "functionNum.current.J");
    const MathMethodArray = ["abs", "acos", "acosh", "asin", "asinh", "atanh", "cbrt", "ceil", "cos", "cosh", "exp", "expm1", "floor", "log", "log1p", "log10", "log2", "random", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc", "PI", "E"];
    str = str.replaceAll("^", "**");
    for (let i = 0; i < MathMethodArray.length; i++) {
      str = str.replaceAll(MathMethodArray[i], `Math.${MathMethodArray[i]}`);
    }
    return eval(`(t) => ${str}`);
  }

  function CountStringNum(str1: string, str2: string) {
    let count = 0
    for (let i = 0; i < str1.length; i++) {
      if (str1[i] === str2) count++
    }
    return count
  }

  function isNumber(char: string) {
    return !isNaN(Number(char)) && char.trim() !== "";
  }

  function applyFunctions(xs: string, ys: string, zs: string) {
    const fx = StringToFunction(xs)
    const fy = StringToFunction(ys)
    const fz = StringToFunction(zs)
    if (fx && fy && fz) {
      functionNum.current.x = fx
      functionNum.current.y = fy
      functionNum.current.z = fz
      setErrorMessage(null)
    } else {
      const invalid = [!fx && 'x(t)', !fy && 'y(t)', !fz && 'z(t)'].filter(Boolean).join(', ')
      setErrorMessage(`数式エラー: ${invalid} が無効です`)
    }
  }

  function setAllFunction() {
    applyFunctions(x, y, z)
  }

  function handlePreset(e: React.ChangeEvent<HTMLSelectElement>) {
    const preset = PRESETS.find(p => p.name === e.target.value)
    if (!preset) return
    setX(preset.x); setY(preset.y); setZ(preset.z)
    setFirstT(preset.firstT); setMaxT(preset.maxT); setDt(preset.dt)
    // state 更新は非同期なので、描画用の値は即座に反映する
    functionNum.current.FirstT = preset.firstT
    functionNum.current.MaxT = preset.maxT
    functionNum.current.dt = preset.dt
    traceT.current = preset.firstT
    applyFunctions(preset.x, preset.y, preset.z)
  }

  // ---- レンダー ----------------------------------------------------

  return (
    <div className="drawfunction-container">
      <aside className="controls-panel">

        <div className="controls-section">
          <h3 className="section-title">描画範囲</h3>
          <ControlRow label="FirstT" value={firstT} step={0.1} onChange={setFirstT} />
          <ControlRow label="MaxT" value={maxT} step={1} onChange={setMaxT} />
          <ControlRow label="dt" value={dt} step={0.01} onChange={setDt} />
        </div>

        <div className="controls-section">
          <h3 className="section-title">J パラメータ</h3>
          <div className="j-display-row">
            <span className="control-name">現在値</span>
            <span className="j-value" ref={jDisplayRef}>0.000</span>
          </div>
          <ControlRow label="dJ" value={dJ} step={0.001} onChange={setDJ} />
          <div className="control-row">
            <span className="control-name">設定値</span>
            <input
              className="control-number"
              type="number"
              step={1}
              value={jSetValue}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0
                setJSetValue(val)
                functionNum.current.J = val
              }}
            />
          </div>
          <button
            className={`reset-button${isAnimating ? '' : ' active'}`}
            onClick={handleToggleAnimation}
          >
            {isAnimating ? '停止' : '再開'}
          </button>
          <p className="j-description">
            <code>J</code> は毎フレーム <code>dJ</code> ずつ自動増加する独自変数。数式の中で <code>J</code> と書くと参照できる。「設定値」を変更すると J を直接上書きできる。
          </p>
        </div>

        <div className="controls-section">
          <h3 className="section-title">プリセット</h3>
          <select className="control-select" defaultValue="" onChange={handlePreset}>
            <option value="" disabled>選択してください…</option>
            {PRESETS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="controls-section">
          <h3 className="section-title">数式</h3>
          <ControlRowString label="x(t)" value={x} onChange={setX} />
          <ControlRowString label="y(t)" value={y} onChange={setY} />
          <ControlRowString label="z(t)" value={z} onChange={setZ} />
        </div>

        <div className="button-group">
          <button className="reset-button" onClick={() => {
            const next = !isDrawAxis
            setIsDrawAxis(next)
            isDrawAxisRef.current = next
          }}>{isDrawAxis ? '軸非表示' : '軸表示'}</button>
          <button className={`reset-button${isDrawPoint ? ' active' : ''}`} onClick={() => {
            const next = !isDrawPoint
            setIsDrawPoint(next)
            isDrawPointRef.current = next
          }}>{isDrawPoint ? '点非表示' : '点表示'}</button>
          <button className="reset-button" onClick={setAllFunction}>関数セット</button>
          <button className="reset-button" onClick={handleReset}>リセット</button>
        </div>
          
      </aside>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={canvasSize.x}
          height={canvasSize.y}
          tabIndex={0}
        />
        {errorMessage && (
          <div className="canvas-error">{errorMessage}</div>
        )}
      </div>
    </div>
  )
}

export default DrawFunction
