/* ============================================================
   CONFIGURATION GÉNÉRALE
   ============================================================ */
const KEY="bulletins_v6";
const $=id=>document.getElementById(id);
const num=v=>{const x=parseFloat(String(v).replace(",","."));return isNaN(x)?0:x};
const f2=x=>(Math.round(x*100)/100).toFixed(2).replace(".",",");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ============================================================
   CHEMINS DES IMAGES (dans le dossier "image/")
   ============================================================ */
const IMG = {
  logo:   "image/logo.png",      // Logo IQRA (utilisé si entete.png absent)
  entete: "image/entete.png",    // Bandeau d'en-tête complet
  pied:   "image/pied.png"       // Bandeau de pied de page complet
};

/* ============================================================
   LISTE COMPLÈTE DES ÉTUDIANTES (extraite du RELEVE.pdf)
   ============================================================ */
const ETUDIANTS = [
{mat:"IQU006F",nom:"ADAMOU AMINATOU",tel:"+237 696 552 077",n:["14","16","15","16","18","18","",""]},
];

/* ============================================================
   PARAMÈTRES PAR DÉFAUT
   ============================================================ */
const DEF={
  s:{
    school:"IQRA ULLUM",
    cls:"Niv 1 - Femmes",
    clsAr:"المستوى الأول - إناث",
    year:"2026",
    date:new Date().toLocaleDateString("fr-FR"),
    max:20,
    m:[
      {fr:"Tawhid", ar:"التوحيد"},
      {fr:"Fiqh",   ar:"الفقه"},
      {fr:"Tafsir", ar:"التفسير"},
      {fr:"",       ar:""}
    ],
    // Utilisation des images du dossier image/
    logo:   IMG.logo,
    entete: IMG.entete,
    pied:   IMG.pied,
    stamp:  ""
  },
  rows:JSON.parse(JSON.stringify(ETUDIANTS))
};

let D=null;
try{D=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!D||!D.s||!D.rows)D=JSON.parse(JSON.stringify(DEF));
// Forcer les images par défaut si absentes
D.s.entete = D.s.entete || IMG.entete;
D.s.pied   = D.s.pied   || IMG.pied;
D.s.logo   = D.s.logo   || IMG.logo;
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}

const act=()=>[0,1,2,3].filter(i=>D.s.m[i].fr.trim());

/* ============================================================
   CALCULS
   ============================================================ */
function calc(r){
  const A=act(),sub={};let tg=0,s1=0,s2=0,sm=0;
  A.forEach(s=>{
    const a=num(r.n[2*s]),b=num(r.n[2*s+1]);
    sub[s]={tot:a+b,moy:(a+b)/2};
    tg+=a+b;s1+=a;s2+=b;sm+=(a+b)/2;
  });
  return {sub,tg,s1,s2,sm,mg:A.length?tg/(2*A.length):0};
}

function ranks(){
  const m=D.rows.map(r=>calc(r).mg);
  return m.map(v=>1+m.filter(x=>x>v).length);
}

function apr(m){
  const v=m/D.s.max*20;
  return v>=16?{fr:"Excellent",ar:"ممتاز",c:"e1"}:
         v>=14?{fr:"Très bien",ar:"جيد جدا",c:"e2"}:
         v>=12?{fr:"Bien",ar:"جيد",c:"e3"}:
         v>=10?{fr:"Passable",ar:"مقبول",c:"e4"}:
                {fr:"Insuffisant",ar:"ضعيف",c:"e5"};
}

/* ============================================================
   DÉCISION : Admise uniquement si TOUTES les matières actives
   sont validées (moyenne >= max/2). Sinon → Redouble.
   ============================================================ */
function decision(r){
  const c=calc(r),A=act(),seuil=D.s.max/2;
  if(A.length===0) return {code:"rdb",fr:"Redouble",ar:"راسب",cls:"rdb",ok:false,echecs:[]};
  const echecs=A.filter(s=>c.sub[s].moy<seuil);
  if(echecs.length===0) return {code:"adm",fr:"Admise",ar:"مقبولة",cls:"adm",ok:true,echecs:[]};
  return {
    code:"rdb",fr:"Redouble",ar:"راسب",cls:"rdb",ok:false,
    echecs:echecs.map(s=>D.s.m[s].fr)
  };
}

const GEN={
e1:["L'apprenante fait preuve de sérieux, de motivation et d'un bon niveau de compréhension dans l'ensemble des matières. Ses efforts constants et sa régularité sont à souligner. Nous l'encourageons à poursuivre sur cette voie et à maintenir cet excellent niveau de travail.","تُظهر المتعلمة جدّيةً وتحفيزًا ومستوى جيدًا في فهم المواد. ونشجعها على مواصلة هذا الجهد والمحافظة على هذا المستوى الممتاز."],
e2:["Très bons résultats, fruit d'un travail sérieux et régulier. Nous encourageons l'apprenante à poursuivre ses efforts.","نتائج جيدة جدًا ثمرة عمل جاد ومنتظم. نشجع المتعلمة على مواصلة جهودها."],
e3:["Résultats satisfaisants. L'apprenante peut progresser encore avec davantage de régularité dans le travail.","نتائج مرضية، ويمكن للمتعلمة أن تتحسن أكثر بمزيد من الانتظام في العمل."],
e4:["Résultats moyens. Des efforts plus soutenus sont nécessaires pour consolider les acquis.","نتائج متوسطة، ويلزم بذل جهد أكبر لتثبيت المكتسبات."],
e5:["Résultats insuffisants. L'apprenante doit redoubler d'efforts et solliciter l'accompagnement du formateur.","نتائج غير كافية، وعلى المتعلمة مضاعفة الجهد وطلب مساعدة الأستاذ."]};

/* ============================================================
   GÉNÉRATION DU BULLETIN
   ============================================================ */
function bul(i){
  const S=D.s,r=D.rows[i],A=act(),c=calc(r),rk=ranks()[i],mx=S.max,ap=apr(c.mg);
  const dec=decision(r);
  const g=GEN[ap.c];

  const rows=A.map(s=>{
    const x=c.sub[s];
    const a=r.n[2*s]===""?"-":f2(num(r.n[2*s]));
    const b=r.n[2*s+1]===""?"-":f2(num(r.n[2*s+1]));
    const p=apr(x.moy);
    const failed=x.moy<mx/2;
    return `<tr>
      <td class="fr">${esc(S.m[s].fr)}${failed?' <span style="color:#b3382c">✗</span>':''}</td>
      <td class="ar">${esc(S.m[s].ar)}</td>
      <td>${a}</td><td>${b}</td>
      <td>${f2(x.tot)}</td>
      <td><b>${f2(x.moy)}</b></td>
      <td class="ap ${p.c}">${p.fr}<br><span class="arr">${p.ar}</span></td>
    </tr>`;
  }).join("");

  const info=(fr,ar,v)=>`<div><span>${fr}<em>${ar}</em></span><b>${esc(v||"-")}</b></div>`;

  const decDetail = dec.ok
    ? "Toutes les matières sont validées."
    : `Matière(s) non validée(s) : <b>${dec.echecs.join(", ")}</b>`;

  // En-tête : image complète si fournie, sinon fallback HTML
  const enteteHTML = S.entete
    ? `<img class="entete" src="${S.entete}" alt="En-tête IQRA ULLUM">`
    : `<div class="hd">
         <div class="logo"><img src="${S.logo}" alt="Logo"></div>
         <div class="ct">
           <h1>${esc(S.school)}</h1>
           <b>ENSEIGNEMENT EN LIGNE</b>
           <i>Apprendre aujourd'hui… Construire demain</i>
         </div>
         <div class="rq">
           <div class="a">طلب العلم فريضة على كل مسلم</div>
           « La science est une obligation pour tout musulman »
         </div>
       </div>`;

  // Pied de page : image complète si fournie, sinon fallback HTML
  const piedHTML = S.pied
    ? `<img class="pied" src="${S.pied}" alt="Pied de page IQRA ULLUM">`
    : `<div class="sg">
         <div>Signature du formateur<br><span class="arr">توقيع الأستاذ(ة)</span><i>_______________________</i></div>
         <div>Cachet de l'établissement<br><span class="arr">ختم المؤسسة</span></div>
       </div>`;

  return `<div class="bul">
    ${enteteHTML}

    <div class="corps">
      <div class="bn"><b>BULLETIN INDIVIDUEL DE NOTES</b><span>بطاقة النتائج الدراسية</span></div>
      <div class="lv">${esc(S.cls)}${S.clsAr?" &nbsp;|&nbsp; "+esc(S.clsAr):""}</div>

      <div class="box">
        <div class="bt"><span>INFORMATIONS DE L'APPRENANTE</span><span class="a">معلومات المتعلمة</span></div>
        <div class="ib">
          <div class="ig">
            ${info("Nom et prénom :","الاسم واللقب",r.nom)}
            ${info("Téléphone :","الهاتف",r.tel)}
            ${info("Matricule :","الرقم التسجيلي",r.mat)}
            ${info("Niveau :","المستوى",S.cls)}
            ${info("Année académique :","السنة الدراسية",S.year)}
            ${info("Date d'émission :","تاريخ الإصدار",S.date)}
          </div>
          <div class="qt">
            <span>« Celui qui cherche la science, Allah lui facilite le chemin vers le Paradis. »</span>
            <span class="arr">من سلك طريقًا يلتمس فيه علمًا سهل الله له طريقًا إلى الجنة</span>
          </div>
        </div>
      </div>

      <div class="box">
        <div class="bt"><span>RÉSULTATS ACADÉMIQUES</span><span class="a">النتائج الدراسية</span></div>
        <table>
          <tr>
            <th>Matières</th><th>المواد</th>
            <th>N1<small>(${mx})</small></th>
            <th>N2<small>(${mx})</small></th>
            <th>Total<small>(${2*mx})</small></th>
            <th>Moyenne<small>(${mx})</small></th>
            <th>Appréciation<br>التقدير</th>
          </tr>
          ${rows}
          <tr class="tg">
            <td class="fr">TOTAL GÉNÉRAL</td><td class="ar">المجموع العام</td>
            <td>${f2(c.s1)}</td><td>${f2(c.s2)}</td>
            <td>${f2(c.tg)}</td><td>${f2(c.sm)}</td>
            <td class="ap ${ap.c}" style="color:#17332b">${ap.fr}<br><span class="arr">${ap.ar}</span></td>
          </tr>
        </table>
      </div>

      <div class="mg">
        <div class="m">
          <span>MOYENNE GÉNÉRALE<br>المعدل العام</span>
          <span><big>${f2(c.mg)}</big> / ${mx}</span>
        </div>
        <div class="dc">
          <span>Décision du conseil &nbsp; قرار المجلس</span>
          <strong class="${dec.cls}">${dec.fr} &nbsp; ${dec.ar}</strong>
          <small style="display:block;margin-top:3px;font-size:9.5px;color:#5a7068">${decDetail}</small>
        </div>
        <div class="dc">
          <span>Rang &nbsp; الترتيب</span>
          <strong style="background:#f3ecc8">${rk}${rk===1?"er":"e"} / ${D.rows.length}</strong>
        </div>
      </div>

      <div class="box">
        <div class="bt"><span>APPRÉCIATION GÉNÉRALE</span><span class="a">التقدير العام</span></div>
        <div class="gp">${g[0]}<div class="a">${g[1]}</div></div>
      </div>
    </div>

    ${piedHTML}
  </div>`;
}

/* ============================================================
   PARAMÈTRES
   ============================================================ */
function loadS(){
  const F=[
    ["school","Établissement"],["cls","Niveau (FR)"],["clsAr","Niveau (AR)"],
    ["year","Année académique"],["date","Date d'émission"],
    ["max","Note max. par évaluation"]
  ];
  let h=F.map(([k,l])=>`<div><label>${l}</label><input id="s_${k}" value="${esc(D.s[k])}"${k==="clsAr"?' dir="rtl"':""}></div>`).join("");
  for(let i=0;i<4;i++){
    h+=`<div><label>Matière ${i+1} (FR) — vide = non utilisée</label><input id="mf${i}" value="${esc(D.s.m[i].fr)}"></div>`;
    h+=`<div><label>Matière ${i+1} (AR)</label><input id="ma${i}" dir="rtl" value="${esc(D.s.m[i].ar)}"></div>`;
  }
  h+=`<div><label>En-tête (image, facultatif)</label><input type="file" id="en" accept="image/*"></div>`;
  h+=`<div><label>Pied de page (image, facultatif)</label><input type="file" id="pi" accept="image/*"></div>`;
  h+=`<div><label>Logo (image, facultatif)</label><input type="file" id="lg" accept="image/*"></div>`;
  h+=`<div><label>Cachet (image, facultatif)</label><input type="file" id="st" accept="image/*"></div>`;
  h+=`<div style="grid-column:1/-1"><label>Actions</label>
       <button class="sec" id="bResetImg" type="button">↺ Restaurer les images par défaut</button>
      </div>`;
  $("sg").innerHTML=h;

  $("bResetImg").onclick=()=>{
    D.s.entete=IMG.entete;D.s.pied=IMG.pied;D.s.logo=IMG.logo;D.s.stamp="";
    save();msg("Images par défaut restaurées.");update();
  };
}
$("sg").addEventListener("input",e=>{
  const t=e.target,id=t.id;
  if(id.startsWith("s_")){
    const k=id.slice(2);
    D.s[k]=k==="max"?(num(t.value)||20):t.value;
  }else if(id[0]==="m"){
    D.s.m[+id[2]][id[1]==="f"?"fr":"ar"]=t.value;
    head();body();
  }
  save();update();
});
$("sg").addEventListener("change",e=>{
  const t=e.target;
  if(t.type!=="file"||!t.files[0])return;
  const rd=new FileReader();
  rd.onload=()=>{
    const map={en:"entete",pi:"pied",lg:"logo",st:"stamp"};
    D.s[map[t.id]||"logo"]=rd.result;
    save();msg("Image enregistrée.");update();
  };
  rd.readAsDataURL(t.files[0]);
});

/* ============================================================
   TABLEAU
   ============================================================ */
function head(){
  const A=act();
  $("th").innerHTML=
    `<tr><th rowspan=2>N°</th><th rowspan=2>Matricule</th><th rowspan=2>Noms et prénoms</th><th rowspan=2>Téléphone</th>`
    +A.map(s=>`<th class="m" colspan=4>${esc(D.s.m[s].fr)}</th>`).join("")
    +`<th rowspan=2>Total gén.</th><th rowspan=2>Moy. gén.</th><th rowspan=2>Rang</th><th rowspan=2>Décision</th><th rowspan=2 class="actions-h">Actions</th></tr><tr>`
    +A.map(()=>"<th>N1</th><th>N2</th><th>TOT</th><th>MOY</th>").join("")
    +"</tr>";
}

function body(){
  const tb=$("tb"),A=act();
  tb.innerHTML="";
  D.rows.forEach((r,i)=>{
    while(r.n.length<8)r.n.push("");
    const tr=document.createElement("tr");
    let h=`<td>${i+1}</td>`;
    h+=`<td class="l"><input data-i="${i}" data-f="mat" value="${esc(r.mat)}"></td>`;
    h+=`<td class="l"><input data-i="${i}" data-f="nom" value="${esc(r.nom)}" style="min-width:170px"></td>`;
    h+=`<td class="l"><input data-i="${i}" data-f="tel" value="${esc(r.tel)}"></td>`;
    A.forEach(s=>{
      h+=`<td><input data-i="${i}" data-n="${2*s}" value="${esc(r.n[2*s])}" inputmode="decimal" style="width:48px"></td>`;
      h+=`<td><input data-i="${i}" data-n="${2*s+1}" value="${esc(r.n[2*s+1])}" inputmode="decimal" style="width:48px"></td>`;
      h+=`<td class="c" id="t${i}_${s}"></td>`;
      h+=`<td class="c" id="m${i}_${s}"></td>`;
    });
    h+=`<td class="c g" id="tg${i}"></td>`;
    h+=`<td class="c g" id="mg${i}"></td>`;
    h+=`<td class="c" id="rk${i}"></td>`;
    h+=`<td class="c" id="dc${i}"></td>`;
    h+=`<td class="actions-c">`;
    h+=`<button class="ic sec" data-pv="${i}">Aperçu</button> `;
    h+=`<button class="ic" data-pdf="${i}">PDF</button> `;
    h+=`<button class="ic del" data-del="${i}">✕</button>`;
    h+=`</td>`;
    tr.innerHTML=h;
    tb.appendChild(tr);
  });
  update();
}

let pv=-1;

function update(){
  const rk=ranks(),A=act();
  let sum=0,adm=0,rdb=0;
  D.rows.forEach((r,i)=>{
    const c=calc(r);
    sum+=c.mg;
    A.forEach(s=>{
      $(`t${i}_${s}`).textContent=f2(c.sub[s].tot);
      const e=$(`m${i}_${s}`);
      e.textContent=f2(c.sub[s].moy);
      e.className="c "+(c.sub[s].moy<D.s.max/2?"low":"");
    });
    $("tg"+i).textContent=f2(c.tg);
    const g=$("mg"+i);
    g.textContent=f2(c.mg);
    g.className="c g "+(c.mg<D.s.max/2?"low":"hi");
    $("rk"+i).textContent=rk[i]+(rk[i]===1?"er":"e");
    const dec=decision(r);
    const dc=$("dc"+i);
    dc.innerHTML=`<span class="${dec.ok?'hi':'low'}" style="font-weight:700">${dec.fr}</span>`;
    if(dec.ok)adm++;else rdb++;
  });
  const n=D.rows.length;
  $("stats").innerHTML=
    `<span>Effectif : <b>${n}</b></span>`
    +`<span>Moyenne de la classe : <b>${n?f2(sum/n):"-"}</b></span>`
    +`<span>Admises : <b class="hi">${adm}</b></span>`
    +`<span>Redoublent : <b class="low">${rdb}</b></span>`;
  if(pv>=0&&D.rows[pv])showPv(pv);
}

/* Affiche l'aperçu DANS LA PAGE PRINCIPALE, en bas */
function showPv(i){
  pv=i;
  $("pc").hidden=false;
  $("ps").innerHTML=bul(i);
  const w=Math.min($("pc").clientWidth-30,794),k=w/794;
  $("ps").style.transform=`scale(${k})`;
  $("pw").style.width=w+"px";
  $("pw").style.height=1123*k+"px";
  $("pc").scrollIntoView({behavior:"smooth",block:"start"});
}

$("pX").onclick=()=>{pv=-1;$("pc").hidden=true};
$("pPdf").onclick=()=>pv>=0&&exportPDF([pv]);

$("tb").addEventListener("input",e=>{
  const t=e.target,i=+t.dataset.i;
  if(isNaN(i))return;
  if(t.dataset.f)D.rows[i][t.dataset.f]=t.value;
  else if(t.dataset.n!==undefined)D.rows[i].n[+t.dataset.n]=t.value;
  save();update();
});

$("tb").addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.pdf!==undefined)exportPDF([+d.pdf]);
  if(d.pv!==undefined){showPv(+d.pv)}
  if(d.del!==undefined&&confirm("Supprimer cette élève ?")){
    D.rows.splice(+d.del,1);
    pv=-1;$("pc").hidden=true;
    save();body();
  }
});

$("bAdd").onclick=()=>{
  D.rows.push({mat:"",nom:"",tel:"",n:Array(8).fill("")});
  save();body();
};

/* ===== Supprimer toute la liste ===== */
$("bDelAll").onclick=()=>{
  if(!D.rows.length){msg("La liste est déjà vide.");return}
  if(!confirm("⚠️ Supprimer TOUTES les "+D.rows.length+" étudiantes de la liste ?\n\nCette action est irréversible."))return;
  if(!confirm("Confirmez-vous définitivement la suppression de la totalité de la liste ?"))return;
  D.rows=[];
  pv=-1;
  $("pc").hidden=true;
  save();
  body();
  msg("Toute la liste a été supprimée (0 étudiante restante).");
};

/* ============================================================
   IMPORT CSV
   ============================================================ */
$("bCsvFile").onclick=()=>$("csvFile").click();
$("csvFile").addEventListener("change",e=>{
  const f=e.target.files[0];
  if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const txt=String(rd.result).replace(/^\uFEFF/,"");
      const lines=txt.split(/\r?\n/).filter(l=>l.trim());
      const detectSep=l=>l.includes(";")?";":l.includes("\t")?"\t":",";
      let start=0;
      if(lines.length && /matric|nom|t[ée]l/i.test(lines[0]))start=1;
      let k=0;
      for(let i=start;i<lines.length;i++){
        const c=lines[i].split(detectSep(lines[i])).map(x=>x.trim());
        if(c.length<4)continue;
        const n=Array(8).fill("");
        act().forEach((s,j)=>{
          n[2*s]=c[3+2*j]||"";
          n[2*s+1]=c[4+2*j]||"";
        });
        D.rows.push({mat:c[0],nom:c[1],tel:c[2],n});
        k++;
      }
      save();body();
      msg(k+" étudiant(s) importé(s) depuis « "+f.name+" ».");
    }catch(err){msg("Erreur lors de la lecture du CSV : "+err.message)}
  };
  rd.readAsText(f,"UTF-8");
  e.target.value="";
});

function msg(t){$("msg").textContent=t}

/* ============================================================
   EXPORT / SAUVEGARDE
   ============================================================ */
async function out(filename,data){
  let dl=null;
  try{dl=await claude.use("downloads")}catch(e){}
  if(dl){
    try{await dl.save({filename,data});msg("Fichier prêt : "+filename);return}
    catch(e){
      if(e&&e.code==="declined"){msg("Enregistrement annulé.");return}
      msg("Enregistrement refusé ("+(e&&(e.code||e.message))+"), tentative alternative…");
    }
  }
  const u=URL.createObjectURL(data instanceof Blob?data:new Blob([data]));
  const a=document.createElement("a");
  a.href=u;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),3000);
}

$("bCsv").onclick=()=>{
  const A=act();
  const h=["Matricule","Nom","Téléphone"];
  A.forEach(s=>{const m=D.s.m[s].fr;h.push(m+" N1",m+" N2",m+" TOT",m+" MOY")});
  h.push("Total général","Moyenne générale","Rang","Décision");
  const rk=ranks();
  const L=[h.join(";")];
  D.rows.forEach((r,i)=>{
    const c=calc(r),dec=decision(r);
    const a=[r.mat,r.nom,r.tel];
    A.forEach(s=>a.push(r.n[2*s],r.n[2*s+1],f2(c.sub[s].tot),f2(c.sub[s].moy)));
    a.push(f2(c.tg),f2(c.mg),rk[i],dec.fr);
    L.push(a.join(";"));
  });
  out("releve_notes.csv","\ufeff"+L.join("\r\n"));
};

/* ============================================================
   GÉNÉRATION PDF
   ============================================================ */
async function exportPDF(idx){
  if(!window.jspdf||!window.html2canvas){
    msg("Bibliothèques PDF non chargées (vérifiez la connexion), rechargez la page.");
    return;
  }
  if(!idx.length){msg("Aucune élève.");return}
  const host=document.createElement("div");
  host.style.cssText="position:absolute;left:0;top:0;z-index:-1;width:794px";
  document.body.appendChild(host);
  try{
    const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4",compress:true});
    for(let k=0;k<idx.length;k++){
      msg(`Génération du PDF… ${k+1}/${idx.length}`);
      host.innerHTML=bul(idx[k]);
      // Attendre le chargement de toutes les images
      const imgs=host.querySelectorAll("img");
      await Promise.all(Array.from(imgs).map(img=>
        img.complete && img.naturalWidth>0
          ? Promise.resolve()
          : new Promise(res=>{img.onload=res;img.onerror=res})
      ));
      if(document.fonts&&document.fonts.ready)await document.fonts.ready;
      const cv=await html2canvas(host.firstElementChild,{
        scale:2,backgroundColor:"#ffffff",useCORS:true,logging:false,scrollX:0,scrollY:0
      });
      if(k)doc.addPage();
      doc.addImage(cv.toDataURL("image/jpeg",0.92),"JPEG",0,0,210,297);
    }
    const nm=idx.length===1
      ? "bulletin_"+(D.rows[idx[0]].nom||"eleve").trim().replace(/[^\w]+/g,"_")
      : "bulletins_"+(D.s.cls||"classe").replace(/[^\w]+/g,"_");
    await out(nm+".pdf",doc.output("arraybuffer"));
  }catch(e){
    msg("Échec de la génération du PDF : "+(e&&(e.message||e.code)||e));
  }finally{host.remove()}
}

$("bAll").onclick=()=>exportPDF(D.rows.map((_,i)=>i));

window.addEventListener("resize",()=>{if(pv>=0)showPv(pv)});

/* ============================================================
   INITIALISATION
   ============================================================ */
loadS();
head();
body();