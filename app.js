// Aura — app.js
// Client-side UI logic, quiz and simple AI-like recommendation engine (mock)

const state = {
  products: [],
  filters: {
    category: 'all',
    budget: 'any',
    ingredient: 'any'
  },
  user: {},
  // UI state for recommendations
  recommendShowAll: true,
  scoredResults: null,
  // show all products in grid (ignore filters)
  showAllProducts: false
};

// Utilities
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

async function loadProducts(){
  try{
    const res = await fetch('data/products.json');
    state.products = await res.json();
  }catch(e){
    console.error('Failed to load products.json', e);
    state.products = [];
  }
}

function formatPrice(p){
  const num = typeof p === 'number' ? p : (parseFloat(p) || 0);
  // Display as Indian Rupees symbol; values are treated as rupee amounts
  try{
    return '₹' + num.toLocaleString('en-IN', {maximumFractionDigits: 2});
  }catch(e){
    return '₹' + num;
  }
}

// Render product grid
function renderProducts(){
  const grid = $('#product-grid');
  grid.innerHTML='';
  // If the "show all" toggle is active, ignore filters and show every product
  let items = [];
  if(state.showAllProducts){
    items = state.products;
  }else{
    items = state.products.filter(p => {
      if(state.filters.category !== 'all' && p.category !== state.filters.category) return false;
      if(state.filters.ingredient !== 'any' && (!p.certifications || !p.certifications.includes(state.filters.ingredient))) return false;
      if(state.filters.budget !== 'any'){
        const b = state.filters.budget;
        if(b==='0-25' && p.price>25) return false;
        if(b==='25-75' && (p.price<25 || p.price>75)) return false;
        if(b==='75-200' && (p.price<75 || p.price>200)) return false;
        if(b==='200+' && p.price<200) return false;
      }
      return true;
    });
  }

  if(items.length===0){
    grid.innerHTML='<div class="summary">No products match your filters.</div>';
    return;
  }

  items.forEach(p=>{
    const el = document.createElement('div'); el.className='product-card reveal';
    el.innerHTML = `
      <div class="card-image"><img src="${p.image}" alt="${p.name}"/></div>
      <div class="card-body">
        <div class="card-title">${p.name}</div>
        <div class="card-meta">${p.brand} • <span class="price">${formatPrice(p.price)}</span></div>
        <div class="card-meta">${p.benefits ? p.benefits.slice(0,2).join(' • ') : ''}</div>
      </div>
    `;
    el.addEventListener('click', ()=>openProductModal(p));
    grid.appendChild(el);
  });
  runReveal();
}

// Modal for product details
function openProductModal(p){
  const modal = $('#product-modal');
  const body = $('#modal-body');
  body.innerHTML = `
    <div class="modal-body">
      <div><img src="${p.image}" alt="${p.name}"/></div>
      <div>
        <h3>${p.name}</h3>
        <div class="card-meta">${p.brand} • <strong>${formatPrice(p.price)}</strong></div>
        <h4>Benefits</h4>
        <ul>${p.benefits.map(b=>`<li>${b}</li>`).join('')}</ul>
        <h4>Ingredients</h4>
        <div class="card-meta">${p.ingredients.join(', ')}</div>
        <h4>Who it's for</h4>
        <div class="card-meta">${p.suitable_for ? p.suitable_for.join(', ') : 'General'}</div>
        <h4>How to use</h4>
        <div class="card-meta">${p.how_to_use}</div>
        <h4>AI Explanation</h4>
        <div class="card-meta">${generateRecommendationSummary(p, state.user)}</div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function closeModal(){
  $('#product-modal').classList.add('hidden');
}

// Simple mock "AI" that scores product suitability and explains.
function generateRecommendationSummary(product, user){
  // This is a mock: in a real app we'd call a backend LLM with user+product.
  const reasons = [];
  if(!user || Object.keys(user).length===0) return 'General recommendation based on product benefits and certifications.';
  if(user.skinType && product.suitable_for && product.suitable_for.includes(user.skinType)) reasons.push('Formulated for your skin type');
  if(user.ingredientPref && product.certifications && product.certifications.includes(user.ingredientPref)) reasons.push(`${user.ingredientPref} friendly`);
  if(user.budget && user.budget==='low' && product.price<=30) reasons.push('Fits your budget');
  if(user.concerns && product.concerns && user.concerns.some(c=>product.concerns.includes(c))) reasons.push('Targets your main concern');
  if(reasons.length===0) return 'Good general match — explore details to confirm fit.';
  return reasons.join('; ') + '.';
}

// Quiz: collects user inputs multi-step
const quizSteps = [
  {id:'skinType', q:'What is your skin type?', type:'select', options:['oily','dry','combination','sensitive','acne-prone']},
  {id:'skinTone', q:'Skin tone (broad)?', type:'select', options:['light','medium','tan','deep']},
  {id:'ageRange', q:'Age range', type:'select', options:['under20','20-35','36-50','50+']},
  {id:'makeupStyle', q:'Makeup style preference', type:'select', options:['natural','glam','bold','none']},
  {id:'ingredientPref', q:'Ingredient preference', type:'select', options:['any','vegan','cruelty-free','fragrance-free','sensitive-safe']},
  {id:'budget', q:'Budget range', type:'select', options:['low','mid','high']},
  {id:'concerns', q:'Primary concerns (pick one)', type:'select', options:['acne','dryness','aging','dullness','breakage']}
];

function openQuiz(){
  const modal = $('#quiz-modal');
  const stepsEl = $('#quiz-steps');
  stepsEl.innerHTML='';
  quizSteps.forEach((s, idx)=>{
    const step = document.createElement('div'); step.className='quiz-step';
    if(idx===0) step.classList.add('active');
    let inputHtml='';
    if(s.type==='select'){
      inputHtml = `<select id="q-${s.id}">${s.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select>`;
    }
    step.innerHTML = `<h3>${s.q}</h3>${inputHtml}<div class="quiz-actions">
      ${idx>0?'<button class="btn" data-action="prev">Back</button>':''}
      <button class="btn btn-primary" data-action="next">${idx<quizSteps.length-1?'Next':'Finish'}</button>
    </div>`;
    stepsEl.appendChild(step);
  });

  // attach handlers
  stepsEl.addEventListener('click', (ev)=>{
    const a = ev.target.getAttribute('data-action');
    if(!a) return;
    const steps = Array.from(stepsEl.querySelectorAll('.quiz-step'));
    const current = steps.findIndex(s=>s.classList.contains('active'));
    if(a==='next'){
      const curStep = quizSteps[current];
      const val = steps[current].querySelector(`#q-${curStep.id}`).value;
      state.user[curStep.id] = val;
      steps[current].classList.remove('active');
      if(current+1<steps.length) steps[current+1].classList.add('active');
      else finishQuiz();
    }
    if(a==='prev'){
      steps[current].classList.remove('active');
      steps[current-1].classList.add('active');
    }
  });

  modal.classList.remove('hidden');
}

function finishQuiz(){
  $('#quiz-modal').classList.add('hidden');
  // After collecting user inputs, run a recommendation pass
  computeRecommendations();
}

function computeRecommendations(){
  // Score products by simple matching rules.
  const scored = state.products.map(p=>{
    let score=0;
    if(state.user.skinType && p.suitable_for && p.suitable_for.includes(state.user.skinType)) score+=3;
    if(state.user.concerns && p.concerns && p.concerns.includes(state.user.concerns)) score+=2;
    if(state.user.ingredientPref && p.certifications && p.certifications.includes(state.user.ingredientPref)) score+=2;
    if(state.user.budget==='low' && p.price<=30) score+=1;
    return {...p, score};
  }).sort((a,b)=>b.score-a.score);

  state.scoredResults = scored;
  const best = scored.slice(0,3).map(p=>`${p.name} (${p.brand}) — ${generateRecommendationSummary(p,state.user)}`);
  $('#recommendation-summary').textContent = best.length?best.join('\n'):'No strong recommendations found. Try changing preferences.';
  renderProducts();
  renderRecommended();
}

// Render recommended list (top picks or all)
function renderRecommended(){
  const list = $('#recommended-list');
  if(!list) return;
  list.innerHTML = '';
  const source = state.scoredResults ? state.scoredResults : state.products.map(p=>({...p, score:0}));
  const toShow = state.recommendShowAll ? source : source.slice(0,6);
  toShow.forEach(p=>{
    const el = document.createElement('div'); el.className='product-card reveal';
    el.style.cursor='pointer';
    el.innerHTML = `
      <div class="card-image"><img src="${p.image}" alt="${p.name}"/></div>
      <div class="card-body">
        <div class="card-title">${p.name}</div>
        <div class="card-meta">${p.brand} • <span class="price">${formatPrice(p.price)}</span></div>
      </div>
    `;
    el.addEventListener('click', ()=>openProductModal(p));
    list.appendChild(el);
  });
  runReveal();
  const btn = $('#rec-toggle-btn');
  if(btn) btn.textContent = state.recommendShowAll ? 'Show Top Picks' : 'Show All';
}

// Filters binding
function bindFilters(){
  $('#filter-category').addEventListener('change', e=>{state.filters.category=e.target.value; state.showAllProducts = false; renderProducts();});
  $('#filter-budget').addEventListener('change', e=>{state.filters.budget=e.target.value; state.showAllProducts = false; renderProducts();});
  $('#filter-ingredient').addEventListener('change', e=>{state.filters.ingredient=e.target.value; state.showAllProducts = false; renderProducts();});
}

function runReveal(){
  const els = $$('.reveal');
  els.forEach(el=>{
    const rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight - 40) el.classList.add('visible');
  });
}

// Typing header animation (simple)
function runTyping(){
  const el = document.querySelector('.typing');
  const text = 'Personalized beauty — crafted by AI';
  let i=0;
  el.textContent='';
  const t = setInterval(()=>{
    el.textContent += text[i++] || '';
    if(i>=text.length) clearInterval(t);
  }, 28);
}

// Init
async function init(){
  await loadProducts();
  bindFilters();
  renderProducts();
  // populate recommended list with all products initially
  renderRecommended();
  runTyping();
  runReveal();

  // event binds
  $('#modal-close').addEventListener('click', closeModal);
  $('#quiz-close').addEventListener('click', ()=>$('#quiz-modal').classList.add('hidden'));
  $('#start-quiz').addEventListener('click', openQuiz);
  $('#cta-quiz').addEventListener('click', openQuiz);
  $('#cta-explore').addEventListener('click', ()=>{
    // Show all products in the Explore area when CTA is clicked
    state.showAllProducts = true;
    state.filters = {category:'all', budget:'any', ingredient:'any'};
    const showAllBtn = $('#show-all-products');
    if(showAllBtn) showAllBtn.textContent = 'Show Filtered';
    renderProducts();
    renderRecommended();
    document.querySelector('.products').scrollIntoView({behavior:'smooth'});
  });

  // recommended toggle button
  const recBtn = $('#rec-toggle-btn');
  if(recBtn){
    // initial label
    recBtn.textContent = state.recommendShowAll ? 'Show Top Picks' : 'Show All';
    recBtn.addEventListener('click', ()=>{
      state.recommendShowAll = !state.recommendShowAll;
      renderRecommended();
    });
  }

  // show all products toggle
  const showAllBtn = $('#show-all-products');
  if(showAllBtn){
    showAllBtn.addEventListener('click', ()=>{
      state.showAllProducts = !state.showAllProducts;
      if(state.showAllProducts){
        // reset filters when showing all
        state.filters = {category:'all', budget:'any', ingredient:'any'};
        showAllBtn.textContent = 'Show Filtered';
      }else{
        showAllBtn.textContent = 'Show All Products';
      }
      renderProducts();
      renderRecommended();
    });
  }

  window.addEventListener('scroll', runReveal);
}

init();
