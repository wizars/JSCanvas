var CAMERA_CANVAS = null;
var EFFECTS_CANVAS = null;

var SIZE_W = 600;
var SIZE_H = 600;

const INTERVAL = 20;
var COLOR = [29,32,165];
var THRESHOLD = 50;

var PATH = [];
const PATH_LIFETIME = 2000;

var PARTICLES =[];
const CHAOS = 10;

// Inicialize everything
function main() {
    console.log("Iniciando")
    // Iniciate the canvases
    CAMERA_CANVAS = document.getElementById('camera');
    EFFECTS_CANVAS = document.getElementById('efectos');

    CAMERA_CANVAS.addEventListener('click', updateColor);
    // Iniciate camera and ask permisions
    const constrainsts = { video: true };
    const permission = navigator.mediaDevices.getUserMedia(constrainsts);
    
    // Link camera stream to video element
    permission.then(
        
        function (stream) {
            const video = document.createElement("video");
            video.srcObject = stream;
            video.play()
            
            // Update image every INTERVAL 
            setInterval(updateImage, INTERVAL, video);
        }
        ).catch(
        // Show error is no camera/permision
        function (err) { alert("camaera error"); }
    );

    
    
}

// Updates the image
function updateImage(video) {
    const context = CAMERA_CANVAS.getContext("2d");

    SIZE_W = video.videoWidth;
    SIZE_H = video.videoHeight;
    EFFECTS_CANVAS.width = SIZE_W;
    EFFECTS_CANVAS.height = SIZE_H;
    CAMERA_CANVAS.width = SIZE_W;
    CAMERA_CANVAS.height = SIZE_H;
context.translate(SIZE_W,SIZE_H);
    context.scale(-1,-1)
    context.drawImage(video, 0, 0, SIZE_W, SIZE_H, 0, 0, SIZE_W, SIZE_H);

    clearEffectsCanvas();
    // Find the target color pixel
    const pixelLocations = getPointerPixels();
    
    // Show them on canvas
    // showLocations(pixelLocations);

    if (pixelLocations.length > 0) {
        const centerPoint = average(pixelLocations);
        centerPoint.time = new Date().getTime();
        // console.log(centerPoint)
        PATH.push(centerPoint)
    }
    keepRecentPartOfPath();
    drawPath()
    updateParticles();
}

// Updates the particles
function updateParticles(){
    for(var i = 0; i<PATH.length;i++){
        var velocity = [
            CHAOS *(Math.random()-0.5),
            CHAOS *(Math.random()-0.5)
        ];
        if (i>0){
            const backVelocity=subtractVectors(PATH[i-1],PATH[i]);
            velocity = addVectors(velocity,backVelocity);
        }
        PARTICLES.push(new Particle(PATH[i],velocity));
    }
    for (var i =0; i < PARTICLES.length; i++){
        PARTICLES[i].move();
        PARTICLES[i].draw();
    }
    while (PARTICLES.length>0 && PARTICLES[0].life==0){
        PARTICLES.shift()
    }
}
// keeps the path recnet
function keepRecentPartOfPath(){
    const now = new Date().getTime();
    while (PATH.length>0 && now-PATH[0].time>PATH_LIFETIME){
        PATH.shift();
    }
}

// Draw path
function drawPath(){
    for ( var i =0;i<PATH.length-1;i++){
        drawSegment(PATH[i],PATH[i+1], "green");
    }
}
// Draw segment
function drawSegment (from, to, color = "black"){
    const context = EFFECTS_CANVAS.getContext("2d");
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    context.strokeStyle=color;
    context.lineWidth=2;
    context.stroke();
}
// Get the matching color points
function getPointerPixels() {
    const context = CAMERA_CANVAS.getContext("2d");
    var pixelLocations = [];

    if (SIZE_H > 0 && SIZE_W > 0) {

        const imageData = context.getImageData(0, 0, SIZE_W, SIZE_H);
        const oneDArray = imageData.data;
        for (var y = 0; y < SIZE_H; y++) {
            for (var x = 0; x < SIZE_W; x++) {
                const r = oneDArray[y * SIZE_W * 4 + x * 4 + 0];
                const g = oneDArray[y * SIZE_W * 4 + x * 4 + 1];
                const b = oneDArray[y * SIZE_W * 4 + x * 4 + 2];
                // const a = oneDArray[y * SIZE_W * 4 + x * 4 + 3];
                if (distance(COLOR, [r, g, b]) <= THRESHOLD) {
                    pixelLocations.push([x, y]);
                }
            }
        }
    }

    return pixelLocations;
}

// Averages points
function average(locations) {
    var loc = [0, 0];
    for (var i = 0; i < locations.length; i++) {
        loc[0] += locations[i][0];
        loc[1] += locations[i][1];

    }

    loc[0] /= locations.length;
    loc[1] /= locations.length;
    return loc
}

// Draws the pixel in the effects canvas
function showLocations(locations) {
    const context = EFFECTS_CANVAS.getContext("2d")
    for (var i = 0; i < locations.length; i++) {
        context.fillRect(...locations[i], 1, 1)
    }
    context.fill();
}

// Clears the canvas
function clearEffectsCanvas() {
    const context = EFFECTS_CANVAS.getContext("2d");
    context.clearRect(0, 0, SIZE_W, SIZE_H);
}

// Computes euclidian distance
function distance(p1, p2) {
    var dist = 0;
    for (var i = 0; i < p1.length; i++) {
        dist += (p1[i] - p2[i]) * (p1[i] - p2[i]);

    }
    return Math.sqrt(dist)
}

// Changes the target color
function updateColor(event) {
    const location = getCursorPosition(event);
    // console.log(location)
    const context = CAMERA_CANVAS.getContext("2d");
    const imageData = context.getImageData(...location, 1, 1);
    const oneDArray = imageData.data;

    COLOR[0] = oneDArray[0];
    COLOR[1] = oneDArray[1];
    COLOR[2] = oneDArray[2];
    alert(`Nuevo Color = ${COLOR}`)
}

// Gets the cursor position in the canvas
function getCursorPosition(event) {
    const rect = CAMERA_CANVAS.getBoundingClientRect();
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);
    return [x, y];
}

// Changes threshold with the range selector
function changeThreshold(event) {

    THRESHOLD = document.getElementById("threshold").value;
    console.log("Umbral = " + THRESHOLD)
}

// Particulas
const G =[0,1]
class Particle{ 
    constructor (location, velocity){
        this.location=location;
        this.velocity=velocity;
        this.life=10;
        this.green = 100+Math.random(Math.random()*100);
    }
    move(){
        this.velocity=addVectors(this.velocity, G)
        this.location=addVectors(this.location, this.velocity)
        this.life--
    }
draw(){
const op = this.life/10;
    const color = "rgba(255,"+this.green+", 0,"+op+")";
    const oldLocation = subtractVectors(this.location, this.velocity)
    drawSegment(this.location, oldLocation,color);
}
}
function addVectors(v1,v2){
    var newV=[ v1[0]+v2[0],v1[1]+v2[1]]
    return newV;
}

function subtractVectors(v1,v2){
    var newV=[ v1[0]-v2[0],v1[1]-v2[1]]
    return newV;
}