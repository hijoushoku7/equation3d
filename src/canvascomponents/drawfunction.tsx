import './drawfunction.css'

function DrawFunction() {
  window.addEventListener('load', setup);
  const canvasSize = {
    x: 1000,
    y: 1000,
  }
  const functionNumber = {
    MaxX: 200,
    First: 0,
    dx: 0.1,
  }

  async function setup() {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }
  function drawDefaultLine(ctx) {
    ctx.beginPath();

  }

  return (
    <>
      <canvas id='draw-canvas'></canvas>
    </>
  )
}

export default DrawFunction