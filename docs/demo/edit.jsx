// Native Higgsfield/Higgsedit edit. Fresh 2560×1440 interface captures.
// Direct UI state changes avoid double-exposed lettering. No motion blur.
export default async ({project}) => {
  const p=await project({dir:'quevian-demo',size:'2560x1440',fps:60,background:'#ffffff'});
  const names=['01-queue','02-create','03-status','04-assign','05-reply','06-posted','07-updated-queue'];
  const shots=await Promise.all(names.map(n=>p.add('../source/'+n+'.jpg')));
  const duration=20;
  const track=(property,points)=>({property,keyframes:points.map(([at,value])=>({at,value,easing:'ease-in-out'}))});
  const states=[[0,0,3.1],[1,3.1,6],[2,6,8.4],[3,8.4,10.8],[4,10.8,14],[5,14,17.1],[6,17.1,19.2],[0,19.2,20]];
  const nodes=[];
  for(const [index,at,end] of states){
    nodes.push(<media at={at} duration={end-at} file={shots[index]} x={0} y={0} width={2560} height={1440} fit="contain"/>);
    // Mask the browser capture cursor on blank background; the native cursor below is continuous.
    nodes.push(<rect at={at} duration={end-at} x={index===0?0:1120} y={238} width={index===0?34:65} height={48}
      fill={index===0?'#ffffff':index===1||index===6?'#f8f9fd':'#7b7c7e'}/>);
  }
  const cursor=[
    [0,2000,800],[.7,2000,800],[2.9,2380,225],[3.2,2380,225],
    [4.3,1460,470],[5.8,1560,1155],[6.1,1560,1155],
    [7.2,1790,355],[8.35,1790,355],[9.2,1800,485],[10.7,1800,485],
    [11.5,1750,1035],[12.8,2140,1040],[13.9,2410,1190],
    [14.2,2410,1190],[15.4,2200,910],[16.95,2520,40],
    [17.3,2520,40],[18.5,2000,800],[20,2000,800]
  ];
  nodes.push(<path x={0} y={0} width={28} height={36} duration={duration}
    d="M 1 1 L 2 29 L 10 22 L 17 35 L 23 32 L 16 19 L 28 18 Z"
    fill="#202124" stroke={{color:'#ffffff',width:2}}
    animate={[track('offsetX',cursor.map(([t,x])=>[t,x])),track('offsetY',cursor.map(([t,,y])=>[t,y]))]}/>);
  for(const [at,x,y] of [[3,2380,225],[5.9,1560,1155],[8.3,1790,355],[10.7,1800,485],[13.9,2410,1190],[17,2520,40]]){
    nodes.push(<rect at={at} duration={.3} x={x-18} y={y-18} width={36} height={36} radius={18} fill="#747474"
      animate={[{property:'scale',from:.7,to:1.45,duration:.3,easing:'ease-out'},track('opacity',[[0,.16],[.3,0]])]}/>);
  }
  // The interface stays fixed. Only the demonstration cursor moves.
  p.compose(<frame width={2560} height={1440} layout="none" duration={duration}>{nodes}</frame>,
    {dur:duration,name:'Fixed-frame Quevian workflow'});
  for(const [label,at] of [['poster',0],['create',4.5],['status',8.8],['reply',12.5],['posted',15.4],['loop',19.9]])await p.frame(at,'renders/'+label+'.png');
  await p.render('renders/demo-master.mp4',{depth:8,bitrate:8000000,concurrency:2,shards:4});
};
