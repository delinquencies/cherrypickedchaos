const PRODUCTS = [
  {id:'jacket',name:'Chainstitch Embroidered Denim Jacket',category:'wear',label:'Vintage Wear',price:185,description:'1970s-inspired Western floral chainstitch on well-worn denim.',image:'assets/jacket.webp'},
  {id:'crock',name:'Texas Salt-Glazed Stoneware Crock',category:'stoneware',label:'Texas Stoneware',price:145,description:'Cobalt-blue folk floral details and historic mercantile character.',image:'assets/crock.webp'},
  {id:'sign',name:'Vintage Texas Gasoline Porcelain Sign',category:'americana',label:'Americana & Signs',price:320,description:'Weathered roadside style with collectible Texas character.',image:'assets/sign.webp'},
  {id:'bowl',name:'Primitive Pine Dough Bowl & Scoop',category:'primitives',label:'Primitives & Bowls',price:210,description:'Rustic hand-carved wood with a warm aged patina.',image:'assets/bowl.webp'}
];
// Illustrative products and pricing from the exported Stitch mockup. They are not verified inventory.
const currency = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
let bag; try{bag=JSON.parse(localStorage.getItem('cpc-demo-bag')||'[]'); if(!Array.isArray(bag))bag=[]}catch{bag=[]}
bag = [...new Set(bag.filter(id => PRODUCTS.some(p => p.id === id)))];
let activeFilter='all';
function persist(){try{localStorage.setItem('cpc-demo-bag',JSON.stringify(bag))}catch{}document.querySelectorAll('[data-bag-count]').forEach(x=>x.textContent=bag.length)}
function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('visible'),3200)}
function addBag(id,source){
  if(bag.includes(id)){toast('Already in your little preview bag — no item reserved.');return}
  bag.push(id);persist();renderCart();
  const bagButton=document.querySelector('[data-open-bag]');
  if(bagButton){bagButton.classList.remove('bag-pop');void bagButton.offsetWidth;bagButton.classList.add('bag-pop');}
  cherryBurst(source);
  toast('A sweet little find for your demo bag! No item reserved.');
}
function removeBag(id){bag=bag.filter(x=>x!==id);persist();renderCart()}
function renderProducts(){let out=document.querySelector('#product-grid');if(!out)return;const shown=PRODUCTS.filter(p=>activeFilter==='all'||activeFilter===p.category);out.innerHTML=shown.map(p=>`<article class="product-card" tabindex="-1" aria-label="Sample find: ${p.name}"><div class="visual"><img src="${p.image}" alt="Illustrative photograph: ${p.name}" loading="lazy"><span class="sample">Sample listing</span></div><div class="details"><span class="meta">${p.label}</span><h3>${p.name}</h3><p>${p.description}</p><div class="price-line"><span class="price">${currency(p.price)}<small>Illustrative price</small></span><button class="btn btn-primary btn-sm" data-add="${p.id}">Add to demo bag</button></div></div></article>`).join('');out.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>addBag(btn.dataset.add,btn)))}
function renderCart(){const list=document.getElementById('cart-items'),total=document.getElementById('cart-total');if(!list)return;const selected=bag.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean);list.innerHTML=selected.length?selected.map(p=>`<div class="cart-row"><img src="${p.image}" alt=""><div><h3>${p.name}</h3><span class="muted">Illustrative listing</span><br><button class="remove" data-remove="${p.id}">Remove</button></div><strong>${currency(p.price)}</strong></div>`).join(''):'<div class="cart-empty">A little empty in here!<br><br>Find a sample treasure to tuck away. Nothing is reserved.</div>';total.textContent=currency(selected.reduce((s,p)=>s+p.price,0));list.querySelectorAll('[data-remove]').forEach(x=>x.addEventListener('click',()=>removeBag(x.dataset.remove)))}
let cartOpener;
function toggleCart(open) {
  const drawer = document.getElementById('cart-drawer');
  if (!open && !drawer.classList.contains('open')) return;
  if (open) cartOpener = document.activeElement;
  drawer.inert = !open;
  drawer.setAttribute('aria-hidden', String(!open));
  document.getElementById('cart-scrim').classList.toggle('open', open);
  drawer.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  document.querySelectorAll('header, main, footer').forEach(el => el.inert = open);
  if (open) { renderCart(); drawer.querySelector('button').focus(); }
  else cartOpener?.focus();
}
document.addEventListener('DOMContentLoaded', () => {
  persist(); renderProducts(); renderCart();
  const drawer = document.getElementById('cart-drawer');
  drawer.inert = true;
  document.querySelectorAll('[data-open-bag]').forEach(x => x.addEventListener('click', () => toggleCart(true)));
  document.querySelectorAll('[data-close-bag]').forEach(x => x.addEventListener('click', () => toggleCart(false)));
  document.addEventListener('keydown', e => {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') toggleCart(false);
    if (e.key === 'Tab') {
      const controls = [...drawer.querySelectorAll('button, a[href], input, [tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.filter === activeFilter));
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(x => {
        x.classList.toggle('active', x === btn); x.setAttribute('aria-pressed', String(x === btn));
      });
      renderProducts();
    });
  });
  document.getElementById('lucky-pick')?.addEventListener('click', pickSurprise);
});


function cherryBurst(button){
  if(!button||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const rect=button.getBoundingClientRect();
  const centerX=rect.left+rect.width/2,centerY=rect.top+rect.height/2;
  for(let i=0;i<4;i++){
    const img=document.createElement('img');img.src='assets/cherries.svg';img.alt='';img.className='cherry-burst';img.setAttribute('aria-hidden','true');
    img.style.left=(centerX+(i-1.5)*8)+'px';img.style.top=(centerY-9)+'px';
    img.style.setProperty('--dx',((i-1.5)*38)+'px');
    img.style.setProperty('--dy',(-100-15*(i%2))+'px');
    img.style.setProperty('--turn',((i-1.5)*100)+'deg');
    img.style.animationDelay=(i*40)+'ms';
    document.body.append(img);setTimeout(()=>img.remove(),1050);
  }
}
function pickSurprise(){
  activeFilter='all';
  document.querySelectorAll('[data-filter]').forEach(btn=>{
    const selected=btn.dataset.filter==='all';btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));
  });
  renderProducts();
  const index=Math.floor(Math.random()*PRODUCTS.length);
  const picked=PRODUCTS[index];
  const card=document.querySelectorAll('#product-grid .product-card')[index];
  if(!card)return;
  document.querySelectorAll('.lucky-glow').forEach(x=>x.classList.remove('lucky-glow'));
  card.classList.add('lucky-glow');
  card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  card.focus({preventScroll:true});
  toast('Your lucky sample find: '+picked.name+'!');
  setTimeout(()=>card.classList.remove('lucky-glow'),3100);
}
