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
    x: (t) => { return 10 * (Math.sin(t) - t) },
    y: (t) => { return 10 * (1 - Math.cos(t)) },
    FirstT: -2000,
    MaxT: 2000,
    dt: 0.1,
  }
  const camera = {
    x: 0, y: 0, z: 0,
    zx: 0, zy: 0,
  }

  async function setup() {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    drawFunction2d(functionNum, ctx);
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

  return (
    <>
      <canvas id='draw-canvas' width={canvasSize.x} height={canvasSize.y}></canvas>
    </>
  )
}

export default DrawFunction