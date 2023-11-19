//html要素
const canvas = document.getElementById('facecanvas');
let ctx = canvas.getContext("2d");
const canvas2 = document.getElementById('farcanvas');
let ctx2=canvas2.getContext("2d");
const canvas3 = document.getElementById('canvas3');
let ctx3=canvas3.getContext("2d");
const canvas4 = document.getElementById('cut');
let ctx4=canvas4.getContext("2d",{
	willReadFrequently: true
});
const canvas5 = document.getElementById('rec');
let ctx5=canvas5.getContext("2d");
const videoEl = document.getElementById('video');
const music = new Audio('sound/siren.mp3');
const inputSize = 224;
const scoreThreshold = 0.5;
const options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
const timed=document.getElementById("time");
//max,min関数
const aryMax = function (a, b) {return Math.max(a, b);}
const aryMin = function (a, b) {return Math.min(a, b);}  
//グローバル関数
let count=0; 
let h,s,v=0;
//timer
let far;
let far_count=0;   
let far_count2=0;
let far_time=0;
let can_sec=true;
let sec=0;
let starttime;
let now_sec=0;
let check_time=1;
//land
let face_size=true;
let landlog=0,landlog2=0,landlog3=0,landlog4=0,landlog3s=0,landlog4s=0;
//angle
let lock_angle=false;
let angle="";
let angle_count=0,angle_time=0;
let initaly=0,ini_area=0;
//確認用
let stop=false;
let sitdown=true;
let start=false;
let change=true;
//パラメーター調整
let s_min=30;
let s_max=20;
let v_min;
let v_max=200;
let per_lr=60;
let per_up=50;
let per_down=40;
function starts(){
    start=true;
    sec=0;
    angle_time=0;
}
function stops(){
    start=false;
}
async function color(){
    let landmark=await landmarkFind();
    let hsv=await faceColor(landmark);
    h=hsv[0],s=hsv[1],v=hsv[2];
    ctx2.drawImage(videoEl, 0, 0);
    let src=cv.imread('farcanvas');
    let dst = new cv.Mat();
    far=await faceArea(src,dst,h,s,v);
    src.delete();
    dst.delete();
    initaly=await topBottom();
    ini_area=landlog3*landlog4;
    v_min=await getV(landmark);    
    return far
}
function test1(){
    change=false;
    document.getElementById("angle").style.display="none";
    document.getElementById("angle_count").style.display="none";
    document.getElementById("angle_time").style.display="none";
}
function test2(){
    change=true;
    document.getElementById("angle").style.display="block";
    document.getElementById("angle_count").style.display="block";
    document.getElementById("angle_time").style.display="block";
}
function change_lr(){
    per_lr=document.getElementById("text_lr").value;
}
function change_up(){
    per_up=document.getElementById("text_up").value;
}
function change_down(){
    per_down=document.getElementById("text_down").value;
}
function default_lr(){
    per_lr=60;
    document.getElementById("text_lr").value="60";
}
function default_up(){
    per_up=50;
    document.getElementById("text_up").value="50";
}
function default_down(){
    per_down=40;
    document.getElementById("text_down").value="40";
}

//main関数
async function main()
{
        if(videoEl.paused || videoEl.ended || !faceapi.nets.tinyFaceDetector.params)
            return setTimeout(() => main())
    
        if(start==true){    
            let landmark=await landmarkFind();
            far_count++;
            //ランドマークがあるとき
            if(landmark != 0){
                sitdown=true;
                if(can_sec==false){
                    sec=0;
                    angle_count=0;
                    angle_time=0;
                    sitdown=true;
                    
                }
                //初回起動時
                if(count==0){
                    count=1;
                    can_sec=true;
                }
                //着席
                document.getElementById("sitdown").innerHTML="sit down";
                document.getElementById("sitdown").style.color="green";
                //方向推定
                if(faceRaite()) faceSize();
                checkAngle(landmark);
                document.getElementById("angle").innerHTML=angle;
            }
            //facearea
            ctx2.drawImage(videoEl, 0, 0);
            ctx4.clearRect(0, 0, 640, 480);
            ctx4.drawImage(videoEl, landlog, landlog2, landlog3, landlog4+60, landlog, landlog2, landlog3, landlog4+60);
            let src=cv.imread('cut');
            let dst = new cv.Mat();
            far=await faceArea(src,dst,h,s,v);
            src.delete();dst.delete();

            //ランドマークがない時の方向推定
            if(landmark == 0 && sitdown==true){
                //await checkAngle2();
                document.getElementById("angle").innerHTML=angle;
            }
            
            //画面に写っていない時
            if (far < 0.1) far_count2++;
            
            //過去5秒間の色情報の処理
            if (far_time >= 5 && can_sec==true){
                far_time=0;
                if(far_count2/far_count >= 0.9){
                    sec=0;count=0;
                    can_sec=false;sitdown=false;
                    document.getElementById("sitdown").innerHTML="stand up";
                    document.getElementById("sitdown").style.color="red";
                    angle="none";
                    document.getElementById("angle").innerHTML=angle;
                }
                far_count=0;far_count2=0;
            }
            //確認用
            document.getElementById("angle_count").innerHTML="Anglecount:"+String(angle_count);
        }
        else{
            sec=0;
            angle_time=0;
            angle_count=0
        }

        setTimeout(() => main())
}

//顔のランドマーク検出関数    
async function landmarkFind(){
    const result = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks()
    let land3x=0,land9y=0,land20y=0,land15x=0;
    if (result) {
        const dims = faceapi.matchDimensions(canvas, videoEl, true);
        const resizedResult = faceapi.resizeResults(result, dims);
        faceapi.draw.drawFaceLandmarks(canvas, resizedResult);
        let landmark=result.landmarks.positions;
        land3x=landmark[2]["_x"];
        land9y=landmark[8]["_y"];
        land15x=landmark[14]["_x"];
        land20y=landmark[19]["_y"];
        landlog=(Math.round(land3x));
        landlog2=(Math.round(land20y));
        landlog3s=(Math.round(land15x-land3x));
        landlog4s=(Math.round(land9y-land20y));
        if(face_size==true){
            face_size=false;
            landlog3=(Math.round(land15x-land3x));
            landlog4=(Math.round(land9y-land20y));
        }
        return landmark
    }
    else{
        ctx.clearRect(0, 0, 640, 480);
    }
    return 0
}
//警告
function alert(){
    music.play();
    window.open("alert.html","alert", 'width=600,height=300,left=300,top=100,toolbar=yes,menubar=yes,scrollbars=yes');
}

//色関連
async function getCoor(coor1,coor2){
    let x=(coor1[0]+coor2[0])/2|0;
    let y=(coor1[1]+coor2[1])/2|0;
    let a1=[x,y];
    x=(coor1[0]+a1[0])/2|0;
    y=(coor1[1]+a1[1])/2|0;
    let a2=[x,y];
    x=(coor2[0]+a1[0])/2|0;
    y=(coor2[1]+a1[1])/2|0;
    let a3=[x,y];
    return [a1,a2,a3];
}
async function getBgr(point){
    //RGB平均値を出力
    let b=[]
    let g=[]
    let r=[]
    for (let i=0;i< point.length ; i++){
        //範囲指定
        let x = point[i][0];
        let y = point[i][1];
        imagedata = ctx2.getImageData(x, y, 1, 1);
        let rr = imagedata.data[0];
        let gg = imagedata.data[1];
        let bb = imagedata.data[2];
        let aa = imagedata.data[3];
        let cb=0;
        let cg=0;
        let cr=0;
        if( aa === 0 )  cb,cg,cr=255;
        else{
            opacity = aa / 255;
            cb = Math.round(bb * opacity + 255 * ( 1 - opacity));
            cg = Math.round(gg * opacity + 255 * ( 1 - opacity));
            cr = Math.round(rr * opacity + 255 * ( 1 - opacity));
        }
        b.push(cb);
        g.push(cg);
        r.push(cr);
    }
    return [b,g,r]
}
async function faceColor(landmark){
    ctx2.drawImage(videoEl, 0, 0);
    //色情報
    let land3=[0,0];
    let land4=[0,0];
    let land14=[0,0];
    let land15=[0,0];
    let land31=[0,0];
    let land6=[0,0];
    let land49=[0,0];
    let land12=[0,0];
    let land55=[0,0];
    for (let i=0;i<landmark.length;i++){
        let x=landmark[i]["_x"];
        let y=landmark[i]["_y"];
        if (i == 2){
            land3=[x,y];
        }
        if (i == 3){
            land4=[x,y];
        }
        if (i == 13){
            land14=[x,y];
        }
        if (i == 14){
            land15=[x,y];
        } 
        if (i == 30){
            land31=[x,y];
        }
        if (i == 5){
            land6=[x,y];
        }
        if (i == 48){
            land49=[x,y];
        }
        if (i == 11){
            land12=[x,y];
        }
        if (i == 54){
            land55=[x,y];
        }
    }  
    //収集座標計算
    //左
    let x=(land3[0]+land4[0])/2|0;
    let y=(land3[1]+land4[1])/2|0;
    let mid=[x,y];
    let points=await getCoor(land3,land31);
    let point1=points[0],point2=points[1],point3=points[2];
    points=await getCoor(mid,land31);
    let point4=points[0],point5=points[1],point6=points[2];
    points=await getCoor(land4,land31);
    let point7=points[0],point8=points[1],point9=points[2];
    //右
    x=(land15[0]+land14[0])/2|0;
    y=(land15[1]+land14[1])/2|0;
    mid=[x,y];
    points=await getCoor(land31,land15);
    let point11=points[0],point12=points[1],point13=points[2];
    points=await getCoor(land31,mid);
    let point14=points[0],point15=points[1],point16=points[2];
    points=await getCoor(land31,land14);
    let point17=points[0],point18=points[1],point19=points[2];
    x=(land6[0]+land49[0])/2|0;
    y=(land6[1]+land49[1])/2|0;
    let point20=[x,y];
    x=(land12[0]+land55[0])/2|0;
    y=(land12[1]+land55[1])/2|0;
    let point21=[x,y];
    //左右連結
    let point=[point1,point2,point3,point4,point5,point6,point7,point8,point9,land31,
    point11,point12,point13,point14,point15,point16,point17,point18,point19,point20,point21];

    //顔の色取得
    let bgr=await getBgr(point);
    let b=bgr[0],g=bgr[1],r=bgr[2];
    let hsv=await getHsv(b,g,r);
    let h=hsv[0],s=hsv[1],v=hsv[2];
    return [h,s,v]
}
async function getHsv(b,g,r){
    //bgrをhsvに変換
    let h=[],s=[],v=[];
    for (let i=0;i<21;i++){
        let bgr=[b[i],g[i],r[i]];
        let max=bgr.reduce(aryMax);
        let min=bgr.reduce(aryMin);
        //h
        if(b[i]==g[i]==r[i]){
            h.push(0);
        }
        else if(b[i]==max){
            let buf=60*((r[i]-g[i])/(max-min))+240;
            if(buf <0){
                buf+=360;
            }
            h.push(Math.round(buf/2));
        }
        else if(g[i]==max){
            let buf=60*((b[i]-r[i])/(max-min))+140;
            if(buf <0){
                buf+=360;
            }
            h.push(Math.round(buf/2));
        }
        else if(r[i]==max){
            let buf=60*((g[i]-b[i])/(max-min));
            if(buf <0){
                buf+=360;
            }
            h.push(Math.round(buf/2));
        }
        //s
        s.push(Math.round(((max-min)/max)*255));
        //v
        v.push(max);
    }
    count++;
    return [h,s,v]
}
async function getV(landmark){
    imagedata = ctx2.getImageData(landmark[8]["_x"], landmark[8]["_y"], 1, 1);
    let rr = imagedata.data[0];
    let gg = imagedata.data[1];
    let bb = imagedata.data[2];
    let aa = imagedata.data[3];
    let cb=0;
    let cg=0;
    let cr=0;
    if( aa === 0 )  cb,cg,cr=255;
    else{
        opacity = aa / 255;
        cb = Math.round(bb * opacity + 255 * ( 1 - opacity));
        cg = Math.round(gg * opacity + 255 * ( 1 - opacity));
        cr = Math.round(rr * opacity + 255 * ( 1 - opacity));
    }
    return [cb,cg,cr].reduce(aryMax)
}
async function faceArea(src,dst,h,s,v){
    //顔の中央値座標切り出し
    
    let height=videoEl.height;
    let width=videoEl.width;
    let dsize = new cv.Size(width, height);
    cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
    if(v.reduce(aryMax)>200){
        v_max=v.reduce(aryMax);
    }
    //抽出
    let mix=new cv.Mat();
    for (let i=0;i<19;i++){
        let dst2=new cv.Mat();
        let hsv = [h[i],s[i],v[i]];
        //色の閾値
        const minMat = cv.matFromArray(
            1,
            3,
            cv.CV_8UC1,
            [hsv[0], hsv[1]-s_min, v_min]
        );
        const maxMat = cv.matFromArray(
            1,
            3,
            cv.CV_8UC1,
            [hsv[0],hsv[1]+s_max, v_max]
        );
        cv.cvtColor(dst,dst2, cv.COLOR_RGB2HSV);
        //画像の2値化
        cv.inRange(dst2, minMat, maxMat, dst2);
        if (i == 0){
            cv.addWeighted(src1=dst2,alpha=1,src2=dst2,beta=1,gamma=0,mix);
            dst2.delete();
            
        }
        else{
            cv.addWeighted(src1=mix,alpha=1,src2=dst2,beta=1,gamma=0,mix);
            dst2.delete();
        }
        
    }
    //白色割合
    let mix_size=(dst.cols * dst.rows);
    let otherpixels=cv.countNonZero(mix);
    let whiteAreaRatio=(otherpixels/mix_size)*100;
    let dsize2 = new cv.Size(mix.cols/4,mix.rows/4);
    cv.resize(mix,mix,dsize2,0,0,cv.INTER_AREA);
    cv.imshow('canvas3', mix);
    mix.delete();
    return whiteAreaRatio
}

//タイマー関数
function timeFormat(sec){
    if(sec<60){
        return String(sec)+"s"
    }
    else if(sec<3600){
        return String(sec/60|0)+"m"+String(sec-(60*(sec/60|0)))+"s"
    }
    else if(sec>=3600){
        let h=sec/3600|0
        let m=sec-(h*3600)
        return String(h)+"h"+String(m/60|0)+"m"+String(m-(60*(m/60|0)))+"s"
    }
}

function timerInitial() {
	let start = new Date(); 
	starttime = start.getTime();
	setInterval('timer()',1000/Math.pow(10,2)); 
}

function timer() {
	let now = new Date(); 
	let nowtime = now.getTime(); 
	now_sec=  (nowtime-starttime)/1000; 
    if(check_time<=now_sec){
        check_time++;
        sec++;
        angle_time++;
        far_time++;
        timed.innerHTML=("time:"+timeFormat(sec));
        document.getElementById("angle_time").innerHTML="Angletime:"+String(angle_time);
        //顔の向き関連
        if(angle != "front"){
            if(angle != "none"){
                angle_count++;
                document.getElementById("angle_count").innerHTML="Anglecount:"+String(angle_count);
            }   
        }
        if(sitdown==false){
            sec=0;
            angle_time=0;
            angle_count=0;
        }
        if(sec==900){
            if(change==false){
                alert();
            }
        }
        if(change){
            //3分間の顔方向情報の処理
            if (angle_time >= 180){
                angle_time=0;
                if (angle_count >= 180*0.7){
                    alert();
                }
                angle_count=0;
            }
        }
    }
}

//顔の大きさ
async function faceSize(){
    let area=landlog3s*landlog4s;
    if(ini_area>area){
        if(100-((area/ini_area)*100)>=25 ){
            landlog3=landlog3s;
            landlog4=landlog4s;
            initaly=await topBottom();
            ini_area=area;
           
        }
    }
    else if(ini_area==area){
        return area
    }
    else{
        if(100-((ini_area/area)*100)>=25 ){
            landlog3=landlog3s;
            landlog4=landlog4s;
            initaly=await topBottom();
            ini_area=area;
            
        }
    }
    return area

}
async function faceRaite(){
    let m,s;
    if(landlog3s>landlog4s){
        m=landlog3s;
        s=landlog4s;
    }
    else{
        m=landlog4s;
        s=landlog3s;
    }
    if(100-(s/m*100) <=3){
        
        return true
    }
    else false
    
}

//方角決定関数（正面、左、右,上、下）
function checkAngle(landmark){
    let left=Math.abs(landmark[30]["_x"]-landmark[2]["_x"]);
    let right=Math.abs(landmark[30]["_x"]-landmark[14]["_x"]);
    let up=Math.abs(landmark[30]["_y"]-((landmark[36]["_y"]+landmark[45]["_y"])/2|0));
    let down=Math.abs(landmark[30]["_y"]-((landmark[48]["_y"]+landmark[54]["_y"])/2|0));
    let max_w,small_w;
    if(left>right){
        max_w=left;
        small_w=right;
    }
    else{
        max_w=right;
        small_w=left;
    }

    if(100-((small_w/max_w)*100) >= per_lr){
        if(left>right){
            angle="left";
        }
        else{
            angle="right";
        }
    }
    else if(100-((up/down)*100) >= per_up){
        angle="up";
    }
    else if(100-((down/up)*100) >= per_down){
        angle="down";
    }
    else{
        angle="front";
    }
}

//方角決定関数（下）
async function topBottom(){
    for(let y=0;y<videoEl.height/4;y++){
        for(let x=0;x<videoEl.width/4;x++){
            var imagedata = ctx3.getImageData(x, y, 1, 1);
            //  RGBAの取得
            if(imagedata.data[0] !=0){
                return y
            }
        }
    }
    return null
}
async function checkAngle2(){
    let y=await topBottom();
    if(y==null){
        return
    }
    else{
        if(initaly-y <= -40){
            angle="down";
            console.log(1)
        }
    }
}

//カメラ起動
async function run(){
    await faceapi.nets.tinyFaceDetector.load('models/');
    await faceapi.nets.faceLandmark68Net.load("models/");
const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
videoEl.srcObject = stream;
}

$(document).ready(function() {
    run();
    timerInitial();
});

