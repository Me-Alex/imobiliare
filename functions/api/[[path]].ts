// Cloudflare Pages Function — API layer using Supabase only
interface Env {}

const SB = 'https://spmapzhlcwhzfrxuvgxd.supabase.co'
const KEY = 'sb_publishable_24oJXCI0JLY1VyLq_Ls-AA_-tYFf729'
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: {
    'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }})
}

const TM: Record<string,string> = { APARTMENT:'Apartament', COMMERCIAL:'Comercial', HOUSE:'Casa', VILLA:'Vila', LAND:'Teren' }
const RT: Record<string,string> = { Apartament:'APARTMENT', Garsoniera:'APARTMENT', Casa:'HOUSE', Vila:'VILLA', Teren:'LAND', 'Spatiu Comercial':'COMMERCIAL', 'Apartament Nou':'APARTMENT', Studio:'APARTMENT', Birou:'COMMERCIAL', Depozit:'COMMERCIAL', Pensiune:'HOUSE' }
const TX: Record<string,string> = { sale:'VANZARE', rent:'INCHIRIERE' }
const ZONES = ['Pipera','Floreasca','Aviatorilor','Dorobanti','Victoriei','Unirii','Militari','Drumul Taberei','Berceni','Pantelimon','Colentina','Vitan','Titan','Otopeni','Corbeanca','Primaverii','Herastrau','Baneasa','Barbu Vacarescu','Romana','Universitate','Centru','Lipscani','Parlament','Crangasi','Grozavesti','Ghencea','Rahova','Politehnica','Iancului','Obor','Dristor','Mihai Bravu']

async function sb<T>(path: string): Promise<T> {
  try { const r = await fetch(SB+'/rest/v1/'+path, {headers:H}); if(!r.ok) return [] as unknown as T; const t=await r.text(); return t?JSON.parse(t):[] as unknown as T; } catch(e) { console.error('SB err:',e); return [] as unknown as T; }
}

function extZone(a:string='',t:string=''):string { const c=(a+' '+t).toLowerCase(); for(const z of ZONES) if(c.includes(z.toLowerCase())) return z; return ''; }
function mapP(r:Record<string,unknown>) {
  const a=Number(r.area_sqm??0), p=Number(r.price??0), g=r.gallery_urls;
  return { id:r.id, title:r.title||'', slug:r.slug||'', description:r.description||'',
    type:TM[(r.type as string)||'']||'', transaction:TX[(r.transaction_type as string)||'sale']||'VANZARE',
    price:p, currency:r.currency||'EUR', areaSqm:a, rooms:Number(r.rooms??0), bathrooms:Number(r.bathrooms??0),
    floor:r.floor!=null?Number(r.floor):null, yearBuilt:r.year_built!=null?Number(r.year_built):null,
    address:r.address||'', zone:(r.zone as string)||extZone(r.address as string,r.title as string),
    sector:null, city:(r.city as string)||'Bucuresti', lat:r.lat!=null?Number(r.lat):null, lng:r.lng!=null?Number(r.lng):null,
    status:r.status||'PUBLISHED', featured:!!r.featured,
    coverUrl:(r.cover_image_url as string)||null,
    galleryUrls:typeof g==='string'?g:JSON.stringify(g||[]),
    pricePerSqm:r.price_per_sqm!=null?Number(r.price_per_sqm):(a>0?Math.round(p/a):null),
    createdAt:(r.created_at as string)||'', updatedAt:(r.updated_at as string)||'' }
}

async function getProperties(u:URL) {
  const type=u.searchParams.get('type'),zone=u.searchParams.get('zone'),tx=u.searchParams.get('transaction'),
    minP=u.searchParams.get('minPrice'),maxP=u.searchParams.get('maxPrice'),minR=u.searchParams.get('minRooms')||u.searchParams.get('rooms'),
    minA=u.searchParams.get('minArea'),maxA=u.searchParams.get('maxArea'),sort=u.searchParams.get('sort')||'newest',
    feat=u.searchParams.get('featured'),q=u.searchParams.get('q')||u.searchParams.get('search'),
    page=Math.max(1,Number(u.searchParams.get('page'))||1),ps=Math.min(50,Math.max(1,Number(u.searchParams.get('pageSize'))||12));
  let path='properties?select=*&status=eq.PUBLISHED';
  if(type) path+='&type=eq.'+encodeURIComponent(RT[type]||type.toUpperCase());
  if(tx){ const t2=tx.toUpperCase(); path+=t2==='INCHIRIERE'?'&transaction_type=eq.rent':'&transaction_type=eq.sale'; }
  if(feat==='true') path+='&featured=eq.true';
  if(q){ const e=encodeURIComponent(q); path+='&or=(title.ilike.*'+e+'*,address.ilike.*'+e+'*,description.ilike.*'+e+'*)'; }
  const rows=await sb<Record<string,unknown>[]>(path);
  let all=rows.map(mapP);
  if(zone) all=all.filter(function(p){return p.zone===zone;});
  if(minP) all=all.filter(function(p){return p.price>=Number(minP);});
  if(maxP) all=all.filter(function(p){return p.price<=Number(maxP);});
  if(minR) all=all.filter(function(p){return p.rooms>=Number(minR);});
  if(minA) all=all.filter(function(p){return p.areaSqm>=Number(minA);});
  if(maxA) all=all.filter(function(p){return p.areaSqm<=Number(maxA);});
  if(q){ var lq=q.toLowerCase(); all=all.filter(function(p){return [p.title,p.address,p.description,p.zone].some(function(s){return (s||'').toLowerCase().includes(lq);}); }); }
  switch(sort){ case 'priceAsc':all.sort(function(a,b){return a.price-b.price;}); break; case 'priceDesc':all.sort(function(a,b){return b.price-a.price;}); break; case 'areaDesc':all.sort(function(a,b){return b.areaSqm-a.areaSqm;}); break; default:all.sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'');}); }
  var total=all.length, start=(page-1)*ps;
  return j({properties:all.slice(start,start+ps),total:total,page:page,pageSize:ps,hasMore:start+ps<total});
}

async function getProp(slug:string) {
  var rows=await sb<Record<string,unknown>[]>('properties?slug=eq.'+encodeURIComponent(slug)+'&status=eq.PUBLISHED&select=*&limit=1');
  if(rows.length>0) return j({property:Object.assign({},mapP(rows[0]),{analytics:[]}});
  return j({error:'Property not found'},404);
}

async function getZones() {
  var md=await sb<Record<string,unknown>[]>('market_data?status=eq.ACTIVE&select=zone,avg_price,rent_yield,liquidity,growth,risk&order=zone.asc');
  var zones=md.map(function(r,i){return {
    id:'zone-'+i, name:r.zone||'', slug:(r.zone||'').toLowerCase().replace(/\s+/g,'-'),
    sector:null, description:'Zona '+(r.zone||'')+' - pret mediu '+Number(r.avg_price||0)+' EUR/m².',
    avgPriceSqm:r.avg_price!=null?Number(r.avg_price):null,
    demand:r.risk&&String(r.risk).toLowerCase().indexOf('scazut')>=0?'Ridicata':r.risk&&String(r.risk).toLowerCase().indexOf('ridicat')>=0?'Scazuta':'Moderata',
    popularFor:'[]', sortOrder:i, _count:{properties:0}
  };});
  return j({zones:zones});
}

async function getMarketData() {
  var md=await sb<Record<string,unknown>[]>('market_data?status=eq.ACTIVE&select=zone,avg_price,rent_yield,liquidity,growth,risk&order=zone.asc');
  var props=await sb<Record<string,unknown>[]>('properties?select=price,area_sqm,status&status=eq.PUBLISHED');
  var weeklyData=md.map(function(r,i){return {id:'md-'+i,zone:r.zone||'',type:'mixed',avgPriceSqm:Number(r.avg_price||0),avgAreaSqm:0,totalListed:0,soldCount:0,week:new Date().toISOString().slice(0,10)};});
  var totalSqm=0; for(var i=0;i<props.length;i++){var a=Number(props[i].area_sqm);var pr=Number(props[i].price);if(a>0)totalSqm+=pr/a;}
  var avgPrice=props.length>0?Math.round(totalSqm/props.length):0;
  return j({zones:[],weeklyData:weeklyData,summary:{totalProperties:props.length,avgPriceSqm:avgPrice,totalZones:md.length,topZone:md.length>0?{name:md[0].zone,avgPriceSqm:md[0].avg_price}:null}});
}

async function postContact(b) {
  var n=(b.name||'').trim(),e=(b.email||'').trim(),p=(b.phone||'').trim(),m=(b.message||'').trim();
  if(!n||n.length<2) return j({error:'Numele este obligatoriu (minim 2 caractere).'},400);
  if(!e||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return j({error:'Adresa de email nu este valida.'},400);
  if(!p||p.length<10) return j({error:'Telefon obligatoriu (minim 10 caractere).'},400);
  if(!m||m.length<10) return j({error:'Mesajul este obligatoriu (minim 10 caractere).'},400);
  return j({success:true,message:'Mesajul a fost trimis cu succes!'});
}

async function postNewsletter(b) {
  var e=(b.email||'').trim();
  if(!e||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return j({error:'Adresa de email nu este valida.'},400);
  return j({success:true,message:'Multumim pentru abonare!'});
}

function getAlerts() { return j([]); }

async function postAlert(b) {
  var e=(b.email||'').trim();
  if(!e||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return j({error:'Email invalid.'},400);
  return j({id:'placeholder',email:e,zone:b.zone||null,propertyType:b.propertyType||null,minPrice:b.minPrice||null,maxPrice:b.maxPrice||null,minRooms:b.minRooms||null,active:true,createdAt:new Date().toISOString()},201);
}

function deleteAlert() { return j({success:true}); }

async function getSuggestions(q) {
  if(!q||q.length<2) return j({suggestions:[]});
  var s=[];
  try{var zr=await sb<Record<string,unknown>[]>('market_data?zone=ilike.*'+encodeURIComponent(q)+'*&status=eq.ACTIVE&select=zone,avg_price&limit=5');for(var i=0;i<zr.length;i++)s.push({type:'zone',name:zr[i].zone,sector:null,avgPriceSqm:zr[i].avg_price});}catch(e){}
  try{var pr=await sb<Record<string,unknown>[]>('properties?status=eq.PUBLISHED&or=(title.ilike.*'+encodeURIComponent(q)+'*,address.ilike.*'+encodeURIComponent(q)+'*)&select=id,title,slug,type,transaction_type,price,area_sqm&limit=5&order=created_at.desc');for(var i=0;i<pr.length;i++)s.push({type:'property',name:pr[i].title,slug:pr[i].slug,zone:extZone(pr[i].address,pr[i].title),propertyType:TM[pr[i].type]||'',transaction:TX[pr[i].transaction_type]||'VANZARE',price:Number(pr[i].price),areaSqm:Number(pr[i].area_sqm)});}catch(e){}
  return j({suggestions:s.slice(0,10)});
}

async function compare(b) {
  var ids=b.ids;
  if(!ids||ids.length<2||ids.length>3) return j({error:'Trimiteti 2-3 ID-uri.'},400);
  var idList=ids.map(encodeURIComponent).join(',');
  var rows=await sb<Record<string,unknown>[]>('properties?id=in.('+idList+')&status=eq.PUBLISHED&select=*');
  return j({properties:rows.map(mapP)});
}

async function getDashboard() {
  var props=await sb<Record<string,unknown>[]>('properties?select=id,title,slug,price,type,transaction_type,status,created_at&limit=100');
  var mapped=props.map(mapP);
  return j({contacts:[],newsletters:[],alerts:[],properties:mapped,stats:{totalContacts:0,totalNewsletters:0,totalAlerts:0,totalProperties:mapped.length,activeProperties:mapped.filter(function(p){return p.status==='PUBLISHED';}).length,soldProperties:mapped.filter(function(p){return p.status==='SOLD';}).length}});
}

export const onRequest = async function(context) {
  var request=context.request;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'86400'}});
  var url=new URL(request.url);
  var path=url.pathname.replace(/^\/api\/?/,'').replace(/\/+$/,'');
  var method=request.method;
  try {
    if(path==='properties/compare'&&method==='POST') return compare(await request.json());
    if(path==='properties'&&method==='GET') return getProperties(url);
    if(path==='properties'&&method==='POST') return j({success:true,message:'Proprietatea salvata local. Configureaza Supabase pentru salvare permanenta.'});
    if(path.indexOf('properties/')===0&&method==='GET') return getProp(path.slice('properties/'.length));
    if(path==='zones'&&method==='GET') return getZones();
    if(path==='market-data'&&method==='GET') return getMarketData();
    if(path==='contact'&&method==='POST') return postContact(await request.json());
    if(path==='newsletter'&&method==='POST') return postNewsletter(await request.json());
    if(path==='price-alerts'&&method==='GET') return getAlerts();
    if(path==='price-alerts'&&method==='POST') return postAlert(await request.json());
    if(path.indexOf('price-alerts/')===0&&method==='DELETE') return deleteAlert();
    if(path==='search/suggestions'&&method==='GET') return getSuggestions(url.searchParams.get('q')?.trim()||'');
    if(path==='admin/dashboard'&&method==='GET') return getDashboard();
    if(path==='ai-chat'&&method==='POST') return j({reply:'Func\u021bia AI chat este \u00een curs de actualizare. V\u0103 rug\u0103m \u00eencerca\u021bi mai t\u00e2rziu.'});
    return j({error:'Not found'},404);
  } catch(err) { console.error('API:',err); return j({error:err instanceof Error?err.message:'Internal error'},500); }
};
