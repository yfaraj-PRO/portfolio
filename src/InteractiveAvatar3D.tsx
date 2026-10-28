import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

class Boundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false}; static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? <img className="portrait-fallback" src="/portrait.png" alt="Yassine Faraj"/> : this.props.children;}
}
function Portrait({reduced}:{reduced:boolean}) {
 const texture=useTexture('/portrait.png');
 const {viewport,size}=useThree();
 const target=useRef(new THREE.Vector2());
 const gaze=useRef(new THREE.Vector2());
 const head=useRef(new THREE.Vector2());
 const active=useRef(true);
 const geometry=useMemo(()=>{
  const g=new THREE.PlaneGeometry(3.3,4.4,112,144);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i);
   // Analytic depth approximation, not a reconstructed face or an inferred depth map.
   const face=Math.exp(-((x/.79)**2+((y-.43)/1.1)**2)*1.8);
   const nose=Math.exp(-((x/.19)**2+((y-.27)/.34)**2)*2);
   p.setZ(i,face*.38+nose*.16);
  }
  g.computeVertexNormals();return g;
 },[]);
 const material=useMemo(()=>new THREE.ShaderMaterial({
  transparent:true,
  uniforms:{portrait:{value:texture},head:{value:new THREE.Vector2()},gaze:{value:new THREE.Vector2()},breath:{value:0}},
  vertexShader:`uniform vec2 head; uniform float breath; varying vec2 vUv;
   void main(){
    vUv=uv;
    vec3 p=position;
    float mask=1.-smoothstep(.65,1.15,length((uv-vec2(.49,.62))/vec2(.31,.31)));
    vec3 local=p-vec3(0.,.45,0.);
    float yaw=head.x*.115; float pitch=-head.y*.075;
    local.xz=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*local.xz;
    local.yz=mat2(cos(pitch),-sin(pitch),sin(pitch),cos(pitch))*local.yz;
    p=mix(p,local+vec3(0.,.45,0.),mask);
    p.x+=head.x*.075*mask;
    p.y+=head.y*.035*mask+breath*mask;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
   }`,
  fragmentShader:`uniform sampler2D portrait; uniform vec2 gaze; varying vec2 vUv;
   float eyeMask(vec2 uv,vec2 center){return 1.-smoothstep(.35,1.,length((uv-center)/vec2(.029,.013)));}
   void main(){
    vec2 uv=vUv;
    float eyes=eyeMask(uv,vec2(.418,.646))+eyeMask(uv,vec2(.578,.646));
    // Move the eye interior while keeping eyelids and surrounding skin still.
    uv-=gaze*vec2(.0065,.0035)*eyes;
    vec4 c=texture2D(portrait,uv); c.rgb=pow(c.rgb,vec3(2.2));
    c.a*=smoothstep(0.,.1,vUv.x)*(1.-smoothstep(.93,1.,vUv.x));
    gl_FragColor=c;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`,
 }),[texture]);
 useEffect(()=>{
  const element=document.getElementById('accueil');
  const move=(event:PointerEvent)=>{
   if(event.pointerType==='touch'||!element)return;
   const r=element.getBoundingClientRect();
   const faceX=r.left+r.width*(r.width<650?.5:.72);
   const faceY=r.top+(r.width<650?250:r.height*.36);
   target.current.set(THREE.MathUtils.clamp((event.clientX-faceX)/(r.width*.45),-1,1),THREE.MathUtils.clamp((faceY-event.clientY)/(r.height*.48),-1,1));
  };
  const reset=()=>target.current.set(0,0);
  const observer=new IntersectionObserver(([entry])=>{active.current=entry.isIntersecting;if(!entry.isIntersecting)reset()});
  if(element)observer.observe(element);
  element?.addEventListener('pointermove',move);element?.addEventListener('pointerleave',reset);window.addEventListener('blur',reset);
  return()=>{observer.disconnect();element?.removeEventListener('pointermove',move);element?.removeEventListener('pointerleave',reset);window.removeEventListener('blur',reset)};
 },[]);
 useFrame(({clock},dt)=>{
  if(reduced||!active.current||document.hidden)return;
  head.current.lerp(target.current,1-Math.exp(-dt*4));
  gaze.current.lerp(target.current,1-Math.exp(-dt*13));
  material.uniforms.head.value.copy(head.current);material.uniforms.gaze.value.copy(gaze.current);
  material.uniforms.breath.value=Math.sin(clock.elapsedTime*.85)*.007;
 });
 const mobile=size.width<650;
 const scale=viewport.height/4.4*(mobile?1.05:1.18);
 return <mesh position={[mobile?0:viewport.width*.225,-viewport.height*.03,0]} scale={scale} geometry={geometry} material={material}/>;
}
function ImportedHead({url}:{url:string}){const model=useGLTF(url);const group=useRef<THREE.Group>(null);useFrame(({pointer},dt)=>{if(group.current){group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,pointer.x*.15,5,dt);group.current.rotation.x=THREE.MathUtils.damp(group.current.rotation.x,-pointer.y*.08,5,dt);}});return <group ref={group}><primitive object={model.scene}/></group>}
export default function InteractiveAvatar3D({modelUrl}:{modelUrl?:string}) {
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);
 const supported=useMemo(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}},[]);
 return <div className="avatar-canvas" role="img" aria-label="Portrait panoramique interactif de Yassine Faraj. Le visage et le regard suivent le curseur.">{supported?<Boundary><Canvas orthographic dpr={[1,1.5]} camera={{position:[0,0,10],zoom:100}} gl={{alpha:true,antialias:true}} frameloop={reduced?'demand':'always'}><ambientLight intensity={2}/><Suspense fallback={null}>{modelUrl?<ImportedHead url={modelUrl}/>:<Portrait reduced={reduced}/>}</Suspense></Canvas></Boundary>:<img className="portrait-fallback" src="/portrait.png" alt="Yassine Faraj"/>}</div>;
}
