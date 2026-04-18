import './drawfunction.css'
import { useEffect, useRef, useState } from 'react'
import ControlRow from './ControlRow'
import ControlRowString from './ControlRowString'

function DrawFunction() {

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const canvasSize = { x: 1000, y: 1000 }


  const camera = useRef({
    x: 0, y: 0, z: 0,
    zx: 0, zy: 0,
    default: { x: 0, y: 0, z: 0, zx: 0, zy: 0 },
  })

  // キーの押下状態も useRef で管理（FrameProcess から参照するため）
  const keys = useRef({
    W: false, S: false, D: false, A: false,
    Space: false, Shift: false,
  })
  const isDragging = useRef(false)

  const MoveSpeed = 10

  // 描画範囲の UI 入力は state で管理する
  const [firstT, setFirstT] = useState(0)
  const [maxT, setMaxT] = useState(200)
  const [dt, setDt] = useState(0.1)
  const [x, setX] = useState("100*cos(t)*sin(t/200*PI)")
  const [y, setY] = useState("100*cos(t/200*PI)")
  const [z, setZ] = useState("100*sin(t)*sin(t/200*PI)+250")

  // functionNum も useRef で持つ。
  // state が変わったら下の useEffect で ref に同期する。
  const functionNum = useRef({
    x: (t: number) => 100 * Math.sin(t * t),
    y: (t: number) => 100 * (1 - Math.sin(t)) * t,
    z: (t: number) => 100 * Math.sin(t) * Math.cos(t),
    FirstT: 0,
    MaxT: 200,
    dt: 0.1,
  })
  // firstT / maxT / dt の変化を functionNum.current に反映する
  useEffect(() => {
    functionNum.current.FirstT = firstT
    functionNum.current.MaxT = maxT
    functionNum.current.dt = dt
  }, [firstT, maxT, dt])

  useEffect(() => {
    Setup()
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
    // 右クリックでカメラリセット
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

  function drawFunction3d(fn, cam, ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    let beyondFlag = false   // カメラ後方(Z2<0)を通過したかどうかのフラグ

    for (let t = fn.FirstT; t <= fn.MaxT; t += fn.dt) {
      // カメラ相対座標
      const x1 = fn.x(t) - cam.x
      const y1 = fn.y(t) - cam.y
      const z = fn.z(t) - cam.z

      // 回転行列
      const x2 = x1 * Math.cos(cam.zx) - z * Math.sin(cam.zx)
      const Z1 = z * Math.cos(cam.zx) + x1 * Math.sin(cam.zx)
      const y2 = y1 * Math.cos(cam.zy) - Z1 * Math.sin(cam.zy)
      const Z2 = Z1 * Math.cos(cam.zy) + y1 * Math.sin(cam.zy)

      // 透視投影
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
        beyondFlag = true   // カメラ後方 → 描画をスキップ
      }
    }
    ctx.stroke()
  }

  // ---- メインループ ------------------------------------------------


  function FrameProcess() {
    const canvas = canvasRef.current
    // canvasクリア
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.clearRect(0, 0, canvasSize.x, canvasSize.y)
      ctx.fillStyle = 'green'
      ctx.fillRect(canvasSize.x / 2 - 2, canvasSize.y / 2 - 2, 4, 4)
      drawFunction3d(functionNum.current, camera.current, ctx)
      move() // キー操作
    }
    setTimeout(FrameProcess, 16)
  }

  function handleReset() {

    Object.assign(camera.current, camera.current.default)
    setFirstT(0); setMaxT(200); setDt(0.1)
  }

  function StringToFunction(str: string) {
    if (CountStringNum(str, '(') !== CountStringNum(str, ')')) return false
    str = str.replaceAll(/\s/g, "")
    //　トークン分割、不正チェック
    const Strings = str.split(/\(|\)|\*|\/|\-|\+|\^|abs|acos|acosh|asin|asinh|atanh|cbrt|ceil|cos|cosh|exp|expm1|floor|log|log1p|log10|log2|random|round|sign|sin|sinh|sqrt|tan|tanh|trunc|PI|E/)
    parent: for (let i = 0; i < Strings.length; i++) {
      if (isNumber(Strings[i]) || Strings[i] === "t" || Strings[i] === "") continue;
      if (String[i] >= 2) return false;
      return false;
    }
    let MathMethodArray = ["abs", "acos", "acosh", "asin", "asinh", "atanh", "cbrt", "ceil", "cos", "cosh", "exp", "expm1", "floor", "log", "log1p", "log10", "log2", "random", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc", "PI", "E"];
    str = str.replaceAll("^", "**");
    for (let i = 0; i < MathMethodArray.length; i++) {
      str = str.replaceAll(MathMethodArray[i], `Math.${MathMethodArray[i]}`);
    }
    return eval(`(t) => ${str}`);
  }

  console.log(StringToFunction("100*sin(t)*sin(t/200*PI)+250"));
  console.log("hello");

  // str1 の中に含まれるstr2の数を数える
  function CountStringNum(str1: string, str2: string) {
    let count = 0
    for (let i = 0; i < str1.length; i++) {
      if (str1[i] === str2) count++
    }
    return count
  }

  function isNumber(char) {
    return !isNaN(char) && char.trim() !== "";
  }

  function setAllFunction() {
    const fx = StringToFunction(x)
    const fy = StringToFunction(y)
    const fz = StringToFunction(z)
    if (fx && fy && fz) {
      functionNum.current.x = fx
      functionNum.current.y = fy
      functionNum.current.z = fz
    }
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
          <br />
          <ControlRowString label="x(t)" value={x} onChange={setX} />
          <ControlRowString label="y(t)" value={y} onChange={setY} />
          <ControlRowString label="z(t)" value={z} onChange={setZ} />
        </div>
        <div className="button-group">
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
      </div>
    </div>
  )
}

export default DrawFunction