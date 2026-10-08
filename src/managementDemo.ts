import {Engine} from './engine';
/** Reproducible presentation sandbox. The caller retains the user's live game. */
export function createManagementDemo(){const e=new Engine(42);e.state.orders=[];
 e.createProduct('Coca-Cola','COCA',12);e.createProduct('Fanta','FANTA',10);
 for(const t of e.state.tiles.filter(t=>['A-1','A-2','A-4'].includes(t.location??'')))e.adjustStock(t.id,-(t.stock??0));
 return e;
}
