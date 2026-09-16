// Higgsfield Higgsedit composition. Run after cropping captures to 1280x720.
export default async ({project}) => {
  const p=await project({dir:'quevian-demo',size:'1280x720',fps:30,background:'#ffffff'});
  const names=['01-queue','02-create','03-status','04-assign','05-reply','06-posted','07-updated-queue'];
  const shots=await Promise.all(names.map(n=>p.add('frames/'+n+'.png')));
  const duration=20;
  p.compose(<media file={shots[0]} x={0} y={0} width={1280} height={720} fit="contain"/>,{at:0,dur:duration,name:'Opening queue and loop bed'});
  const scenes=[{index:1,at:2.8,dur:3.2},{index:2,at:6,dur:2.5},{index:3,at:8.5,dur:2.5},{index:4,at:11,dur:3},{index:5,at:14,dur:3},{index:6,at:17,dur:2.6}];
  for(const s of scenes){
    const opacity=[{at:0,value:0},{at:0.12,value:1},{at:s.dur-(s.index===6?0.6:0.001),value:1},{at:s.dur,value:s.index===6?0:1}];
    p.compose(<media file={shots[s.index]} x={0} y={0} width={1280} height={720} fit="contain" animate={[{property:'opacity',keyframes:opacity}]}/>,{at:s.at,dur:s.dur,name:names[s.index]});
  }
  const gestures=[
    {at:0,dur:2.8,from:[940,430],to:[1175,142]},
    {at:2.8,dur:3.2,from:[540,180],to:[815,630]},
    {at:6,dur:2.5,from:[820,223],to:[750,255]},
    {at:8.5,dur:2.5,from:[810,300],to:[790,366]},
    {at:11,dur:3,from:[900,580],to:[1180,674]},
    {at:14,dur:3,from:[1190,640],to:[1240,24]}
  ];
  for(const g of gestures){
    const travel=g.dur-0.4;
    const animate=[
      {property:'offsetX',keyframes:[{at:0,value:g.from[0]},{at:0.45,value:g.from[0]},{at:travel,value:g.to[0],easing:'house'}]},
      {property:'offsetY',keyframes:[{at:0,value:g.from[1]},{at:0.45,value:g.from[1]},{at:travel,value:g.to[1],easing:'house'}]}
    ];
    p.compose(<path d="M 1 1 L 2 24 L 8 18 L 13 29 L 18 26 L 12 16 L 23 15 Z" width={24} height={30} x={0} y={0} fill="#101113" stroke={{color:'#ffffff',width:1.8}} animate={animate}/>,{at:g.at,dur:g.dur,name:'Cursor '+g.at});
    p.compose(<rect x={g.to[0]-17} y={g.to[1]-17} width={34} height={34} radius={17} fill="#6b7280" opacity={0.18} animate={[{property:'scale',from:0.6,to:1.5,duration:0.3},{property:'opacity',from:0.2,to:0,duration:0.3}]}/>,{at:g.at+g.dur-0.3,dur:0.3,name:'Click '+g.at});
  }
  await p.frame(1,'renders/poster.png');
  await p.render('renders/demo-master.mp4',{depth:8,bitrate:2500000,concurrency:2,shards:4});
};
