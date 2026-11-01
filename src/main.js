import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb5c4);
scene.fog = new THREE.Fog(0x9bb5c4, 180, 520);
const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 900);
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight(0xdcecff, 0x38452d, 2.0));
const sun = new THREE.DirectionalLight(0xfff1dc, 3.1);
sun.position.set(-70, 120, 40); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-180; sun.shadow.camera.right=180; sun.shadow.camera.top=180; sun.shadow.camera.bottom=-180;
scene.add(sun);

const mat = (color, roughness=0.8, metalness=0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
const grassMat = mat(0x3c6248), asphaltMat = mat(0x343a40), whiteMat = mat(0xf0f0ed), redMat = mat(0xff3048), darkMat = mat(0x11151a), carbonMat = mat(0x20262d,0.35,0.45), tyreMat = mat(0x111214,0.95), glassMat = new THREE.MeshStandardMaterial({color:0x111923,metalness:.6,roughness:.18});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200,1200), grassMat); ground.rotation.x=-Math.PI/2; ground.position.y=-0.2; ground.receiveShadow=true; scene.add(ground);

// A closed, rounded circuit. Points are sampled to make a drivable centerline.
const rx=83, rz=48;
const trackPoints=[];
for(let i=0;i<240;i++){const t=i/240*Math.PI*2;trackPoints.push(new THREE.Vector3(rx*Math.cos(t),0,rz*Math.sin(t)));}
const curve = new THREE.CatmullRomCurve3(trackPoints,true,'centripetal');
const curveSamples=curve.getPoints(900);
function ribbon(points,width,y,material){
 const verts=[], inds=[];
 for(let i=0;i<points.length;i++){const p=points[i], next=points[(i+1)%points.length];const tangent=new THREE.Vector3().subVectors(next,p).normalize();const side=new THREE.Vector3(-tangent.z,0,tangent.x).multiplyScalar(width/2);verts.push(p.x+side.x,y,p.z+side.z,p.x-side.x,y,p.z-side.z);}
 for(let i=0;i<points.length;i++){const j=(i+1)%points.length,a=i*2,b=a+1,c=j*2,d=c+1;inds.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(inds);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
ribbon(curveSamples,18,0.015,asphaltMat);
// Painted circuit edge strips
const leftPts=[], rightPts=[];
for(let i=0;i<curveSamples.length;i++){const p=curveSamples[i], n=curveSamples[(i+1)%curveSamples.length], t=new THREE.Vector3().subVectors(n,p).normalize(), s=new THREE.Vector3(-t.z,0,t.x).multiplyScalar(9.15);leftPts.push(new THREE.Vector3(p.x+s.x,.07,p.z+s.z));rightPts.push(new THREE.Vector3(p.x-s.x,.07,p.z-s.z));}
ribbon(leftPts,.7,.075,redMat);ribbon(rightPts,.7,.075,whiteMat);
// Outer runoff and curbs in alternating blocks
const curbRed=mat(0xd52d3f), curbWhite=mat(0xf4f1e9);
for(let i=0;i<curveSamples.length;i+=8){
 const p=curveSamples[i], n=curveSamples[(i+8)%curveSamples.length], tang=new THREE.Vector3().subVectors(n,p), center=p.clone();
 const curb=new THREE.Mesh(new THREE.BoxGeometry(Math.max(1,tang.length()),.09,1.05),i%16===0?curbRed:curbWhite);
 curb.position.set(center.x,.10,center.z);curb.rotation.y=-Math.atan2(tang.z,tang.x);scene.add(curb);
}
// Trackside walls and grandstands around part of the circuit
const wallMat=mat(0xb9c0c7), standMat=mat(0x4a525e);
function box(w,h,d,material,x,y,z,ry=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
for(let i=0;i<48;i++){const t=i/48*Math.PI*2, x=rx*Math.cos(t), z=rz*Math.sin(t);const tangent=new THREE.Vector3(-rx*Math.sin(t),0,rz*Math.cos(t)).normalize();const angle=-Math.atan2(tangent.z,tangent.x);box(5,.8,.35,wallMat,x,.4,z,angle);}
for(let i=0;i<13;i++){const x=-50+i*8;box(7,4,9,standMat,x,2,-67,0);for(let r=0;r<3;r++)box(6,.22,.28,r%2?redMat:whiteMat,x,1+r*.8,-62.3);}
for(let i=0;i<10;i++){const x=-42+i*9;box(7,5,1.3,mat(0xe8edf1),x,2.5,65,0);box(6.7,1.4,1.5,mat(0x303844),x,5.4,65,0);}
for(let i=0;i<25;i++){const t=i/25*Math.PI*2;const x=130*Math.cos(t),z=82*Math.sin(t);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.3,.45,4,6),mat(0x4c3a2a));trunk.position.set(x,2,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.5,1),mat(0x31523b));crown.position.set(x,5,z);scene.add(crown);}

// Start/finish line across track
const line=new THREE.Mesh(new THREE.PlaneGeometry(18,1.5),whiteMat);line.rotation.x=-Math.PI/2;line.position.set(rx,0.08,0);scene.add(line);
for(let i=0;i<18;i++){const sq=new THREE.Mesh(new THREE.PlaneGeometry(1,1.5),i%2?darkMat:whiteMat);sq.rotation.x=-Math.PI/2;sq.position.set(rx-8.5+i,0.09,0);scene.add(sq);}

function makeCar(color=0xff3048){
 const root=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,.38,4.3),mat(color,.32,.3));body.position.y=.62;body.castShadow=true;root.add(body);
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.62,2.25,4),mat(color,.32,.3));nose.rotation.x=Math.PI/2;nose.position.set(0,.58,-2.4);nose.scale.set(1,.65,1);root.add(nose);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(2.1,.13,3.6),carbonMat);floor.position.set(0,.35,-.15);root.add(floor);
 const cockpit=new THREE.Mesh(new THREE.SphereGeometry(.53,16,10),glassMat);cockpit.scale.set(.72,.45,1.15);cockpit.position.set(0,.94,-.1);root.add(cockpit);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.47,.045,8,24,Math.PI),carbonMat);halo.rotation.z=Math.PI;halo.position.set(0,1.13,-.15);root.add(halo);
 // front and rear wings
 const fw=new THREE.Mesh(new THREE.BoxGeometry(3.0,.12,.45),mat(color,.28,.25));fw.position.set(0,.4,-3.25);root.add(fw);
 const rw=new THREE.Mesh(new THREE.BoxGeometry(2.5,.15,.5),mat(color,.28,.25));rw.position.set(0,1.0,2.15);root.add(rw);
 const rwvert=new THREE.Mesh(new THREE.BoxGeometry(.12,1.0,.12),carbonMat);rwvert.position.set(0,1.4,2.1);root.add(rwvert);
 const wheels=[];
 for(const x of [-1.03,1.03])for(const z of [-1.65,1.55]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.3,18),tyreMat);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.43,z);wheel.castShadow=true;root.add(wheel);wheels.push(wheel);}
 const stripe=new THREE.Mesh(new THREE.BoxGeometry(.18,.025,2.4),whiteMat);stripe.position.set(0,.82,.1);root.add(stripe);
 root.userData.wheels=wheels;return root;
}
const player=makeCar(0xff3048);scene.add(player);
const aiCars=[makeCar(0x2a8cff),makeCar(0xf4f1e8),makeCar(0xffb12e)];
aiCars.forEach((c,i)=>{scene.add(c);c.userData.aiProgress=(i+1)*.013;c.userData.aiSpeed=31-i*1.5;});
const keys={};let running=false,paused=false,mode='practice',view='tcam',speed=0,steer=0,gear=1,rpm=1200,elapsed=0,lap=1,lapStart=0,lastLap=null,sessionDuration=5,finished=false;
const totalLaps=5;
const $=s=>document.querySelector(s);
const fmt=t=>{if(t==null||!Number.isFinite(t))return '--:--.---';const m=Math.floor(t/60),sec=(t%60).toFixed(3).padStart(6,'0');return `${String(m).padStart(2,'0')}:${sec}`;};
function placeCarAt(car,progress,lane=0){const t=((progress%1)+1)%1;const p=curve.getPointAt(t),tangent=curve.getTangentAt(t);car.position.set(p.x+(-tangent.z)*lane,.04,p.z+tangent.x*lane);car.rotation.y=Math.atan2(-tangent.x,-tangent.z);}
placeCarAt(player,.015,0);aiCars.forEach((c,i)=>placeCarAt(c,c.userData.aiProgress,(i%2===0?1:-1)*3.0));

function updateCamera(dt){
 const forward=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y)).multiplyScalar(-1);
 let targetPos,targetLook;
 if(view==='cockpit'){targetPos=player.position.clone().add(new THREE.Vector3(0,1.2,0)).addScaledVector(forward,-.15);targetLook=player.position.clone().addScaledVector(forward,24);camera.fov=82;}
 else if(view==='tv'){targetPos=player.position.clone().addScaledVector(forward,-10).add(new THREE.Vector3(0,5.5,0));targetLook=player.position.clone().addScaledVector(forward,4);camera.fov=55;}
 else{targetPos=player.position.clone().addScaledVector(forward,-7.5).add(new THREE.Vector3(0,3.2,0));targetLook=player.position.clone().addScaledVector(forward,7);camera.fov=65;}
 camera.position.lerp(targetPos,1-Math.pow(.001,dt));camera.lookAt(targetLook);camera.updateProjectionMatrix();
}
function chooseView(v){view=v;document.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===v));}
document.querySelectorAll('.view-btn').forEach(b=>b.addEventListener('click',()=>chooseView(b.dataset.view)));
document.querySelectorAll('.session-option').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('.session-option').forEach(x=>x.classList.toggle('selected',x===b));$('#session-name').textContent=mode.toUpperCase();}));
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.repeat)return;if(e.key==='1')chooseView('tcam');if(e.key==='2')chooseView('tv');if(e.key==='3')chooseView('cockpit');if(e.key.toLowerCase()==='p'||e.key==='Escape')togglePause();if(e.key.toLowerCase()==='r'&&running)resetSession();});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function togglePause(){if(!running||finished)return;paused=!paused;$('#pause-screen').classList.toggle('hidden',!paused);}
$('#pause-btn').addEventListener('click',togglePause);$('#resume-btn').addEventListener('click',togglePause);$('#restart-btn').addEventListener('click',resetSession);$('#again-btn').addEventListener('click',()=>{$('#finish-screen').classList.add('hidden');$('#start-screen').classList.remove('hidden');resetSession(false);});
function resetSession(showMenu=true){speed=0;steer=0;gear=1;rpm=1200;elapsed=0;lap=1;lapStart=0;lastLap=null;finished=false;running=false;paused=false;placeCarAt(player,.015,0);aiCars.forEach((c,i)=>{c.userData.aiProgress=(i+1)*.013;c.userData.aiSpeed=31-i*1.5;placeCarAt(c,c.userData.aiProgress,(i%2===0?1:-1)*3);});$('#pause-screen').classList.add('hidden');$('#finish-screen').classList.add('hidden');$('#last-lap').textContent='--:--.---';$('#session-lap').textContent='LAP 1 / 5';$('#race-state').textContent='READY';if(showMenu)$('#start-screen').classList.remove('hidden');}
$('#start-btn').addEventListener('click',()=>{resetSession(false);running=true;elapsed=0;$('#start-screen').classList.add('hidden');$('#session-name').textContent=mode.toUpperCase();$('#race-state').textContent='RUNNING';$('#track-status').textContent='TRACK CLEAR';});
function nearestProgress(pos){let best=0,bestD=Infinity;for(let i=0;i<curveSamples.length;i+=4){const d=curveSamples[i].distanceToSquared(pos);if(d<bestD){bestD=d;best=i/curveSamples.length;}}return best;}
let playerProgress=0,previousProgress=0;
function updatePlayer(dt){
 const throttle=keys.w||keys.arrowup?1:0, brake=keys.s||keys.arrowdown?1:0, left=keys.a||keys.arrowleft?1:0, right=keys.d||keys.arrowright?1:0;
 const steerInput=right-left;
 // Prototype vehicle model: engine force, drag, brake force, speed-sensitive steering and approximate aero load.
 const maxSpeed=91;const aeroDrag=.00165*speed*speed;const rolling=.65+speed*.018;
 const drive=throttle*(14.8/(1+speed*.015));const braking=brake*(speed>0?25:8);
 speed=THREE.MathUtils.clamp(speed+(drive-braking-aeroDrag-rolling)*dt,0,maxSpeed);
 const grip=THREE.MathUtils.clamp(1.0-speed/125,.25,1);steer=THREE.MathUtils.damp(steer,steerInput,5,dt);
 player.rotation.y-=steer*grip*(0.85+speed*.008)*dt;
 const forward=new THREE.Vector3(-Math.sin(player.rotation.y),0,-Math.cos(player.rotation.y));
 player.position.addScaledVector(forward,speed*dt);
 // Light lateral tyre scrub / stability effect
 const progress=nearestProgress(player.position);const center=curve.getPointAt(progress);const dist=player.position.distanceTo(center);
 if(dist>13){$('#track-status').textContent='OFF TRACK';speed=Math.max(0,speed-10*dt);}else $('#track-status').textContent='TRACK CLEAR';
 const laneOffset=new THREE.Vector3().subVectors(player.position,center);laneOffset.y=0;
 if(dist>19){player.position.lerp(center,Math.min(dt*.4,1));}
 // wheel animation and front wheel steering
 player.userData.wheels.forEach((w,i)=>{w.rotation.x-=speed*dt*1.8;if(i<2)w.rotation.y=steer*.28;});
 // derive a readable gear/RPM estimate
 gear= speed<1?'N':THREE.MathUtils.clamp(Math.floor(speed/13)+1,1,8);
 rpm=speed<1?1200:Math.round(2500+(speed%13)/13*7000);
 $('#speed').textContent=String(Math.round(speed*3.6)).padStart(3,'0');$('#gear').textContent=gear;
 $('#rpm-number').textContent=rpm.toLocaleString('en-US');$('#rpm-fill').style.width=`${THREE.MathUtils.clamp((rpm-1000)/10500*100,5,100)}%`;
 // Lap crossing detection: progress wraps across the start/finish line.
 previousProgress=playerProgress;playerProgress=progress;
 if(running&&previousProgress>.88&&playerProgress<.12&&speed>5){lastLap=elapsed-lapStart;lapStart=elapsed;lap++;$('#last-lap').textContent=fmt(lastLap);$('#session-lap').textContent=`LAP ${Math.min(lap,totalLaps)} / ${totalLaps}`;if(mode==='qualifying'&&lastLap<80)$('#race-state').textContent='VALID LAP';if(mode==='race'&&lap>totalLaps){finished=true;running=false;$('#finish-summary').textContent=`You completed the ${totalLaps}-lap sprint. Best lap: ${fmt(lastLap)}. More sim systems are coming.`;$('#finish-screen').classList.remove('hidden');}}
}
function updateAI(dt){aiCars.forEach((c,i)=>{c.userData.aiProgress=(c.userData.aiProgress+c.userData.aiSpeed*dt/(2*Math.PI*65))%1;placeCarAt(c,c.userData.aiProgress,(i%2===0?1:-1)*3);c.userData.wheels.forEach(w=>w.rotation.x-=c.userData.aiSpeed*dt*1.8);});}
function updateTiming(){const pp=nearestProgress(player.position);const ranked=[{name:'JONAS',p:pp,player:true},...aiCars.map((c,i)=>({name:['R. VEGA','M. KATO','L. NOVAK'][i],p:c.userData.aiProgress}))].sort((a,b)=>b.p-a.p);const pos=ranked.findIndex(x=>x.player)+1;$('#player-pos').textContent=`P ${String(pos).padStart(2,'0')}`;}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(running&&!paused&&!finished){elapsed+=dt;updatePlayer(dt);updateAI(dt);updateTiming();}else if(!running){updateAI(dt*.22);}updateCamera(dt);renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));});
$('#loading').style.opacity='0';setTimeout(()=>$('#loading')?.remove(),550);
animate();
