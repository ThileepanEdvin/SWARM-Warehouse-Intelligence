import { useEffect, useId, useRef, useState } from 'react';
import { Minus, Plus, Maximize2, Route, Grid2X2, Hand } from 'lucide-react';

import type { SimulationState, Point } from './engine';
import { robotStates } from './presentation';

export type Camera={zoom:number;x:number;y:number};
type Props = { guidance?:string;showLocations?:boolean;highlighted?:string[];onCell?:(x:number,y:number)=>void; camera?:Camera;setCamera?:(update:(value:Camera)=>Camera)=>void; speed: number; playing: boolean; state: SimulationState; selected: string | null; select: (id: string | null) => void; tool: string; onPlace: (x: number, y: number) => void; compact?: boolean };
const colors = ['#cef486', '#75d7e5', '#b7a0ee', '#f3be80', '#ed9dab', '#97c9ff'];
const productColors: Record<string, string> = { A: '#89b9d9', B: '#b6a2d9', C: '#d5b488' };
function Carton({ x = 0, y = 0, opacity = 1 }: { x?: number; y?: number; opacity?: number }) {
  return <g className="carton" transform={`translate(${x} ${y})`} opacity={opacity}><path d="M -10 -6 L 0 -11 L 10 -6 V 7 L 0 12 L -10 7 Z" fill="#cf9d5d" stroke="#f0c791"/><path d="M -10 -6 L 0 -1 L 10 -6 M 0 -1 V 12" fill="none" stroke="#f8dcaf"/><path d="M -4 -9 L 6 -4 V 1" fill="none" stroke="#f5d1a0" strokeWidth="3"/></g>;
}

export default function Warehouse({ state, selected, select, tool, onPlace, speed, playing, compact = false, camera, setCamera,showLocations=false,highlighted=[],onCell,guidance }: Props) {
  const uid = useId().replace(/:/g, '');
  const [localZoom, setLocalZoom] = useState(1), [localPan, setLocalPan] = useState({ x: 0, y: 0 });
  const zoom=camera?.zoom??localZoom,pan=camera?{x:camera.x,y:camera.y}:localPan;
  const setZoom=(value:number|((n:number)=>number))=>{if(setCamera)setCamera(c=>({...c,zoom:typeof value==='number'?value:value(c.zoom)}));else setLocalZoom(value)};
  const setPan=(value:{x:number;y:number})=>{if(setCamera)setCamera(c=>({...c,...value}));else setLocalPan(value)};
  const [allRoutes, setAllRoutes] = useState(false), [grid, setGrid] = useState(false), [hand, setHand] = useState(false), [hover, setHover] = useState('');
  const [hoveredShelf,setHoveredShelf]=useState<string|null>(null);const hovered=state.tiles.find(t=>t.id===hoveredShelf);const reserved=hovered?state.robots.filter(r=>r.shelfId===hovered.id&&!r.cargo&&r.orderId).length:0;
  const drag = useRef<{ x: number; y: number; px: number; py: number; scale: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragged = useRef(false);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (event: WheelEvent) => { event.preventDefault(); setZoom(value => Math.min(3, Math.max(.6, value - event.deltaY * .001))); };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, [setCamera]);
  const size = 40, w = state.width * size, h = state.height * size;
  const points = (path: Point[]) => path.map(p => `${p.x * size + 20},${p.y * size + 20}`).join(' ');
  const selectedRobot = state.robots.find(r => r.id === selected);
  const recent = (state.signals ?? []).filter(signal => state.tick - signal.tick < 10);
  return <div className={`warehouse-view premium-map ${compact ? 'compact-map' : ''} ${playing ? '' : 'map-paused'}`}>
    <div className="map-caption"><span className="live-dot"/>{playing ? 'OPÉRATIONS EN DIRECT' : 'SIMULATION EN PAUSE'}{!compact && <span className="muted">{guidance??'Sélectionnez un robot pour comprendre sa mission'}</span>}</div>
    <svg ref={svgRef} className={`warehouse-svg ${tool !== 'select' ? 'placement' : ''} ${hand ? 'hand-camera' : ''}`} viewBox={`-18 -44 ${w + 36} ${h + 86}`} role="img" aria-label="Entrepôt interactif"
      onPointerDown={e => { dragged.current = false; if (hand || e.button === 1 || e.altKey) { drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, scale: 1 / (e.currentTarget.getScreenCTM()?.a ?? 1) }; e.currentTarget.setPointerCapture(e.pointerId); } }}
      onPointerMove={e => { if (drag.current) { const { x, y, px, py, scale } = drag.current; if (Math.abs(e.clientX - x) + Math.abs(e.clientY - y) > 4) dragged.current = true; setPan({ x: px + (e.clientX - x) * scale, y: py + (e.clientY - y) * scale }); } }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <defs>
        <pattern id={`grid-${uid}`} width={size} height={size} patternUnits="userSpaceOnUse"><rect width={size} height={size} fill="#192129"/><path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={grid ? '#35424e' : '#232e37'} strokeWidth={grid ? '.8' : '.3'}/></pattern>
        <pattern id={`hazard-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#3c3429"/><rect width="5" height="12" fill="#d8ad60"/></pattern>
        <linearGradient id={`rack-${uid}`} x2="0" y2="1"><stop stopColor="#526070"/><stop offset="1" stopColor="#2a3442"/></linearGradient>
        <filter id={`shadow-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity=".45"/></filter>
      </defs>
      <g transform={`translate(${pan.x} ${pan.y}) translate(${w / 2} ${h / 2}) scale(${zoom}) translate(${-w / 2} ${-h / 2})`}>
        <rect x="-5" y="-5" width={w + 10} height={h + 10} rx="10" fill="#10171d" stroke="#3d4b57"/><rect width={w} height={h} rx="8" fill={`url(#grid-${uid})`}/>
        <g pointerEvents="none"><rect x="8" y="8" width="108" height={h - 16} rx="8" fill="#94d6a108" stroke="#91c9972b" strokeDasharray="5 6"/><rect x={w - 108} y="8" width="100" height={h - 16} rx="8" fill="#8cbcff08" stroke="#8cbcff2b" strokeDasharray="5 6"/><text x="60" y="-17" textAnchor="middle" className="zone-label charging-label">RECHARGE</text><text x={w / 2} y="-17" textAnchor="middle" className="zone-label">STOCKAGE & PRÉPARATION</text><text x={w - 60} y="-17" textAnchor="middle" className="zone-label dispatch-label">EXPÉDITION</text>{[1, 6, 10, 14].map(y => <path key={y} d={`M 155 ${y * size + 20} H ${w - 128}`} stroke="#9aaeb009" strokeWidth="15" strokeDasharray="14 25"/>)}</g>
        {Array.from({ length: state.width * state.height }, (_, i) => <rect key={i} x={(i % state.width) * size} y={Math.floor(i / state.width) * size} width={size} height={size} fill="transparent" className="floor-hit" onClick={() => { if (dragged.current || hand) return; if(onCell){onCell(i % state.width,Math.floor(i / state.width));return;}if (tool === 'select') select(null); else onPlace(i % state.width, Math.floor(i / state.width)); }}/>) }
        {state.tiles.map(t => {
          const label = t.kind === 'shelf' ? `${t.location} · ${state.products?.find(p => p.sku === t.sku)?.name} · total ${t.stock} · réservé ${state.robots.filter(r=>r.shelfId===t.id&&!r.cargo&&r.orderId).length} · disponible ${(t.stock??0)-state.robots.filter(r=>r.shelfId===t.id&&!r.cargo&&r.orderId).length} · capacité ${t.capacity} · prioritaire ${state.robots.find(r=>r.id===t.priorityRobot)?.code??'aucun'} · autorisés ${t.allowedRobots?t.allowedRobots.map(id=>state.robots.find(r=>r.id===id)?.code).join(', ')||'aucun':'tous'}` : t.kind === 'charger' ? 'Station de recharge · un robot à la fois' : t.kind === 'depot' ? 'Dépôt d’expédition · déchargement des colis' : 'Obstacle · passage fermé';
          return <g key={t.id} transform={`translate(${t.x * size} ${t.y * size})`} className={`tile tile-${t.kind}`} onMouseEnter={() => {if(t.kind==='shelf'){setHoveredShelf(t.id);setHover('')}else setHover(label)}} onMouseLeave={() => {setHover('');setHoveredShelf(null)}} onClick={e => { e.stopPropagation(); if (dragged.current || hand) return; if (tool === 'select') select(t.id); else onPlace(t.x, t.y); }}><title>{label} · {t.id} · cellule {t.x + 1}, {t.y + 1}</title>
            {(selected === t.id||highlighted.includes(t.id)) && <rect x="-2" y="-2" width="44" height="44" rx="6" fill="#c6f36712" stroke="#d1f66c"/>}
            {t.kind==='shelf'&&showLocations&&<g className="shelf-label"><rect x="0" y="-11" width="40" height="14" rx="3" fill="#101a22" stroke="#8baca050"/><text x="20" y="0" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e7f0dd">{t.location}</text></g>}{t.kind === 'shelf' ? <><rect x="4" y="6" width="32" height="31" rx="3" fill="#0b1116"/><rect x="3" y="2" width="34" height="32" rx="3" fill={`url(#rack-${uid})`} stroke="#75889a"/><path d="M 7 15 H 33 M 7 28 H 33 M 5 4 V 33 M 35 4 V 33" stroke="#8a9caf" strokeWidth="1.7"/>{(t.stock ?? 0) > 0 && [0, 1, 2, 3].map(i => <g key={i} transform={`translate(${9 + i % 2 * 14} ${5 + Math.floor(i / 2) * 13})`}><rect width="10" height="8" rx="1" fill={(state.products?.find(p=>p.sku===t.sku)?.color??productColors[t.sku ?? 'A'])}/><path d="M 5 0 V 8" stroke="#e8e4d175" strokeWidth="2"/></g>)}<rect x="7" y="32" width="26" height="2" rx="1" fill={(state.products?.find(p=>p.sku===t.sku)?.color??productColors[t.sku ?? 'A'])}/></>
              : t.kind === 'charger' ? <><rect x="3" y="3" width="34" height="34" rx="8" fill="#22392e" stroke="#7cbf91"/><path d="M 5 11 V 6 H 11 M 29 6 H 35 V 11 M 35 29 V 34 H 29 M 11 34 H 5 V 29" fill="none" stroke="#bce69b" strokeWidth="2"/><path d="M 22 9 L 14 22 H 21 L 18 31 L 27 17 H 21 Z" fill="#bff084"/></>
                : t.kind === 'depot' ? <><rect x="2" y="2" width="36" height="36" rx="5" fill="#243c53" stroke="#86b4d8"/><path d="M 6 7 H 34 M 6 14 H 34 M 6 21 H 34 M 6 28 H 34 M 6 35 H 34" stroke="#597e9b" strokeWidth="2"/><path d="M 10 20 H 30 M 24 14 L 30 20 L 24 26" stroke="#d0e5f5" strokeWidth="2.5" fill="none"/></>
                  : <><rect x="2" y="3" width="36" height="33" rx="3" fill={`url(#hazard-${uid})`} stroke="#d4b176"/><rect x="10" y="12" width="20" height="13" rx="2" fill="#343636"/><path d="M 15 15 L 25 22 M 25 15 L 15 22" stroke="#eacb91" strokeWidth="2"/></>}
          </g>;
        })}
        {selectedRobot?.previousRoute && state.tick - selectedRobot.previousRoute.tick < 24 && <polyline className="old-route" points={points(selectedRobot.previousRoute.path)} fill="none" stroke="#f3987f" strokeOpacity=".65" strokeWidth="3" strokeDasharray="5 7" pointerEvents="none"/>}
        {state.robots.map((r, i) => ((selected === r.id||highlighted.includes(r.id)) || allRoutes) && r.path.length > 0 && <g key={`route-${r.id}`} pointerEvents="none"><polyline className="current-route" points={points([r, ...r.path])} fill="none" stroke={selected===r.id?'#cef486':colors[i % colors.length]} strokeOpacity={(selected === r.id||highlighted.includes(r.id)) ? '.9' : '.3'} strokeWidth={(selected === r.id||highlighted.includes(r.id)) ? 3 : 1.5} strokeDasharray="6 7"/><circle cx={r.path.at(-1)!.x * size + 20} cy={r.path.at(-1)!.y * size + 20} r="7" fill="none" stroke={selected===r.id?'#cef486':colors[i % colors.length]} strokeWidth="2"/></g>)}
        {state.robots.map((r, i) => {
          const color = r.state === 'fault' ? '#ed8b83' : colors[i % colors.length];
          const shelf = state.tiles.find(t => t.id === r.shelfId), phase = (3 - r.timer) / 3;
          return <g key={r.id} data-state={r.state} data-robot-id={r.id} transform={`translate(${r.x * size + 20} ${r.y * size + 20})`} className={`robot robot-${r.state} ${r.battery < 20 ? 'robot-low' : ''} ${r.waitingNow?'robot-delayed':''}`} style={{ transitionDuration: playing ? `${430 / speed}ms` : '0ms' }} onMouseEnter={() => setHover(`${r.code??r.id} · ${robotStates[r.state]} · batterie ${r.battery.toFixed(0)} %`)} onMouseLeave={() => setHover('')} onClick={e => { e.stopPropagation(); if (!dragged.current && !hand) select(r.id); }} filter={`url(#shadow-${uid})`}><title>{r.id} · {robotStates[r.state]} · batterie {r.battery.toFixed(0)} %</title>
            {(selected === r.id||highlighted.includes(r.id)) && <circle r="23" className="selection-ring" fill={`${color}12`} stroke={color} strokeWidth="1.4" strokeDasharray="4 4"/>}{r.state === 'charging' && <circle r="21" className="charge-ring" fill="none" stroke="#a3e899" strokeWidth="2" strokeDasharray="8 5"/>}
            <rect x="-18" y="-9" width="5" height="18" rx="2" fill="#080d12"/><rect x="13" y="-9" width="5" height="18" rx="2" fill="#080d12"/><rect x="-15" y="-15" width="30" height="30" rx="9" fill={color} stroke="#e5f3eb65"/><rect x="-10" y="-8" width="20" height="17" rx="5" fill="#24313a" stroke="#13202b"/><path transform={`rotate(${r.orientation * 180 / Math.PI})`} d="M 9 -3 L 14 0 L 9 3 Z" fill="#fcffdc"/><rect x="-7" y="-13" width="14" height="3" rx="1.5" fill="#15342d"/><circle cx="-3" cy="-11.5" r="1" fill="#edffd8"/><circle cx="3" cy="-11.5" r="1" fill="#edffd8"/>
            {!r.cargo && r.state !== 'loading' && <text y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{(r.code??r.id).slice(-2)}</text>}
            {r.state === 'loading' && shelf && <g className="handling-cargo" transform={`translate(${(shelf.x - r.x) * size * (1 - phase)} ${(shelf.y - r.y) * size * (1 - phase)})`} style={{ transition: `transform ${playing ? 430 / speed : 0}ms linear` }}><Carton opacity={.65 + phase * .35}/></g>}
            {r.cargo > 0 && <Carton x={r.state === 'unloading' ? phase * 17 : 0} y={r.state === 'unloading' ? -phase * 6 : 0}/>}
            {(['waiting', 'blocked', 'fault', 'charging'].includes(r.state)||r.waitingNow) && <g className="state-indicator"><circle cx="15" cy="-17" r="7" fill={r.state === 'fault' ? '#b64f48' : '#2c443a'} stroke={color}/><text x="15" y="-14" textAnchor="middle" fill="#fff" fontSize="10">{r.state === 'fault' ? '!' : r.state === 'charging' ? 'ϟ' : 'Ⅱ'}</text></g>}
            {((selected === r.id||highlighted.includes(r.id)) || r.battery < 20) && <><rect x="-14" y="22" width="28" height="3" rx="1.5" fill="#45505a"/><rect className="battery-fill" x="-14" y="22" width={28 * r.battery / 100} height="3" rx="1.5" fill={r.battery < 20 ? '#ee8c71' : '#c9ef8b'}/></>}
          </g>;
        })}
        {recent.filter(s => s.kind === 'delivery').map(s => <g key={s.id} className="delivery-package" data-signal="delivery" transform={`translate(${s.x * size + 20 + Math.min(28, (state.tick - s.tick) * 4)} ${s.y * size + 20})`} opacity={Math.max(0, 1 - (state.tick - s.tick) / 10)} pointerEvents="none"><Carton/></g>)}
        {recent.filter(s => s.kind === 'reward').map(s => <g key={s.id} data-signal="reward" transform={`translate(${s.x * size + 15} ${s.y * size - 15 - (state.tick - s.tick) * 3})`} opacity={Math.max(0, 1 - (state.tick - s.tick) / 10)} pointerEvents="none"><rect x="-20" y="-13" width="85" height="23" rx="10" fill="#243e2d" stroke="#a6d977"/><text fontSize="12" fontWeight="600" fill="#d2f796">+{s.amount} €</text></g>)}
      </g>
    </svg>
    {hovered&&<div className="shelf-tooltip" role="tooltip"><strong>Rayonnage {hovered.location}</strong>{!(hovered.stock??0)?<p>Emplacement vide</p>:<><p>Produit : {state.products?.find(p=>p.sku===hovered.sku)?.name}</p><p>Stock total : {hovered.stock} · Disponible : {(hovered.stock??0)-reserved}</p><p>Réservé : {reserved} · Capacité : {hovered.capacity}</p><p>Prioritaire : {state.robots.find(r=>r.id===hovered.priorityRobot)?.code??'aucun'}</p><p>Accès : {hovered.allowedRobots?hovered.allowedRobots.map(id=>state.robots.find(r=>r.id===id)?.code).join(', ')||'aucun':'tous les robots'}</p></>}</div>}{!hovered&&(hover || selectedRobot) && <div className="map-hover">{hover || `${selectedRobot!.code??selectedRobot!.id} · ${robotStates[selectedRobot!.state]} · ${selectedRobot!.path.length} m restants`}{selectedRobot?.previousRoute && state.tick - selectedRobot.previousRoute.tick < 24 && <span><i className="route-old-dot"/>Ancien trajet <i className="route-new-dot"/>Nouveau trajet</span>}</div>}
    <div className="map-bottom"><div className="legend"><span><i style={{ background: '#b5d98b' }}/>Recharge</span><span><i style={{ background: '#a9a6c9' }}/>Produits</span><span><i style={{ background: '#8cbcff' }}/>Expédition</span></div><div className="map-controls"><button title="Déplacer la caméra" className={hand ? 'selected' : ''} onClick={() => setHand(!hand)}><Hand size={16}/></button><button title="Afficher la grille" className={grid ? 'selected' : ''} onClick={() => setGrid(!grid)}><Grid2X2 size={16}/></button><button title="Afficher les itinéraires" className={allRoutes ? 'selected' : ''} onClick={() => setAllRoutes(!allRoutes)}><Route size={16}/></button><span className="divider"/><button title="Réduire" onClick={() => setZoom(v => Math.max(.6, v - .15))}><Minus size={16}/></button><span>{Math.round(zoom * 100)}%</span><button title="Agrandir" onClick={() => setZoom(v => Math.min(3, v + .15))}><Plus size={16}/></button><button title="Recentrer" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 size={16}/></button></div></div>
  </div>;
}
