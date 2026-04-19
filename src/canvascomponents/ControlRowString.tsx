type ControlRowStringProps = {
    label: string
    value: string
    onChange: (v: string) => void
}


function ControlRowString({ label, value, onChange }: ControlRowStringProps) {
    return (
        <div className="control-row-string">
            <span className="control-name">{label}</span>
            <input
                className="control-string"
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}

export default ControlRowString
