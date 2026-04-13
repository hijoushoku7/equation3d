import './drawfunction.css'

function DrawFunction() {
  window.addEventListener('load', setup);

  const canvasSize = {
    x: 8000,
    y: 8000,
  }
  const originX = canvasSize.x / 2;
  const originY = canvasSize.y / 2;


  const calcY = (x) => {
    return x * 2;
  }
  let x = 0;
  const dx = 1;
  const max = canvasSize.x;

  async function setup() {
    await drawOriginLine();
    await drawFunction(x, max, dx)
  }

  function drawOriginLine() {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!canvas || !ctx) return;
    ctx.beginPath();
    ctx.moveTo(originX, canvasSize.y);
    ctx.lineTo(originX, 0);
    ctx.moveTo(0, originY);
    ctx.lineTo(canvasSize.x, originY);
    ctx.stroke();
  }


  function drawFunction(x, maxX, dx) {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    ctx.moveTo(0, 0);
    for (let X = x; X <= max; X += dx) {
      const y = calcY(X) - canvasSize.y / 2;
      if (!(y > max)) { ctx.lineTo(X, y); }
      ctx.moveTo(X, y);
      // console.log(`xは${x} 、yは${y}`);
    }
    ctx.stroke();
  }


  return (
    <>
      <canvas id='draw-canvas'></canvas>
    </>
  )
}

export default DrawFunction