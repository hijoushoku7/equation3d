import './drawfunction.css'
import { useEffect } from 'react'

function DrawFunction() {
  useEffect(() => {
    setup();
  }, []);
  const canvasSize = {
    x: 1000,
    y: 1000,
  }
  const functionNum = {
    x: (t) => { return 10 * (Math.sin(t) - t) * Math.sin(t) },
    y: (t) => { return 10 * (1 - Math.cos(t)) },
    z: (t) => { return 100 * (Math.sin(t) - t) * Math.cos(t) },
    FirstT: 0,
    MaxT: 200,
    dt: 0.1,
  }
  const camera = {
    x: 0, y: 0, z: 0,
    zx: 0, zy: 0,
    default: {
      x: 0, y: 0, z: 0,
      zx: 0, zy: 0,
    }
  }

  async function setup() {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    drawFunction3d(functionNum, camera, ctx);
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


  return (
    <>
      <canvas id='draw-canvas' width={canvasSize.x} height={canvasSize.y}></canvas>
    </>
  )
}

export default DrawFunction