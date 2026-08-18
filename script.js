const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
$('#year').textContent=new Date().getFullYear();
const saved=localStorage.getItem('portfolio-theme');if(saved==='light')document.body.classList.add('light');
$('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('portfolio-theme',document.body.classList.contains('light')?'light':'dark')});
$('#menuBtn').addEventListener('click',()=>$('#navLinks').classList.toggle('open'));
$$('.nav-links a').forEach(a=>a.addEventListener('click',()=>$('#navLinks').classList.remove('open')));
window.addEventListener('scroll',()=>{const h=document.documentElement;$('#progress').style.width=`${(h.scrollTop/(h.scrollHeight-h.clientHeight))*100}%`});
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});$$('.reveal').forEach(el=>io.observe(el));
const featured=['finsecure-core','production-rag-system','Data-Leakage-Detection-System','mlops_orchestrator','healthcare-fraud-hub','graph-pulse','ecommerce-retention','Better-Fullstack','agentic-system'];
const descriptions={
  'finsecure-core':'A security-focused engineering project exploring reliable financial workflows and risk-aware systems.',
  'production-rag-system':'Production-oriented retrieval-augmented generation architecture for grounded AI applications.',
  'Data-Leakage-Detection-System':'A machine-learning project focused on identifying and preventing data leakage in workflows.',
  'mlops_orchestrator':'Automation and orchestration patterns for repeatable machine-learning operations.',
  'healthcare-fraud-hub':'Analytics and ML concepts for identifying suspicious patterns in healthcare data.',
  'graph-pulse':'Graph-based experimentation for analyzing connected data and relationships.',
  'ecommerce-retention':'Data-driven analysis of customer retention and e-commerce behavior.',
  'Better-Fullstack':'Full-stack development experiments focused on building better production web applications.',
  'agentic-system':'An exploration of agentic architectures and AI-powered workflows.'
};
async function loadProjects(){const grid=$('#projectGrid');try{const r=await fetch('https://api.github.com/users/Sukumar-Elley/repos?per_page=100&sort=updated');if(!r.ok)throw Error();const repos=await r.json();const chosen=[];for(const name of featured){const repo=repos.find(x=>x.name===name);if(repo)chosen.push(repo)}if(!chosen.length)throw Error();grid.innerHTML=chosen.slice(0,6).map((p,i)=>`<article class="project reveal visible"><span class="number">0${i+1} / PROJECT</span><h3>${escapeHtml(p.name.replaceAll('-',' '))}</h3><p>${escapeHtml(descriptions[p.name]||p.description||'A software project from my GitHub portfolio.')}</p><div class="project-foot"><div class="tags"><span class="tag">${escapeHtml(p.language||'Code')}</span><span class="tag">GitHub</span></div><a href="${p.html_url}" target="_blank" rel="noreferrer">View project ↗</a></div></article>`).join('')}catch(e){grid.innerHTML='<div class="loading">Projects could not be loaded right now. <a class="text-link" href="https://github.com/Sukumar-Elley?tab=repositories" target="_blank" rel="noreferrer">Open GitHub repositories ↗</a></div>'}}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}loadProjects();