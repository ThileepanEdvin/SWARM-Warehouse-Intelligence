export type Point = { x: number; y: number };
const key = (p: Point) => `${p.x},${p.y}`;
const distance = (a: Point, b: Point) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
/** Four-neighbour A*, deterministic ties and no corner cutting. Returned path excludes start. */
export function findPath(start: Point, goal: Point, width: number, height: number, blocked: Set<string>): Point[] | null {
  if (key(start) === key(goal)) return [];
  if (blocked.has(key(goal))) return null;
  const open: Point[] = [start], scores = new Map([[key(start),0]]), parent = new Map<string,Point>();
  const closed = new Set<string>();
  while(open.length) {
    open.sort((a,b)=>(scores.get(key(a))!+distance(a,goal))-(scores.get(key(b))!+distance(b,goal)));
    const current = open.shift()!; const ck = key(current);
    if (ck===key(goal)) { const path: Point[]=[]; let node=current; while(key(node)!==key(start)) { path.unshift(node); node=parent.get(key(node))!; } return path; }
    if(closed.has(ck)) continue; closed.add(ck);
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const next={x:current.x+dx,y:current.y+dy}, nk=key(next);
      if(next.x<0||next.y<0||next.x>=width||next.y>=height||blocked.has(nk)||closed.has(nk)) continue;
      const g=scores.get(ck)!+1;
      if(g<(scores.get(nk)??Infinity)) { scores.set(nk,g);parent.set(nk,current);open.push(next); }
    }
  }
  return null;
}

