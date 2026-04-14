import './drawfunction.css'
import { useRef, useState } from 'react'

type ControlRowProps = {
  label: string
  value: number
  step: number
  onChange: (v: number) => void
}

function ControlRow({ label, value, step, onChange }: ControlRowProps) {
  return (
    <div className="control-row">
      <span className="control-name">{label}</span>
      <input
        className="control-number"
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  )
}

function DrawFunction() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const canvasSize = {
    x: 1000,
    y: 1000,
  }

  const [camX, setCamX] = useState(0)
  const [camY, setCamY] = useState(0)
  const [camZ, setCamZ] = useState(0)
  const [camZX, setCamZX] = useState(0)
  const [camZY, setCamZY] = useState(0)
  const [firstT, setFirstT] = useState(0)
  const [maxT, setMaxT] = useState(200)
  const [dt, setDt] = useState(0.1)

  const functionNum = {
    x: (t) => { return 10 * (Math.sin(t) - t) * Math.sin(t) },
    y: (t) => { return 10 * (1 - Math.cos(t)) },
    z: (t) => { return 100 * (Math.sin(t) - t) * Math.cos(t) },
    FirstT: firstT,
    MaxT: maxT,
    dt: dt,
  }
  const camera = {
    x: camX, y: camY, z: camZ,
    zx: camZX, zy: camZY,
    default: {
      x: 0, y: 0, z: 0,
      zx: 0, zy: 0,
    }
  }

  function drawFunction2d(functionNum, ctx) {
    ctx.beginPath();
    if (!ctx) return;
    for (let t = functionNum.FirstT; t <= functionNum.MaxT; t += functionNum.dt) {
      const x = canvasSize.x / 2 + functionNum.x(t);
      const y = canvasSize.y / 2 - functionNum.y(t);
      if (x < canvasSize.x && y < canvasSize.y) ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  function drawFunction3d(functionNum, camera, ctx) {
    if (!ctx) return;
    ctx.beginPath();
    for (let t = functionNum.FirstT; t <= functionNum.MaxT; t += functionNum.dt) {
      const x1 = functionNum.x(t) - camera.x;
      const y1 = functionNum.y(t) - camera.y;
      const z = functionNum.z(t) - camera.z;

      // 回転
      const x2 = x1 * Math.cos(camera.zx) - z * Math.sin(camera.zx);
      const z1 = x1 * Math.sin(camera.zx) + z * Math.cos(camera.zx);
      const y2 = y1 * Math.cos(camera.zy) - z1 * Math.sin(camera.zy);
      const z2 = y1 * Math.sin(camera.zy) + z1 * Math.cos(camera.zy);

      // 射影
      const X = x2 * 380 / z2;
      const Y = y2 * 380 / z2;

      // 描画
      const x = canvasSize.x / 2 + X;
      const y = canvasSize.y / 2 - Y;
      if (x < canvasSize.x && y < canvasSize.y) ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  function handleDraw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.clearRect(0, 0, canvasSize.x, canvasSize.y)
    drawFunction3d(functionNum, camera, ctx)
  }

  function handleReset() {
    setCamX(0); setCamY(0); setCamZ(0)
    setCamZX(0); setCamZY(0)
    setFirstT(0); setMaxT(200); setDt(0.1)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.clearRect(0, 0, canvasSize.x, canvasSize.y)
    const defaultFn = { ...functionNum, FirstT: 0, MaxT: 200, dt: 0.1 }
    const defaultCam = { x: 0, y: 0, z: 0, zx: 0, zy: 0, default: { x: 0, y: 0, z: 0, zx: 0, zy: 0 } }
    drawFunction3d(defaultFn, defaultCam, ctx)
  }

  return (
    <div className="drawfunction-container">
      <aside className="controls-panel">
        <div className="controls-section">
          <h3 className="section-title">カメラ位置</h3>
          <ControlRow label="x"  value={camX}  step={1}    onChange={setCamX} />
          <ControlRow label="y"  value={camY}  step={1}    onChange={setCamY} />
          <ControlRow label="z"  value={camZ}  step={1}    onChange={setCamZ} />
        </div>
        <div className="controls-section">
          <h3 className="section-title">カメラ回転 (rad)</h3>
          <ControlRow label="zx" value={camZX} step={0.01} onChange={setCamZX} />
          <ControlRow label="zy" value={camZY} step={0.01} onChange={setCamZY} />
        </div>
        <div className="controls-section">
          <h3 className="section-title">描画範囲</h3>
          <ControlRow label="FirstT" value={firstT} step={0.1}  onChange={setFirstT} />
          <ControlRow label="MaxT"   value={maxT}   step={1}    onChange={setMaxT} />
          <ControlRow label="dt"     value={dt}     step={0.01} onChange={setDt} />
        </div>

        <div className="button-group">
          <button className="draw-button" onClick={handleDraw}>描画</button>
          <button className="reset-button" onClick={handleReset}>リセット</button>
        </div>
      </aside>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={canvasSize.x} height={canvasSize.y} />
      </div>
    </div>
  )
}

export default DrawFunction
