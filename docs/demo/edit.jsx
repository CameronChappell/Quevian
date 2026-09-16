// Native Higgsfield / Higgsedit composition. Cropped source captures are 1280x720.
// Camera and cursor tracks remain continuous across the full 20-second loop.
export default async ({project}) => {
  const p=await project({dir:'quevian-demo',size:'1280x720',fps:60,background:'#ffffff'});
  const names=['01-queue','02-create','03-status','04-assign','05-reply','06-posted','07-updated-queue'];
  const shots=await Promise.all(names.map(n=>p.add('../frames/'+n+'.png')));
  const duration=20;
  const smooth='ease-in-out';
  const track=(property,points)=>({property,keyframes:points.map(([at,value])=>({at,value,easing:smooth}))});
  const nodes=[<media file={shots[0]} x={0} y={0} width={1280} height={720} fit="contain" duration={duration}/>];

  // Overlapping states dissolve smoothly; previous frames never pop away.
  for(const [index,at,fade] of [[1,2.6,.42],[2,6,.4],[3,8.5,.36],[4,11,.4],[5,14,.4],[6,16.6,.5],[0,18.65,.65]]){
    nodes.push(<media at={at} duration={duration-at} file={shots[index]} x={0} y={0} width={1280} height={720} fit="contain"
      animate={[track('opacity',[[0,0],[fade,1],[duration-at,1]])]}/>);
  }

  // One cursor with flowing travel between actions, without per-shot resets.
  const cursor=[
    [0,940,430],[.7,952,418],[2.3,1176,142],[2.65,1176,142],
    [3.45,712,280],[4.3,725,283],[5.7,816,632],[6.08,816,632],
    [6.95,765,236],[7.7,746,255],[8.55,774,286],
    [9.5,790,359],[10.6,790,365],[11.75,928,580],
    [12.5,951,595],[13.72,1184,674],[14.2,1184,674],
    [15.2,1180,576],[16.3,1240,24],[16.68,1240,24],
    [17.7,1110,318],[19.3,940,430],[20,940,430]
  ];
  nodes.push(<path x={0} y={0} width={20} height={26} duration={duration}
    d="M 1 1 L 2 21 L 7 16 L 12 25 L 16 23 L 11 14 L 20 13 Z"
    fill="#161719" stroke={{color:'#ffffff',width:1.5}}
    animate={[track('offsetX',cursor.map(([t,x])=>[t,x])),track('offsetY',cursor.map(([t,,y])=>[t,y]))]}/>);
  for(const [at,x,y] of [[2.34,1176,142],[5.72,816,632],[7.7,746,255],[10.55,790,365],[13.75,1184,674],[16.3,1240,24]]){
    nodes.push(<rect at={at} duration={.42} x={x-13} y={y-13} width={26} height={26} radius={13} fill="#747474"
      animate={[{property:'scale',from:.65,to:1.5,duration:.42,easing:'ease-out'},track('opacity',[[0,.16],[.42,0]])]}/>);
  }

  // Zoom around each task's focal point, keeping lower action buttons in view.
  // Native frame scale uses its top-left origin, so offsets compensate explicitly.
  const camera=[[0,1,640,360],[.7,1,640,360],[4.8,1.07,640,360],
    [6.2,1.045,1000,320],[9.8,1.09,1000,330],[12.8,1.075,1000,600],
    [15.2,1.085,1000,500],[18.5,1,640,360],[20,1,640,360]];
  p.compose(<frame width={1280} height={720} layout="none" duration={duration}
    animate={[
      track('scale',camera.map(([t,s])=>[t,s])),
      track('offsetX',camera.map(([t,s,x])=>[t,(1-s)*x])),
      track('offsetY',camera.map(([t,s,,y])=>[t,(1-s)*y]))
    ]}>{nodes}</frame>,{dur:duration,name:'Smooth Quevian workflow'});
  for(const [label,at] of [['poster',0],['create',4.5],['assign',9.6],['reply',12.8],['posted',15.4],['loop',19.9]]){
    await p.frame(at,'renders/'+label+'.png');
  }
  await p.render('renders/demo-master.mp4',{depth:8,bitrate:4000000,concurrency:2,shards:4});
};
