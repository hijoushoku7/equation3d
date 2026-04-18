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

export default ControlRow
