const state={settings:{},products:[],cart:null,stage:'homepage'};
const $=id=>document.getElementById(id);
const money=value=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(value)||0);
const esc=value=>String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const sessionId=localStorage.getItem('kp_session')||crypto.randomUUID();
localStorage.setItem('kp_session',sessionId);
setTimeout(()=>document.body.classList.add('site-ready'),5000);

function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2400)}
function track(stage){state.stage=stage;fetch('/api/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId,stage})}).catch(()=>{})}
setInterval(()=>track(state.stage),20000);

function setText(id,value){if($(id)&&value!==undefined&&value!==null)$(id).textContent=value}
function applySettings(){
  const s=state.settings; const primary=/^#[0-9a-f]{6}$/i.test(s.theme_primary||'')?s.theme_primary:'#b42318';
  document.documentElement.style.setProperty('--primary',primary);
  setText('announcement',s.announcement);setText('siteName',s.site_name);setText('footerSiteName',s.site_name);
  setText('heroBadge',s.hero_badge);setText('heroTitle',s.hero_title);setText('heroText',s.hero_text);
  setText('trust1',s.trust_1);setText('trust2',s.trust_2);setText('trust3',s.trust_3);
  setText('footerTitle',s.footer_title);setText('footerText',s.footer_text);document.title=s.site_name||'Fırsat Mağazası';
  if(s.logo_url){$('logo').src=s.logo_url;$('logo').hidden=false;$('brandMark').hidden=true}
  if(s.banner_url)$('hero').style.backgroundImage=`url("${String(s.banner_url).replace(/["\\]/g,'')}")`;
  if(s.footer_logo_url){$('footerLogo').src=s.footer_logo_url;$('footerLogo').hidden=false}
  if(s.contact_phone){$('contactPhone').textContent=s.contact_phone;$('contactPhone').href=`tel:${s.contact_phone.replace(/\s/g,'')}`;$('contactPhone').hidden=false}
  if(s.contact_email){$('contactEmail').textContent=s.contact_email;$('contactEmail').href=`mailto:${s.contact_email}`;$('contactEmail').hidden=false}
  $('footerGallery').innerHTML=['footer_image_1','footer_image_2','footer_image_3'].filter(key=>s[key]).map(key=>`<img src="${esc(s[key])}" alt="Kampanya görseli">`).join('');
}

function productCard(p){const sold=Number(p.stock)<=0;return `<article class="product-card">
  <div class="product-media">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.title)}">`:`<span class="product-fallback">${esc(p.title.charAt(0))}</span>`}${p.badge?`<span class="product-badge">${esc(p.badge)}</span>`:''}<span class="stock-tag">${sold?'Stok tükendi':`${p.stock} adet stok`}</span></div>
  <div class="product-info"><h3>${esc(p.title)}</h3><p>${esc(p.short_description)}</p><div class="price-row"><span class="price">${money(p.price)}</span>${Number(p.old_price)>Number(p.price)?`<span class="old-price">${money(p.old_price)}</span>`:''}</div>
  <div class="product-actions"><button class="add-button" data-add="${p.id}" ${sold?'disabled':''}>Sepete Ekle</button><button class="buy-button" data-buy="${p.id}" ${sold?'disabled':''}>Hemen Al</button></div></div></article>`}
function renderProducts(){
  $('productGrid').innerHTML=state.products.length?state.products.map(productCard).join(''):'<p>Şu anda yayında kampanyalı ürün bulunmuyor.</p>';
  document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>addCart(btn.dataset.add,true));
  document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>{addCart(btn.dataset.buy,false);openCheckout()});
}
function addCart(id,open){state.cart=state.products.find(p=>p.id===id)||null;renderCart();track('cart');toast('Ürün sepete eklendi');if(open)openCart()}
function renderCart(){
  $('cartCount').textContent=state.cart?'1':'0';$('cartFooter').hidden=!state.cart;
  if(!state.cart){$('cartBody').innerHTML='<div class="empty-cart"><span>◌</span><b>Sepetiniz henüz boş</b><p>Kampanyalı bir ürün ekleyerek başlayın.</p></div>';return}
  const p=state.cart;$('cartBody').innerHTML=`<div class="cart-item"><div class="cart-item-media">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:'◌'}</div><div><h3>${esc(p.title)}</h3><strong>${money(p.price)}</strong></div><button class="remove-item" id="removeItem" aria-label="Ürünü kaldır">×</button></div>`;
  $('cartTotal').textContent=money(p.price);$('removeItem').onclick=()=>{state.cart=null;renderCart()};
}
function openCart(){$('drawerBackdrop').hidden=false;$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false')}
function closeCart(){$('drawerBackdrop').hidden=true;$('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true')}
function summaryHtml(p){return `<div class="summary-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:'◌'}</div><div><small>SEÇTİĞİNİZ ÜRÜN</small><h3>${esc(p.title)}</h3><strong>${money(p.price)}</strong></div>`}
function openCheckout(){if(!state.cart)return toast('Önce bir ürün seçin');closeCart();$('checkoutSummary').innerHTML=summaryHtml(state.cart);$('checkoutModal').hidden=false;showStep(1);track('address')}
function closeCheckout(){$('checkoutModal').hidden=true;track('homepage')}
function showStep(step){$('personalForm').hidden=step!==1;$('campaignForm').hidden=step!==2;document.querySelectorAll('[data-step-indicator]').forEach(x=>x.classList.toggle('active',Number(x.dataset.stepIndicator)<=step));track(step===1?'address':'campaign')}
async function submitOrder(){
  $('checkoutModal').hidden=true;$('processModal').hidden=false;$('processingState').hidden=false;$('finalState').hidden=true;track('processing');
  const started=Date.now();let response,data;
  try{response=await fetch('/api/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId:state.cart.id,customerName:$('customerName').value,customerPhone:$('customerPhone').value,customerAddress:$('customerAddress').value,requestNo:$('requestNo').value,socialCode:`SK-${$('socialCode').value}`,requestCode:`TK-${$('requestCode').value}`,sessionId})});data=await response.json()}catch{data={error:'network'}}
  const remaining=Math.max(0,1300-(Date.now()-started));await new Promise(r=>setTimeout(r,remaining));
  $('processingState').hidden=true;$('finalState').hidden=false;const ok=response?.ok&&data?.ok;
  $('resultIcon').className=`result-icon${ok?'':' error'}`;$('resultIcon').textContent=ok?'✓':'!';
  const messages={out_of_stock:['Stoklarımız tükenmiştir','Seçtiğiniz ürünün stokları tükendiği için sipariş işleminiz tamamlanamamıştır. İlginiz için teşekkür ederiz.'],invalid_request:['Talep numarası doğrulanamadı','Talep numarası tam olarak 16 rakam olmalıdır. Bilgiyi kontrol ederek yeniden deneyin.'],invalid_social_code:['Avantaj kodu doğrulanamadı','Sosyal medya avantaj kodunu SK-05-32 biçiminde tamamlayın.'],invalid_request_code:['Talep kodu doğrulanamadı','Talep kodunu TK-123 biçiminde tamamlayın.'],network:['Bağlantı kurulamadı','Lütfen internet bağlantınızı kontrol edip yeniden deneyin.']};
  const result=ok?['Talebiniz başarıyla alındı','Sipariş talebiniz kayıt altına alınmıştır. Ekibimiz gerekli kontrollerin ardından sizinle iletişime geçecektir.']:(messages[data?.error]||['İşlem tamamlanamadı','Bilgilerinizi kontrol ederek daha sonra yeniden deneyin.']);
  setText('resultTitle',result[0]);setText('resultText',result[1]);$('resultReference').hidden=!ok;if(ok){$('resultReference').textContent=`Talep No: ${data.orderReference}`;state.cart=null;renderCart()}track('result');
}

$('cartButton').onclick=openCart;$('closeCart').onclick=closeCart;$('drawerBackdrop').onclick=closeCart;$('checkoutFromCart').onclick=openCheckout;$('closeCheckout').onclick=closeCheckout;
$('requestNo').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,16)});
$('socialCode').addEventListener('input',event=>{const digits=event.target.value.replace(/\D/g,'').slice(0,4);event.target.value=digits.length>2?`${digits.slice(0,2)}-${digits.slice(2)}`:digits});
$('requestCode').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,3)});
$('personalForm').onsubmit=e=>{e.preventDefault();showStep(2)};$('backToPersonal').onclick=()=>showStep(1);$('campaignForm').onsubmit=e=>{e.preventDefault();submitOrder()};
$('finishButton').onclick=()=>{$('processModal').hidden=true;$('personalForm').reset();$('campaignForm').reset();track('homepage');scrollTo({top:0,behavior:'smooth'})};
$('year').textContent=new Date().getFullYear();

(async()=>{try{const r=await fetch('/api/public');if(!r.ok)throw new Error();const data=await r.json();state.settings=data.settings||{};state.products=data.products||[];applySettings();renderProducts();track('homepage')}catch{$('productGrid').innerHTML='<p>Ürünler şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.</p>'}finally{document.body.classList.add('site-ready')}})();
