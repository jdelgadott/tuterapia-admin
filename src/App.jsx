import { useState, useEffect } from "react";
import { supabase, supabaseAdmin } from "./supabase.js";

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
    const {data, error:authError} = await supabase.auth.signInWithPassword({email,password});
    if(authError){ setError("Email o contraseña incorrectos."); setLoading(false); return; }
    const {data:adminData} = await supabase.from("admin_users").select("*").eq("email",email).single();
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
    {id:"tracking",  icon:"📈", label:"Tracking"},
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
  {id:"usuarios",  label:"Usuarios",      group:"Colaboradores", color:"#4a9356"},
  {id:"talleres",  label:"Talleres",      group:"Cultura",      color:P.purple},
  {id:"contenido", label:"Contenido",     group:"Cultura",      color:P.purple},
  {id:"motivos",   label:"Motivos",       group:"Estrategia",   color:P.accent},
  {id:"recomendaciones",label:"Recomendaciones",group:"Estrategia",color:P.accent},
  {id:"hitos",     label:"Hitos",         group:"Estrategia",   color:P.accent},
  {id:"encuestas", label:"Encuestas",     group:"Estrategia",   color:P.accent},
  {id:"informes",  label:"Informes",      group:"Estrategia",   color:P.accent},
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
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 11px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:8,
            background:tab==="config"?P.sidebarActiveBg:"none",
            color:tab==="config"?P.primary:P.textMuted,
            fontSize:12,fontWeight:tab==="config"?600:400,textAlign:"left"}}>
          ⚙️ Configuración
        </button>
        {/* Groups */}
        {[
          {group:"Colaboradores",color:P.colIndividual,bg:P.bgIndividual,tabs:[
            {id:"sesiones",label:"Sesiones",icon:"📊"},{id:"usuarios",label:"Usuarios",icon:"👥"}
          ]},
          {group:"Cultura",color:P.colColectivo,bg:P.bgColectivo,tabs:[
            {id:"talleres",label:"Talleres",icon:"🎤"},{id:"contenido",label:"Contenido",icon:"📁"}
          ]},
          {group:"Estrategia",color:P.colEstrategico,bg:P.bgEstrategico,tabs:[
            {id:"motivos",label:"Motivos",icon:"🧠"},{id:"recomendaciones",label:"Recomendaciones",icon:"💡"},
            {id:"hitos",label:"Hitos",icon:"🏆"},{id:"encuestas",label:"Encuestas",icon:"📝"},
            {id:"informes",label:"Informes",icon:"📋"},{id:"textos",label:"Textos",icon:"✏️"}
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
        {tab==="sesiones"&&<SesionesTab companyId={co.id}/>}
        {tab==="usuarios"&&<UsuariosTab company={co}/>}
        {tab==="talleres"&&<TalleresTab companyId={co.id}/>}
        {tab==="contenido"&&<ContenidoTab companyId={co.id}/>}
        {tab==="motivos"&&<MotivosTab companyId={co.id}/>}
        {tab==="recomendaciones"&&<RecomendacionesTab companyId={co.id}/>}
        {tab==="hitos"&&<HitosTab companyId={co.id}/>}
        {tab==="encuestas"&&<EncuestasTab companyId={co.id}/>}
        {tab==="informes"&&<InformesTab companyId={co.id}/>}
        {tab==="textos"&&<TextosTab companyId={co.id}/>}
        {tab==="facturacion"&&<FacturacionTab companyId={co.id} company={co}/>}
      </div>
      </div>
    </div>
  );
}

// ── CONFIG TAB ─────────────────────────────────────────────────────
function ConfigTab({ company, reload }) {
  const [form, setForm] = useState({
    name:company.name||"", domain:company.domain||"",
    plan_type:company.plan_type||"Cuponera Fija", plan_coverage:company.plan_coverage||"100%",
    monthly_plan:company.monthly_plan||300, session_price_ref:company.session_price_ref||1600,
    start_date:company.start_date||"", workshop_target:company.workshop_target||5,
    contact_name:company.contact_name||"",
    consultoria_activa:company.consultoria_activa||false,
    consultoria_solicitada:company.consultoria_solicitada||false,
    encuesta_frecuencia:company.encuesta_frecuencia||"trimestral",
    referente_email:company.referente_email||"firoldi@tuterapia.com.uy",
  });
  const [msg, setMsg] = useState("");
  async function save() {
    const {error} = await supabase.from("companies").update({
      ...form, monthly_plan:parseInt(form.monthly_plan), session_price_ref:parseInt(form.session_price_ref), workshop_target:parseInt(form.workshop_target)
    }).eq("id",company.id);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Guardado."); reload(); }
  }
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
      <Input label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})}/>
      <Input label="Dominio" value={form.domain} onChange={v=>setForm({...form,domain:v})}/>
      <Select label="Tipo de plan" value={form.plan_type} onChange={v=>setForm({...form,plan_type:v})} options={[{value:"Cuponera Fija",label:"Cuponera Fija"},{value:"A Demanda",label:"A Demanda"}]}/>
      <Select label="Cobertura" value={form.plan_coverage} onChange={v=>setForm({...form,plan_coverage:v})} options={[{value:"100%",label:"100%"},{value:"60%",label:"60%"},{value:"50%",label:"50%"}]}/>
      <Input label="Sesiones/mes" value={form.monthly_plan} onChange={v=>setForm({...form,monthly_plan:v})} type="number"/>
      <Input label="Precio ref. (UYU)" value={form.session_price_ref} onChange={v=>setForm({...form,session_price_ref:v})} type="number"/>
      <Input label="Inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
      <Input label="Target talleres/año" value={form.workshop_target} onChange={v=>setForm({...form,workshop_target:v})} type="number"/>
      <Input label="Contacto RRHH" value={form.contact_name} onChange={v=>setForm({...form,contact_name:v})}/>
      <Input label="Referente TT" value={form.referente_email} onChange={v=>setForm({...form,referente_email:v})}/>
      <Select label="Frecuencia encuestas" value={form.encuesta_frecuencia} onChange={v=>setForm({...form,encuesta_frecuencia:v})} options={[{value:"trimestral",label:"Trimestral"},{value:"semestral",label:"Semestral"},{value:"anual",label:"Anual"}]}/>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"12px 16px",background:P.lighter,borderRadius:10,marginBottom:12}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:P.text}}>Consultoría Estratégica</div>
        <div style={{fontSize:11,color:P.textMuted}}>Activa el Índice Tu Terapia y el análisis de inversión en el dashboard</div>
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
function SesionesTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({month:"",year:new Date().getFullYear(),canjeadas:0,realizadas:0,nuevos:0,total_historico:0,c1:0,c2:0,c3:0,c4:0,c5:0,partial:false});
  const [msg, setMsg] = useState("");
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
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} meses cargados</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar mes</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <Input label="Mes" value={form.month} onChange={v=>setForm({...form,month:v})} placeholder="ej. May 26"/>
        <Input label="Año" value={form.year} onChange={v=>setForm({...form,year:v})} type="number"/>
        <Input label="Canjeadas" value={form.canjeadas} onChange={v=>f("canjeadas",v)} type="number"/>
        <Input label="Realizadas" value={form.realizadas} onChange={v=>f("realizadas",v)} type="number"/>
        <Input label="Nuevos" value={form.nuevos} onChange={v=>f("nuevos",v)} type="number"/>
        <Input label="Total histórico" value={form.total_historico} onChange={v=>f("total_historico",v)} type="number"/>
        <Input label="C1" value={form.c1} onChange={v=>f("c1",v)} type="number"/>
        <Input label="C2" value={form.c2} onChange={v=>f("c2",v)} type="number"/>
        <Input label="C3" value={form.c3} onChange={v=>f("c3",v)} type="number"/>
        <Input label="C4" value={form.c4} onChange={v=>f("c4",v)} type="number"/>
        <Input label="C5" value={form.c5} onChange={v=>f("c5",v)} type="number"/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <input type="checkbox" checked={form.partial} onChange={e=>setForm({...form,partial:e.target.checked})} id="partial"/>
        <label htmlFor="partial" style={{fontSize:12,color:P.textMuted}}>Mes parcial</label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,background:P.white,borderRadius:10,overflow:"hidden",border:`1px solid ${P.border}`}}>
        <thead><tr style={{borderBottom:`1.5px solid ${P.border}`,background:P.gray50}}>
          {["Mes","Canj.","Real.","Nuevos","Hist.","C1","C2","C3","C4","C5","Parc.",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
          <td style={{padding:"8px 10px",fontWeight:600}}>{r.month} {r.year}</td>
          <td style={{padding:"8px 10px"}}>{r.canjeadas}</td><td style={{padding:"8px 10px"}}>{r.realizadas}</td>
          <td style={{padding:"8px 10px"}}>{r.nuevos}</td><td style={{padding:"8px 10px"}}>{r.total_historico||"—"}</td>
          <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c1}</td><td style={{padding:"8px 10px",color:P.textMuted}}>{r.c2}</td>
          <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c3}</td><td style={{padding:"8px 10px",color:P.textMuted}}>{r.c4}</td>
          <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c5}</td>
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
    const {error:e2,data:inserted}=await supabase.from("company_users").insert([{company_id:company.id,email:form.email,full_name:form.full_name,role:form.role,active:true}]).select().single();
    if(e2){setMsg("Error: "+e2.message);setLoading(false);return;}
    await savePerms(inserted.id,formPerms);
    // Call Edge Function to send invite
    const {data:{session}}=await supabase.auth.getSession();
    const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
      body:JSON.stringify({email:form.email,company_id:company.id,full_name:form.full_name,role:form.role})
    });
    const result=await res.json();
    if(result.error) setMsg(`${form.full_name} agregado. Mail: ${result.error}`);
    else setMsg(`Invitación enviada a ${form.email}.`);
    setShowForm(false);setForm({email:"",full_name:"",role:"viewer"});setFormPerms({individual:true,colectivo:true,estrategico:true,gestion:false});
    setLoading(false);load();
  }
  async function toggleActive(u){await supabase.from("company_users").update({active:!u.active}).eq("id",u.id);load();}
  async function updatePerms(userId,newPerms){await savePerms(userId,newPerms);setUserPerms(prev=>({...prev,[userId]:newPerms}));}
  async function del(id){await supabase.from("user_permissions").delete().eq("user_id",id);await supabase.from("company_users").delete().eq("id",id);load();}
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

// ── TALLERES TAB ───────────────────────────────────────────────────
function TalleresTab({ companyId }) {
  const [subtab, setSubtab] = useState("realizados");
  const [rows, setRows] = useState([]);
  const [recs, setRecs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [form, setForm] = useState({title:"",date:"",speaker:"",initials:"",type:"Activación",lang:"Español",rating:"",rating_tallerista:"",rating_relevancia:""});
  const [recForm, setRecForm] = useState({title:"",descripcion:"",month:""});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); loadRecs(); },[companyId]);
  async function load(){const {data}=await supabase.from("workshops").select("*").eq("company_id",companyId).order("date",{ascending:false});setRows(data||[]);}
  async function loadRecs(){const {data}=await supabase.from("workshops_recommended").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRecs(data||[]);}
  async function save(){
    if(!form.title||!form.date){setMsg("Título y fecha obligatorios.");return;}
    const {error}=await supabase.from("workshops").insert([{...form,company_id:companyId,rating:parseFloat(form.rating)||null,rating_tallerista:parseFloat(form.rating_tallerista)||null,rating_relevancia:parseFloat(form.rating_relevancia)||null}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Taller guardado.");setShowForm(false);load();setForm({title:"",date:"",speaker:"",initials:"",type:"Activación",lang:"Español",rating:"",rating_tallerista:"",rating_relevancia:""});}
  }
  async function saveRec(){
    if(!recForm.title){setMsg("Título obligatorio.");return;}
    const {error}=await supabase.from("workshops_recommended").insert([{...recForm,company_id:companyId}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Recomendación guardada.");setShowRecForm(false);loadRecs();setRecForm({title:"",descripcion:"",month:""});}
  }
  async function del(id){await supabase.from("workshops").delete().eq("id",id);load();}
  async function delRec(id){await supabase.from("workshops_recommended").delete().eq("id",id);loadRecs();}
  const TIPOS=["Activación","Concientización","Mindfulness","Liderazgo","8M","Otro"];
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${P.border}`}}>
      {["realizados","recomendados"].map(t=><button key={t} onClick={()=>setSubtab(t)} style={{fontSize:12,fontWeight:subtab===t?600:400,color:subtab===t?P.primary:P.textMuted,background:"none",border:"none",borderBottom:subtab===t?`2px solid ${P.primary}`:"2px solid transparent",padding:"8px 14px",cursor:"pointer",textTransform:"capitalize"}}>{t}</button>)}
    </div>
    {subtab==="realizados"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:13,color:P.textMuted}}>{rows.length} talleres</div>
        <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar taller</Btn>
      </div>
      {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Mindfulness en el trabajo"/>
          <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})} placeholder="ej. Ago 2025"/>
          <Input label="Speaker" value={form.speaker} onChange={v=>setForm({...form,speaker:v})}/>
          <Input label="Iniciales" value={form.initials} onChange={v=>setForm({...form,initials:v})} placeholder="ej. TT"/>
          <Select label="Tipo" value={form.type} onChange={v=>setForm({...form,type:v})} options={TIPOS.map(t=>({value:t,label:t}))}/>
          <Select label="Idioma" value={form.lang} onChange={v=>setForm({...form,lang:v})} options={[{value:"Español",label:"Español"},{value:"Inglés",label:"Inglés"}]}/>
          <Input label="★ Satisfacción general" value={form.rating} onChange={v=>setForm({...form,rating:v})} type="number" placeholder="ej. 4.8"/>
          <Input label="★ Calificación tallerista" value={form.rating_tallerista} onChange={v=>setForm({...form,rating_tallerista:v})} type="number"/>
          <Input label="★ Relevancia contenido" value={form.rating_relevancia} onChange={v=>setForm({...form,rating_relevancia:v})} type="number"/>
        </div>
        <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin talleres aún.</div></Card>}
        {rows.map(r=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:10}}>{r.initials||"TT"}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>
            <div style={{fontSize:11,color:P.textMuted}}>{r.date} · {r.speaker} · {r.type}</div>
            {(r.rating||r.rating_tallerista||r.rating_relevancia)&&<div style={{fontSize:11,color:P.accent,marginTop:2}}>
              {r.rating&&`★ ${r.rating} general`} {r.rating_tallerista&&`· ${r.rating_tallerista} tallerista`} {r.rating_relevancia&&`· ${r.rating_relevancia} relevancia`}
            </div>}
          </div>
          <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
        </div>)}
      </div>
    </>}
    {subtab==="recomendados"&&<>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:13,color:P.textMuted}}>{recs.length} recomendados</div>
        <Btn small onClick={()=>setShowRecForm(!showRecForm)}>+ Agregar</Btn>
      </div>
      {showRecForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
        <Input label="Título" value={recForm.title} onChange={v=>setRecForm({...recForm,title:v})} placeholder="ej. Gestión del estrés"/>
        <Textarea label="Descripción" value={recForm.descripcion} onChange={v=>setRecForm({...recForm,descripcion:v})} rows={2}/>
        <Input label="Mes sugerido" value={recForm.month} onChange={v=>setRecForm({...recForm,month:v})} placeholder="ej. Jun 2026"/>
        <div style={{display:"flex",gap:8}}><Btn small onClick={saveRec}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowRecForm(false)}>Cancelar</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {recs.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin recomendaciones aún.</div></Card>}
        {recs.map(r=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>
            {r.descripcion&&<div style={{fontSize:11,color:P.textMuted}}>{r.descripcion}</div>}
            {r.month&&<span style={{background:P.lighter,color:P.primary,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{r.month}</span>}
          </div>
          <button onClick={()=>delRec(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
        </div>)}
      </div>
    </>}
  </div>;
}

// ── CONTENIDO TAB ──────────────────────────────────────────────────
function ContenidoTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({title:"",type:"Campana",date:"",_file:null});
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("content").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!form.title){setMsg("Título obligatorio.");return;}
    const today=new Date().toLocaleDateString("es-UY",{month:"short",year:"numeric"});
    const {data:ins,error}=await supabase.from("content").insert([{title:form.title,type:form.type,date:form.date||today,company_id:companyId,is_new:true}]).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._file){
      const ext=form._file.name.split('.').pop();
      const path=`${companyId}/${ins.id}.${ext}`;
      const {error:upErr}=await supabase.storage.from("contenido").upload(path,form._file,{upsert:true,contentType:form._file.type});
      if(!upErr){const {data}=supabase.storage.from("contenido").getPublicUrl(path);await supabase.from("content").update({file_url:data.publicUrl}).eq("id",ins.id);}
    }
    setMsg("Contenido agregado.");setShowForm(false);load();setForm({title:"",type:"Campana",date:"",_file:null});
  }
  async function del(id){await supabase.from("content").delete().eq("id",id);load();}
  const TYPE_C={Campana:{bg:"#FFF0E6",tx:"#7A3800"},Guia:{bg:P.lighter,tx:P.primary},Protocolo:{bg:"#EEF4FF",tx:"#1A3A8B"}};
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} piezas</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar contenido</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Guia para lideres"/>
        <Select label="Tipo" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"Campana",label:"Campaña"},{value:"Guia",label:"Guía"},{value:"Protocolo",label:"Protocolo"}]}/>
        <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})} placeholder="ej. May 2026"/>
      </div>
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
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin contenido aún.</div></Card>}
      {rows.map(r=>{const col=TYPE_C[r.type]||{bg:P.lighter,tx:P.primary};return <div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <Badge text={r.type==="Campana"?"Campaña":r.type==="Guia"?"Guía":r.type} bg={col.bg} color={col.tx}/>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div><div style={{fontSize:11,color:P.textMuted}}>{r.date}</div></div>
        {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>}
        <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
      </div>;})}
    </div>
  </div>;
}

// ── MOTIVOS TAB ────────────────────────────────────────────────────
function MotivosTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({reason:"",percentage:"",count:"",period:""});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("consultation_reasons").select("*").eq("company_id",companyId).order("percentage",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!form.reason){setMsg("El motivo es obligatorio.");return;}
    const {error}=await supabase.from("consultation_reasons").insert([{...form,company_id:companyId,percentage:parseFloat(form.percentage)||null,count:parseInt(form.count)||null}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Guardado.");setShowForm(false);load();setForm({reason:"",percentage:"",count:"",period:""});}
  }
  async function del(id){await supabase.from("consultation_reasons").delete().eq("id",id);load();}
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} motivos</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Agregar motivo</Btn>
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
function EncuestasTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({title:"",descripcion:"",_file:null});
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("encuestas_archivos").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);}
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
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
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

// ── INFORMES TAB ───────────────────────────────────────────────────
function InformesTab({ companyId }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({title:"",period:"",_file:null});
  const [msg, setMsg] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load(){const {data}=await supabase.from("informes").select("*").eq("company_id",companyId).order("created_at",{ascending:false});setRows(data||[]);}
  async function save(){
    if(!form.title){setMsg("Título obligatorio.");return;}
    const {data:ins,error}=await supabase.from("informes").insert([{title:form.title,period:form.period,company_id:companyId}]).select().single();
    if(error){setMsg("Error: "+error.message);return;}
    if(form._file){
      const ext=form._file.name.split('.').pop();const path=`${companyId}/${ins.id}.${ext}`;
      const {error:upErr}=await supabase.storage.from("informes").upload(path,form._file,{upsert:true,contentType:form._file.type});
      if(!upErr){const {data}=supabase.storage.from("informes").getPublicUrl(path);await supabase.from("informes").update({file_url:data.publicUrl}).eq("id",ins.id);}
    }
    setMsg("Informe creado.");setShowForm(false);load();setForm({title:"",period:"",_file:null});
  }
  async function del(id){await supabase.from("informes").delete().eq("id",id);load();}
  return <div style={{padding:"20px 24px"}}>
    <Msg text={msg}/>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontSize:13,color:P.textMuted}}>{rows.length} informes</div>
      <Btn small onClick={()=>setShowForm(!showForm)}>+ Nuevo informe</Btn>
    </div>
    {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Informe Q1 2026"/>
        <Input label="Período" value={form.period} onChange={v=>setForm({...form,period:v})} placeholder="ej. Ene-Mar 2026"/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Archivo</label>
        <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          📎 {form._file?form._file.name:"Seleccionar archivo"}
          <input type="file" accept=".pdf,.xlsx,.docx" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
        </label>
      </div>
      <div style={{display:"flex",gap:8}}><Btn small onClick={save}>Guardar</Btn><Btn small variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
    </Card>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.length===0&&<Card><div style={{textAlign:"center",padding:"16px",color:P.textMuted}}>Sin informes aún.</div></Card>}
      {rows.map(r=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.title}</div>{r.period&&<div style={{fontSize:11,color:P.textMuted}}>{r.period}</div>}</div>
        {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{color:P.accent,fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>}
        <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
      </div>)}
    </div>
  </div>;
}

// ── TEXTOS TAB ─────────────────────────────────────────────────────
const MODULES_HEADERS=[
  {module:"individual",subs:["Sesiones","Adherencia","Distribución de cupones"],label:"Colaboradores",color:"#4a9356"},
  {module:"colectivo",subs:["Talleres","Contenido"],label:"Cultura de Bienestar",color:P.purple},
  {module:"estrategico",subs:["Bienestar del equipo","Consultoría Tu Terapia","Recursos y reportes"],label:"Estrategia de Bienestar",color:P.accent},
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
      await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer re_9rj91mUx_K7pxQ8tKqs6SFoZmZskNTi2n"},
        body:JSON.stringify({from:"noreply@tuterapia-empresas.com",to:company.referente_email,subject:`Recordatorio de pago — ${r.period} · Tu Terapia`,
          html:`<p>Te recordamos que la factura del período <b>${r.period}</b> por <b>UY$ ${r.amount?.toLocaleString()}</b> está pendiente de pago.</p><p>Podés verla desde <a href="https://tuterapia-empresas.com">tu panel de bienestar</a>.</p><p>El equipo de Tu Terapia</p>`})});
      setMsg(`Recordatorio enviado a ${company.referente_email}`);
    }catch(e){setMsg("Error enviando recordatorio.");}
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
  const [form, setForm] = useState({name:"",domain:"",plan_type:"Cuponera Fija",plan_coverage:"100%",monthly_plan:"300",session_price_ref:"1600",start_date:"",workshop_target:"5",contact_name:""});
  const [msg, setMsg] = useState("");
  async function save(){
    if(!form.name||!form.domain){setMsg("Nombre y dominio obligatorios.");return;}
    const {error}=await supabase.from("companies").insert([{...form,monthly_plan:parseInt(form.monthly_plan)||300,session_price_ref:parseInt(form.session_price_ref)||1600,workshop_target:parseInt(form.workshop_target)||5}]);
    if(error) setMsg("Error: "+error.message);
    else{setMsg("Empresa creada.");setShowForm(false);reload();setForm({name:"",domain:"",plan_type:"Cuponera Fija",plan_coverage:"100%",monthly_plan:"300",session_price_ref:"1600",start_date:"",workshop_target:"5",contact_name:""});}
  }
  async function del(id){if(!confirm("¿Eliminar empresa?"))return;await supabase.from("companies").delete().eq("id",id);reload();}
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
        <Select label="Tipo de plan" value={form.plan_type} onChange={v=>setForm({...form,plan_type:v})} options={[{value:"Cuponera Fija",label:"Cuponera Fija"},{value:"A Demanda",label:"A Demanda"}]}/>
        <Select label="Cobertura" value={form.plan_coverage} onChange={v=>setForm({...form,plan_coverage:v})} options={[{value:"100%",label:"100%"},{value:"60%",label:"60%"},{value:"50%",label:"50%"}]}/>
        <Input label="Sesiones/mes" value={form.monthly_plan} onChange={v=>setForm({...form,monthly_plan:v})} type="number"/>
        <Input label="Inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
        <Input label="Contacto RRHH" value={form.contact_name} onChange={v=>setForm({...form,contact_name:v})}/>
      </div>
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

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const {data:ad}=await supabase.from("admin_users").select("*").eq("email",session.user.email).single();
        if(ad){setUser(session.user);setAdminData(ad);}
        else{await supabase.auth.signOut();}
      }
      setLoading(false);
    });
  },[]);

  useEffect(()=>{ if(user) loadCompanies(); },[user]);
  async function loadCompanies(){const {data}=await supabase.from("companies").select("*").order("created_at",{ascending:false});setCompanies(data||[]);}
  async function handleLogout(){await supabase.auth.signOut();setUser(null);setAdminData(null);}

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:P.bg,fontFamily:"system-ui,sans-serif",color:P.textMuted,fontSize:13}}>Cargando...</div>;
  if(!user) return <LoginView onLogin={(u,ad)=>{setUser(u);setAdminData(ad);}}/>;

  const titles={dashboard:"Dashboard",empresas:"Empresas",talleristas:"Talleristas",tracking:"Tracking"};

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
        {active==="tracking"&&<TrackingView companies={companies}/>}
      </div>
    </div>
  );
}

