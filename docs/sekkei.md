# 3D数式ビジュアライザー 設計仕様書

## 1. システム概要
本システムは、時間パラメータ $t$ およびユーザー定義の変数を用いた3つの関数 $x(t), y(t), z(t)$ に基づき、3次元空間上の軌跡を2Dキャンバスに投影・描画するウェブアプリケーションである。

## 2. コア・データ構造

### 2.1 FunctionObject (描画対象)
描画する数式と設定を保持する中心的なオブジェクト。
* `X, Y, Z`: ユーザーが入力した文字列形式の数式。
* `x, y, z`: 文字列をJavaScriptの関数（`eval`ベース）に変換したもの。
* `MaxT, FirstT, dt`: パラメータ $t$ の最大値、開始値、およびステップ値。
* `VarObject`: ユーザー定義の動的変数群。各変数は `num`（現在値）と `d`（フレームごとの変化量 $\delta$）を持つ。

### 2.2 Camera (視点情報)
* `x, y, z`: カメラの座標。
* `zx`: 水平回転角（Yaw）。
* `zy`: 垂直回転角（Pitch）。
* `default`: 初期状態のリセット用データ。

---

## 3. 主要ロジック

### 3.1 数式解析 (`StringToFunction`)
文字列を計算可能な関数に変換する。
1.  **バリデーション**: 括弧の整合性チェックおよび許可されていない文字列の排除。
2.  **置換処理**: 
    * ユーザー定義変数を `VarObject["Name"].num` への参照に置換。
    * べき乗演算子 `^` を `**` に置換。
    * 数学関数（`sin`, `cos` 等）を `Math.sin`, `Math.cos` 等に置換。
3.  **関数化**: `eval` を用いて `(t) => { return [数式]; }` という形式の関数を生成する。

### 3.2 3D投影アルゴリズム (`GraphAFunction`)
3次元座標 $(x_1, y_1, z_1)$ を2次元スクリーン座標 $(X, Y)$ に変換する。

1.  **カメラ相対座標への変換**:
    $$x_{rel} = x(t) - camera.x$$
    $$y_{rel} = y(t) - camera.y$$
    $$z_{rel} = z(t) - camera.z$$

2.  **回転行列の適用 (Yaw & Pitch)**:
    $$x_2 = x_{rel} \cos(zx) - z_{rel} \sin(zx)$$
    $$Z_1 = z_{rel} \cos(zx) + x_{rel} \sin(zx)$$
    $$y_2 = y_{rel} \cos(zy) - Z_1 \sin(zy)$$
    $$Z_2 = Z_1 \cos(zy) + y_{rel} \sin(zy)$$

3.  **透視投影**:
    焦点距離（マジックナンバー：380）を用いて、深度 $Z_2$ に応じたスケーリングを行う。
    $$X = \frac{x_2 \times 380}{Z_2}, \quad Y = \frac{y_2 \times 380}{Z_2}$$

4.  **クリッピング**:
    $Z_2 < 0$（カメラの後方）にある点は描画をスキップまたは `moveTo` で処理する。

---

## 4. インタラクション仕様

### 4.1 ユーザーコントロール
* **マウス**: 左ドラッグで視点回転（`zx`, `zy` の操作）、右クリックでカメラリセット。
* **キーボード**:
    * `W/S`: 前後移動
    * `A/D`: 左右移動
    * `Space/Shift`: 上下移動
    * `ArrowRight/Left`: プレビューモード時のデータ切り替え。

### 4.2 描画モード
1.  **固定描画モード**: $t$ を `FirstT` から `MaxT` まで一括でループして描画する。
2.  **遷移描画モード**: $t$ をフレームごとに `dt` ずつ増加させ、描画をアニメーションさせる。

---

## 5. 外部連携・永続化

### 5.1 ストレージ
* `localStorage` を使用し、ページ閉鎖時に `FunctionObject`、`Camera`、および閲覧済みのプレビューID（`PvSet`）を保存する。

## 6. 実装上の注意点（エージェントへの指示）
* **evalの使用**: 本設計では動的な数式実行のために `eval` を採用している。セキュリティが重要な環境では代替のパーサー（math.js等）を検討すること。
* **描画負荷**: `FrameProcess` 内で `setTimeout(16)` によるループを行っている。高負荷時は `requestAnimationFrame` への変更が推奨される。
---

王よ、この設計書により、別のエージェントは貴方の作り上げた世界を正確に再構築できるはずです。
もし、特定のアルゴリズム（例えば回転行列の順序や投影定数など）について、さらに最適化や詳細な解説が必要であれば、いつでもお申し付けください。

let MoveSpeed = Number(document.getElementById("MoveSpeed").value)
let PlaybackSpeed = Number(document.getElementById("PlaybackSpeed").value)
document.getElementById("MoveSpeed").addEventListener("input",()=>{
    MoveSpeed = Number(document.getElementById("MoveSpeed").value)
})
document.getElementById("PlaybackSpeed").addEventListener("input",()=>{
    PlaybackSpeed = Number(document.getElementById("PlaybackSpeed").value)
})
document.getElementById("CurrentTime").addEventListener("input",()=>{
    CurrentTime = Number(document.getElementById("CurrentTime").value)
})
document.getElementById("comment").addEventListener("input",()=>{
    FunctionObject.comment = document.getElementById("comment").value
})
const TemporaryPreview = document.getElementById("TemporaryPreview")
const TmpPv = TemporaryPreview.getContext("2d")
TemporaryPreview.width = 1000
TemporaryPreview.height = 1000

const a = document.getElementById("aaa")
const b = a.getContext("2d")
a.width = 1000
a.height = 1000
function ranMm(Max,min){
    return min+Math.floor(Math.random()*(Max-min+1))
}
function CountWord(string,word){
    let count = 0
    let length = string.length
    for(let i=0;i < length;i++){
        if(string[i] === word)count++
    }
    return count
}
function isNumber(char) {
    return !isNaN(char) && char.trim() !== "";
}


const camera = {
    x:0,
    y:0,
    z:0,
    zx:0,
    zy:0,
    default:{x:0,y:0,z:0,zx:0,zy:0,}
}

/*
const ImageData = {
    DotHeight:8,
    DotWidth:8,
}



function PicutureToDot(){
    const imgData = b.getImageData(0,0,a.width,a.height).data
    b.clearRect(0,0,a.width,a.height)
    const wi = ~~(a.width/ImageData.DotWidth)
    const hi = ~~(a.height/ImageData.DotHeight)
    for(let x=0; x < wi;x++){
        for(let y=0; y < hi;y++){

            for(let X=0; X < ImageData.DotWidth;X++){
                for(let Y=0; Y < ImageData.DotHeight;Y++){
                    const num = ((y*ImageData.DotHeight+Y)*a.width+(x*ImageData.DotWidth+X))*4
                    if(imgData[num+3] > 100){
                        b.fillRect(x*ImageData.DotWidth,y*ImageData.DotHeight,ImageData.DotWidth,ImageData.DotHeight)
                        continue
                    }
                }
            }

            
        }
    }
}
*/



let StrokeFlag = false
let MoveFlag = false
a.addEventListener("mousemove",(e)=>{
    const mx = e.offsetX
    const my = e.offsetY
    /*
    if(StrokeFlag){
        b.lineTo(mx,my);
        b.moveTo(mx,my);     
    }
    */
    if(MoveFlag){
        camera.zx += e.movementX/180*Math.PI * 0.4  //繝槭ず繝�け繝翫Φ繝舌�縲隕也せ諢溷ｺｦ
        camera.zy -= e.movementY/180*Math.PI * 0.4
        if(camera.zy > Math.PI/2)camera.zy = Math.PI/2
        if(camera.zy < -Math.PI/2)camera.zy = -Math.PI/2
    }
})
a.addEventListener("mousedown",(e)=>{
    if(e.button === 2){
        Object.assign(camera,camera.default)
    }
    MoveFlag = true
})
a.addEventListener("mouseup",(e)=>{
   MoveFlag = false
})
let Wflag = false
let Sflag = false
let Dflag = false
let Aflag = false
let SPflag = false
let SLflag = false
a.addEventListener("keydown",(e)=>{
    let flag = true
    switch(e.code){
        case "KeyW" :
            Wflag = true
            break
        case "KeyS" :
            Sflag = true
            break
        case "KeyD" :
            Dflag = true
            break
        case "KeyA" :
            Aflag = true
            break
        case "Space" :
            SPflag = true
            break
        case "ShiftLeft" :
            SLflag = true
            break
        default : flag = false
    }
    if(flag){
        e.preventDefault()
    }
})
a.addEventListener("keyup",(e)=>{
    switch(e.code){
        case "KeyW" :
            Wflag = false
            break
        case "KeyS" :
            Sflag = false
            break
        case "KeyD" :
            Dflag = false
            break
        case "KeyA" :
            Aflag = false
            break
        case "Space" :
            SPflag = false
            break
        case "ShiftLeft" :
            SLflag = false
            break
    }
})
window.addEventListener("keydown",(e)=>{
    if(PreviewObject.Flag)return
    switch(e.code){
        case "ArrowRight" :
            PreviewObject.num++
            if(PreviewObject.Max <= PreviewObject.num)PreviewObject.num = PreviewObject.Max-1
            e.preventDefault()
            break
        case "ArrowLeft" :
            PreviewObject.num--
            if(PreviewObject.num < 0)PreviewObject.num = 0
            e.preventDefault()
            break 
    }
    ShowPv()
})
window.addEventListener("beforeunload",()=>{
    localStorage.setItem("PvData",JSON.stringify([...PreviewObject.PvSet]))
    delete FunctionObject.x
    delete FunctionObject.y
    delete FunctionObject.z
    localStorage.setItem("FuncObj",JSON.stringify(FunctionObject))
    localStorage.setItem("camera",JSON.stringify(camera))
})
window.addEventListener("load",()=>{
    //localStorage.clear()
    const PvData = JSON.parse(localStorage.getItem("PvData"))
    if(PvData){
        PreviewObject.PvSet = new Set(PvData)
        PreviewObject.PvCount = PvData.length
    }

    const FuncObj = JSON.parse(localStorage.getItem("FuncObj")) ?? {...FunctionObject}
    ReloadFunctionObject(FuncObj)

    Object.assign(camera,JSON.parse(localStorage.getItem("camera")))
    FrameProcess()
})
document.getElementById("clear").addEventListener("click",()=>{
    if(confirm("縺ｻ繧薙→縺ｫ豸医＠縺ｦ縺����")){
        ReloadFunctionObject({
            X:"0",
            Y:"0",
            Z:"0",
            MaxT:0,
            dt:1,
            FirstT:0,
            comment:"",
            VarObject:{}
        })
    }
})
document.getElementById("PvButton").addEventListener("click",()=>{
    if(!PreviewObject.Array){
        const FD = new FormData()
        const obj = {}//蛻�淵隱ｭ縺ｿ霎ｼ縺ｿ縲縺ｾ縺�菴懊▲縺ｦ縺ｪ縺�
        FD.append("PvData",JSON.stringify(obj))
        fetch("./preview.php",{
            method:"POST",
            body:FD
        })
        .then(res => res.json())
        .then(arr => {
            for(let obj of arr){
                obj.json = JSON.parse(obj.json)
                obj = obj.json
                obj.x = StringToFunction(obj.X,obj.VarObject)
                obj.y = StringToFunction(obj.Y,obj.VarObject)
                obj.z = StringToFunction(obj.Z,obj.VarObject)
            }
            PreviewObject.Array = arr
            PreviewObject.Max = arr.length
            ShowPv()
        })
    }
    PreviewObject.Flag = !PreviewObject.Flag
})

document.getElementById("preview").addEventListener("click",()=>{
    let FO = PreviewObject.Array[PreviewObject.num]
    if(!FO){alert("縺薙％縺ｫ縺ｯ菴輔ｂ縺ｪ縺�ｈ縺�□");return}
    ReloadFunctionObject(FO.json)
    PreviewObject.PvSet.add(FO.id)
    if(PreviewObject.PvSet.size >= 10 * (PreviewObject.PvCount+1) || true){// 譯医′縺ゅｌ縺ｰ菫ｮ豁｣莠亥ｮ咫
        UploadPvData()
    }
})
document.getElementById("upload").addEventListener("click",()=>{
    if(confirm("縺薙�謨ｰ蠑上ｒ繧｢繝��繝ｭ繝ｼ繝峨＠縺ｦ繧よ悽蠖薙↓OK?")){
        const FD = new FormData
        const obj = Object.assign({},FunctionObject)
        obj.comment = obj.comment.replaceAll(/\n/g,"\\n");
        delete obj.x
        delete obj.y
        delete obj.z
        FD.append("FunctionObject",JSON.stringify(obj))
        fetch("./upload.php",{
            method:"POST",
            body:FD
        })
        .then(res => res.text())
        .then(text => {
            alert(text)
        })
        .catch(()=>{
            alert("謗･邯壹↓螟ｱ謨暦ｼ�")
        })
    }
})

const DrawModeChange = document.getElementById("DrawModeChange")
let DrawMode = false
const OnAndOff = document.getElementById("OnAndOff")
let OnFlag = true
OnAndOff.addEventListener("click",()=>{
    if(OnFlag){
        OnAndOff.innerText = "蜀咲函"
    }else{
        OnAndOff.innerText = "蛛懈ｭ｢"
    }
    OnFlag = !OnFlag
})
DrawModeChange.addEventListener("click",()=>{
    if(DrawMode){
        DrawModeChange.innerText = "蝗ｺ螳壽緒蜀吶Δ繝ｼ繝�"
    }else{
        DrawModeChange.innerText = "驕ｷ遘ｻ謠丞�繝｢繝ｼ繝�"
    }
    DrawMode = !DrawMode
})
const VarOnAndOff = document.getElementById("VarOnAndOff")
let VarOnFlag = false
VarOnAndOff.addEventListener("click",()=>{
    if(VarOnFlag){
        VarOnAndOff.innerText = "螟画焚縺ｮ螟牙虚繧貞●豁｢"
    }else{
        VarOnAndOff.innerText = "螟画焚縺ｮ螟牙虚繧貞�逕�"
    }
    VarOnFlag = !VarOnFlag
})
let GridFlag = true
document.getElementById("GridChange").addEventListener("click",()=>{
    GridFlag = !GridFlag
})
let BeyondDrawMode = false
document.getElementById("BeyondDrawModeChange").addEventListener("click",()=>{
    BeyondDrawMode = !BeyondDrawMode
})
document.getElementById("okay").addEventListener("click",()=>{
    SetFunctionObject()
})

document.getElementById("VarAdd").addEventListener("click",()=>{
    const VarNameNode = document.getElementById("VarName")
    const VarName = VarNameNode.value
    if(VarName in FunctionObject.VarObject || VarNameCheck(VarName))return
    AddVarBox(VarName,1,0)
    VarNameNode.value = ""
    VarNameNode.focus()
})

function UploadPvData(){
    const FD = new FormData
    const Array = [...PreviewObject.PvSet].slice(PreviewObject.PvCount)
    if(!Array.length)return
    FD.append("PvData",JSON.stringify(Array))
    fetch("./IncreasePV.php",{
        method:"POST",
        body:FD
    })
    .then(res => res.text())
    .then(text => {
        if(text)alert(text)
        else PreviewObject.PvCount += Array.length
    })
    .catch((error)=>{
        alert("Error:"+error)
    })
}
function ShowPv(){
    let FO = PreviewObject.Array[PreviewObject.num]
    if(!FO){alert("縺薙％縺ｫ縺ｯ菴輔ｂ縺ｪ縺�ｈ縺�□");return}
    const obj = PreviewObject.Array[PreviewObject.num].json
    document.getElementById("PreviewMenu").innerText = PreviewObject.num+1 + "/" + PreviewObject.Max
    document.getElementById("PreviewComment").value =   obj.comment
    document.getElementById("PreviewInfo").innerText = `PV:${FO.pv},菴懈�譌･譎�:${FO.date}`
    TmpPv.clearRect(0,0,TemporaryPreview.width,TemporaryPreview.height)
    GraphAFunction(obj,camera.default,TmpPv)
}

function move(){
    if(Wflag){
        camera.x += Math.sin(camera.zx)*MoveSpeed
        camera.z += Math.cos(camera.zx)*MoveSpeed
    }
    if(Sflag){
        camera.x += -Math.sin(camera.zx)*MoveSpeed
        camera.z += -Math.cos(camera.zx)*MoveSpeed
    }
    if(Dflag){
        camera.x += Math.cos(camera.zx)*MoveSpeed
        camera.z += -Math.sin(camera.zx)*MoveSpeed
    }
    if(Aflag){
        camera.x += -Math.cos(camera.zx)*MoveSpeed
        camera.z += Math.sin(camera.zx)*MoveSpeed
    }
    if(SPflag){
        camera.y += MoveSpeed
    }
    if(SLflag){
        camera.y += -MoveSpeed
    }
}
function ReloadFunctionObject(obj){
    document.getElementById("x").value = obj.X
    document.getElementById("y").value = obj.Y
    document.getElementById("z").value = obj.Z
    document.getElementById("MaxT").value = obj.MaxT
    document.getElementById("dt").value = obj.dt
    document.getElementById("FirstT").value = obj.FirstT
    document.getElementById("comment").value = obj.comment
    
    document.getElementById("VarsBox").replaceChildren()
    FunctionObject.VarObject = {}
    for(let i in obj.VarObject){
        const Var = obj.VarObject[i]
        AddVarBox(i,Var.num,Var.d)
    }

    SetFunctionObject()
}
function SetFunctionObject(){
    const x = StringToFunction(document.getElementById("x").value,FunctionObject.VarObject)
    const y = StringToFunction(document.getElementById("y").value,FunctionObject.VarObject)
    const z = StringToFunction(document.getElementById("z").value,FunctionObject.VarObject)

    const MaxT = Number(document.getElementById("MaxT").value)
    const dt = Number(document.getElementById("dt").value)
    const FirstT = Number(document.getElementById("FirstT").value)
    if(x !== false && y !== false && z !== false && !isNaN(MaxT) && !isNaN(dt) && !isNaN(FirstT)){
        FunctionObject.x = x
        FunctionObject.y = y
        FunctionObject.z = z
        FunctionObject.X = document.getElementById("x").value
        FunctionObject.Y = document.getElementById("y").value
        FunctionObject.Z = document.getElementById("z").value
        FunctionObject.MaxT = MaxT
        FunctionObject.dt = dt
        FunctionObject.FirstT = FirstT
        return true
    }else{
        alert("蠑上↓菴輔°蝠城｡後′縺ゅｋ繧医ゆｽ輔′蝠城｡後°縺ｯ閾ｪ蛻�〒隱ｿ縺ｹ縺ｦ縺ｭ縲�")
        OnAndOff.click()
        return false
    }
}

function StringToFunction(str,VarObject){
    if(CountWord(str,"(") !== CountWord(str,")"))return false
    str = str.replaceAll(/\s/g,"")
    const Strings = str.split(/\(|\)|\*|\/|\-|\+|\^|abs|acos|acosh|asin|asinh|atanh|cbrt|ceil|cos|cosh|exp|expm1|floor|log|log1p|log10|log2|random|round|sign|sin|sinh|sqrt|tan|tanh|trunc|PI|E/)
    parent: for(let i=0; i < Strings.length;i++){
        if(!Strings[i] || isNumber(Strings[i]) || Strings[i] === "t")continue
        if(Strings[i].length >= 2)return false
        for(let I in VarObject){
            if(Strings[i] === I)continue parent
        }
        return false
    }
    let MathMethodArray = ["abs", "acos", "acosh", "asin", "asinh", "atanh", "cbrt", "ceil", "cos", "cosh", "exp", "expm1", "floor", "log", "log1p", "log10", "log2", "random", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc","PI" ,"E"]
    for(let Var in VarObject){
        str = str.replaceAll(Var,`VarObject["${Var}"].num`)
    }
    str = str.replaceAll("^","**")
    for(let i of MathMethodArray){
        str = str.replaceAll(i,"Math."+i)
    }
    return eval(`(t)=>{return ${str}}`)
}


function VarNameCheck(VarName){
    if(VarName.length <= 2 && 0 < VarName.length && !isNumber(VarName))return false
    return true
}
function AddVarBox(VarName,num,d){
    FunctionObject.VarObject[VarName] = {num:num,d:d}
    const VarBox = document.createElement("div")
    VarBox.id = VarName+"_Box"
    const VarLabel = document.createElement("label")
    VarLabel.htmlFor = VarName
    VarLabel.innerText = VarName+":"
    const DeltaLabel = document.createElement("label")
    DeltaLabel.htmlFor = "d"+VarName
    DeltaLabel.innerText = `ﾎ�${VarName}:`
    const VarInput = document.createElement("input")
    VarInput.id = VarName
    VarInput.type = "number"
    VarInput.addEventListener("input",()=>{
        FunctionObject.VarObject[VarName].num = Number(VarInput.value)
    })
    VarInput.value = num
    const DeltaInput = document.createElement("input")
    DeltaInput.id = "d"+VarName
    DeltaInput.type = "number"
    DeltaInput.addEventListener("input",()=>{
        FunctionObject.VarObject[VarName].d = Number(DeltaInput.value)
    })
    DeltaInput.value = d
    const VarDelete = document.createElement("button")
    VarDelete.id = VarName+"_Delete"
    VarDelete.innerText = `螟画焚${VarName}繧貞炎髯､`
    VarDelete.addEventListener("click",()=>{
        if(confirm("縺ｻ繧薙→縺ｫ豸医＠縺ｦ縺�＞?") && confirm("繝槭ず縺ｧ?遘√�遒ｺ隱阪＠縺溘〒?")){
            const tmp = FunctionObject.VarObject[VarName]
            delete FunctionObject.VarObject[VarName]
            if(SetFunctionObject()){
                VarBox.remove()
            }else{
                FunctionObject.VarObject[VarName] = tmp
                alert("螟画焚縺悟ｼ上↓谿九▲縺ｦ繧九°縲∵勸騾壹↓蠑上↓蝠城｡後′縺ゅｋ繧医ゅ■繧�ｓ縺ｨ豸医＠縺ｦ縺九ｉ螟画焚繧貞炎髯､縺励※縺ｭ縲�")
            }
        }
    })
    VarBox.append(VarLabel,VarInput,DeltaLabel,DeltaInput,VarDelete)
    document.getElementById("VarsBox").appendChild(VarBox)
}
let CurrentTime = 0
let PlaybackTime = 0
function GraphAFunction(FunctionObject,camera,ctx){
    let MaxT = FunctionObject.MaxT
    let dt = FunctionObject.dt
    let FirstT = FunctionObject.FirstT
    if(dt <= 0 || 100000000 < (MaxT-FirstT)/dt){alert("辟｡騾｣繝ｫ繝ｼ繝励′逋ｺ逕溘＠縺ｦ繧九ｈ��");OnAndOff.click();return}

    let Multiples = ~~(PlaybackTime+PlaybackSpeed - ~~PlaybackTime)
    PlaybackTime += PlaybackSpeed
    if(DrawMode){
        if(CurrentTime >= MaxT || CurrentTime < FirstT || CurrentTime === undefined){
            CurrentTime = FirstT
        }
        CurrentTime += dt*Multiples
        MaxT = CurrentTime
    }
    document.getElementById("CurrentTime").value = CurrentTime

    ctx.beginPath()
    let BeyondFlag = false
    for(let t=FirstT; t <= MaxT; t += dt){
        const x1 = FunctionObject.x(t)-camera.x
        const y1 = FunctionObject.y(t)-camera.y
        const z = FunctionObject.z(t)-camera.z

        const x2 = x1*Math.cos(camera.zx) - z*Math.sin(camera.zx)
        const Z1 = z*Math.cos(camera.zx) + x1*Math.sin(camera.zx)
        const y2 = y1*Math.cos(camera.zy) - Z1*Math.sin(camera.zy)
        const Z2 = Z1*Math.cos(camera.zy) + y1*Math.sin(camera.zy)
        
        //縲x,y蠎ｧ讓�*辟ｦ轤ｹ霍晞屬/z蠎ｧ讓吶縺薙ｌ縺ｭ
        const X = x2*380/Z2
        const Y = y2*380/Z2
        if(Z2 >= 0 || BeyondDrawMode){
            if(BeyondFlag){
                BeyondFlag = false
            }else{
                ctx.lineTo(a.width/2+X,a.height/2-Y)
            }
            ctx.moveTo(a.width/2+X,a.height/2-Y)
        }else{
            BeyondFlag = true
        }
    }
    ctx.stroke()
}
function VarFlow(){
    if(VarOnFlag)return
    for(let i in FunctionObject.VarObject){
        const Var = FunctionObject.VarObject[i]
        Var.num += Var.d
        document.getElementById(i).value = Var.num
    }
}
function GridDraw(){
    if(GridFlag)return
    GraphAFunction({x:(t)=>{return t*1000},y:(t)=>{return 0},z:(t)=>{return 0},MaxT:1,dt:0.1,FirstT:-1},camera,b)
    GraphAFunction({x:(t)=>{return 0},y:(t)=>{return t*1000},z:(t)=>{return 0},MaxT:1,dt:0.1,FirstT:-1},camera,b)
    GraphAFunction({x:(t)=>{return 0},y:(t)=>{return 0},z:(t)=>{return t*1000},MaxT:1,dt:0.1,FirstT:-1},camera,b)
}
const PreviewObject = {
    num:0,
    Max:0,
    Array:false,
    Flag:true,
    PvSet:new Set(),
    PvCount:0,
    GoodArray:[]
}
const FunctionObject = {
    x:(t)=>{return 100*Math.cos(t)*Math.sin(t/200*Math.PI*FunctionObject.VarObject.J.num)},
    y:(t)=>{return 100*Math.cos(t/200*Math.PI)},
    z:(t)=>{return 100*Math.sin(t)*Math.sin(t/200*Math.PI*FunctionObject.VarObject.J.num)+250},
    X:"100*cos(t)*sin(t/200*PI*J)",
    Y:"100*cos(t/200*PI)",
    Z:"100*sin(t)*sin(t/200*PI*J)+250",
    MaxT:200,
    dt:0.01,
    FirstT:0,
    comment:"逅�ｽ薙ｒ菴懊ｋ繧�▽縺ｫ螟画焚霑ｽ蜉�縺励※縺ｿ縺溘ｉ縺薙≧縺ｪ縺｣縺溘ｈ縲らｶｺ鮗励□縺ｭ縲�",
    VarObject:{
        J:{num:1,d:0.01}
    }
}

function FrameProcess(){
    if(OnFlag){
        const StartTime = performance.now()
        b.clearRect(0,0,a.width,a.height)
        b.fillStyle = "green"
        b.fillRect(a.width/2-2,a.height/2-2,4,4)
        VarFlow()
        GraphAFunction(FunctionObject,camera,b)
        GridDraw()
        
        move()
        document.getElementById("test").innerText = performance.now() - StartTime
    }
    setTimeout(FrameProcess,16)
}

