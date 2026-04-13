import './drawfunction.css'

function DrawFunction() {
  window.addEventListener('load', draw);

  function draw() {
    const canvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1500, 1500);
    ctx.stroke();
  }

  return (
    <>
      <canvas id='draw-canvas' width={1500} height={1500}></canvas>
    </>
  )
}

export default DrawFunction