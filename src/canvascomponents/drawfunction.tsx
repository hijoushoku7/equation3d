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
    x: (t) => { return Math.cos(t) - t },
    y: (t) => { return 1 - Math.cos(t) },
    FirstT: 0,
    MaxT: 200,
    dt: 0.1,
  }

  async function setup() {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }
  function drawFunction2d(functionNum, ctx) {
    ctx.beginPath();

  }

  return (
    <>
      <canvas id='draw-canvas'></canvas>
    </>
  )
}

export default DrawFunction