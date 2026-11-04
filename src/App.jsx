import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
// Solo en la vista previa (build de prueba con datos de ejemplo): nada sale hacia servicios reales
/* global __PREVIEW__ */
const IS_PREVIEW = typeof __PREVIEW__!=="undefined" && __PREVIEW__;

const P = {
  primary:"#1A5C4A", light:"#2D9977", lighter:"#E6F4F0", bg:"#F5F7F6",
  border:"#DDE8E4", text:"#18211E", textMuted:"#607870", white:"#FFFFFF",
  gray50:"#F0F4F2", red:"#B03030", redBg:"#FAEAEA",
  accent:"#2a6aaa", accentBg:"#e8f2fc",
  purple:"#5040A0", purpleBg:"#F0EAF8",
  gold:"#c49020", goldBg:"#fef8e8",
  // Section colors (same as dashboard)
  colIndividual:"#4a9356", bgIndividual:"#eef6f0",
  colColectivo:"#5040A0", bgColectivo:"#f0eaf8",
  colEstrategico:"#2a6aaa", bgEstrategico:"#e8f2fc",
  colGestion:"#607870", bgGestion:"#F0F4F2",
  // Sidebar (softer than before)
  sidebarBg:"#F5F7F6", sidebarBorder:"#DDE8E4",
  sidebarText:"#18211E", sidebarMuted:"#607870",
  sidebarActive:"#1A5C4A", sidebarActiveBg:"#E6F4F0",
};

// ── SHARED COMPONENTS ──────────────────────────────────────────────
function Card({ children, style={} }) {
  return <div style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 20px",marginBottom:12,...style}}>{children}</div>;
}
function SectionTitle({ children, color=P.textMuted }) {
  return <div style={{fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>{children}</div>;
}
function Badge({ text, color=P.primary, bg=P.lighter }) {
  return <span style={{background:bg,color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{text}</span>;
}
function Btn({ children, onClick, variant="primary", small=false, disabled=false }) {
  const s = {
    primary:{ background:P.primary, color:"#fff", border:"none" },
    secondary:{ background:P.lighter, color:P.primary, border:`1px solid ${P.border}` },
    danger:{ background:P.redBg, color:P.red, border:`1px solid ${P.red}44` },
    ghost:{ background:"none", color:P.textMuted, border:`1px solid ${P.border}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{...s[variant],borderRadius:8,padding:small?"4px 10px":"8px 16px",fontSize:small?11:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.6:1,display:"inline-flex",alignItems:"center",gap:6}}>{children}</button>;
}
function Input({ label, value, onChange, placeholder, type="text", style={} }) {
  return <div style={{marginBottom:12,...style}}>
    {label&&<label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      {...(type==="email"?{autoCapitalize:"none",autoCorrect:"off",spellCheck:false,autoComplete:"email"}:{})}
      style={{width:"100%",padding:"8px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",boxSizing:"border-box",background:P.white}}/>
  </div>;
}
function Textarea({ label, value, onChange, placeholder, rows=3 }) {
  return <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:"100%",padding:"8px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",boxSizing:"border-box",background:P.white,resize:"vertical"}}/>
  </div>;
}
function Select({ label, value, onChange, options }) {
  return <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",padding:"8px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",background:P.white,cursor:"pointer"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>;
}
function Msg({ text }) {
  if(!text) return null;
  const isErr = text.startsWith("Error");
  return <div style={{padding:"10px 14px",background:isErr?P.redBg:P.lighter,color:isErr?P.red:P.primary,borderRadius:8,marginBottom:12,fontSize:12,fontWeight:500}}>{text}</div>;
}
function FileUploadBtn({ id, fileUrl, uploading, onFile, label="⬆ Subir archivo", accept="*" }) {
  return <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
    {uploading?<span style={{color:P.textMuted}}>Subiendo...</span>:fileUrl?<span style={{color:P.primary}}>✓ {label.replace("⬆ ","")}</span>:label}
    <input type="file" accept={accept} style={{display:"none"}} onChange={e=>e.target.files[0]&&onFile(e.target.files[0])}/>
  </label>;
}

// ── LOGIN ──────────────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleLogin() {
    if(!email||!password){ setError("Completá email y contraseña."); return; }
    setLoading(true); setError("");
    // El mail se normaliza: el teclado del celular capitaliza la primera letra y Auth
    // guarda todo en minúscula, pero admin_users se consultaba con match exacto.
    const em = email.trim().toLowerCase();
    const {data, error:authError} = await supabase.auth.signInWithPassword({email:em,password});
    if(authError){
      // Un 400/422 es credencial equivocada; cualquier otra cosa (red caída, base pausada)
      // no lo es, y decir "contraseña incorrecta" manda a la gente a buscar donde no es.
      const esCredencial = authError.status===400 || authError.status===422;
      setError(esCredencial ? "Email o contraseña incorrectos."
                            : "No pudimos conectar con el servidor. Probá de nuevo en un momento.");
      setLoading(false); return;
    }
    const {data:adminData, error:adErr} = await supabase.from("admin_users").select("*").eq("email",em).maybeSingle();
    if(adErr){ setError("No pudimos verificar tu acceso. Probá de nuevo en un momento."); setLoading(false); return; }
    if(!adminData){ await supabase.auth.signOut(); setError("No tenés acceso al panel admin."); setLoading(false); return; }
    onLogin(data.user, adminData);
    setLoading(false);
  }
  return (
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
      <div style={{background:P.white,borderRadius:16,border:`1px solid ${P.border}`,padding:"40px",width:360,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:48,height:48,borderRadius:12,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <span style={{color:"#fff",fontWeight:800,fontSize:16}}>TT</span>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:P.text}}>Panel Admin</div>
          <div style={{fontSize:12,color:P.textMuted,marginTop:2}}>Tu Terapia — acceso restringido</div>
        </div>
        {error&&<div style={{padding:"10px 14px",background:P.redBg,color:P.red,borderRadius:8,marginBottom:14,fontSize:12}}>{error}</div>}
        <Input label="Email" value={email} onChange={setEmail} placeholder="tu@tuterapia.com.uy" type="email"/>
        <Input label="Contraseña" value={password} onChange={setPassword} placeholder="••••••••" type="password"/>
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"11px",background:P.primary,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginTop:4}}>
          {loading?"Verificando...":"Ingresar"}
        </button>
      </div>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────────
function Sidebar({ active, setActive, adminName, onLogout }) {
  const items = [
    {id:"dashboard", icon:"🏠", label:"Dashboard"},
    {id:"empresas",  icon:"🏢", label:"Empresas"},
    {id:"talleristas",icon:"🎤",label:"Talleristas"},
    {id:"equipo",    icon:"👥", label:"Equipo TT"},
    {id:"tracking",  icon:"📈", label:"Tracking"},
    {id:"sync",      icon:"🔄", label:"Sincronización"},
  ];
  return (
    <div style={{width:210,background:P.sidebarBg,minHeight:"100vh",display:"flex",flexDirection:"column",flexShrink:0,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",borderRight:`1px solid ${P.sidebarBorder}`}}>
      <div style={{padding:"22px 18px 14px",borderBottom:`1px solid ${P.sidebarBorder}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:11}}>TT</span>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:P.text}}>Tu Terapia</div>
            <div style={{fontSize:10,color:P.textMuted,letterSpacing:"0.04em"}}>Panel Admin</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"8px 8px"}}>
        {items.map(item=><button key={item.id} onClick={()=>setActive(item.id)}
          style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"8px 11px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,
            background:active===item.id?P.sidebarActiveBg:"none",
            color:active===item.id?P.sidebarActive:P.sidebarMuted,
            fontSize:13,fontWeight:active===item.id?600:400,textAlign:"left"}}>
          <span style={{fontSize:15}}>{item.icon}</span>{item.label}
        </button>)}
      </nav>
      <div style={{padding:"14px 18px",borderTop:`1px solid ${P.sidebarBorder}`}}>
        <div style={{fontSize:11,color:P.textMuted,marginBottom:2}}>Sesión activa</div>
        <div style={{fontSize:12,color:P.text,fontWeight:600,marginBottom:8}}>{adminName}</div>
        <button onClick={onLogout} style={{fontSize:11,color:P.textMuted,background:"none",border:`1px solid ${P.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer",width:"100%"}}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD GLOBAL ───────────────────────────────────────────────
function DashboardView({ companies }) {
  const [pageViews, setPageViews] = useState([]);
  useEffect(()=>{ supabase.from("page_views").select("*").order("created_at",{ascending:false}).limit(10).then(({data})=>setPageViews(data||[])); },[]);
  return (
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
        {[["Empresas activas",companies.length,"🏢"],["Visitas recientes",pageViews.length,"👁"],["Estado","Operativo","✅"]].map(([l,v,i])=>(
          <div key={l} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 18px"}}>
            <div style={{fontSize:26,marginBottom:4}}>{i}</div>
            <div style={{fontSize:24,fontWeight:700,color:P.primary,letterSpacing:"-0.5px"}}>{v}</div>
            <div style={{fontSize:12,color:P.textMuted,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle>Empresas</SectionTitle>
        {companies.map(co=><div key={co.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${P.border}`}}>
          <div style={{width:32,height:32,borderRadius:8,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:10}}>{co.name?.slice(0,2).toUpperCase()}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:P.text}}>{co.name}</div>
            <div style={{fontSize:11,color:P.textMuted}}>{co.plan_type} · {co.start_date}</div>
          </div>
          <Badge text="Activa"/>
        </div>)}
        {companies.length===0&&<div style={{textAlign:"center",padding:"20px",color:P.textMuted,fontSize:13}}>Sin empresas aún.</div>}
      </Card>
    </div>
  );
}

// ── EMPRESA DETAIL TABS ────────────────────────────────────────────
const TABS = [
  {id:"config",    label:"Configuración", group:null,          color:P.textMuted},
  {id:"sesiones",  label:"Sesiones",      group:"Colaboradores", color:"#4a9356"},
  {id:"usuarios",  label:"Accesos al dashboard", group:"Colaboradores", color:"#4a9356"},
  {id:"talleres",  label:"Talleres",      group:"Cultura",      color:P.purple},
  {id:"contenido", label:"Contenido",     group:"Cultura",      color:P.purple},
  {id:"motivos",   label:"Motivos",       group:"Estrategia",   color:P.accent},
  {id:"recomendaciones",label:"Recomendaciones",group:"Estrategia",color:P.accent},
  {id:"hitos",     label:"Hitos",         group:"Estrategia",   color:P.accent},
  {id:"encuestas", label:"Encuestas",     group:"Estrategia",   color:P.accent},
  {id:"textos",    label:"Textos",        group:"Estrategia",   color:P.accent},
  {id:"facturacion",label:"Facturación",  group:"Gestión",      color:P.textMuted},
];

const GROUPS = ["Colaboradores","Cultura","Estrategia","Gestión"];

function EmpresaDetail({ company, onBack, reload }) {
  const [tab, setTab] = useState("config");
  const co = company;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{borderBottom:`1px solid ${P.border}`,padding:"16px 24px",background:P.white,display:"flex",alignItems:"center",gap:14}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",color:P.primary,fontWeight:500}}>← Empresas</button>
        <div style={{width:36,height:36,borderRadius:8,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{color:"#fff",fontWeight:700,fontSize:11}}>{co.name?.slice(0,2).toUpperCase()}</span>
        </div>
        <div>
          <div style={{fontSize:17,fontWeight:700,color:P.text,letterSpacing:"-0.3px"}}>{co.name}</div>
          <div style={{fontSize:11,color:P.textMuted}}>{co.plan_type} · {co.monthly_plan} ses/mes · Desde {co.start_date}</div>
        </div>
      </div>
      {/* Side nav + content */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Left nav */}
      <div style={{width:190,background:P.sidebarBg,borderRight:`1px solid ${P.border}`,overflowY:"auto",flexShrink:0,padding:"10px 8px"}}>
        {/* Config */}
        <button onClick={()=>setTab("config")}
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 11px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,
            background:tab==="config"?P.sidebarActiveBg:"none",
            color:tab==="config"?P.primary:P.textMuted,
            fontSize:12,fontWeight:tab==="config"?600:400,textAlign:"left"}}>
          ⚙️ Configuración
        </button>
        <button onClick={()=>setTab("usuarios")}
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 11px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:8,
            background:tab==="usuarios"?P.sidebarActiveBg:"none",
            color:tab==="usuarios"?P.primary:P.textMuted,
            fontSize:12,fontWeight:tab==="usuarios"?600:400,textAlign:"left"}}>
          👥 Accesos al dashboard
        </button>
        {/* Groups */}
        {[
          {group:"Colaboradores",color:P.colIndividual,bg:P.bgIndividual,tabs:[
            {id:"sesiones",label:"Sesiones",icon:"📊"}
          ]},
          {group:"Cultura",color:P.colColectivo,bg:P.bgColectivo,tabs:[
            {id:"talleres",label:"Talleres",icon:"🎤"},{id:"contenido",label:"Contenido",icon:"📁"}
          ]},
          {group:"Estrategia",color:P.colEstrategico,bg:P.bgEstrategico,tabs:[
            {id:"motivos",label:"Motivos",icon:"🧠"},{id:"recomendaciones",label:"Recomendaciones",icon:"💡"},
            {id:"hitos",label:"Hitos",icon:"🏆"},{id:"encuestas",label:"Encuestas",icon:"📝"},
            {id:"textos",label:"Textos",icon:"✏️"}
          ]},
          {group:"Gestión",color:P.colGestion,bg:P.bgGestion,tabs:[
            {id:"facturacion",label:"Facturación",icon:"💳"}
          ]},
        ].map(({group,color,bg,tabs})=><div key={group} style={{marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:600,color,textTransform:"uppercase",letterSpacing:"0.07em",padding:"4px 11px 4px",marginBottom:2}}>{group}</div>
          {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 11px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:1,
              background:tab===t.id?bg:"none",
              color:tab===t.id?color:P.textMuted,
              fontSize:12,fontWeight:tab===t.id?600:400,textAlign:"left"}}>
            <span style={{fontSize:13}}>{t.icon}</span>{t.label}
          </button>)}
        </div>)}
      </div>
      {/* Content */}
      <div style={{flex:1,overflowY:"auto",background:P.bg}}>
        {tab==="config"&&<ConfigTab company={co} reload={reload}/>}
        {tab==="sesiones"&&<SesionesTab companyId={co.id} planKind={co.plan_kind||"cuponera_fija"}/>}
        {tab==="usuarios"&&<UsuariosTab company={co}/>}
        {tab==="talleres"&&<TalleresTab companyId={co.id}/>}
        {tab==="contenido"&&<ContenidoTab companyId={co.id}/>}
        {tab==="motivos"&&<MotivosTab companyId={co.id}/>}
        {tab==="recomendaciones"&&<RecomendacionesTab companyId={co.id}/>}
        {tab==="hitos"&&<HitosTab companyId={co.id}/>}
        {tab==="encuestas"&&<EncuestasTab companyId={co.id}/>}
        {tab==="textos"&&<TextosTab companyId={co.id}/>}
        {tab==="facturacion"&&<FacturacionTab companyId={co.id} company={co}/>}
      </div>
      </div>
    </div>
  );
}

// ── CONFIG TAB ─────────────────────────────────────────────────────
const PLAN_KINDS = [
  {value:"cuponera_fija", label:"Cuponera Fija", desc:"Pool fijo de sesiones por mes"},
  {value:"fee_fijo",      label:"Fee Fijo Mensual", desc:"Fee plano + % OFF para colaboradores"},
  {value:"a_demanda",     label:"A Demanda", desc:"La empresa cubre un % de cada sesión consumida"},
];
const PLAN_KIND_LABELS = {cuponera_fija:"Cuponera Fija", fee_fijo:"Fee Fijo Mensual", a_demanda:"A Demanda"};
// Deben coincidir con MODULES del dashboard (ids y nombres de subpestañas)
const ALL_MODULES = [
  {id:"individual", label:"Colaboradores",           subs:["Sesiones","Adherencia","Motivos de consulta"]},
  {id:"colectivo",  label:"Cultura de Bienestar",    subs:["Talleres","Contenido"]},
  {id:"estrategico",label:"Estrategia de Bienestar", subs:["Bienestar del equipo","Consultoría Tu Terapia"]},
  {id:"gestion",    label:"Gestión",                 subs:["Resumen"]},
];
const FULL_VISIBILITY = Object.fromEntries(ALL_MODULES.map(m=>[m.id,m.subs]));

function ConfigTab({ company, reload }) {
  const [form, setForm] = useState({
    name:company.name||"", domain:company.domain||"",
    plan_kind:company.plan_kind||"cuponera_fija",
    coverage_pct:company.coverage_pct!=null?Math.round(Number(company.coverage_pct)*100):100,
    monthly_plan:company.monthly_plan||"", monthly_fee:company.monthly_fee||"",
    monthly_cap:company.monthly_cap||"", session_price_ref:company.session_price_ref||1600,
    session_cost_online:company.session_cost_online||"", session_cost_presencial:company.session_cost_presencial||"",
    user_session_limit:company.user_session_limit||"", user_monthly_limit:company.user_monthly_limit||"",
    headcount_total:company.headcount_total||"", headcount_leaders:company.headcount_leaders||"",
    start_date:company.start_date||"", renewal:company.renewal||"",
    workshop_target:company.workshop_target||5,
    contact_name:company.contact_name||"",
    consultoria_activa:company.consultoria_activa||false,
    consultoria_solicitada:company.consultoria_solicitada||false,
    encuesta_frecuencia:company.encuesta_frecuencia||"trimestral",
    referente_email:company.referente_email||"firoldi@tuterapia.com.uy",
    // Formato: {módulo:[subs visibles]}; null = todo visible. Convierte el formato legacy (array de módulos).
    visible_modules: Array.isArray(company.visible_modules)
      ? Object.fromEntries(company.visible_modules.map(id=>[id,(ALL_MODULES.find(m=>m.id===id)||{subs:[]}).subs]))
      : (company.visible_modules && typeof company.visible_modules==="object") ? company.visible_modules : null,
  });
  const [msg, setMsg] = useState("");
  // Referentes disponibles: equipo TT activo marcado como referente (Equipo TT en el sidebar)
  const [referentes, setReferentes] = useState([]);
  useEffect(()=>{ (async()=>{
    const {data}=await supabase.from("admin_users").select("email,name,short_name").eq("is_referente",true).eq("active",true).order("name");
    setReferentes((data||[]).map(r=>({value:r.email,label:r.short_name?`${r.short_name} — ${r.name}`:r.name})));
  })(); },[]);
  const k = form.plan_kind;
  const effective = form.visible_modules || FULL_VISIBILITY;
  function toggleModule(id){
    const cur = {...effective};
    if((cur[id]||[]).length) delete cur[id];
    else cur[id] = ALL_MODULES.find(m=>m.id===id).subs;
    setForm({...form, visible_modules: cur});
  }
  function toggleSub(id, s){
    const cur = {...effective};
    const subs = cur[id]||[];
    const next = subs.includes(s) ? subs.filter(x=>x!==s) : [...subs, s];
    if(next.length) cur[id]=next; else delete cur[id];
    setForm({...form, visible_modules: cur});
  }
  async function save() {
    const pct = Math.min(100, Math.max(1, parseInt(form.coverage_pct)||100));
    const {visible_modules, ...rest} = form;
    const {error} = await supabase.from("companies").update({
      ...rest,
      plan_type: PLAN_KIND_LABELS[k],
      plan_coverage: `${pct}%`,
      coverage_pct: pct/100,
      monthly_plan: k==="cuponera_fija" ? (parseInt(form.monthly_plan)||null) : null,
      monthly_fee: k==="fee_fijo" ? (parseInt(form.monthly_fee)||null) : null,
      monthly_cap: k==="a_demanda" ? (parseInt(form.monthly_cap)||null) : null,
      session_price_ref: k==="cuponera_fija" ? (parseInt(form.session_price_ref)||null) : null,
      session_cost_online: k==="a_demanda" ? (parseInt(form.session_cost_online)||null) : null,
      session_cost_presencial: k==="a_demanda" ? (parseInt(form.session_cost_presencial)||null) : null,
      user_session_limit: parseInt(form.user_session_limit)||null,
      user_monthly_limit: parseInt(form.user_monthly_limit)||null,
      headcount_total: parseInt(form.headcount_total)||null,
      headcount_leaders: parseInt(form.headcount_leaders)||null,
      workshop_target: parseInt(form.workshop_target)||5,
      visible_modules: visible_modules,
    }).eq("id",company.id);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Guardado."); reload(); }
  }
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
      <Input label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})}/>
      <Input label="Dominio" value={form.domain} onChange={v=>setForm({...form,domain:v})}/>
      <Select label="Tipo de plan" value={form.plan_kind} onChange={v=>setForm({...form,plan_kind:v})} options={PLAN_KINDS}/>
      {k!=="cuponera_fija"&&<Input label={k==="fee_fijo"?"% OFF colaboradores (cobertura %)":"Cobertura empresa (%)"} value={form.coverage_pct} onChange={v=>setForm({...form,coverage_pct:v})} type="number"/>}
      {k==="cuponera_fija"&&<Input label="Sesiones/mes" value={form.monthly_plan} onChange={v=>setForm({...form,monthly_plan:v})} type="number"/>}
      {k==="cuponera_fija"&&<Input label="Costo por sesión — único blended (UYU)" value={form.session_price_ref} onChange={v=>setForm({...form,session_price_ref:v})} type="number"/>}
      {k==="fee_fijo"&&<Input label="Fee mensual (UYU)" value={form.monthly_fee} onChange={v=>setForm({...form,monthly_fee:v})} type="number"/>}
      {k==="a_demanda"&&<Input label="Costo sesión ONLINE — paga la empresa (UYU)" value={form.session_cost_online} onChange={v=>setForm({...form,session_cost_online:v})} type="number"/>}
      {k==="a_demanda"&&<Input label="Costo sesión PRESENCIAL — paga la empresa (UYU)" value={form.session_cost_presencial} onChange={v=>setForm({...form,session_cost_presencial:v})} type="number"/>}
      {k==="a_demanda"&&<Input label="Tope mensual (sesiones, vacío = sin tope)" value={form.monthly_cap} onChange={v=>setForm({...form,monthly_cap:v})} type="number"/>}
      <Input label="Límite de sesiones por colaborador (vacío = sin límite)" value={form.user_session_limit} onChange={v=>setForm({...form,user_session_limit:v})} type="number"/>
      <Input label="Límite por colaborador por MES (vacío = sin límite)" value={form.user_monthly_limit} onChange={v=>setForm({...form,user_monthly_limit:v})} type="number"/>
      <Input label="Nómina: colaboradores en total (cobertura y encuestas)" value={form.headcount_total} onChange={v=>setForm({...form,headcount_total:v})} type="number"/>
      <Input label="Cantidad de líderes/mandos medios" value={form.headcount_leaders} onChange={v=>setForm({...form,headcount_leaders:v})} type="number"/>
      <Input label="Inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
      <Input label="Renovación" value={form.renewal} onChange={v=>setForm({...form,renewal:v})} placeholder="ej. Jul 2026"/>
      <Input label="Target talleres/año" value={form.workshop_target} onChange={v=>setForm({...form,workshop_target:v})} type="number"/>
      <Input label="Contacto RRHH" value={form.contact_name} onChange={v=>setForm({...form,contact_name:v})}/>
      <Select label="Referente TT" value={form.referente_email} onChange={v=>setForm({...form,referente_email:v})} options={referentes}/>
      <Select label="Frecuencia encuestas" value={form.encuesta_frecuencia} onChange={v=>setForm({...form,encuesta_frecuencia:v})} options={[{value:"trimestral",label:"Trimestral"},{value:"semestral",label:"Semestral"},{value:"anual",label:"Anual"}]}/>
    </div>
    {k==="a_demanda"&&(()=>{
      const cov=(parseInt(form.coverage_pct)||100)/100;
      const desc=cov>=1?0.10:0.05;
      const sugO=Math.round(1600*cov*(1-desc)), sugP=Math.round(1850*cov*(1-desc));
      return <div style={{padding:"12px 16px",background:P.accentBg,borderRadius:10,marginBottom:16,fontSize:12,color:"#1a4a7a",lineHeight:1.7}}>
        <b>Sugerido</b> según lista ($1.600 online · $1.850 presencial, IVA incl.), cobertura {Math.round(cov*100)}% y descuento por convenio {Math.round(desc*100)}%: <b>$ {sugO} online · $ {sugP} presencial</b>
        <button onClick={()=>setForm({...form,session_cost_online:sugO,session_cost_presencial:sugP})}
          style={{marginLeft:10,background:P.accent,color:"#fff",border:"none",borderRadius:6,padding:"3px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Usar sugeridos</button>
        {cov<1&&<div style={{marginTop:4}}>⚠︎ Estos montos son el <b>{Math.round(cov*100)}% que financia la empresa</b> — el resto lo aporta el colaborador (co-pago). Así se muestran también en el dash.</div>}
      </div>;
    })()}
    <div style={{padding:"12px 16px",background:P.lighter,borderRadius:10,marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:2}}>Secciones visibles en el dashboard</div>
      <div style={{fontSize:11,color:P.textMuted,marginBottom:10}}>{form.visible_modules?"Configuración personalizada para esta empresa.":"Por defecto la empresa ve todo. Tocá una sección o subpestaña para personalizar."}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {ALL_MODULES.map(m=>{
          const modOn = (effective[m.id]||[]).length>0;
          return <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>toggleModule(m.id)}
              style={{background:modOn?P.primary:P.gray50,color:modOn?"#fff":P.textMuted,border:`1px solid ${modOn?P.primary:P.border}`,borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",minWidth:170,textAlign:"left"}}>
              {modOn?"✓ ":""}{m.label}
            </button>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {m.subs.map(s=>{
                const subOn = (effective[m.id]||[]).includes(s);
                return <button key={s} onClick={()=>toggleSub(m.id,s)}
                  style={{background:subOn?P.white:P.gray50,color:subOn?P.primary:P.textMuted,border:`1px solid ${subOn?P.primary:P.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer",opacity:subOn?1:0.7}}>
                  {subOn?"✓ ":""}{s}
                </button>;
              })}
            </div>
          </div>;
        })}
      </div>
      {form.visible_modules&&<button onClick={()=>setForm({...form,visible_modules:null})} style={{marginTop:10,background:"none",border:"none",fontSize:11,color:P.accent,cursor:"pointer",padding:0,fontWeight:600}}>Volver a mostrar todo (default)</button>}
    </div>
    <CuponesEmpresa companyId={company.id}/>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"12px 16px",background:P.lighter,borderRadius:10,marginBottom:12}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:P.text}}>Consultoría Estratégica</div>
        <div style={{fontSize:11,color:P.textMuted}}>Se activa cuando la empresa se suma a la encuesta semestral. Mientras está inactiva, el dash la muestra borrosa con el botón para pedirla.</div>
        {form.consultoria_solicitada&&!form.consultoria_activa&&<div style={{fontSize:11,color:P.accent,marginTop:2}}>⏳ Solicitud pendiente del cliente</div>}
      </div>
      <button onClick={()=>setForm({...form,consultoria_activa:!form.consultoria_activa})}
        style={{background:form.consultoria_activa?P.primary:P.gray50,color:form.consultoria_activa?"#fff":P.textMuted,border:`1px solid ${form.consultoria_activa?P.primary:P.border}`,borderRadius:20,padding:"5px 16px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
        {form.consultoria_activa?"Activada":"Inactiva"}
      </button>
    </div>
    <Btn onClick={save}>Guardar cambios</Btn>
  </div>;
}

// ── SESIONES TAB ───────────────────────────────────────────────────
function SesionesTab({ companyId, planKind }) {
  // Cuponera trackea canjeadas+realizadas+cupones; a demanda y fee fijo solo canjeadas (el dash las muestra como "Sesiones")
  const isCuponera = planKind==="cuponera_fija";
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({month:"",year:new Date().getFullYear(),canjeadas:0,realizadas:0,nuevos:0,activos:0,total_historico:0,c1:0,c2:0,c3:0,c4:0,c5:0,partial:false});
  const [msg, setMsg] = useState("");
  const [importing, setImporting] = useState(false);
  useEffect(()=>{ load(); },[companyId]);
  async function load() { const {data}=await supabase.from("sessions_data").select("*").eq("company_id",companyId).order("year").order("month"); setRows(data||[]); }
  async function save() {
    if(!form.month){setMsg("Ingresá el mes.");return;}
    const {error}=await supabase.from("sessions_data").insert([{...form,company_id:companyId,year:parseInt(form.year)}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Guardado.");setShowForm(false);load();}
  }
  async function del(id){await supabase.from("sessions_data").delete().eq("id",id);load();}
  const f=(k,v)=>setForm({...form,[k]:parseInt(v)||0});

  async function importCSV(file) {
    setImporting(true); setMsg("");
    try {
      const rawText = await file.text();
      // Remove BOM if present
      const text = rawText.replace(/^\uFEFF/, "");
      
      // Parse CSV respecting quoted fields with newlines inside
      function parseCSV(text, sep) {
        const rows = [];
        let row = [], field = "", inQuote = false;
        for(let i=0;i<text.length;i++){
          const ch = text[i], next = text[i+1];
          if(ch==='"') { inQuote=!inQuote; }
          else if(!inQuote && ch===sep) { row.push(field.trim()); field=""; }
          else if(!inQuote && (ch==="\r"&&next==="\n"||ch==="\n")) {
            row.push(field.trim()); rows.push(row); row=[]; field="";
            if(ch==="\r") i++;
          } else { field+=ch; }
        }
        if(field||row.length) { row.push(field.trim()); rows.push(row); }
        return rows;
      }

      // Detect separator
      const firstLine = text.split("\n")[0];
      const sep = firstLine.includes(";") ? ";" : ",";
      const allRows = parseCSV(text, sep);

      // Find header row: has "Empresa" and "Mes" in first two cols
      let headerIdx = -1;
      for(let i=0;i<allRows.length;i++){
        const r = allRows[i];
        if(r.length>2 && r[0].toLowerCase().includes("empresa") && r[1].toLowerCase().replace(/\n/g,"").includes("mes")) {
          headerIdx = i; break;
        }
      }
      if(headerIdx<0) { setMsg("No se encontró la fila de encabezados. Asegurate de usar el template de Tu Terapia."); setImporting(false); return; }

      // Column positions are fixed in our template:
      // 0=Empresa, 1=Mes, 2=Año, 3=Canjeadas, 4=Realizadas, 5=Tasa%, 6=CanjUltMes, 7=RealUltMes
      // 8=Nuevos, 9=Activos, 10=TotalHistorico, 11=PrimeraVez, 12=%PrimeraVez, 13=PromedioSes, 14=Parcial
      const COL = { mes:1, year:2, canjeadas:3, realizadas:4, nuevos:8, activos:9,
                    total_historico:10, primera_vez:11, partial:14 };

      const toInt = (val) => val ? parseInt((val+"").replace(/[^0-9]/g,""))||0 : 0;

      const rows_to_insert = [];
      for(let i=headerIdx+1; i<allRows.length; i++){
        const row = allRows[i];
        if(!row || row.length<3) continue;
        const mesVal = (row[COL.mes]||"").replace(/\n/g,"").trim();
        const yearVal = parseInt(row[COL.year]);
        if(!mesVal || isNaN(yearVal) || yearVal<2020) continue;
        // Skip empty rows
        if(row.slice(3,12).every(v=>!v||v.trim()==="")) continue;
        const isPartial = ["si","sí","yes","true","1"].includes((row[COL.partial]||"").toLowerCase().trim());
        rows_to_insert.push({
          company_id: companyId,
          month: mesVal, year: yearVal,
          canjeadas: toInt(row[COL.canjeadas]),
          realizadas: toInt(row[COL.realizadas]),
          nuevos: toInt(row[COL.nuevos]),
          activos: toInt(row[COL.activos]),
          total_historico: toInt(row[COL.total_historico]),
          primera_vez: toInt(row[COL.primera_vez]),
          c1:0, c2:0, c3:0, c4:0, c5:0,
          partial: isPartial,
        });
      }

      if(rows_to_insert.length===0) { setMsg("No se encontraron filas con datos. Completá el template antes de importar."); setImporting(false); return; }

      let inserted = 0;
      for(const row of rows_to_insert) {
        const {error} = await supabase.from("sessions_data").upsert([row], {onConflict:"company_id,month,year"});
        if(!error) inserted++;
      }
      setMsg(`✓ ${inserted} meses importados correctamente.`);
      load();
    } catch(e) {
      setMsg("Error al procesar el archivo: "+e.message);
    }
    setImporting(false);
  }

  async function importMotivosCSV(file) {
    // handled separately but kept here for reference
  }
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <SesionesPorCupon companyId={companyId}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} meses cargados
        {!isCuponera&&<div style={{fontSize:11,color:P.accent,marginTop:3}}>ℹ️ Se usa el mismo template para todos los planes. Para esta empresa ({planKind==="fee_fijo"?"Fee Mensual":"A Demanda"}) completá solo <b>Canjeadas</b>, Nuevos, Activos, Total histórico y Primera vez — las columnas Realizadas y Tasa se dejan vacías.</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <label style={{display:"inline-flex",alignItems:"center",gap:6,background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:importing?"not-allowed":"pointer",opacity:importing?0.6:1}}>
          {importing?"⏳ Importando...":"⬆ Importar Excel/CSV"}
          <input type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} disabled={importing} onChange={async e=>{
            if(!e.target.files[0]) return;
            const file = e.target.files[0];
            if(file.name.endsWith(".csv")) {
              await importCSV(file);
            } else {
              setMsg("Por ahora solo se admite CSV. Exportá el Excel como CSV antes de importar.");
            }
            e.target.value="";
          }}/>
        </label>
        <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar mes</Btn>
      </div>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <Input label="Mes" value={form.month} onChange={v=>setForm({...form,month:v})} placeholder="ej. May 26"/>
        <Input label="Año" value={form.year} onChange={v=>setForm({...form,year:v})} type="number"/>
        <Input label={isCuponera?"Canjeadas":"Sesiones (canjeadas)"} value={form.canjeadas} onChange={v=>f("canjeadas",v)} type="number"/>
        {isCuponera&&<Input label="Realizadas" value={form.realizadas} onChange={v=>f("realizadas",v)} type="number"/>}
        <Input label="Nuevos" value={form.nuevos} onChange={v=>f("nuevos",v)} type="number"/>
        <Input label="Activos" value={form.activos} onChange={v=>f("activos",v)} type="number"/>
        <Input label="Total histórico" value={form.total_historico} onChange={v=>f("total_historico",v)} type="number"/>
        <Input label="Primera vez" value={form.primera_vez||0} onChange={v=>f("primera_vez",v)} type="number"/>
        {isCuponera&&<Input label="C1" value={form.c1} onChange={v=>f("c1",v)} type="number"/>}
        {isCuponera&&<Input label="C2" value={form.c2} onChange={v=>f("c2",v)} type="number"/>}
        {isCuponera&&<Input label="C3" value={form.c3} onChange={v=>f("c3",v)} type="number"/>}
        {isCuponera&&<Input label="C4" value={form.c4} onChange={v=>f("c4",v)} type="number"/>}
        {isCuponera&&<Input label="C5" value={form.c5} onChange={v=>f("c5",v)} type="number"/>}
      </div>
      {!isCuponera&&<div style={{fontSize:11,color:P.textMuted,margin:"2px 0 10px"}}>Este plan ({planKind==="fee_fijo"?"Fee Mensual":"A Demanda"}) solo muestra sesiones canjeadas en el dash — no hace falta cargar realizadas ni cupones.</div>}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <input type="checkbox" checked={form.partial} onChange={e=>setForm({...form,partial:e.target.checked})} id="partial"/>
        <label htmlFor="partial" style={{fontSize:12,color:P.textMuted}}>Mes parcial</label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,background:P.white,borderRadius:10,overflow:"hidden",border:`1px solid ${P.border}`}}>
        <thead><tr style={{borderBottom:`1.5px solid ${P.border}`,background:P.gray50}}>
          {(isCuponera
            ?["Mes","Canj.","Real.","Nuevos","Activos","Hist.","C1","C2","C3","C4","C5","Parc.",""]
            :["Mes","Sesiones","Nuevos","Activos","Hist.","Parc.",""]
          ).map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
          <td style={{padding:"8px 10px",fontWeight:600}}>{r.month} {r.year}</td>
          <td style={{padding:"8px 10px"}}>{r.canjeadas}</td>{isCuponera&&<td style={{padding:"8px 10px"}}>{r.realizadas}</td>}
          <td style={{padding:"8px 10px"}}>{r.nuevos}</td><td style={{padding:"8px 10px"}}>{r.activos||"—"}</td><td style={{padding:"8px 10px"}}>{r.total_historico||"—"}</td>
          {isCuponera&&<td style={{padding:"8px 10px",color:P.textMuted}}>{r.c1}</td>}{isCuponera&&<td style={{padding:"8px 10px",color:P.textMuted}}>{r.c2}</td>}
          {isCuponera&&<td style={{padding:"8px 10px",color:P.textMuted}}>{r.c3}</td>}{isCuponera&&<td style={{padding:"8px 10px",color:P.textMuted}}>{r.c4}</td>}
          {isCuponera&&<td style={{padding:"8px 10px",color:P.textMuted}}>{r.c5}</td>}
          <td style={{padding:"8px 10px"}}>{r.partial?"✓":""}</td>
          <td style={{padding:"8px 10px"}}><button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer"}}>🗑</button></td>
        </tr>)}
        {rows.length===0&&<tr><td colSpan={12} style={{padding:"20px",textAlign:"center",color:P.textMuted}}>Sin datos</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}

// ── USUARIOS TAB ───────────────────────────────────────────────────
const MODULES_PERMS=[
  {id:"individual",label:"Colaboradores",color:"#4a9356"},
  {id:"colectivo",label:"Cultura de Bienestar",color:P.purple},
  {id:"estrategico",label:"Estrategia de Bienestar",color:P.accent},
  {id:"gestion",label:"Gestión",color:P.textMuted},
];
function UsuariosTab({ company }) {
  const [users, setUsers] = useState([]);
  const [userPerms, setUserPerms] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({email:"",full_name:"",role:"viewer"});
  const [formPerms, setFormPerms] = useState({individual:true,colectivo:true,estrategico:true,gestion:false});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[company.id]);
  async function load() {
    const {data:us}=await supabase.from("company_users").select("*").eq("company_id",company.id).order("created_at",{ascending:false});
    setUsers(us||[]);
    if(us?.length){
      const {data:ps}=await supabase.from("user_permissions").select("*").in("user_id",us.map(u=>u.id));
      const m={};(ps||[]).forEach(p=>{if(!m[p.user_id])m[p.user_id]={};m[p.user_id][p.section]=p.visible;});
      setUserPerms(m);
    }
  }
  async function savePerms(userId,perms){
    await supabase.from("user_permissions").delete().eq("user_id",userId);
    const rows=Object.entries(perms).map(([section,visible])=>({user_id:userId,section,visible}));
    if(rows.length) await supabase.from("user_permissions").insert(rows);
  }
  async function invite() {
    if(!form.email||!form.full_name){setMsg("Email y nombre obligatorios.");return;}
    setLoading(true);setMsg("");
    // Siempre en minúscula: el login busca el mail exacto y Auth lo guarda normalizado.
    const em=form.email.trim().toLowerCase();
    const {error:e2,data:inserted}=await supabase.from("company_users").insert([{company_id:company.id,email:em,full_name:form.full_name,role:form.role,active:true}]).select().single();
    if(e2){setMsg("Error: "+e2.message);setLoading(false);return;}
    await savePerms(inserted.id,formPerms);
    // Call Edge Function to send invite
    const {data:{session}}=await supabase.auth.getSession();
    // En la vista previa nunca se manda una invitación real
    const result=IS_PREVIEW?{preview:true}:await (await fetch("https://cdzvjueschflpkxlozby.supabase.co/functions/v1/invite-user",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
      body:JSON.stringify({email:em,company_id:company.id,full_name:form.full_name,role:form.role})
    })).json();
    if(result.error) setMsg(`${form.full_name} agregado. Mail: ${result.error}`);
    else if(result.existing) setMsg(`${form.full_name} ya tenía cuenta de Tu Terapia: se le dio acceso a esta empresa. Entra con su contraseña de siempre (sin nueva invitación).`);
    else setMsg(`Invitación enviada a ${form.email}.`);
    setShowForm(false);setForm({email:"",full_name:"",role:"viewer"});setFormPerms({individual:true,colectivo:true,estrategico:true,gestion:false});
    setLoading(false);load();
  }
  async function toggleActive(u){await supabase.from("company_users").update({active:!u.active}).eq("id",u.id);load();}
  async function updatePerms(userId,newPerms){await savePerms(userId,newPerms);setUserPerms(prev=>({...prev,[userId]:newPerms}));}
  async function del(id){
    const u=users.find(x=>x.id===id);
    await supabase.from("user_permissions").delete().eq("user_id",id);
    await supabase.from("company_users").delete().eq("id",id);
    // Purga la cuenta de login si ya no tiene acceso a ninguna empresa (libera el mail)
    if(u?.email){
      const {data:res}=await supabase.functions.invoke("delete-user",{body:{email:u.email}});
      if(res?.purged) setMsg(`Usuario eliminado. Su cuenta de acceso también se borró — el mail queda libre.`);
      else if(res?.remaining) setMsg(`Usuario eliminado de esta empresa. Conserva acceso a ${res.remaining} empresa(s) más.`);
      else setMsg("Usuario eliminado.");
    }
    load();
  }
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{users.length} usuarios — {company.name}</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar usuario</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Nombre completo" value={form.full_name} onChange={v=>setForm({...form,full_name:v})} placeholder="ej. Laura Martínez"/>
        <Input label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder={`ej. laura@${company.domain}`} type="email"/>
        <Select label="Rol" value={form.role} onChange={v=>setForm({...form,role:v})} options={[{value:"viewer",label:"Viewer"},{value:"admin",label:"Admin"}]}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Módulos con acceso</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {MODULES_PERMS.map(m=><label key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:formPerms[m.id]?P.white:P.gray50,border:`1px solid ${formPerms[m.id]?m.color+"55":P.border}`,borderRadius:8,cursor:"pointer"}}>
            <input type="checkbox" checked={!!formPerms[m.id]} onChange={e=>setFormPerms({...formPerms,[m.id]:e.target.checked})} style={{accentColor:m.color}}/>
            <span style={{fontSize:12,fontWeight:500,color:formPerms[m.id]?m.color:P.textMuted}}>{m.label}</span>
          </label>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={invite} disabled={loading}>{loading?"Enviando...":"Enviar invitación"}</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {users.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin usuarios aún.</div></Card>}
      {users.map(u=>{
        const perms=userPerms[u.id]||{};
        return <Card key={u.id}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:u.active?P.primary:P.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:11}}>{u.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                <div style={{fontSize:13,fontWeight:600,color:P.text}}>{u.full_name}</div>
                <Badge text={u.active?"Activo":"Inactivo"} bg={u.active?P.lighter:P.gray50} color={u.active?P.primary:P.textMuted}/>
              </div>
              <div style={{fontSize:11,color:P.textMuted,marginBottom:10}}>{u.email}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {MODULES_PERMS.map(m=>{
                  const has=Object.keys(perms).length>0?!!perms[m.id]:false;
                  return <label key={m.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:has?P.white:P.gray50,border:`1px solid ${has?m.color+"55":P.border}`,borderRadius:20,cursor:"pointer"}}>
                    <input type="checkbox" checked={has} onChange={e=>{const np={...perms,[m.id]:e.target.checked};updatePerms(u.id,np);}} style={{width:12,height:12,accentColor:m.color}}/>
                    <span style={{fontSize:11,color:has?m.color:P.textMuted}}>{m.label}</span>
                  </label>;
                })}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>toggleActive(u)} style={{background:"none",border:`1px solid ${P.border}`,borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:P.textMuted}}>{u.active?"Desactivar":"Activar"}</button>
              <button onClick={()=>del(u.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:15}}>🗑</button>
            </div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}

// ── BLOQUES NUEVOS DEL REDISEÑO 2026 ───────────────────────────────
// Confirmación: en la vista previa no hay diálogos del navegador, así que se da por confirmada
const ask=(m)=>IS_PREVIEW||window.confirm(m);
const MES_ABBR=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Configuración → qué cupones de la plataforma son de esta empresa (los usa la sincronización)
function CuponesEmpresa({ companyId }) {
  const [rows, setRows] = useState([]);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("company_coupons").select("*").eq("company_id",companyId).order("created_at");setRows(data||[]);}
  async function add(){
    const c=code.trim(); if(!c){setMsg("Escribí el código del cupón tal cual está en la plataforma.");return;}
    const {error}=await supabase.from("company_coupons").insert([{company_id:companyId,coupon_code:c,label:label.trim()||null}]);
    if(error) setMsg(error.message.includes("duplicate")||error.code==="23505"?"Ese cupón ya está asignado a otra empresa.":"Error: "+error.message);
    else{setMsg("");setCode("");setLabel("");load();}
  }
  async function del(id){if(!ask("¿Quitar este cupón? La sincronización deja de contar sus sesiones para esta empresa."))return;await supabase.from("company_coupons").delete().eq("id",id);load();}
  return <div style={{padding:"12px 16px",background:P.lighter,borderRadius:10,marginBottom:12}}>
    <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:2}}>Cupones de la plataforma</div>
    <div style={{fontSize:11,color:P.textMuted,marginBottom:10}}>Las sesiones pagadas con estos cupones se cuentan para esta empresa. En el dash, cada cupón tiene su color en la barra de sesiones.</div>
    {msg&&<div style={{fontSize:11,color:P.red,marginBottom:8}}>{msg}</div>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
      {rows.length===0&&<span style={{fontSize:12,color:P.accent}}>Sin cupones: la sincronización no puede traer datos de esta empresa.</span>}
      {rows.map(r=><span key={r.id} style={{display:"inline-flex",alignItems:"center",gap:6,background:P.white,border:`1px solid ${P.border}`,borderRadius:20,padding:"4px 6px 4px 12px",fontSize:12}}>
        <b style={{color:P.text}}>{r.coupon_code}</b>{r.label&&<span style={{color:P.textMuted}}>· {r.label}</span>}
        <button onClick={()=>del(r.id)} title="Quitar" style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:13,padding:"0 4px"}}>✕</button>
      </span>)}
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
      <div style={{width:200}}><Input label="Código" value={code} onChange={setCode} placeholder="ej. #bienestarbc"/></div>
      <div style={{width:200}}><Input label="Para qué es (opcional)" value={label} onChange={setLabel} placeholder="ej. caso particular"/></div>
      <div style={{marginBottom:12}}><Btn small onClick={add}>+ Agregar cupón</Btn></div>
    </div>
  </div>;
}

// Sesiones → detalle por cupón de cada mes (lo llena la sincronización; se puede corregir a mano)
function SesionesPorCupon({ companyId }) {
  const [rows, setRows] = useState([]);
  const [codes, setCodes] = useState([]);
  const [form, setForm] = useState({month:MES_ABBR[new Date().getMonth()],year:new Date().getFullYear(),coupon_code:"",sessions:""});
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){
    const {data}=await supabase.from("sessions_by_coupon").select("*").eq("company_id",companyId);setRows(data||[]);
    const {data:cc}=await supabase.from("company_coupons").select("coupon_code").eq("company_id",companyId);setCodes((cc||[]).map(c=>c.coupon_code));
  }
  async function save(){
    if(!form.coupon_code||form.sessions===""){setMsg("Elegí el cupón y cargá las sesiones.");return;}
    const {error}=await supabase.from("sessions_by_coupon").upsert([{company_id:companyId,month:form.month,year:parseInt(form.year),coupon_code:form.coupon_code,sessions:parseInt(form.sessions)||0,source:"manual"}],{onConflict:"company_id,month,year,coupon_code"});
    if(error) setMsg("Error: "+error.message); else{setMsg("Guardado.");load();}
  }
  async function del(id){if(!ask("¿Borrar este dato?"))return;await supabase.from("sessions_by_coupon").delete().eq("id",id);load();}
  const months=[...new Set(rows.map(r=>`${r.month} ${r.year}`))].sort((a,b)=>{const [ma,ya]=a.split(" "),[mb,yb]=b.split(" ");return (yb*100+MES_ABBR.indexOf(mb))-(ya*100+MES_ABBR.indexOf(ma));}).slice(0,12);
  const allCodes=[...new Set([...codes,...rows.map(r=>r.coupon_code)])];
  return <Card>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div><div style={{fontSize:13,fontWeight:600,color:P.text}}>Sesiones por cupón</div><div style={{fontSize:11,color:P.textMuted}}>Lo completa la sincronización con la plataforma. Corregí acá solo si un mes vino mal.</div></div>
      <Btn small variant="secondary" onClick={()=>setOpen(!open)}>{open?"Cerrar":"Corregir a mano"}</Btn>
    </div>
    {open&&<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end",marginTop:10}}>
      <div style={{width:100}}><Select label="Mes" value={form.month} onChange={v=>setForm({...form,month:v})} options={MES_ABBR.map(m=>({value:m,label:m}))}/></div>
      <div style={{width:90}}><Input label="Año" value={form.year} onChange={v=>setForm({...form,year:v})} type="number"/></div>
      <div style={{width:180}}><Select label="Cupón" value={form.coupon_code} onChange={v=>setForm({...form,coupon_code:v})} options={[{value:"",label:"— Elegí —"},...allCodes.map(c=>({value:c,label:c}))]}/></div>
      <div style={{width:100}}><Input label="Sesiones" value={form.sessions} onChange={v=>setForm({...form,sessions:v})} type="number"/></div>
      <div style={{marginBottom:12}}><Btn small onClick={save}>Guardar</Btn></div>
    </div>}
    {msg&&<div style={{fontSize:11,color:P.accent,marginTop:6}}>{msg}</div>}
    {months.length===0?<div style={{fontSize:12,color:P.textMuted,marginTop:10}}>Todavía no hay sesiones por cupón.</div>:
    <div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
      <thead><tr>{["Mes",...allCodes].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",color:P.textMuted,fontSize:10.5,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${P.border}`}}>{h}</th>)}</tr></thead>
      <tbody>{months.map(m=>{const [mo,yr]=m.split(" ");return <tr key={m} style={{borderBottom:`1px solid ${P.border}`}}>
        <td style={{padding:"6px 8px",fontWeight:600,color:P.text}}>{m}</td>
        {allCodes.map(cd=>{const r=rows.find(x=>x.month===mo&&String(x.year)===yr&&x.coupon_code===cd);return <td key={cd} style={{padding:"6px 8px",color:P.text}}>
          {r?<>{r.sessions}{r.source==="manual"&&<span title="Cargado a mano" style={{color:P.accent,marginLeft:4}}>✎</span>}<button onClick={()=>del(r.id)} title="Borrar" style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:11,marginLeft:4}}>✕</button></>:<span style={{color:P.textMuted}}>—</span>}
        </td>;})}
      </tr>;})}</tbody>
    </table></div>}
  </Card>;
}

// Encuestas → resultados de la encuesta emergente por cupón (dentro de la plataforma)
function EncuestaPopupAdmin({ companyId }) {
  const [rows, setRows] = useState([]);
  const sem=(d=new Date())=>`S${d.getMonth()<6?1:2} ${d.getFullYear()}`;
  const [form, setForm] = useState({period:sem(),n:"",mejoro_trabajo:"",recomendaria:"",no_habria_consultado:""});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("encuesta_popup").select("*").eq("company_id",companyId).order("period",{ascending:false});setRows(data||[]);}
  async function save(){
    const nums=["mejoro_trabajo","recomendaria","no_habria_consultado"].map(k=>parseFloat(String(form[k]).replace(",",".")));
    if(!/^S[12] \d{4}$/.test(form.period.trim())){setMsg("El período va como S1 2026 o S2 2026.");return;}
    if(!(parseInt(form.n)>0)||nums.some(v=>isNaN(v)||v<0||v>100)){setMsg("Cargá la cantidad de respuestas y los tres porcentajes (0 a 100).");return;}
    const {error}=await supabase.from("encuesta_popup").upsert([{company_id:companyId,period:form.period.trim(),n:parseInt(form.n),mejoro_trabajo:nums[0],recomendaria:nums[1],no_habria_consultado:nums[2],source:"manual"}],{onConflict:"company_id,period"});
    if(error) setMsg("Error: "+error.message); else{setMsg("Guardado.");load();}
  }
  async function del(id){if(!ask("¿Borrar estos resultados?"))return;await supabase.from("encuesta_popup").delete().eq("id",id);load();}
  return <div style={{marginBottom:20}}>
    <SectionTitle>Encuesta emergente en la plataforma (quienes usan el beneficio)</SectionTitle>
    <div style={{fontSize:11,color:P.textMuted,marginBottom:10}}>Se muestra arriba de todo en Estrategia → Bienestar del equipo, y el "no habría consultado" también en Consultoría.</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
      <div style={{width:110}}><Input label="Período" value={form.period} onChange={v=>setForm({...form,period:v})} placeholder="S2 2026"/></div>
      <div style={{width:110}}><Input label="Respuestas" value={form.n} onChange={v=>setForm({...form,n:v})} type="number"/></div>
      <div style={{width:150}}><Input label="% mejoró en el trabajo" value={form.mejoro_trabajo} onChange={v=>setForm({...form,mejoro_trabajo:v})}/></div>
      <div style={{width:130}}><Input label="% lo recomendaría" value={form.recomendaria} onChange={v=>setForm({...form,recomendaria:v})}/></div>
      <div style={{width:170}}><Input label="% no habría consultado" value={form.no_habria_consultado} onChange={v=>setForm({...form,no_habria_consultado:v})}/></div>
      <div style={{marginBottom:12}}><Btn small onClick={save}>Guardar</Btn></div>
    </div>
    {msg&&<div style={{fontSize:11,color:P.accent,marginBottom:8}}>{msg}</div>}
    {rows.map(r=><div key={r.id} style={{display:"flex",gap:14,alignItems:"center",fontSize:12,padding:"6px 0",borderBottom:`1px solid ${P.border}`,flexWrap:"wrap"}}>
      <b style={{color:P.text,width:70}}>{r.period}</b><span style={{color:P.textMuted}}>{r.n} respuestas</span>
      <span>{r.mejoro_trabajo}% mejoró</span><span>{r.recomendaria}% recomendaría</span><span>{r.no_habria_consultado}% no habría consultado</span>
      <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",marginLeft:"auto"}}>🗑</button>
    </div>)}
  </div>;
}

// Encuestas → reunión semestral de resultados + informe descargable (Consultoría)
function ReunionesSemestrales({ companyId }) {
  const [rows, setRows] = useState([]);
  const sem=(d=new Date())=>`S${d.getMonth()<6?1:2} ${d.getFullYear()}`;
  const [form, setForm] = useState({period:sem(),date:"",time:"",minutes_url:"",report_url:"",_report:null});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("reuniones_semestrales").select("*").eq("company_id",companyId).order("period",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!/^S[12] \d{4}$/.test(form.period.trim())){setMsg("El semestre va como S1 2026 o S2 2026.");return;}
    const payload={company_id:companyId,period:form.period.trim(),date:form.date||null,time:form.time||null,minutes_url:form.minutes_url.trim()||null,report_url:form.report_url.trim()||null};
    const {data:saved,error}=await supabase.from("reuniones_semestrales").upsert([payload],{onConflict:"company_id,period"}).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._report){const u=await uploadTo("informes",`${companyId}/semestral-${payload.period.replace(" ","-")}.pdf`,form._report); if(u) await supabase.from("reuniones_semestrales").update({report_url:u}).eq("id",saved.id);}
    setMsg("Guardado.");setForm({period:sem(),date:"",time:"",minutes_url:"",report_url:"",_report:null});load();
  }
  async function del(id){if(!ask("¿Borrar esta reunión?"))return;await supabase.from("reuniones_semestrales").delete().eq("id",id);load();}
  return <div style={{marginBottom:20}}>
    <SectionTitle>Reunión semestral e informe de resultados</SectionTitle>
    <div style={{fontSize:11,color:P.textMuted,marginBottom:10}}>Aparece en Consultoría, en la tarjeta de cada semestre. Sin fecha, el dash muestra el botón para agendar con la referente.</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
      <div style={{width:110}}><Input label="Semestre" value={form.period} onChange={v=>setForm({...form,period:v})} placeholder="S1 2026"/></div>
      <div style={{width:150}}><Input label="Fecha de la reunión" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/></div>
      <div style={{width:100}}><Input label="Hora" value={form.time} onChange={v=>setForm({...form,time:v})} placeholder="10:00"/></div>
      <div style={{flex:1,minWidth:200}}><Input label="Link a la minuta (opcional)" value={form.minutes_url} onChange={v=>setForm({...form,minutes_url:v})}/></div>
    </div>
    <FileOrLink label="Informe de resultados (PDF)" url={form.report_url} file={form._report} onUrl={v=>setForm({...form,report_url:v})} onFile={f=>setForm({...form,_report:f})} accept=".pdf"/>
    <Btn small onClick={save}>Guardar</Btn>
    {msg&&<div style={{fontSize:11,color:P.accent,margin:"8px 0"}}>{msg}</div>}
    <div style={{marginTop:10}}>{rows.map(r=><div key={r.id} style={{display:"flex",gap:14,alignItems:"center",fontSize:12,padding:"6px 0",borderBottom:`1px solid ${P.border}`,flexWrap:"wrap"}}>
      <b style={{color:P.text,width:70}}>{r.period}</b>
      <span style={{color:r.date?P.text:P.accent}}>{r.date?`Reunión ${r.date}${r.time?` · ${r.time}`:""}`:"Sin fecha"}</span>
      {r.report_url?<a href={r.report_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontWeight:600,textDecoration:"none"}}>Informe ↗</a>:<span style={{color:P.accent}}>Falta el informe</span>}
      {r.minutes_url&&<a href={r.minutes_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontWeight:600,textDecoration:"none"}}>Minuta ↗</a>}
      <button onClick={()=>{setForm({period:r.period,date:r.date||"",time:r.time||"",minutes_url:r.minutes_url||"",report_url:r.report_url||"",_report:null});}} style={{background:"none",border:"none",color:P.accent,cursor:"pointer",marginLeft:"auto"}} title="Editar">✏️</button>
      <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer"}} title="Borrar">🗑</button>
    </div>)}</div>
  </div>;
}

// Menú global → Sincronización con la plataforma (MySQL)
function SincronizacionView() {
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[]);
  async function load(){const {data}=await supabase.from("sync_runs").select("*").order("started_at",{ascending:false}).limit(15);setRuns(data||[]);}
  async function run(){
    setRunning(true);setMsg("");setResult(null);
    try{
      if(IS_PREVIEW){
        await new Promise(r=>setTimeout(r,900));
        setResult({dryRun:true,periodLabel:"Oct 2026",companies:[{company:"Empresa Demo",codes:["#bienestardemo","#demoparticular"],unknownCodes:[],months:14,reasons:15,diffCount:1,diffs:[{month:"Oct 2026",field:"nuevos",loaded:3,mysql:4}]}]});
      } else {
        const {data:{session}}=await supabase.auth.getSession();
        const r=await fetch("/api/sync-mysql",{method:"POST",headers:{Authorization:`Bearer ${session?.access_token}`}});
        const j=await r.json(); if(!r.ok||!j.ok) throw new Error(j.error||`Error ${r.status}`);
        setResult(j);
      }
      load();
    }catch(e){setMsg("No se pudo sincronizar: "+e.message);}
    setRunning(false);
  }
  const FIELD={canjeadas:"Sesiones",realizadas:"Realizadas",activos:"Activos",nuevos:"Nuevos",total_historico:"Total histórico",primera_vez:"Primera vez","(mes nuevo)":"Mes que no estaba cargado"};
  return <div style={{padding:"24px 28px",maxWidth:900}}>
    <div style={{fontSize:13,color:P.textMuted,lineHeight:1.6,marginBottom:16}}>
      Todos los días a las 3:17 (hora de Uruguay) el sistema lee la plataforma y actualiza sesiones, sesiones por cupón, personas activas, nuevas, primera vez y motivos de consulta de cada empresa. Solo trae totales: nunca datos de una persona.
    </div>
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:220}}>
          <div style={{fontSize:14,fontWeight:700,color:P.text}}>Sincronizar ahora</div>
          <div style={{fontSize:11,color:P.textMuted}}>En modo prueba calcula y compara contra lo cargado, sin cambiar nada.</div>
        </div>
        <Btn onClick={run} disabled={running}>{running?"Sincronizando…":"Sincronizar ahora"}</Btn>
      </div>
      {msg&&<div style={{fontSize:12,color:P.red,marginTop:10}}>{msg}</div>}
      {result&&<div style={{marginTop:14,borderTop:`1px solid ${P.border}`,paddingTop:12}}>
        <div style={{fontSize:12,fontWeight:700,color:result.dryRun?P.accent:P.primary,marginBottom:8}}>{result.dryRun?"Modo prueba: no se escribió nada":"Datos actualizados"} · motivos al {result.periodLabel}</div>
        {result.companies.map(c=><div key={c.company} style={{padding:"8px 0",borderBottom:`1px solid ${P.border}`,fontSize:12}}>
          <b style={{color:P.text}}>{c.company}</b>{" "}
          {c.skipped?<span style={{color:P.accent}}>· {c.skipped} (cargalos en Configuración)</span>
           :<span style={{color:P.textMuted}}>· {c.months} meses · {c.reasons} motivos · {c.diffCount===0?"coincide con lo cargado ✓":`${c.diffCount} diferencias con lo cargado`}</span>}
          {c.unknownCodes?.length>0&&<div style={{color:P.red}}>Estos cupones no existen en la plataforma: {c.unknownCodes.join(", ")}</div>}
          {c.diffs?.length>0&&<table style={{marginTop:6,borderCollapse:"collapse",fontSize:11.5}}><tbody>
            {c.diffs.slice(0,10).map((d,i)=><tr key={i}><td style={{padding:"2px 10px 2px 0",color:P.textMuted}}>{d.month}</td><td style={{padding:"2px 10px 2px 0"}}>{FIELD[d.field]||d.field}</td><td style={{padding:"2px 10px 2px 0"}}>cargado: <b>{d.loaded??"—"}</b></td><td>plataforma: <b>{d.mysql}</b></td></tr>)}
          </tbody></table>}
        </div>)}
      </div>}
    </Card>
    <SectionTitle>Últimas corridas</SectionTitle>
    {runs.length===0?<div style={{fontSize:12,color:P.textMuted}}>Todavía no corrió.</div>:
    <div style={{display:"flex",flexDirection:"column",gap:6}}>{runs.map(r=><div key={r.id} style={{display:"flex",gap:12,fontSize:12,background:P.white,border:`1px solid ${P.border}`,borderRadius:8,padding:"8px 12px",flexWrap:"wrap"}}>
      <span style={{color:r.status==="ok"?P.primary:r.status==="error"?P.red:P.accent,fontWeight:700}}>{r.status==="ok"?"✓ OK":r.status==="error"?"✕ Error":"… En curso"}</span>
      <span style={{color:P.text}}>{new Date(r.started_at).toLocaleString("es-UY")}</span>
      <span style={{color:P.textMuted}}>{r.trigger==="cron"?"automática":"manual"}{r.dry_run?" · prueba":""}</span>
      {r.error&&<span style={{color:P.red}}>{r.error}</span>}
      {r.summary?.diffs&&<span style={{color:P.textMuted}}>{r.summary.diffs.length} diferencias</span>}
    </div>)}</div>}
  </div>;
}

// ── TALLERES TAB ───────────────────────────────────────────────────
// Iniciativas (taller, contención, evento, stand, activación) + recomendaciones con audiencia/formato/por qué.
const INIT_TYPES=[{value:"taller",label:"Taller temático"},{value:"contencion",label:"Taller de contención grupal"},{value:"evento",label:"Participación en evento"},{value:"stand",label:"Activación con stand"},{value:"activacion",label:"Activación"}];
const INIT_LABEL=Object.fromEntries(INIT_TYPES.map(t=>[t.value,t.label]));
const isTallerType=(t)=>t==="taller"||t==="contencion"||!t;
const EMPTY_TALLER={initiative_type:"taller",title:"",date:"",speaker:"",initials:"",participants:"",rating:"",responses:"",survey_url:"",report_url:"",material_url:"",cost:"",cost_usd:"",_report:null,_material:null};
const EMPTY_REC={audience:"colaboradores",title:"",format:"",reason:"",month:""};

// Sube un archivo a un bucket y devuelve su URL pública (o null si falla)
async function uploadTo(bucket, path, file){
  const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type});
  if(error) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
// Campo "archivo o link": se puede pegar un link o elegir un archivo para subir
function FileOrLink({ label, url, file, onUrl, onFile, accept="*" }){
  return <div style={{marginBottom:12}}>
    <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <input value={url||""} onChange={e=>onUrl(e.target.value)} placeholder="Pegá un link…" style={{flex:1,minWidth:180,padding:"8px 10px",border:`1px solid ${P.border}`,borderRadius:7,fontSize:12,fontFamily:"inherit"}}/>
      <span style={{fontSize:11,color:P.textMuted}}>o</span>
      <label style={{display:"inline-flex",alignItems:"center",gap:6,background:P.white,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
        📎 {file?file.name:"Subir archivo"}
        <input type="file" accept={accept} style={{display:"none"}} onChange={e=>e.target.files[0]&&onFile(e.target.files[0])}/>
      </label>
    </div>
  </div>;
}

function TalleresTab({ companyId }) {
  const [subtab, setSubtab] = useState("realizados");
  const [rows, setRows] = useState([]);
  const [recs, setRecs] = useState([]);
  const [talleristas, setTalleristas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showRecForm, setShowRecForm] = useState(false);
  const [editingRecId, setEditingRecId] = useState(null);
  const [form, setForm] = useState(EMPTY_TALLER);
  const [recForm, setRecForm] = useState(EMPTY_REC);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); loadRecs(); (async()=>{const {data}=await supabase.from("talleristas").select("*").order("name");setTalleristas(data||[]);})(); },[companyId]);
  async function load(){const {data}=await supabase.from("workshops").select("*").eq("company_id",companyId).order("date",{ascending:false});setRows(data||[]);}
  async function loadRecs(){const {data}=await supabase.from("workshops_recommended").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRecs(data||[]);}
  function resetForm(){ setForm(EMPTY_TALLER); setEditingId(null); }
  function editRow(r){
    setForm({...EMPTY_TALLER,...Object.fromEntries(Object.keys(EMPTY_TALLER).filter(k=>!k.startsWith("_")).map(k=>[k,r[k]??""])),initiative_type:r.initiative_type||"taller"});
    setEditingId(r.id); setShowForm(true);
  }
  async function save(){
    if(!form.title||!form.date){setMsg("Título y fecha son obligatorios.");return;}
    const rt=parseFloat(String(form.rating).replace(",","."));
    if(form.rating!==""&&(isNaN(rt)||rt<0||rt>10)){setMsg("La satisfacción va de 0 a 10.");return;}
    setSaving(true);
    const taller=isTallerType(form.initiative_type);
    const tal=talleristas.find(t=>t.name===form.speaker);
    const payload={initiative_type:form.initiative_type,title:form.title.trim(),date:form.date,
      speaker:taller?form.speaker||null:null,initials:taller?(tal?.initials||form.initials||null):null,
      participants:parseInt(form.participants)||null,
      rating:taller&&form.rating!==""?rt:null,responses:taller?parseInt(form.responses)||null:null,
      survey_url:taller?form.survey_url.trim()||null:null,report_url:taller?form.report_url.trim()||null:null,
      material_url:form.material_url.trim()||null,cost:parseInt(form.cost)||null,cost_usd:parseFloat(form.cost_usd)||null};
    const {data:saved,error}= editingId
      ? await supabase.from("workshops").update(payload).eq("id",editingId).select().single()
      : await supabase.from("workshops").insert([{...payload,company_id:companyId}]).select().single();
    if(error){setSaving(false);setMsg("Error: "+error.message);return;}
    // Archivos: informe de resultados → bucket "informes"; material → bucket "contenido"
    const ups={};
    if(form._report){const u=await uploadTo("informes",`${companyId}/talleres/${saved.id}-informe.${form._report.name.split(".").pop()}`,form._report); if(u) ups.report_url=u;}
    if(form._material){const u=await uploadTo("contenido",`${companyId}/talleres/${saved.id}-material.${form._material.name.split(".").pop()}`,form._material); if(u) ups.material_url=u;}
    if(Object.keys(ups).length) await supabase.from("workshops").update(ups).eq("id",saved.id);
    setSaving(false);setMsg(editingId?"Iniciativa actualizada.":"Iniciativa guardada.");setShowForm(false);load();resetForm();
  }
  async function saveRec(){
    if(!recForm.title){setMsg("El nombre del taller o ciclo es obligatorio.");return;}
    const payload={audience:recForm.audience,title:recForm.title.trim(),format:recForm.format.trim()||null,reason:recForm.reason.trim()||null,month:recForm.month.trim()||null};
    const {error}= editingRecId
      ? await supabase.from("workshops_recommended").update(payload).eq("id",editingRecId)
      : await supabase.from("workshops_recommended").insert([{...payload,company_id:companyId}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Recomendación guardada.");setShowRecForm(false);setEditingRecId(null);loadRecs();setRecForm(EMPTY_REC);}
  }
  async function del(id){if(!ask("¿Borrar esta iniciativa?"))return;await supabase.from("workshops").delete().eq("id",id);load();}
  async function delRec(id){if(!ask("¿Borrar esta recomendación?"))return;await supabase.from("workshops_recommended").delete().eq("id",id);loadRecs();}
  const taller=isTallerType(form.initiative_type);
  const n1=(v)=>v==null||v===""?"":String(v).replace(".",",");
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${P.border}`}}>
      {[["realizados","Iniciativas realizadas"],["recomendados","Recomendaciones"]].map(([t,l])=><button key={t} onClick={()=>setSubtab(t)} style={{fontSize:12,fontWeight:subtab===t?600:400,color:subtab===t?P.primary:P.textMuted,background:"none",border:"none",borderBottom:subtab===t?`2px solid ${P.primary}`:"2px solid transparent",padding:"8px 14px",cursor:"pointer"}}>{l}</button>)}
    </div>
    {subtab==="realizados"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:13,color:P.textMuted}}>{rows.length} iniciativas</div>
        <Btn small onClick={()=>{ if(showForm){setShowForm(false);resetForm();} else {resetForm();setShowForm(true);} }}>+ Agregar iniciativa</Btn>
      </div>
      {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
        <div style={{fontSize:12,fontWeight:700,color:P.primary,marginBottom:10}}>{editingId?"Editar iniciativa":"Nueva iniciativa"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Select label="Tipo de iniciativa" value={form.initiative_type} onChange={v=>setForm({...form,initiative_type:v})} options={INIT_TYPES}/>
          <Input label="Nombre" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Concientización en salud mental"/>
          <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/>
          <Input label={taller?"Participantes":"Personas que participaron"} value={form.participants} onChange={v=>setForm({...form,participants:v})} type="number"/>
          {taller&&<Select label="Tallerista" value={form.speaker} onChange={v=>setForm({...form,speaker:v})} options={[{value:"",label:"— Elegí —"},...talleristas.map(t=>({value:t.name,label:t.name}))]}/>}
          {taller&&<Input label="Satisfacción (0 a 10)" value={form.rating} onChange={v=>setForm({...form,rating:v})} placeholder="ej. 9,2"/>}
          {taller&&<Input label="Cantidad de respuestas de la encuesta" value={form.responses} onChange={v=>setForm({...form,responses:v})} type="number"/>}
          {taller&&<Input label="Link de la encuesta de feedback (Typeform)" value={form.survey_url} onChange={v=>setForm({...form,survey_url:v})} placeholder="https://form.typeform.com/…"/>}
          <Input label="Costo pagado (UYU) — se usa en inversión" value={form.cost} onChange={v=>setForm({...form,cost:v})} type="number" placeholder="ej. 28000"/>
          <Input label="Costo facturado (USD) — referencia" value={form.cost_usd} onChange={v=>setForm({...form,cost_usd:v})} type="number" placeholder="ej. 732"/>
        </div>
        {taller&&<FileOrLink label="Informe de resultados" url={form.report_url} file={form._report} onUrl={v=>setForm({...form,report_url:v})} onFile={f=>setForm({...form,_report:f})} accept=".pdf"/>}
        <FileOrLink label={taller?"Contenido post-taller":"Material de la activación"} url={form.material_url} file={form._material} onUrl={v=>setForm({...form,material_url:v})} onFile={f=>setForm({...form,_material:f})}/>
        {taller&&talleristas.length===0&&<div style={{fontSize:11,color:P.accent,marginBottom:10}}>No hay talleristas cargados: agregalos en el menú Talleristas para elegirlos acá (con su foto).</div>}
        <div style={{display:"flex",gap:8}}><Btn small onClick={save} disabled={saving}>{saving?"Guardando…":editingId?"Actualizar":"Guardar"}</Btn><Btn small variant="secondary" onClick={()=>{setShowForm(false);resetForm();}}>Cancelar</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin iniciativas aún.</div></Card>}
        {rows.map(r=>{const tl=isTallerType(r.initiative_type); return <div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:700,color:P.accent,textTransform:"uppercase",letterSpacing:"0.05em"}}>{INIT_LABEL[r.initiative_type]||"Taller temático"}</div>
            <div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>
            <div style={{fontSize:11,color:P.textMuted}}>{r.date}{tl&&r.speaker?` · ${r.speaker}`:""}{r.participants?` · ${r.participants} participantes`:""}{r.cost?` · $ ${new Intl.NumberFormat("es-UY").format(r.cost)}`:""}</div>
            <div style={{display:"flex",gap:10,fontSize:11,marginTop:3,flexWrap:"wrap"}}>
              {tl&&(r.rating!=null?<span style={{color:P.primary,fontWeight:700}}>★ {n1(r.rating)}/10 · {r.responses||0} respuestas</span>:<span style={{color:P.accent}}>Falta la satisfacción</span>)}
              {tl&&!r.survey_url&&<span style={{color:P.accent}}>Falta el link de la encuesta</span>}
              {tl&&!r.report_url&&<span style={{color:P.accent}}>Falta el informe</span>}
              {r.material_url&&<a href={r.material_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontWeight:600,textDecoration:"none"}}>Material ↗</a>}
              {tl&&r.report_url&&<a href={r.report_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontWeight:600,textDecoration:"none"}}>Informe ↗</a>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>editRow(r)} style={{background:"none",border:"none",color:P.accent,cursor:"pointer",fontSize:15}} title="Editar">✏️</button>
            <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}} title="Borrar">🗑</button>
          </div>
        </div>;})}
      </div>
    </>}
    {subtab==="recomendados"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:13,color:P.textMuted}}>{recs.length} recomendaciones · se muestran arriba de todo en Talleres</div>
        <Btn small onClick={()=>{setShowRecForm(!showRecForm);setEditingRecId(null);setRecForm(EMPTY_REC);}}>+ Agregar recomendación</Btn>
      </div>
      {showRecForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Select label="Audiencia" value={recForm.audience} onChange={v=>setRecForm({...recForm,audience:v})} options={[{value:"colaboradores",label:"Para colaboradores"},{value:"lideres",label:"Para líderes"}]}/>
          <Input label="Nombre del taller o ciclo" value={recForm.title} onChange={v=>setRecForm({...recForm,title:v})} placeholder="ej. Liderar equipos bajo presión"/>
          <Input label="Formato" value={recForm.format} onChange={v=>setRecForm({...recForm,format:v})} placeholder="ej. Ciclo de 3 encuentros · uno por mes"/>
          <Input label="Mes sugerido (opcional)" value={recForm.month} onChange={v=>setRecForm({...recForm,month:v})} placeholder="ej. Mar 2027"/>
        </div>
        <Textarea label="Por qué: el dato de motivos que lo justifica" value={recForm.reason} onChange={v=>setRecForm({...recForm,reason:v})} rows={2} placeholder="ej. El estrés laboral subió 6 puntos desde julio y ya es el segundo motivo de consulta."/>
        <div style={{display:"flex",gap:8}}><Btn small onClick={saveRec}>{editingRecId?"Actualizar":"Guardar"}</Btn><Btn small variant="secondary" onClick={()=>{setShowRecForm(false);setEditingRecId(null);}}>Cancelar</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {recs.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin recomendaciones aún.</div></Card>}
        {recs.map(r=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:700,color:P.accent,textTransform:"uppercase",letterSpacing:"0.05em"}}>{r.audience==="lideres"?"Para líderes":"Para colaboradores"}{r.month?` · ${r.month}`:""}</div>
            <div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>
            {(r.format||r.descripcion)&&<div style={{fontSize:11,color:P.textMuted}}>{r.format||r.descripcion}</div>}
            {r.reason?<div style={{fontSize:11,color:P.text,marginTop:2}}><b>Por qué:</b> {r.reason}</div>:<div style={{fontSize:11,color:P.accent,marginTop:2}}>Falta el "por qué"</div>}
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>{setRecForm({audience:r.audience||"colaboradores",title:r.title||"",format:r.format||r.descripcion||"",reason:r.reason||"",month:r.month||""});setEditingRecId(r.id);setShowRecForm(true);}} style={{background:"none",border:"none",color:P.accent,cursor:"pointer",fontSize:15}} title="Editar">✏️</button>
            <button onClick={()=>delRec(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}} title="Borrar">🗑</button>
          </div>
        </div>)}
      </div>
    </>}
  </div>;
}

// ── CONTENIDO TAB ──────────────────────────────────────────────────
// Piezas por sección del dash + el feedback (estrellas y comentarios) que deja RRHH en cada una.
const CONTENT_CATS=[{value:"protocolo",label:"Protocolos · acceso rápido"},{value:"lideres",label:"Para líderes"},{value:"colaboradores",label:"Para colaboradores"},{value:"mensual",label:"Qué compartir cada mes"},{value:"beneficio",label:"Comunicar el beneficio"}];
const CAT_LABEL=Object.fromEntries(CONTENT_CATS.map(c=>[c.value,c.label]));
const MESES_FULL=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const EMPTY_CONTENT={category:"lideres",title:"",format:"",description:"",file_url:"",_file:null};

function ContenidoTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CONTENT);
  const [openFb, setOpenFb] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){
    const {data}=await supabase.from("content").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);
    const {data:fb}=await supabase.from("content_feedback").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setFeedback(fb||[]);
  }
  function resetForm(){setForm(EMPTY_CONTENT);setEditingId(null);}
  async function save(){
    if(!form.title){setMsg("El título es obligatorio.");return;}
    if(form.category==="mensual"&&!MESES_FULL.includes(form.format)){setMsg("Para \"Qué compartir cada mes\" elegí el mes.");return;}
    const payload={category:form.category,title:form.title.trim(),format:form.format.trim()||null,description:form.description.trim()||null,
      type:(form.format||"").split(" ·")[0]||null,file_url:form.file_url.trim()||null};
    const {data:saved,error}= editingId
      ? await supabase.from("content").update(payload).eq("id",editingId).select().single()
      : await supabase.from("content").insert([{...payload,company_id:companyId,is_new:true,date:new Date().toISOString().slice(0,10)}]).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._file){const u=await uploadTo("contenido",`${companyId}/${saved.id}.${form._file.name.split(".").pop()}`,form._file); if(u) await supabase.from("content").update({file_url:u}).eq("id",saved.id);}
    setMsg(editingId?"Contenido actualizado.":"Contenido agregado.");setShowForm(false);resetForm();load();
  }
  async function del(id){if(!ask("¿Borrar este contenido? También se borra su feedback."))return;await supabase.from("content").delete().eq("id",id);load();}
  const fbOf=(id)=>feedback.filter(f=>f.content_id===id);
  const avg=(list)=>list.length?String(Math.round(list.reduce((s,f)=>s+f.stars,0)/list.length*10)/10).replace(".",","):null;
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,gap:10,flexWrap:"wrap"}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} piezas · {feedback.length} respuestas de RRHH</div>
      <Btn small onClick={()=>{if(showForm){setShowForm(false);resetForm();}else{resetForm();setShowForm(true);}}}>+ Agregar contenido</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Select label="Sección del dash" value={form.category} onChange={v=>setForm({...form,category:v,format:v==="mensual"?MESES_FULL[new Date().getMonth()]:""})} options={CONTENT_CATS}/>
        <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Primeros auxilios psicológicos"/>
        {form.category==="mensual"
          ? <Select label="Mes" value={form.format} onChange={v=>setForm({...form,format:v})} options={MESES_FULL.map(m=>({value:m,label:m}))}/>
          : <Input label="Formato (se muestra como etiqueta)" value={form.format} onChange={v=>setForm({...form,format:v})} placeholder="ej. Guía · PDF, Video · 6 min, PDF · 4 páginas"/>}
        <Input label="Descripción corta" value={form.description} onChange={v=>setForm({...form,description:v})} placeholder="ej. Qué mirar y cuándo escalar."/>
      </div>
      <FileOrLink label="Archivo o link" url={form.file_url} file={form._file} onUrl={v=>setForm({...form,file_url:v})} onFile={f=>setForm({...form,_file:f})}/>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>{editingId?"Actualizar":"Guardar"}</Btn><Btn small variant="secondary" onClick={()=>{setShowForm(false);resetForm();}}>Cancelar</Btn></div>
    </Card>}
    {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin contenido aún.</div></Card>}
    {[...CONTENT_CATS,{value:"__otros",label:"Sin sección (no se muestra en el dash)"}].map(cat=>{
      const items=rows.filter(r=>cat.value==="__otros"?!CAT_LABEL[r.category]:r.category===cat.value);
      if(!items.length) return null;
      return <div key={cat.value} style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:cat.value==="__otros"?P.accent:P.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{cat.label}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {items.map(r=>{const fb=fbOf(r.id); return <div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              {r.format&&<Badge text={r.format}/>}
              <div style={{flex:1,minWidth:160}}><div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>{r.description&&<div style={{fontSize:11,color:P.textMuted}}>{r.description}</div>}</div>
              <button onClick={()=>setOpenFb(openFb===r.id?null:r.id)} disabled={!fb.length} style={{background:"none",border:"none",cursor:fb.length?"pointer":"default",fontSize:12,fontWeight:600,color:fb.length?"#b8892e":P.textMuted}}>{fb.length?`★ ${avg(fb)} · ${fb.length} ${fb.length===1?"respuesta":"respuestas"}`:"Sin feedback"}</button>
              {r.file_url?<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>:<span style={{fontSize:11,color:P.accent}}>Falta el archivo</span>}
              <button onClick={()=>{setForm({category:r.category||"lideres",title:r.title||"",format:r.format||"",description:r.description||"",file_url:r.file_url||"",_file:null});setEditingId(r.id);setShowForm(true);}} style={{background:"none",border:"none",color:P.accent,cursor:"pointer",fontSize:15}} title="Editar">✏️</button>
              <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}} title="Borrar">🗑</button>
            </div>
            {openFb===r.id&&<div style={{marginTop:10,borderTop:`1px solid ${P.border}`,paddingTop:8,display:"flex",flexDirection:"column",gap:6}}>
              {fb.map(f=><div key={f.id} style={{fontSize:12,color:P.text}}><span style={{color:"#b8892e"}}>{"★".repeat(f.stars)}{"☆".repeat(5-f.stars)}</span> <span style={{color:P.textMuted}}>· {f.user_email} · {new Date(f.created_at).toLocaleDateString("es-UY")}</span>{f.comment&&<div style={{marginTop:2}}>“{f.comment}”</div>}</div>)}
            </div>}
          </div>;})}
        </div>
      </div>;
    })}
  </div>;
}

// ── MOTIVOS TAB ────────────────────────────────────────────────────
function MotivosTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({reason:"",percentage:"",count:"",period:""});
  const [msg, setMsg] = useState("");
  const [importing, setImporting] = useState(false);
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("consultation_reasons").select("*").eq("company_id",companyId).order("percentage",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!form.reason){setMsg("El motivo es obligatorio.");return;}
    const {error}=await supabase.from("consultation_reasons").insert([{...form,company_id:companyId,percentage:parseFloat(form.percentage)||null,count:parseInt(form.count)||null}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Guardado.");setShowForm(false);load();setForm({reason:"",percentage:"",count:"",period:""});}
  }
  async function del(id){await supabase.from("consultation_reasons").delete().eq("id",id);load();}

  async function importCSV(file) {
    setImporting(true); setMsg("");
    try {
      const rawText = await file.text();
      const text = rawText.replace(/^\uFEFF/, "");
      const sep = text.split("\n")[0].includes(";") ? ";" : ",";
      const lines = text.trim().split(/\r?\n/);
      // Find header row: col0="empresa" AND col1 contains "motivo"
      let headerIdx = -1;
      for(let i=0;i<lines.length;i++){
        const cells = lines[i].split(sep);
        if((cells[0]||"").trim().toLowerCase()==="empresa" && (cells[1]||"").trim().toLowerCase().includes("motivo")){
          headerIdx = i; break;
        }
      }
      if(headerIdx<0){ setMsg("No se encontró la fila de encabezados."); setImporting(false); return; }
      // col0=Empresa, col1=Motivo, col2=Cantidad, col3=%, col4=Período
      const rows_to_insert = [];
      for(let i=headerIdx+1; i<lines.length; i++){
        const cells = lines[i].split(sep).map(v=>(v||"").trim().replace(/"/g,""));
        if(cells.join("").trim()==="") continue;
        if((cells[0]||"").toLowerCase().startsWith("total")) continue;
        if((cells[0]||"").includes("📌")||(cells[0]||"").toLowerCase().includes("instruc")||(cells[0]||"").toLowerCase().includes("fuente")) continue;
        const reason = (cells[1]||"").trim();
        if(!reason) continue;
        const count = parseInt((cells[2]||"").replace(/[^0-9]/g,""))||null;
        const pct = parseFloat((cells[3]||"").replace(",",".").replace(/[^0-9.]/g,""))||null;
        const period = (cells[4]||"").trim();
        rows_to_insert.push({company_id:companyId, reason, count, percentage:pct, period});
      }
      if(rows_to_insert.length===0){ setMsg("No se encontraron motivos válidos."); setImporting(false); return; }
      // Reemplaza solo los períodos que vienen en el CSV: el historial queda para comparar en el dash
      for(const per of [...new Set(rows_to_insert.map(r=>r.period||""))]){
        const q=supabase.from("consultation_reasons").delete().eq("company_id",companyId);
        await (per?q.eq("period",per):q.is("period",null));
      }
      const {error} = await supabase.from("consultation_reasons").insert(rows_to_insert);
      if(error) setMsg("Error: "+error.message);
      else { setMsg(`✓ ${rows_to_insert.length} motivos importados.`); load(); }
    } catch(e) { setMsg("Error: "+e.message); }
    setImporting(false);
  }
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} motivos</div>
      <div style={{display:"flex",gap:8}}>
        <label style={{display:"inline-flex",alignItems:"center",gap:6,background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:importing?"not-allowed":"pointer",opacity:importing?0.6:1}}>
          {importing?"⏳ Importando...":"⬆ Importar CSV"}
          <input type="file" accept=".csv" style={{display:"none"}} disabled={importing} onChange={async e=>{
            if(e.target.files[0]) { await importCSV(e.target.files[0]); e.target.value=""; }
          }}/>
        </label>
        <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar motivo</Btn>
      </div>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Motivo" value={form.reason} onChange={v=>setForm({...form,reason:v})} placeholder="ej. Ansiedad"/>
        <Input label="Porcentaje (%)" value={form.percentage} onChange={v=>setForm({...form,percentage:v})} type="number"/>
        <Input label="Cantidad (opcional)" value={form.count} onChange={v=>setForm({...form,count:v})} type="number"/>
        <Input label="Período" value={form.period} onChange={v=>setForm({...form,period:v})} placeholder="ej. Q1 2026"/>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin motivos aún.</div></Card>}
      {rows.map((r,i)=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:24,height:24,borderRadius:"50%",background:i===0?P.primary:P.lighter,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{color:i===0?"#fff":P.primary,fontSize:10,fontWeight:700}}>#{i+1}</span>
        </div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.reason}</div>{r.period&&<div style={{fontSize:11,color:P.textMuted}}>{r.period}</div>}</div>
        {r.percentage!=null&&<span style={{fontSize:14,fontWeight:700,color:P.primary}}>{r.percentage}%</span>}
        {r.count!=null&&<span style={{fontSize:12,color:P.textMuted}}>{r.count} casos</span>}
        <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
      </div>)}
    </div>
  </div>;
}

// ── RECOMENDACIONES TAB ────────────────────────────────────────────
function RecomendacionesTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({action:"",reason:"",urgency:"media",date:new Date().toLocaleDateString("es-UY",{day:"2-digit",month:"short",year:"numeric"})});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("recommendations").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!form.action){setMsg("La acción es obligatoria.");return;}
    const {error}=await supabase.from("recommendations").insert([{...form,company_id:companyId}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Guardado.");setShowForm(false);load();setForm({action:"",reason:"",urgency:"media",date:new Date().toLocaleDateString("es-UY",{day:"2-digit",month:"short",year:"numeric"})});}
  }
  async function del(id){await supabase.from("recommendations").delete().eq("id",id);load();}
  const UC={alta:{bg:P.redBg,tx:P.red},media:{bg:P.accentBg,tx:P.accent},baja:{bg:P.lighter,tx:P.primary}};
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} recomendaciones</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Nueva</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <Input label="Acción sugerida" value={form.action} onChange={v=>setForm({...form,action:v})} placeholder="ej. Lanzar campaña Q2"/>
      <Textarea label="Hallazgo clínico" value={form.reason} onChange={v=>setForm({...form,reason:v})} placeholder="Describí el hallazgo que justifica esta recomendación..." rows={2}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Select label="Urgencia" value={form.urgency} onChange={v=>setForm({...form,urgency:v})} options={[{value:"alta",label:"Urgente"},{value:"media",label:"Media prioridad"},{value:"baja",label:"A considerar"}]}/>
        <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})}/>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin recomendaciones aún.</div></Card>}
      {rows.map(r=>{const u=UC[r.urgency]||UC.media;return <Card key={r.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,marginBottom:6}}><Badge text={r.urgency==="alta"?"Urgente":r.urgency==="media"?"Media":"A considerar"} bg={u.bg} color={u.tx}/><span style={{fontSize:11,color:P.textMuted}}>{r.date}</span></div>
            <div style={{fontSize:13,fontWeight:700,color:P.text,marginBottom:4}}>{r.action}</div>
            <div style={{fontSize:12,color:P.textMuted,lineHeight:1.6}}>{r.reason}</div>
          </div>
          <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,marginLeft:10,flexShrink:0}}>🗑</button>
        </div>
      </Card>;})}
    </div>
  </div>;
}

// ── HITOS TAB ──────────────────────────────────────────────────────
function HitosTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({label:"",value:"",date:"",reached:false,icon:"🎯"});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("milestones").select("*").eq("company_id",companyId).order("value",{ascending:true});setRows(data||[]);}
  async function save(){
    if(!form.label){setMsg("Título obligatorio.");return;}
    const {error}=await supabase.from("milestones").insert([{...form,company_id:companyId,value:parseInt(form.value)||null}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Hito guardado.");setShowForm(false);load();setForm({label:"",value:"",date:"",reached:false,icon:"🎯"});}
  }
  async function toggle(r){await supabase.from("milestones").update({reached:!r.reached,date:!r.reached?new Date().toLocaleDateString("es-UY",{month:"short",year:"numeric"}):null}).eq("id",r.id);load();}
  async function del(id){await supabase.from("milestones").delete().eq("id",id);load();}
  const ICONS=["🎯","🏆","⭐","🚀","💚","🎉","👥","📈","💪","🤝"];
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} hitos · {rows.filter(r=>r.reached).length} alcanzados</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Nuevo hito</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Título" value={form.label} onChange={v=>setForm({...form,label:v})} placeholder="ej. 100 sesiones realizadas"/>
        <Input label="Valor" value={form.value} onChange={v=>setForm({...form,value:v})} type="number" placeholder="ej. 100"/>
        <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})} placeholder="ej. Sep 2025"/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {ICONS.map(ic=><button key={ic} onClick={()=>setForm({...form,icon:ic})} style={{fontSize:18,padding:"5px 8px",borderRadius:8,border:`2px solid ${form.icon===ic?P.primary:P.border}`,background:form.icon===ic?P.lighter:"none",cursor:"pointer"}}>{ic}</button>)}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <input type="checkbox" checked={form.reached} onChange={e=>setForm({...form,reached:e.target.checked})} id="reached"/>
        <label htmlFor="reached" style={{fontSize:12,color:P.textMuted}}>Ya alcanzado</label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin hitos aún.</div></Card>}
      {rows.map(r=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${r.reached?P.primary+"44":P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20,flexShrink:0}}>{r.icon||"🎯"}</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.label}</div><div style={{fontSize:11,color:P.textMuted}}>{r.value&&`${r.value} · `}{r.date||"Sin fecha"}</div></div>
        <button onClick={()=>toggle(r)} style={{background:r.reached?P.primary:P.gray50,color:r.reached?"#fff":P.textMuted,border:`1px solid ${r.reached?P.primary:P.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{r.reached?"✓ Alcanzado":"Marcar alcanzado"}</button>
        <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
      </div>)}
    </div>
  </div>;
}

// ── ENCUESTAS TAB ──────────────────────────────────────────────────
// Mapeo pregunta→dimensión de la encuesta web (debe coincidir con ENCUESTA_DIMS del dash)
const ENCUESTA_DIM_MAP=[
  {label:"Bienestar y salud mental",qs:[1,2,3,4],color:"#1A5C4A"},
  {label:"Clima y comunicación",qs:[5,6,7,8],color:"#267A62"},
  {label:"Liderazgo efectivo",qs:[9,10,11,12],color:"#5040A0"},
  {label:"Engagement y compromiso",qs:[13,14,15,16],color:"#2a6aaa"},
  {label:"Ausentismo percibido",qs:[17,18,19],color:"#8B4A8B"},
  {label:"Productividad sostenible",qs:[20,21,22],color:"#B03030"},
];
function EncuestasTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [seguimiento, setSeguimiento] = useState([]);
  const [compState, setCompState] = useState(null);
  const [segForm, setSegForm] = useState({period:"",score:""});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({title:"",descripcion:"",_file:null});
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){
    const {data}=await supabase.from("encuestas_archivos").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);
    const {data:resp}=await supabase.from("encuesta_respuestas").select("id,role,answers,comment,comment_approved,created_at").eq("company_id",companyId).order("created_at",{ascending:false});setRespuestas(resp||[]);
    const {data:seg}=await supabase.from("seguimiento_beneficio").select("*").eq("company_id",companyId).order("created_at");setSeguimiento(seg||[]);
    const {data:comp}=await supabase.from("companies").select("encuesta_abierta,headcount_total,headcount_leaders").eq("id",companyId).single();setCompState(comp||null);
  }
  async function addSeguimiento(){
    if(!segForm.period||!segForm.score){setMsg("Completá período y puntaje.");return;}
    const {error}=await supabase.from("seguimiento_beneficio").upsert([{company_id:companyId,period:segForm.period.trim(),score:parseFloat(segForm.score)}],{onConflict:"company_id,period"});
    if(error){setMsg("Error: "+error.message);return;}
    setSegForm({period:"",score:""});setMsg("Seguimiento guardado.");load();
  }
  async function save(){
    if(!form.title){setMsg("Título obligatorio.");return;}
    const {data:ins,error}=await supabase.from("encuestas_archivos").insert([{title:form.title,descripcion:form.descripcion,company_id:companyId}]).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._file){
      const ext=form._file.name.split('.').pop();const path=`${companyId}/${ins.id}.${ext}`;
      const {error:upErr}=await supabase.storage.from("informes").upload(path,form._file,{upsert:true,contentType:form._file.type});
      if(!upErr){const {data}=supabase.storage.from("informes").getPublicUrl(path);await supabase.from("encuestas_archivos").update({file_url:data.publicUrl}).eq("id",ins.id);}
    }
    setMsg("Encuesta creada.");setShowForm(false);load();setForm({title:"",descripcion:"",_file:null});
  }
  async function del(id){await supabase.from("encuestas_archivos").delete().eq("id",id);load();}
  const segAvgs=(rol)=>ENCUESTA_DIM_MAP.map(d=>{
    const vals=respuestas.filter(r=>(r.role||"colaborador")===rol).flatMap(r=>d.qs.map(q=>r.answers?.[`q${q}`]).filter(v=>typeof v==="number"));
    return {...d, avg: vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):null};
  });
  const nEq=respuestas.filter(r=>(r.role||"colaborador")==="colaborador").length;
  const nLid=respuestas.filter(r=>r.role==="lider").length;
  const avgsEq=segAvgs("colaborador"), avgsLid=segAvgs("lider");
  const LIDER_METRICS=[["Gestión y apoyo",[23,24,30]],["Productividad del equipo",[25]],["Presencia y energía",[26]],["Retención esperada",[27]],["Creatividad e ideas",[28]],["Bienestar del líder",[29]]];
  const lidMetrics=LIDER_METRICS.map(([l,qs])=>{
    const vals=respuestas.filter(r=>r.role==="lider").flatMap(r=>qs.map(q=>r.answers?.[`q${q}`]).filter(v=>typeof v==="number"));
    return [l, vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):null];
  });
  async function toggleAbierta(){
    const next=!compState?.encuesta_abierta;
    setCompState(s=>({...(s||{}),encuesta_abierta:next}));
    // .select().single() fuerza a que un bloqueo de RLS (0 filas actualizadas) aparezca como error visible
    const {error}=await supabase.from("companies").update({encuesta_abierta:next}).eq("id",companyId).select("encuesta_abierta").single();
    if(error) setMsg(`Error al ${next?"abrir":"cerrar"} la encuesta: ${error.message}`);
    else setMsg(`Encuesta ${next?"abierta":"cerrada"}.`);
    load();
  }
  const comments=respuestas.filter(r=>r.comment).slice(0,10);
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <Card style={{marginBottom:16}}>
      <EncuestaPopupAdmin companyId={companyId}/>
      <ReunionesSemestrales companyId={companyId}/>
    </Card>
    <Card style={{marginBottom:16,background:P.lighter,borderColor:P.primary+"33"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <SectionTitle>Resultados de la encuesta web</SectionTitle>
        <button onClick={toggleAbierta}
          style={{background:compState?.encuesta_abierta?P.primary:P.gray50,color:compState?.encuesta_abierta?"#fff":P.textMuted,border:`1px solid ${compState?.encuesta_abierta?P.primary:P.border}`,borderRadius:20,padding:"5px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          {compState?.encuesta_abierta?"● Encuesta ABIERTA — cerrar":"○ Encuesta cerrada — abrir"}
        </button>
      </div>
      <div style={{fontSize:11,color:P.textMuted,margin:"4px 0 10px"}}>Los colaboradores solo pueden responder mientras la encuesta esté abierta. Abrila durante la ventana de aplicación (2-3 semanas por semestre) y cerrala al terminar.</div>
      {respuestas.length===0
        ? <div style={{fontSize:12,color:P.textMuted,padding:"6px 0"}}>Sin respuestas aún. Los links (general y líderes) aparecen en el dash de la empresa (Consultoría → Encuesta para tu equipo) — RRHH los comparte y las respuestas anónimas caen acá solas.</div>
        : <>
          <div style={{fontSize:12,color:P.textMuted,marginBottom:12}}>
            <b style={{color:P.primary,fontSize:16}}>{nEq}</b> equipo{compState?.headcount_total?` (dotación ~${compState.headcount_total})`:""}
            {nEq>0&&compState?.headcount_total&&nEq>compState.headcount_total&&<span style={{color:P.red,fontWeight:700}}> ⚠️ más respuestas que dotación</span>}
            {" · "}<b style={{color:"#B45309",fontSize:16}}>{nLid}</b> líderes{compState?.headcount_leaders?` (esperados ~${compState.headcount_leaders})`:""}
            {nLid>0&&compState?.headcount_leaders&&nLid>compState.headcount_leaders&&<span style={{color:P.red,fontWeight:700}}> ⚠️ más líderes que los esperados</span>}
            {" · última: "}{new Date(respuestas[0].created_at).toLocaleDateString("es-UY")}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8,marginBottom:12}}>
            {avgsEq.map((d,i)=>{
              const lid=avgsLid[i].avg;
              const gap=d.avg!=null&&lid!=null?Math.round((lid-d.avg)*10)/10:null;
              return <div key={d.label} style={{background:"#fff",border:`1px solid ${P.border}`,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:18,fontWeight:800,color:d.color}}>{d.avg!=null?d.avg.toFixed(1):"—"}<span style={{fontSize:11,fontWeight:400,color:P.textMuted}}> /10 equipo</span></div>
                {lid!=null&&<div style={{fontSize:12,fontWeight:700,color:"#B45309"}}>{lid.toFixed(1)} líderes{gap!=null?` · brecha ${gap>0?"+":""}${gap}`:""}</div>}
                <div style={{fontSize:10,color:P.textMuted,marginTop:2}}>{d.label}</div>
              </div>;
            })}
          </div>
          {nLid>0&&<div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Bloque de líderes (q23-q30)</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
              {lidMetrics.map(([l,v])=><div key={l} style={{background:"#fff",border:`1px solid ${P.border}`,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:16,fontWeight:800,color:"#B45309"}}>{v!=null?v.toFixed(1):"—"}</div>
                <div style={{fontSize:10,color:P.textMuted}}>{l}</div>
              </div>)}
            </div>
          </div>}
          <div style={{fontSize:11,color:P.textMuted,marginBottom:comments.length?10:0}}>Estos promedios se cargan solos en el dash de la empresa, agrupados por semestre (mínimo 3 respuestas por semestre). Si se cargan valores manuales por trimestre/semestre, esos tienen prioridad.</div>
          {comments.length>0&&<div>
            <div style={{fontSize:11,fontWeight:700,color:P.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",margin:"8px 0 6px"}}>Comentarios anónimos ({comments.length} más recientes) — elegí cuáles ve la empresa</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {comments.map((r)=><div key={r.id} style={{background:"#fff",border:`1px solid ${r.comment_approved?P.primary+"66":P.border}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:P.text,lineHeight:1.6,display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1}}>"{r.comment}"<span style={{fontSize:10,color:P.textMuted,marginLeft:8}}>{new Date(r.created_at).toLocaleDateString("es-UY")}</span></div>
                <button onClick={async()=>{await supabase.from("encuesta_respuestas").update({comment_approved:!r.comment_approved}).eq("id",r.id);load();}}
                  style={{flexShrink:0,background:r.comment_approved?P.primary:P.gray50,color:r.comment_approved?"#fff":P.textMuted,border:`1px solid ${r.comment_approved?P.primary:P.border}`,borderRadius:20,padding:"3px 12px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  {r.comment_approved?"✓ Visible en dash":"Oculto"}
                </button>
              </div>)}
            </div>
          </div>}
        </>}
    </Card>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} encuestas</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Nueva encuesta</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Encuesta Indice Tu Terapia Q2 2026"/>
      <Input label="Descripción" value={form.descripcion} onChange={v=>setForm({...form,descripcion:v})} placeholder="ej. 22 preguntas - 6 dimensiones"/>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Archivo</label>
        <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          📎 {form._file?form._file.name:"Seleccionar archivo"}
          <input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
        </label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin encuestas aún.</div></Card>}
      {rows.map(r=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>{r.descripcion&&<div style={{fontSize:11,color:P.textMuted}}>{r.descripcion}</div>}</div>
        {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>}
        <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
      </div>)}
    </div>
  </div>;
}

// ── TEXTOS TAB ─────────────────────────────────────────────────────
const MODULES_HEADERS=[
  {module:"individual",subs:["Sesiones","Adherencia"],label:"Colaboradores",color:"#4a9356"},
  {module:"colectivo",subs:["Talleres","Contenido"],label:"Cultura de Bienestar",color:P.purple},
  {module:"estrategico",subs:["Bienestar del equipo","Consultoría Tu Terapia"],label:"Estrategia de Bienestar",color:P.accent},
  {module:"gestion",subs:["Facturación","Plan activo","Equipo TT"],label:"Gestión",color:P.textMuted},
];
function TextosTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({title:"",subtitle:""});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("header_texts").select("*").eq("company_id",companyId);setRows(data||[]);}
  function getRow(module,sub){return rows.find(r=>r.module===module&&r.sub===sub);}
  async function save(module,sub){
    const existing=getRow(module,sub);
    if(existing) await supabase.from("header_texts").update({title:form.title,subtitle:form.subtitle}).eq("id",existing.id);
    else await supabase.from("header_texts").insert([{company_id:companyId,module,sub,title:form.title,subtitle:form.subtitle}]);
    setEditing(null);setMsg("Guardado.");load();
  }
  async function del(id){await supabase.from("header_texts").delete().eq("id",id);load();}
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{fontSize:12,color:P.textMuted,marginBottom:14,lineHeight:1.6}}>Editá el título y subtítulo de cada pestaña del dashboard. Si dejás vacío, se muestra el texto por defecto.</div>
    {MODULES_HEADERS.map(mod=><Card key={mod.module} style={{marginBottom:10}}>
      <SectionTitle color={mod.color}>{mod.label}</SectionTitle>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {mod.subs.map(sub=>{
          const row=getRow(mod.module,sub);
          const isEd=editing===`${mod.module}-${sub}`;
          return <div key={sub} style={{padding:"10px 12px",background:P.gray50,borderRadius:8,border:`1px solid ${P.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isEd?8:0}}>
              <div><span style={{fontSize:12,fontWeight:600,color:P.text}}>{sub}</span>{row?.title&&<span style={{fontSize:11,color:P.textMuted,marginLeft:8}}>"{row.title}"</span>}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEditing(`${mod.module}-${sub}`);setForm({title:row?.title||"",subtitle:row?.subtitle||""});}} style={{background:"none",border:`1px solid ${P.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer",color:P.primary}}>{row?.title?"Editar":"+ Agregar"}</button>
                {row&&<button onClick={()=>del(row.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:13}}>🗑</button>}
              </div>
            </div>
            {isEd&&<div>
              <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Tu equipo avanza hacia el bienestar"/>
              <Input label="Subtítulo" value={form.subtitle} onChange={v=>setForm({...form,subtitle:v})} placeholder="ej. 2.573 sesiones realizadas este año"/>
              <div style={{display:"flex",gap:8}}><Btn small onClick={()=>save(mod.module,sub)}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setEditing(null)}>Cancelar</Btn></div>
            </div>}
          </div>;
        })}
      </div>
    </Card>)}
  </div>;
}

// ── FACTURACIÓN TAB ────────────────────────────────────────────────
function FacturacionTab({ companyId, company }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({period:"",amount:"",status:"pendiente",invoice:"",_file:null});
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("billing").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!form.period||!form.amount){setMsg("Período y monto obligatorios.");return;}
    const {data:ins,error}=await supabase.from("billing").insert([{period:form.period,amount:parseInt(form.amount),status:form.status,invoice:form.invoice,company_id:companyId}]).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._file){
      const ext=form._file.name.split('.').pop();const path=`${companyId}/${ins.id}.${ext}`;
      const {error:upErr}=await supabase.storage.from("facturas").upload(path,form._file,{upsert:true,contentType:form._file.type});
      if(!upErr){const {data}=supabase.storage.from("facturas").getPublicUrl(path);await supabase.from("billing").update({file_url:data.publicUrl}).eq("id",ins.id);}
    }
    setMsg("Factura creada.");setShowForm(false);load();setForm({period:"",amount:"",status:"pendiente",invoice:"",_file:null});
  }
  async function togglePaid(r){await supabase.from("billing").update({status:r.status==="pagado"?"pendiente":"pagado"}).eq("id",r.id);load();}
  async function sendReminder(r){
    if(!company?.referente_email){setMsg("Esta empresa no tiene referente asignado.");return;}
    try{
      // El mail lo manda el servidor (Edge Function): la clave de Resend nunca va en el navegador
      const {data:res,error:fnErr}=IS_PREVIEW?{data:{ok:true},error:null}:await supabase.functions.invoke("enviar-recordatorio",{body:{billing_id:r.id}});
      if(fnErr||res?.error){
        // El motivo real viaja en el cuerpo de la respuesta: fnErr.message solo dice
        // "non-2xx status code", que no le sirve a nadie para saber qué hay que arreglar.
        let detalle=res?.error||"";
        if(!detalle&&fnErr?.context){ try{ detalle=(await fnErr.context.json())?.error||""; }catch{ detalle=""; } }
        setMsg(detalle?`No se pudo enviar: ${detalle}`:"Error enviando recordatorio.");
        return;
      }
      setMsg(`Recordatorio enviado a ${company.referente_email}`);
    }catch(e){setMsg(`Error enviando recordatorio: ${e?.message||e}`);}
  }
  async function del(id){await supabase.from("billing").delete().eq("id",id);load();}
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} facturas</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Nueva factura</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Período" value={form.period} onChange={v=>setForm({...form,period:v})} placeholder="ej. May 2026"/>
        <Input label="Monto (UYU)" value={form.amount} onChange={v=>setForm({...form,amount:v})} type="number"/>
        <Input label="N° factura" value={form.invoice} onChange={v=>setForm({...form,invoice:v})} placeholder="ej. TT-2026-051"/>
        <Select label="Estado" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"pendiente",label:"Pendiente"},{value:"pagado",label:"Pagado"}]}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>PDF de factura (opcional)</label>
        <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          📎 {form._file?form._file.name:"Seleccionar PDF"}
          <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
        </label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin facturas aún.</div></Card>}
      {rows.map(r=><Card key={r.id}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:P.text}}>{r.period}</div><div style={{fontSize:12,color:P.textMuted}}>{r.invoice} · UY$ {r.amount?.toLocaleString()}</div></div>
          <Badge text={r.status==="pagado"?"Pagado":"Pendiente"} bg={r.status==="pagado"?P.lighter:P.redBg} color={r.status==="pagado"?P.primary:P.red}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ PDF</a>}
            <button onClick={()=>togglePaid(r)} style={{background:r.status==="pagado"?P.redBg:P.lighter,color:r.status==="pagado"?P.red:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{r.status==="pagado"?"Marcar pendiente":"Marcar pagado"}</button>
            {r.status==="pendiente"&&<button onClick={()=>sendReminder(r)} style={{background:"#FFF8E1",color:"#F57F17",border:"1px solid #FFE082",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>✉ Recordatorio</button>}
            <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
          </div>
        </div>
      </Card>)}
    </div>
  </div>;
}

// ── EMPRESAS LIST ──────────────────────────────────────────────────
function EmpresasView({ companies, reload, onSelect }) {
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {name:"",domain:"",plan_kind:"cuponera_fija",start_date:"",contact_name:""};
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");
  async function save(){
    if(!form.name||!form.domain){setMsg("Nombre y dominio obligatorios.");return;}
    const {error}=await supabase.from("companies").insert([{
      name:form.name, domain:form.domain,
      plan_kind:form.plan_kind, plan_type:PLAN_KIND_LABELS[form.plan_kind],
      coverage_pct: form.plan_kind==="cuponera_fija"?1:0.5,
      plan_coverage: form.plan_kind==="cuponera_fija"?"100%":"50%",
      start_date:form.start_date, contact_name:form.contact_name, workshop_target:5,
    }]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Empresa creada. Ahora completá el plan (costos por sesión, límites, secciones visibles) en su pestaña Configuración.");setShowForm(false);reload();setForm(emptyForm);}
  }
  async function del(id){
    const emp=companies.find(c=>c.id===id);
    if(!ask(`¿Eliminar ${emp?.name||"esta empresa"}?\n\nSe borran TODOS sus datos (sesiones, talleres, facturación, encuestas, usuarios) y sus archivos subidos. No se puede deshacer.`))return;
    // Los datos de la base se van por cascada; los archivos de Storage hay que borrarlos aparte
    for(const bucket of ["contenido","facturas","informes"]){
      const {data:files}=await supabase.storage.from(bucket).list(id,{limit:1000});
      const paths=(files||[]).filter(f=>f.id).map(f=>`${id}/${f.name}`);
      if(paths.length) await supabase.storage.from(bucket).remove(paths);
    }
    const {error}=await supabase.from("companies").delete().eq("id",id);
    if(error){setMsg("Error al eliminar: "+error.message);return;}
    setMsg(`${emp?.name||"Empresa"} eliminada junto con todos sus datos y archivos.`);
    reload();
  }
  return <div style={{padding:"24px 28px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <div style={{fontSize:14,fontWeight:600,color:P.text}}>{companies.length} empresa{companies.length!==1?"s":""}</div>
      <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva empresa</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
      <SectionTitle>Nueva empresa</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. TCS"/>
        <Input label="Dominio" value={form.domain} onChange={v=>setForm({...form,domain:v})} placeholder="ej. tcs.com"/>
        <Select label="Tipo de plan" value={form.plan_kind} onChange={v=>setForm({...form,plan_kind:v})} options={PLAN_KINDS}/>
        <Input label="Inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
        <Input label="Contacto RRHH" value={form.contact_name} onChange={v=>setForm({...form,contact_name:v})}/>
      </div>
      <div style={{fontSize:11,color:P.textMuted,margin:"4px 0 10px"}}>Los detalles del plan (sesiones, costos por sesión, límites por colaborador, secciones visibles) se completan después en la pestaña <b>Configuración</b> de la empresa.</div>
      <div style={{display:"flex",gap:8}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {companies.length===0&&<Card><div style={{textAlign:"center",padding:"24px",color:P.textMuted}}>No hay empresas. Creá la primera.</div></Card>}
      {companies.map(co=><div key={co.id} onClick={()=>onSelect(co)}
        style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=P.primary}
        onMouseLeave={e=>e.currentTarget.style.borderColor=P.border}>
        <div style={{width:42,height:42,borderRadius:10,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{color:"#fff",fontWeight:700,fontSize:13}}>{co.name?.slice(0,2).toUpperCase()}</span>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:3}}>{co.name}</div>
          <div style={{fontSize:12,color:P.textMuted}}>@{co.domain} · {co.plan_type} · {co.monthly_plan} ses/mes · {co.start_date||"—"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {co.consultoria_activa&&<Badge text="Consultoría activa" bg={P.lighter} color={P.primary}/>}
          {co.consultoria_solicitada&&!co.consultoria_activa&&<Badge text="Consultoría solicitada" bg={P.accentBg} color={P.accent}/>}
          <span style={{fontSize:12,color:P.primary,fontWeight:600}}>Ver →</span>
        </div>
        <button onClick={e=>{e.stopPropagation();del(co.id);}} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,padding:"4px",marginLeft:4}}>🗑</button>
      </div>)}
    </div>
  </div>;
}

// ── TALLERISTAS VIEW ───────────────────────────────────────────────
function TalleristasView() {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:"",initials:"",_photoFile:null});
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[]);
  async function load(){const {data}=await supabase.from("talleristas").select("*").order("name");setRows(data||[]);}
  async function save(){
    if(!form.name){setMsg("Nombre obligatorio.");return;}
    const {data:ins,error}=await supabase.from("talleristas").insert([{name:form.name,initials:form.initials}]).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._photoFile){
      const ext=form._photoFile.name.split('.').pop();const path=`talleristas/${ins.id}.${ext}`;
      const {error:upErr}=await supabase.storage.from("contenido").upload(path,form._photoFile,{upsert:true,contentType:form._photoFile.type});
      if(!upErr){const {data}=supabase.storage.from("contenido").getPublicUrl(path);await supabase.from("talleristas").update({photo_url:data.publicUrl}).eq("id",ins.id);}
    }
    setMsg("Tallerista creado.");setShowForm(false);load();setForm({name:"",initials:"",_photoFile:null});
  }
  async function uploadPhoto(id,file){
    setUploading(u=>({...u,[id]:true}));
    const ext=file.name.split('.').pop();const path=`talleristas/${id}.${ext}`;
    const {error:upErr}=await supabase.storage.from("contenido").upload(path,file,{upsert:true,contentType:file.type});
    if(upErr){setMsg("Error: "+upErr.message);setUploading(u=>({...u,[id]:false}));return;}
    const {data}=supabase.storage.from("contenido").getPublicUrl(path);
    await supabase.from("talleristas").update({photo_url:data.publicUrl}).eq("id",id);
    setUploading(u=>({...u,[id]:false}));setMsg("Foto actualizada.");load();
  }
  async function del(id){await supabase.from("talleristas").delete().eq("id",id);load();}
  return <div style={{padding:"24px 28px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:600,color:P.text}}>{rows.length} talleristas</div>
      <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar tallerista</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Nombre completo" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. Juan Ignacio Delgado"/>
        <Input label="Iniciales" value={form.initials} onChange={v=>setForm({...form,initials:v})} placeholder="ej. JD"/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Foto</label>
        <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          📷 {form._photoFile?form._photoFile.name:"Seleccionar foto"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_photoFile:e.target.files[0]})}/>
        </label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin talleristas aún.</div></Card>}
      {rows.map(r=><Card key={r.id}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {r.photo_url?<img src={r.photo_url} alt={r.name} style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
            :<div style={{width:52,height:52,borderRadius:"50%",background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{r.initials||r.name?.slice(0,2).toUpperCase()}</span>
            </div>}
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:P.text}}>{r.name}</div><div style={{fontSize:12,color:P.textMuted}}>Iniciales: {r.initials||"—"}</div></div>
          <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {uploading[r.id]?"Subiendo...":r.photo_url?"✓ Cambiar foto":"⬆ Subir foto"}
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadPhoto(r.id,e.target.files[0])}/>
          </label>
          <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
        </div>
      </Card>)}
    </div>
  </div>;
}

// ── EQUIPO TT (admins + referentes) ────────────────────────────────
const EMPTY_MIEMBRO={email:"",name:"",short_name:"",role:"",phone:"",whatsapp:"",initials:"",area:"",calendar_url:"",is_referente:true,active:true,_photoFile:null};
function EquipoView() {
  const [rows,setRows]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [form,setForm]=useState(EMPTY_MIEMBRO);
  const [uploading,setUploading]=useState({});
  const [msg,setMsg]=useState("");
  useEffect(()=>{ load(); },[]);
  async function load(){const {data}=await supabase.from("admin_users").select("*").order("name");setRows(data||[]);}
  function reset(){setForm(EMPTY_MIEMBRO);setEditingId(null);}
  function edit(r){setForm({email:r.email||"",name:r.name||"",short_name:r.short_name||"",role:r.role||"",phone:r.phone||"",whatsapp:r.whatsapp||"",initials:r.initials||"",area:r.area||"",calendar_url:r.calendar_url||"",is_referente:r.is_referente!==false,active:r.active!==false,_photoFile:null});setEditingId(r.id);setShowForm(true);}
  async function save(){
    if(!form.email||!form.name){setMsg("Email y nombre son obligatorios.");return;}
    const {_photoFile,...payload}=form;
    payload.email=payload.email.trim().toLowerCase();
    let id=editingId;
    if(editingId){
      const {error}=await supabase.from("admin_users").update(payload).eq("id",editingId);
      if(error){setMsg("Error: "+error.message);return;}
      setMsg("Miembro actualizado.");
    } else {
      const {data:ins,error}=await supabase.from("admin_users").insert([payload]).select().single();
      if(error){setMsg("Error: "+error.message);return;}
      id=ins.id;
      // Invitación para que pueda entrar al panel admin
      const {data:res}=await supabase.functions.invoke("invite-user",{body:{email:payload.email,full_name:payload.name}});
      setMsg(res?.existing?`${payload.name} agregado. Ya tenía cuenta: entra con su contraseña de siempre.`:`${payload.name} agregado. Se le envió la invitación para crear su contraseña.`);
    }
    if(_photoFile&&id) await uploadPhoto(id,_photoFile,true);
    setShowForm(false);reset();load();
  }
  async function uploadPhoto(id,file,silent){
    setUploading(u=>({...u,[id]:true}));
    const ext=file.name.split('.').pop();const path=`equipo/${id}.${ext}`;
    const {error:upErr}=await supabase.storage.from("contenido").upload(path,file,{upsert:true,contentType:file.type});
    if(upErr){setMsg("Error al subir la foto: "+upErr.message);setUploading(u=>({...u,[id]:false}));return;}
    const {data}=supabase.storage.from("contenido").getPublicUrl(path);
    await supabase.from("admin_users").update({photo_url:`${data.publicUrl}?v=${Date.now()}`}).eq("id",id);
    setUploading(u=>({...u,[id]:false}));
    if(!silent){setMsg("Foto actualizada.");load();}
  }
  async function toggle(r,field){await supabase.from("admin_users").update({[field]:!(r[field]!==false)}).eq("id",r.id);load();}
  async function del(r){
    if(!ask(`¿Quitar a ${r.name} del equipo? Perderá el acceso al panel admin.`))return;
    const usadas=await supabase.from("companies").select("id",{count:"exact",head:true}).eq("referente_email",r.email);
    if((usadas.count??0)>0){setMsg(`No se puede: ${r.name} es referente de ${usadas.count} empresa(s). Cambiá el referente primero.`);return;}
    await supabase.from("admin_users").delete().eq("id",r.id);
    const {data:res}=await supabase.functions.invoke("delete-user",{body:{email:r.email}});
    setMsg(res?.purged?`${r.name} eliminado. Su cuenta de acceso también se borró.`:`${r.name} eliminado del equipo.`);
    load();
  }
  return <div style={{padding:"24px 28px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:14,fontWeight:600,color:P.text}}>{rows.length} en el equipo</div>
      <Btn onClick={()=>{ if(showForm){setShowForm(false);reset();} else {reset();setShowForm(true);} }}>+ Agregar miembro</Btn>
    </div>
    <div style={{fontSize:11,color:P.textMuted,marginBottom:16}}>Quienes están acá tienen acceso al panel admin. Los marcados como <b>referente</b> aparecen en el selector de referente de cada empresa y su ficha se muestra en el dash del cliente.</div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:700,color:P.primary,marginBottom:10}}>{editingId?"Editar miembro":"Nuevo miembro"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Email (acceso al admin)" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="nombre@tuterapia.com.uy"/>
        <Input label="Nombre completo" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. Florencia Iroldi"/>
        <Input label="Nombre corto (se muestra en el dash)" value={form.short_name} onChange={v=>setForm({...form,short_name:v})} placeholder="ej. Flor"/>
        <Input label="Rol" value={form.role} onChange={v=>setForm({...form,role:v})} placeholder="ej. Customer Success Manager"/>
        <Input label="Iniciales" value={form.initials} onChange={v=>setForm({...form,initials:v})} placeholder="ej. FI"/>
        <Input label="Área" value={form.area} onChange={v=>setForm({...form,area:v})} placeholder="ej. Gestión de cuentas"/>
        <Input label="Teléfono" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="ej. 099495218"/>
        <Input label="WhatsApp (con país, sin +)" value={form.whatsapp} onChange={v=>setForm({...form,whatsapp:v})} placeholder="ej. 598099495218"/>
      </div>
      <Input label="Link de agenda (opcional)" value={form.calendar_url} onChange={v=>setForm({...form,calendar_url:v})} placeholder="https://calendar.google.com/..."/>
      <div style={{display:"flex",gap:16,alignItems:"center",margin:"4px 0 12px",flexWrap:"wrap"}}>
        <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          📷 {form._photoFile?form._photoFile.name:"Seleccionar foto"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_photoFile:e.target.files[0]})}/>
        </label>
        <label style={{fontSize:12,color:P.text,display:"inline-flex",alignItems:"center",gap:6}}>
          <input type="checkbox" checked={form.is_referente} onChange={e=>setForm({...form,is_referente:e.target.checked})}/> Puede ser referente de empresas
        </label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn onClick={save}>{editingId?"Actualizar":"Guardar e invitar"}</Btn><Btn variant="secondary" onClick={()=>{setShowForm(false);reset();}}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin miembros aún.</div></Card>}
      {rows.map(r=><Card key={r.id} style={{opacity:r.active===false?0.55:1}}>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          {r.photo_url?<img src={r.photo_url} alt={r.name} style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
            :<div style={{width:52,height:52,borderRadius:"50%",background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{r.initials||(r.name||"?").slice(0,2).toUpperCase()}</span>
            </div>}
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontSize:14,fontWeight:600,color:P.text}}>{r.name} {r.short_name&&<span style={{fontWeight:400,color:P.textMuted}}>· {r.short_name}</span>}</div>
            <div style={{fontSize:12,color:P.textMuted}}>{r.role||"Sin rol"} · {r.email}</div>
          </div>
          <button onClick={()=>toggle(r,"is_referente")} style={{background:r.is_referente!==false?P.lighter:P.gray50,color:r.is_referente!==false?P.primary:P.textMuted,border:`1px solid ${r.is_referente!==false?P.primary+"55":P.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{r.is_referente!==false?"✓ Referente":"No referente"}</button>
          <button onClick={()=>toggle(r,"active")} style={{background:"none",border:`1px solid ${P.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600,color:P.textMuted,cursor:"pointer"}}>{r.active===false?"Inactivo":"Activo"}</button>
          <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {uploading[r.id]?"Subiendo...":r.photo_url?"✓ Cambiar foto":"⬆ Subir foto"}
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadPhoto(r.id,e.target.files[0])}/>
          </label>
          <button onClick={()=>edit(r)} style={{background:"none",border:"none",color:P.accent,cursor:"pointer",fontSize:15}} title="Editar">✏️</button>
          <button onClick={()=>del(r)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
        </div>
      </Card>)}
    </div>
  </div>;
}

// ── TRACKING VIEW ──────────────────────────────────────────────────
function TrackingView({ companies }) {
  const [views, setViews] = useState([]);
  const [companyId, setCompanyId] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){
    let q=supabase.from("page_views").select("*").order("created_at",{ascending:false}).limit(100);
    if(companyId) q=q.eq("company_id",companyId);
    const {data}=await q;setViews(data||[]);
  }
  const byModule=views.reduce((acc,v)=>{acc[v.module||"home"]=(acc[v.module||"home"]||0)+1;return acc;},{});
  return <div style={{padding:"24px 28px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
    <div style={{marginBottom:16}}>
      <Select label="Empresa" value={companyId} onChange={setCompanyId} options={[{value:"",label:"Todas las empresas"},...companies.map(c=>({value:c.id,label:c.name}))]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
      {Object.entries(byModule).map(([mod,count])=><div key={mod} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 14px",textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:P.primary}}>{count}</div>
        <div style={{fontSize:11,color:P.textMuted,marginTop:2}}>{mod}</div>
      </div>)}
      {!Object.keys(byModule).length&&<div style={{fontSize:12,color:P.textMuted,padding:"20px"}}>Sin visitas.</div>}
    </div>
    <Card>
      <SectionTitle>Últimas {views.length} visitas</SectionTitle>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
            {["Usuario","Módulo","Sección","Fecha"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{views.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
            <td style={{padding:"8px 10px"}}>{v.user_email||"anónimo"}</td>
            <td style={{padding:"8px 10px",color:P.primary,fontWeight:500}}>{v.module||"home"}</td>
            <td style={{padding:"8px 10px",color:P.textMuted}}>{v.sub||"—"}</td>
            <td style={{padding:"8px 10px",color:P.textMuted}}>{new Date(v.created_at).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
          </tr>)}
          {!views.length&&<tr><td colSpan={4} style={{padding:"20px",textAlign:"center",color:P.textMuted}}>Sin visitas.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ── MAIN ───────────────────────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("empresas");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [connError, setConnError] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const {data:ad,error}=await supabase.from("admin_users").select("*").eq("email",(session.user.email||"").trim().toLowerCase()).maybeSingle();
        // Solo deslogueamos si la consulta anduvo y el mail realmente no está en el equipo.
        // Si falló (red caída o base pausada) la sesión sigue valiendo: antes esto sacaba
        // a todo el mundo cada vez que Supabase se pausaba por inactividad.
        if(error){setConnError(true);}
        else if(ad){setUser(session.user);setAdminData(ad);}
        else{await supabase.auth.signOut();}
      }
      setLoading(false);
    });
  },[]);

  useEffect(()=>{ if(user) loadCompanies(); },[user]);
  async function loadCompanies(){const {data}=await supabase.from("companies").select("*").order("created_at",{ascending:false});setCompanies(data||[]);}
  async function handleLogout(){await supabase.auth.signOut();setUser(null);setAdminData(null);}

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:P.bg,fontFamily:"system-ui,sans-serif",color:P.textMuted,fontSize:13}}>Cargando...</div>;
  if(connError) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:P.bg,fontFamily:"system-ui,sans-serif",padding:24}}>
      <div style={{background:P.white,borderRadius:16,border:`1px solid ${P.border}`,padding:"36px 32px",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>🔌</div>
        <div style={{fontSize:17,fontWeight:700,color:P.text,marginBottom:8}}>No pudimos conectar</div>
        <div style={{fontSize:13,color:P.textMuted,lineHeight:1.6,marginBottom:22}}>
          Tu sesión sigue abierta — es el servidor el que no está respondiendo.
          Si el proyecto de Supabase se pausó por inactividad, hay que restaurarlo desde su panel.
        </div>
        <button onClick={()=>window.location.reload()}
          style={{padding:"10px 22px",background:P.primary,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          Reintentar
        </button>
      </div>
    </div>
  );
  if(!user) return <LoginView onLogin={(u,ad)=>{setUser(u);setAdminData(ad);}}/>;

  const titles={dashboard:"Dashboard",empresas:"Empresas",talleristas:"Talleristas",equipo:"Equipo TT",tracking:"Tracking",sync:"Sincronización con la plataforma"};

  // If a company is selected, show the detail view
  if(selectedCompany&&active==="empresas") {
    return (
      <div style={{display:"flex",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:P.bg}}>
        <Sidebar active={active} setActive={id=>{setActive(id);setSelectedCompany(null);}} adminName={adminData?.name||user?.email} onLogout={handleLogout}/>
        <EmpresaDetail company={selectedCompany} onBack={()=>setSelectedCompany(null)} reload={loadCompanies}/>
      </div>
    );
  }

  return (
    <div style={{display:"flex",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:P.bg,color:P.text}}>
      <Sidebar active={active} setActive={id=>{setActive(id);setSelectedCompany(null);}} adminName={adminData?.name||user?.email} onLogout={handleLogout}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <div style={{borderBottom:`1px solid ${P.border}`,padding:"16px 28px",background:P.white}}>
          <div style={{fontSize:18,fontWeight:700,color:P.text,letterSpacing:"-0.3px"}}>{titles[active]||active}</div>
        </div>
        {active==="dashboard"&&<DashboardView companies={companies}/>}
        {active==="empresas"&&<EmpresasView companies={companies} reload={loadCompanies} onSelect={co=>{setSelectedCompany(co);setActive("empresas");}}/>}
        {active==="talleristas"&&<TalleristasView/>}
        {active==="equipo"&&<EquipoView/>}
        {active==="tracking"&&<TrackingView companies={companies}/>}
        {active==="sync"&&<SincronizacionView/>}
      </div>
    </div>
  );
}

