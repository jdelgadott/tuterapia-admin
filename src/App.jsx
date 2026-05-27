import { useState, useEffect } from "react";
import { supabase, supabaseAdmin } from "./supabase.js";

const P = {
  primary:"#1A5C4A", light:"#2D9977", lighter:"#E6F4F0", bg:"#F5F7F6",
  border:"#DDE8E4", text:"#18211E", textMuted:"#607870", white:"#FFFFFF",
  gray50:"#F0F4F2", red:"#B03030", redBg:"#FAEAEA",
  accent:"#2a6aaa", accentBg:"#e8f2fc",
};

// ── LOGIN ──────────────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if(!email||!password){ setError("Completá email y contraseña."); return; }
    setLoading(true); setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if(authError){ setError("Email o contraseña incorrectos."); setLoading(false); return; }
    // Verify admin
    const { data: adminData } = await supabase.from("admin_users").select("*").eq("email", email).single();
    if(!adminData){ await supabase.auth.signOut(); setError("No tenés acceso al panel admin."); setLoading(false); return; }
    onLogin(data.user, adminData);
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
      <div style={{background:P.white,borderRadius:16,border:`1px solid ${P.border}`,padding:"40px",width:360,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:48,height:48,borderRadius:12,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <span style={{color:"#fff",fontWeight:800,fontSize:16}}>TT</span>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:P.text,marginBottom:4}}>Panel Admin</div>
          <div style={{fontSize:13,color:P.textMuted}}>Tu Terapia — acceso restringido</div>
        </div>
        {error&&<div style={{padding:"10px 14px",background:P.redBg,color:P.red,borderRadius:8,marginBottom:16,fontSize:12,fontWeight:500}}>{error}</div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@tuterapia.com.uy"
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{width:"100%",padding:"10px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{width:"100%",padding:"10px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"11px",background:P.primary,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
          {loading?"Verificando...":"Ingresar"}
        </button>
      </div>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────────
function Sidebar({ active, setActive, adminName, onLogout }) {
  const items = [
    { id:"dashboard",       icon:"🏠", label:"Dashboard" },
    { id:"empresas",        icon:"🏢", label:"Empresas" },
    { id:"sesiones",        icon:"📊", label:"Sesiones" },
    { id:"talleres",        icon:"👥", label:"Talleres" },
    { id:"contenido",       icon:"📁", label:"Contenido" },
    { id:"facturas",        icon:"💳", label:"Facturación" },
    { id:"recomendaciones", icon:"💡", label:"Recomendaciones" },
    { id:"motivos",        icon:"🧠", label:"Motivos consulta" },
    { id:"informes",       icon:"📋", label:"Informes de uso" },
    { id:"encuestas",      icon:"📝", label:"Encuestas" },
    { id:"talleristas",    icon:"🎤", label:"Talleristas" },
    { id:"headers",        icon:"✏️",  label:"Frases headers" },
    { id:"usuarios",        icon:"👤", label:"Usuarios empresa" },
    { id:"tracking",        icon:"📈", label:"Tracking" },
  ];
  return (
    <div style={{width:220,background:P.primary,minHeight:"100vh",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"24px 20px 16px"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>Tu Terapia</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:2,letterSpacing:"0.06em",textTransform:"uppercase"}}>Panel Admin</div>
      </div>
      <nav style={{flex:1,padding:"8px 10px"}}>
        {items.map(item=>(
          <button key={item.id} onClick={()=>setActive(item.id)}
            style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,
              background:active===item.id?"rgba(255,255,255,0.15)":"none",
              color:active===item.id?"#fff":"rgba(255,255,255,0.65)",
              fontSize:13,fontWeight:active===item.id?600:400,textAlign:"left"}}>
            <span style={{fontSize:15}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:2}}>Sesión activa</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.85)",fontWeight:600,marginBottom:8}}>{adminName}</div>
        <button onClick={onLogout} style={{fontSize:11,color:"rgba(255,255,255,0.5)",background:"none",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,padding:"4px 10px",cursor:"pointer",width:"100%"}}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Header({ title, sub }) {
  return (
    <div style={{borderBottom:`1px solid ${P.border}`,padding:"18px 28px",background:P.white,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:P.text,letterSpacing:"-0.3px"}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:P.textMuted,marginTop:2}}>{sub}</div>}
      </div>
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"20px 24px",marginBottom:16,...style}}>{children}</div>;
}
function SectionTitle({ children }) {
  return <div style={{fontSize:11,fontWeight:700,color:P.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>{children}</div>;
}
function Badge({ text, color=P.primary, bg=P.lighter }) {
  return <span style={{background:bg,color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{text}</span>;
}
function Btn({ children, onClick, variant="primary", small=false, disabled=false }) {
  const styles = {
    primary:{ background:P.primary, color:"#fff", border:"none" },
    secondary:{ background:P.lighter, color:P.primary, border:`1px solid ${P.border}` },
    danger:{ background:P.redBg, color:P.red, border:`1px solid ${P.red}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{...styles[variant],borderRadius:8,padding:small?"5px 12px":"8px 16px",fontSize:small?11:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.6:1,display:"inline-flex",alignItems:"center",gap:6}}>
      {children}
    </button>
  );
}
function Input({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",boxSizing:"border-box",background:P.white}}/>
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, rows=3 }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",boxSizing:"border-box",background:P.white,resize:"vertical"}}/>
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"9px 12px",border:`1px solid ${P.border}`,borderRadius:8,fontSize:13,color:P.text,outline:"none",background:P.white,cursor:"pointer"}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function CompanySelect({ companies, value, onChange }) {
  return (
    <div style={{marginBottom:20,padding:"14px 16px",background:P.lighter,borderRadius:10,border:`1px solid ${P.border}`}}>
      <Select label="Empresa" value={value} onChange={onChange}
        options={[{value:"",label:"Seleccioná una empresa"},...companies.map(c=>({value:c.id,label:c.name}))]}/>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────
function DashboardView({ companies }) {
  const [pageViews, setPageViews] = useState([]);
  useEffect(()=>{ supabase.from("page_views").select("*").order("created_at",{ascending:false}).limit(10).then(({data})=>setPageViews(data||[])); },[]);
  return (
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[["Empresas activas",companies.length,"🏢"],["Visitas al dash",pageViews.length,"👁"],["Estado","Operativo","✅"]].map(([l,v,i])=>(
          <div key={l} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"18px 20px"}}>
            <div style={{fontSize:28,marginBottom:6}}>{i}</div>
            <div style={{fontSize:26,fontWeight:700,color:P.primary,letterSpacing:"-1px"}}>{v}</div>
            <div style={{fontSize:12,color:P.textMuted,marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle>Empresas registradas</SectionTitle>
        {companies.length===0
          ? <div style={{fontSize:12,color:P.textMuted,textAlign:"center",padding:"20px"}}>Sin empresas aún.</div>
          : companies.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${P.border}`}}>
              <div style={{width:36,height:36,borderRadius:8,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontWeight:700,fontSize:11}}>{c.name?.slice(0,2).toUpperCase()}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:P.text}}>{c.name}</div>
                <div style={{fontSize:11,color:P.textMuted}}>@{c.domain} · {c.plan_type} · {c.start_date}</div>
              </div>
              <Badge text="Activa"/>
            </div>)
        }
      </Card>
      <Card>
        <SectionTitle>Últimas visitas</SectionTitle>
        {pageViews.length===0
          ? <div style={{fontSize:12,color:P.textMuted,textAlign:"center",padding:"20px"}}>Sin visitas aún.</div>
          : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
                {["Usuario","Módulo","Sección","Fecha"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{pageViews.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`}}>
                <td style={{padding:"9px 12px"}}>{v.user_email||"anónimo"}</td>
                <td style={{padding:"9px 12px",color:P.primary,fontWeight:500}}>{v.module||"home"}</td>
                <td style={{padding:"9px 12px",color:P.textMuted}}>{v.sub||"—"}</td>
                <td style={{padding:"9px 12px",color:P.textMuted}}>{new Date(v.created_at).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
              </tr>)}</tbody>
            </table>
        }
      </Card>
    </div>
  );
}

// ── EMPRESAS ──────────────────────────────────────────────────────
function EmpresasView({ companies, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", domain:"", plan_type:"Cuponera Fija", plan_coverage:"100%", monthly_plan:"300", session_price_ref:"1600", start_date:"", workshop_target:"5", contact_name:"" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    if(!form.name||!form.domain){ setMsg("Nombre y dominio son obligatorios."); return; }
    setLoading(true);
    const { error } = await supabase.from("companies").insert([{ ...form, monthly_plan:parseInt(form.monthly_plan)||300, session_price_ref:parseInt(form.session_price_ref)||1600, workshop_target:parseInt(form.workshop_target)||5 }]);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Empresa creada."); setShowForm(false); reload(); setForm({ name:"", domain:"", plan_type:"Cuponera Fija", plan_coverage:"100%", monthly_plan:"300", session_price_ref:"1600", start_date:"", workshop_target:"5", contact_name:"" }); }
    setLoading(false);
  }

  async function del(id) {
    if(!confirm("¿Eliminar empresa?")) return;
    await supabase.from("companies").delete().eq("id",id); reload();
  }

  return (
    <div style={{padding:"24px 28px"}}>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12,fontWeight:500}}>{msg}</div>}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontSize:13,color:P.textMuted}}>{companies.length} empresa{companies.length!==1?"s":""}</div>
        <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva empresa</Btn>
      </div>
      {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:20}}>
        <SectionTitle>Nueva empresa</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. TCS"/>
          <Input label="Dominio" value={form.domain} onChange={v=>setForm({...form,domain:v})} placeholder="ej. tcs.com"/>
          <Select label="Tipo de plan" value={form.plan_type} onChange={v=>setForm({...form,plan_type:v})} options={[{value:"Cuponera Fija",label:"Cuponera Fija"},{value:"A Demanda",label:"A Demanda"}]}/>
          <Select label="Cobertura" value={form.plan_coverage} onChange={v=>setForm({...form,plan_coverage:v})} options={[{value:"100%",label:"100%"},{value:"60%",label:"60%"},{value:"50%",label:"50%"}]}/>
          <Input label="Sesiones/mes" value={form.monthly_plan} onChange={v=>setForm({...form,monthly_plan:v})} type="number"/>
          <Input label="Precio ref. (UYU)" value={form.session_price_ref} onChange={v=>setForm({...form,session_price_ref:v})} type="number"/>
          <Input label="Fecha de inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
          <Input label="Target talleres/año" value={form.workshop_target} onChange={v=>setForm({...form,workshop_target:v})} type="number"/>
          <Input label="Contacto RRHH" value={form.contact_name} onChange={v=>setForm({...form,contact_name:v})} placeholder="ej. Laura M."/>
        </div>
        <div style={{display:"flex",gap:10}}><Btn onClick={save} disabled={loading}>{loading?"Guardando...":"Guardar"}</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {companies.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin empresas.</div></Card>}
        {companies.map(co=><div key={co.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:40,height:40,borderRadius:10,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{co.name?.slice(0,2).toUpperCase()}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:2}}>{co.name}</div>
              <div style={{fontSize:12,color:P.textMuted}}>@{co.domain} · {co.plan_type} · {co.monthly_plan} ses/mes · {co.start_date||"—"}</div>
            </div>
            <Badge text={co.plan_type}/>
            <button onClick={()=>del(co.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,padding:"4px"}}>🗑</button>
          </div>
          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${P.border}`,display:"flex",gap:24,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,color:P.textMuted}}>Consultoría estratégica:</span>
              <button onClick={async()=>{ await supabase.from("companies").update({consultoria_activa:!co.consultoria_activa}).eq("id",co.id); reload(); }}
                style={{background:co.consultoria_activa?P.primary:P.gray50,color:co.consultoria_activa?"#fff":P.textMuted,border:`1px solid ${co.consultoria_activa?P.primary:P.border}`,borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {co.consultoria_activa?"Activada":"Inactiva"}
              </button>
              {co.consultoria_solicitada&&!co.consultoria_activa&&<span style={{fontSize:11,color:P.accent,fontWeight:500}}>⏳ Solicitud pendiente</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,color:P.textMuted}}>Encuestas:</span>
              <select value={co.encuesta_frecuencia||"trimestral"}
                onChange={async(e)=>{ await supabase.from("companies").update({encuesta_frecuencia:e.target.value}).eq("id",co.id); reload(); }}
                style={{padding:"4px 10px",border:`1px solid ${P.border}`,borderRadius:6,fontSize:11,color:P.text,background:P.white,cursor:"pointer"}}>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,color:P.textMuted}}>Referente TT:</span>
              <input defaultValue={co.referente_email||"firoldi@tuterapia.com.uy"}
                onBlur={async(e)=>{ await supabase.from("companies").update({referente_email:e.target.value}).eq("id",co.id); }}
                style={{padding:"4px 10px",border:`1px solid ${P.border}`,borderRadius:6,fontSize:11,color:P.text,background:P.white,width:220}}/>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}

// ── SESIONES ──────────────────────────────────────────────────────
function SesionesView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month:"", year:new Date().getFullYear(), canjeadas:0, realizadas:0, nuevos:0, total_historico:0, c1:0, c2:0, c3:0, c4:0, c5:0, partial:false });
  const [msg, setMsg] = useState("");
  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() { const {data}=await supabase.from("sessions_data").select("*").eq("company_id",companyId).order("year").order("month"); setRows(data||[]); }
  async function save() {
    if(!form.month){ setMsg("Ingresá el mes."); return; }
    const {error}=await supabase.from("sessions_data").insert([{...form,company_id:companyId,year:parseInt(form.year)}]);
    if(error) setMsg("Error: "+error.message); else { setMsg("Guardado."); setShowForm(false); load(); }
  }
  async function del(id) { await supabase.from("sessions_data").delete().eq("id",id); load(); }
  const f=(k,v)=>setForm({...form,[k]:parseInt(v)||0});
  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={setCompanyId}/>
      {msg&&<div style={{padding:"10px 14px",background:P.lighter,color:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} meses</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar mes</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nuevo mes</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            <Input label="Mes (ej. May 26)" value={form.month} onChange={v=>setForm({...form,month:v})}/>
            <Input label="Año" value={form.year} onChange={v=>setForm({...form,year:v})} type="number"/>
            <Input label="Canjeadas" value={form.canjeadas} onChange={v=>f("canjeadas",v)} type="number"/>
            <Input label="Realizadas" value={form.realizadas} onChange={v=>f("realizadas",v)} type="number"/>
            <Input label="Nuevos" value={form.nuevos} onChange={v=>f("nuevos",v)} type="number"/>
            <Input label="Cup. 1" value={form.c1} onChange={v=>f("c1",v)} type="number"/>
            <Input label="Cup. 2" value={form.c2} onChange={v=>f("c2",v)} type="number"/>
            <Input label="Cup. 3" value={form.c3} onChange={v=>f("c3",v)} type="number"/>
            <Input label="Cup. 4" value={form.c4} onChange={v=>f("c4",v)} type="number"/>
            <Input label="Cup. 5" value={form.c5} onChange={v=>f("c5",v)} type="number"/>
            <Input label="Total histórico pacientes" value={form.total_historico} onChange={v=>f("total_historico",v)} type="number"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <input type="checkbox" checked={form.partial} onChange={e=>setForm({...form,partial:e.target.checked})} id="partial"/>
            <label htmlFor="partial" style={{fontSize:12,color:P.textMuted}}>Mes parcial</label>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <Card>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
                {["Mes","Canj.","Real.","Nuevos","C1","C2","C3","C4","C5","Parcial",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
                <td style={{padding:"8px 10px",fontWeight:600}}>{r.month} {r.year}</td>
                <td style={{padding:"8px 10px"}}>{r.canjeadas}</td><td style={{padding:"8px 10px"}}>{r.realizadas}</td><td style={{padding:"8px 10px"}}>{r.nuevos}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c1}</td><td style={{padding:"8px 10px",color:P.textMuted}}>{r.c2}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c3}</td><td style={{padding:"8px 10px",color:P.textMuted}}>{r.c4}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c5}</td>
                <td style={{padding:"8px 10px"}}>{r.partial?"✓":""}</td>
                <td style={{padding:"8px 10px"}}><button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer"}}>🗑</button></td>
              </tr>)}
              {rows.length===0&&<tr><td colSpan={11} style={{padding:"24px",textAlign:"center",color:P.textMuted}}>Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </>}
    </div>
  );
}

// ── RECOMENDACIONES ────────────────────────────────────────────────
function RecomendacionesView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ action:"", reason:"", urgency:"media", date:new Date().toLocaleDateString("es-UY",{day:"2-digit",month:"short",year:"numeric"}) });
  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() { const {data}=await supabase.from("recommendations").select("*").eq("company_id",companyId).order("created_at",{ascending:false}); setRows(data||[]); }
  async function save() { await supabase.from("recommendations").insert([{...form,company_id:companyId}]); setShowForm(false); load(); }
  async function del(id) { await supabase.from("recommendations").delete().eq("id",id); load(); }
  const uc={alta:{bg:P.redBg,tx:P.red},media:{bg:P.accentBg,tx:P.accent},baja:{bg:P.lighter,tx:P.primary}};
  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={setCompanyId}/>
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} recomendaciones</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <Input label="Acción sugerida" value={form.action} onChange={v=>setForm({...form,action:v})} placeholder="ej. Lanzar campaña Q2"/>
          <Textarea label="Razón / hallazgo clínico" value={form.reason} onChange={v=>setForm({...form,reason:v})} placeholder="Describí el hallazgo que justifica esta recomendación..."/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Select label="Urgencia" value={form.urgency} onChange={v=>setForm({...form,urgency:v})} options={[{value:"alta",label:"Urgente"},{value:"media",label:"Media prioridad"},{value:"baja",label:"A considerar"}]}/>
            <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})}/>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.map(r=>{const u=uc[r.urgency]||uc.media; return <Card key={r.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,marginBottom:8}}><Badge text={r.urgency==="alta"?"Urgente":r.urgency==="media"?"Media":"A considerar"} bg={u.bg} color={u.tx}/><span style={{fontSize:11,color:P.textMuted}}>{r.date}</span></div>
                <div style={{fontSize:13,fontWeight:700,color:P.text,marginBottom:6}}>{r.action}</div>
                <div style={{fontSize:12,color:P.textMuted,lineHeight:1.6}}>{r.reason}</div>
              </div>
              <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,marginLeft:12}}>🗑</button>
            </div>
          </Card>;})}
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin recomendaciones.</div></Card>}
        </div>
      </>}
    </div>
  );
}

// ── TRACKING ──────────────────────────────────────────────────────
function TrackingView({ companies }) {
  const [views, setViews] = useState([]);
  const [companyId, setCompanyId] = useState("");
  useEffect(()=>{ load(); },[companyId]);
  async function load() {
    let q=supabase.from("page_views").select("*").order("created_at",{ascending:false}).limit(100);
    if(companyId) q=q.eq("company_id",companyId);
    const {data}=await q; setViews(data||[]);
  }
  const byModule=views.reduce((acc,v)=>{ acc[v.module||"home"]=(acc[v.module||"home"]||0)+1; return acc; },{});
  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={setCompanyId}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
        {Object.entries(byModule).map(([mod,count])=>(
          <div key={mod} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:P.primary}}>{count}</div>
            <div style={{fontSize:11,color:P.textMuted,marginTop:2}}>{mod}</div>
          </div>
        ))}
        {!Object.keys(byModule).length&&<div style={{fontSize:12,color:P.textMuted}}>Sin visitas.</div>}
      </div>
      <Card>
        <SectionTitle>Detalle ({views.length})</SectionTitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
              {["Usuario","Módulo","Sección","Fecha"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
            </tr></thead>
            <tbody>{views.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
              <td style={{padding:"9px 12px"}}>{v.user_email||"anónimo"}</td>
              <td style={{padding:"9px 12px",color:P.primary,fontWeight:500}}>{v.module||"home"}</td>
              <td style={{padding:"9px 12px",color:P.textMuted}}>{v.sub||"—"}</td>
              <td style={{padding:"9px 12px",color:P.textMuted}}>{new Date(v.created_at).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
            </tr>)}
            {!views.length&&<tr><td colSpan={4} style={{padding:"24px",textAlign:"center",color:P.textMuted}}>Sin visitas.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── USUARIOS EMPRESA ──────────────────────────────────────────────
const MODULES_PERMS = [
  { id:"individual",  label:"Colaboradores",            color:"#4a9356" },
  { id:"colectivo",   label:"Cultura de Bienestar",     color:"#9070b8" },
  { id:"estrategico", label:"Estrategia de Bienestar",  color:"#2a6aaa" },
  { id:"gestion",     label:"Gestión",                  color:"#607870" },
];

function UsuariosView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [users, setUsers] = useState([]);
  const [userPerms, setUserPerms] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email:"", full_name:"", role:"viewer" });
  const [formPerms, setFormPerms] = useState({ individual:true, colectivo:true, estrategico:true, gestion:false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);

  async function load() {
    const {data:us} = await supabase.from("company_users").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setUsers(us||[]);
    if(us?.length) {
      const ids = us.map(u=>u.id);
      const {data:ps} = await supabase.from("user_permissions").select("*").in("user_id", ids);
      const permsMap = {};
      (ps||[]).forEach(p=>{ if(!permsMap[p.user_id]) permsMap[p.user_id]={}; permsMap[p.user_id][p.section]=p.visible; });
      setUserPerms(permsMap);
    }
  }

  async function savePerms(userId, perms) {
    await supabase.from("user_permissions").delete().eq("user_id", userId);
    const rows = Object.entries(perms).map(([section,visible])=>({ user_id:userId, section, visible }));
    if(rows.length) await supabase.from("user_permissions").insert(rows);
  }

  async function invite() {
    if(!form.email||!form.full_name){ setMsg("Email y nombre son obligatorios."); return; }
    setLoading(true); setMsg("");
    // 1. Create in company_users
    const {error:e2, data:inserted} = await supabase.from("company_users").insert([{
      company_id:companyId, email:form.email, full_name:form.full_name, role:form.role, active:true
    }]).select().single();
    if(e2){ setMsg("Error: "+e2.message); setLoading(false); return; }
    // 2. Save permissions
    await savePerms(inserted.id, formPerms);
    // 3. Send invitation email via Supabase Auth
    const {error:invErr} = await supabaseAdmin.auth.admin.inviteUserByEmail(form.email, {
      data: { company_id:companyId, full_name:form.full_name, role:form.role }
    });
    if(invErr) setMsg(`Usuario ${form.full_name} agregado. No se pudo enviar el mail de invitación: ${invErr.message}`);
    else setMsg(`Invitación enviada a ${form.email}. ${form.full_name} recibirá un mail para elegir su contraseña.`);
    setShowForm(false);
    setForm({ email:"", full_name:"", role:"viewer" });
    setFormPerms({ individual:true, colectivo:true, estrategico:true, gestion:false });
    setLoading(false);
    load();
  }

  async function updatePerms(userId, newPerms) {
    await savePerms(userId, newPerms);
    setUserPerms(prev=>({...prev,[userId]:newPerms}));
  }

  async function toggleActive(user) {
    await supabase.from("company_users").update({ active:!user.active }).eq("id",user.id);
    load();
  }

  async function del(id) {
    if(!confirm("¿Eliminar este usuario?")) return;
    await supabase.from("user_permissions").delete().eq("user_id",id);
    await supabase.from("company_users").delete().eq("id",id);
    load();
  }

  const company = companies.find(c=>c.id===companyId);

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12,fontWeight:500}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{users.length} usuario{users.length!==1?"s":""} — {company?.name}</div>
          <Btn onClick={()=>{ setShowForm(!showForm); setEditingUser(null); }}>+ Agregar usuario</Btn>
        </div>

        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nuevo usuario — {company?.name}</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Nombre completo" value={form.full_name} onChange={v=>setForm({...form,full_name:v})} placeholder="ej. Laura Martínez"/>
            <Input label="Email corporativo" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder={`ej. laura@${company?.domain||"empresa.com"}`} type="email"/>
            <Select label="Rol" value={form.role} onChange={v=>setForm({...form,role:v})}
              options={[{value:"viewer",label:"Viewer — solo lectura"},{value:"admin",label:"Admin — acceso total"}]}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>Módulos con acceso</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {MODULES_PERMS.map(m=><label key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:formPerms[m.id]?P.white:P.gray50,border:`1px solid ${formPerms[m.id]?m.color+"66":P.border}`,borderRadius:8,cursor:"pointer"}}>
                <input type="checkbox" checked={!!formPerms[m.id]} onChange={e=>setFormPerms({...formPerms,[m.id]:e.target.checked})} style={{width:16,height:16,accentColor:m.color}}/>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:formPerms[m.id]?m.color:P.textMuted}}>{m.label}</div>
                </div>
              </label>)}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={invite} disabled={loading}>{loading?"Guardando...":"Agregar usuario"}</Btn>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn>
          </div>
        </Card>}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {users.length===0&&<Card><div style={{textAlign:"center",padding:"24px",color:P.textMuted,fontSize:13}}>Sin usuarios aún.</div></Card>}
          {users.map(u=>{
            const perms = userPerms[u.id]||{};
            return <Card key={u.id}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:u.active?P.primary:P.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{u.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3,flexWrap:"wrap"}}>
                    <div style={{fontSize:14,fontWeight:600,color:P.text}}>{u.full_name}</div>
                    <Badge text={u.active?"Activo":"Inactivo"} bg={u.active?P.lighter:P.gray50} color={u.active?P.primary:P.textMuted}/>
                    <Badge text={u.role==="admin"?"Admin":"Viewer"} bg={P.accentBg} color={P.accent}/>
                  </div>
                  <div style={{fontSize:12,color:P.textMuted,marginBottom:12}}>{u.email}</div>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:600,color:P.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Acceso a módulos</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {MODULES_PERMS.map(m=>{
                        const hasAccess = perms[m.id]!==false && perms[m.id]!==undefined ? (Object.keys(perms).length===0 ? false : perms[m.id]) : false;
                        return <label key={m.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:hasAccess?P.white:P.gray50,border:`1px solid ${hasAccess?m.color+"66":P.border}`,borderRadius:20,cursor:"pointer"}}>
                          <input type="checkbox" checked={!!hasAccess}
                            onChange={e=>{ const np={...perms,[m.id]:e.target.checked}; updatePerms(u.id,np); }}
                            style={{width:13,height:13,accentColor:m.color}}/>
                          <span style={{fontSize:11,fontWeight:500,color:hasAccess?m.color:P.textMuted}}>{m.label}</span>
                        </label>;
                      })}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={()=>toggleActive(u)} style={{background:"none",border:`1px solid ${P.border}`,borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",color:P.textMuted}}>
                    {u.active?"Desactivar":"Activar"}
                  </button>
                  <button onClick={()=>del(u.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,padding:"4px"}}>🗑</button>
                </div>
              </div>
            </Card>;
          })}
        </div>
      </>}
    </div>
  );
}


// ── FACTURACIÓN ────────────────────────────────────────────────────
function FacturacionView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ period:"", amount:"", status:"pendiente", invoice:"" });
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);

  async function load() {
    const {data} = await supabase.from("billing").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRows(data||[]);
  }

  async function save() {
    if(!form.period||!form.amount){ setMsg("Período y monto son obligatorios."); return; }
    const {data:inserted, error} = await supabase.from("billing").insert([{period:form.period,amount:parseInt(form.amount),status:form.status,invoice:form.invoice,company_id:companyId}]).select().single();
    if(error){ setMsg("Error: "+error.message); return; }
    if(form._file) {
      const ext = form._file.name.split('.').pop();
      const path = `${companyId}/${inserted.id}.${ext}`;
      const {error:upErr} = await supabase.storage.from("facturas").upload(path, form._file, {upsert:true,contentType:form._file.type});
      if(!upErr){ const {data} = supabase.storage.from("facturas").getPublicUrl(path); await supabase.from("billing").update({file_url:data.publicUrl}).eq("id",inserted.id); }
    }
    setMsg("Factura creada."); setShowForm(false); load(); setForm({period:"",amount:"",status:"pendiente",invoice:""});
  }

  async function uploadPDF(id, file) {
    setUploading(u=>({...u,[id]:true}));
    const ext = file.name.split('.').pop();
    const path = `${companyId}/${id}.${ext}`;
    const {error:upErr} = await supabase.storage.from("facturas").upload(path, file, {upsert:true,contentType:file.type});
    if(upErr){ setMsg("Error: "+upErr.message); setUploading(u=>({...u,[id]:false})); return; }
    const {data} = supabase.storage.from("facturas").getPublicUrl(path);
    await supabase.from("billing").update({file_url:data.publicUrl}).eq("id",id);
    setUploading(u=>({...u,[id]:false}));
    setMsg("PDF subido correctamente.");
    load();
  }

  async function togglePaid(row) {
    const newStatus = row.status==="pagado"?"pendiente":"pagado";
    await supabase.from("billing").update({status:newStatus}).eq("id",row.id);
    load();
  }

  async function sendReminder(row) {
    const company = companies.find(co=>co.id===companyId);
    if(!company?.referente_email){ setMsg("Esta empresa no tiene referente asignado."); return; }
    try {
      await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer re_9rj91mUx_K7pxQ8tKqs6SFoZmZskNTi2n"},
        body:JSON.stringify({
          from:"onboarding@resend.dev",
          to:company.referente_email,
          subject:`Recordatorio de pago — ${row.period} · Tu Terapia`,
          html:`<p>Hola,</p><p>Te recordamos que la factura del período <b>${row.period}</b> por <b>UY$ ${row.amount.toLocaleString()}</b> se encuentra pendiente de pago.</p><p>Podés descargarla desde tu <a href="https://tuterapia-dashempresa.vercel.app">panel de bienestar</a>.</p><p>Ante cualquier consulta, no dudes en escribirnos.</p><p>El equipo de Tu Terapia</p>`
        })
      });
      setMsg(`Recordatorio enviado a ${company.referente_email}`);
    } catch(e) { setMsg("Error enviando recordatorio."); }
  }

  async function del(id) {
    if(!confirm("¿Eliminar esta factura?")) return;
    await supabase.from("billing").delete().eq("id",id); load();
  }

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12,fontWeight:500}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} facturas</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva factura</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nueva factura</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Período (ej. May 2026)" value={form.period} onChange={v=>setForm({...form,period:v})}/>
            <Input label="Monto (UYU)" value={form.amount} onChange={v=>setForm({...form,amount:v})} type="number"/>
            <Input label="N° factura" value={form.invoice} onChange={v=>setForm({...form,invoice:v})} placeholder="ej. TT-2026-051"/>
            <Select label="Estado" value={form.status} onChange={v=>setForm({...form,status:v})}
              options={[{value:"pendiente",label:"Pendiente"},{value:"pagado",label:"Pagado"}]}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>PDF de factura (opcional)</label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              📎 {form._file?form._file.name:"Seleccionar PDF"}
              <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
            </label>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin facturas aún.</div></Card>}
          {rows.map(r=><Card key={r.id}>
            <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:3}}>{r.period}</div>
                <div style={{fontSize:12,color:P.textMuted}}>{r.invoice} · UY$ {r.amount?.toLocaleString()}</div>
              </div>
              <Badge text={r.status==="pagado"?"Pagado":"Pendiente"} bg={r.status==="pagado"?P.lighter:P.redBg} color={r.status==="pagado"?P.primary:P.red}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {/* Upload PDF */}
                <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
                  {uploading[r.id]?"Subiendo...":r.file_url?"✓ PDF":"⬆ Subir PDF"}
                  <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadPDF(r.id,e.target.files[0])}/>
                </label>
                {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver PDF</a>}
                <button onClick={()=>togglePaid(r)} style={{background:r.status==="pagado"?P.redBg:P.lighter,color:r.status==="pagado"?P.red:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {r.status==="pagado"?"Marcar pendiente":"Marcar pagado"}
                </button>
                {r.status==="pendiente"&&<button onClick={()=>sendReminder(r)} style={{background:"#FFF8E1",color:"#F57F17",border:"1px solid #FFE082",borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>✉ Recordatorio</button>}
                <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
              </div>
            </div>
          </Card>)}
        </div>
      </>}
    </div>
  );
}

// ── TALLERES ───────────────────────────────────────────────────────
function TalleresView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [tab, setTab] = useState("realizados");
  const [rows, setRows] = useState([]);
  const [recs, setRecs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [form, setForm] = useState({ title:"", date:"", speaker:"", initials:"", type:"Activación", lang:"Español", rating:"" });
  const [recForm, setRecForm] = useState({ title:"", desc:"", month:"" });
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId){ load(); loadRecs(); } },[companyId]);
  async function load() {
    const {data} = await supabase.from("workshops").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRows(data||[]);
  }
  async function loadRecs() {
    const {data} = await supabase.from("workshops_recommended").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRecs(data||[]);
  }
  async function save() {
    if(!form.title||!form.date){ setMsg("Título y fecha son obligatorios."); return; }
    const {error} = await supabase.from("workshops").insert([{...form, company_id:companyId, rating:parseFloat(form.rating)||null}]);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Taller guardado."); setShowForm(false); load(); setForm({title:"",date:"",speaker:"",initials:"",type:"Activación",lang:"Español",rating:""}); }
  }
  async function saveRec() {
    if(!recForm.title){ setMsg("Título obligatorio."); return; }
    const {error} = await supabase.from("workshops_recommended").insert([{...recForm, company_id:companyId}]);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Recomendación guardada."); setShowRecForm(false); loadRecs(); setRecForm({title:"",desc:"",month:""}); }
  }
  async function del(id) { await supabase.from("workshops").delete().eq("id",id); load(); }
  async function delRec(id) { await supabase.from("workshops_recommended").delete().eq("id",id); loadRecs(); }

  const TIPOS=["Activación","Concientización","Mindfulness","Liderazgo","8M","Otro"];

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",gap:2,marginBottom:16,borderBottom:`1px solid ${P.border}`,paddingBottom:0}}>
          {["realizados","recomendados"].map(t=><button key={t} onClick={()=>setTab(t)} style={{fontSize:12,fontWeight:tab===t?600:400,color:tab===t?P.primary:P.textMuted,background:"none",border:"none",borderBottom:tab===t?`2px solid ${P.primary}`:"2px solid transparent",padding:"8px 16px",cursor:"pointer",textTransform:"capitalize"}}>{t}</button>)}
        </div>

        {tab==="realizados"&&<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:13,color:P.textMuted}}>{rows.length} talleres realizados</div>
            <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar taller</Btn>
          </div>
          {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
            <SectionTitle>Nuevo taller</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Mindfulness en el trabajo"/>
              <Input label="Fecha (ej. Ago 2025)" value={form.date} onChange={v=>setForm({...form,date:v})}/>
              <Input label="Speaker" value={form.speaker} onChange={v=>setForm({...form,speaker:v})} placeholder="ej. Equipo Tu Terapia"/>
              <Input label="Iniciales" value={form.initials} onChange={v=>setForm({...form,initials:v})} placeholder="ej. TT"/>
              <Select label="Tipo" value={form.type} onChange={v=>setForm({...form,type:v})} options={TIPOS.map(t=>({value:t,label:t}))}/>
              <Select label="Idioma" value={form.lang} onChange={v=>setForm({...form,lang:v})} options={[{value:"Español",label:"Español"},{value:"Inglés",label:"Inglés"},{value:"Portugués",label:"Portugués"}]}/>
              <Input label="Rating (ej. 4.8)" value={form.rating} onChange={v=>setForm({...form,rating:v})} type="number"/>
            </div>
            <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
          </Card>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin talleres realizados aún.</div></Card>}
            {rows.map(r=><div key={r.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontWeight:700,fontSize:11}}>{r.initials||"TT"}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:2}}>{r.title}</div>
                <div style={{fontSize:11,color:P.textMuted}}>{r.date} · {r.speaker} · {r.type}{r.lang&&r.lang!=="Español"?` · ${r.lang}`:""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {r.rating&&<span style={{fontSize:13,fontWeight:600,color:P.accent}}>★ {r.rating}</span>}
                <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
              </div>
            </div>)}
          </div>
        </>}

        {tab==="recomendados"&&<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:13,color:P.textMuted}}>{recs.length} talleres recomendados</div>
            <Btn onClick={()=>setShowRecForm(!showRecForm)}>+ Agregar recomendación</Btn>
          </div>
          {showRecForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
            <SectionTitle>Nueva recomendación de taller</SectionTitle>
            <Input label="Título del taller" value={recForm.title} onChange={v=>setRecForm({...recForm,title:v})} placeholder="ej. Gestión del estrés"/>
            <Textarea label="Descripción" value={recForm.descripcion} onChange={v=>setRecForm({...recForm,descripcion:v})} placeholder="ej. Para equipos con alta demanda operativa" rows={2}/>
            <Input label="Mes sugerido (ej. Jun 2026)" value={recForm.month} onChange={v=>setRecForm({...recForm,month:v})}/>
            <div style={{display:"flex",gap:10}}><Btn onClick={saveRec}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowRecForm(false)}>Cancelar</Btn></div>
          </Card>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {recs.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin recomendaciones aún.</div></Card>}
            {recs.map(r=><div key={r.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:2}}>{r.title}</div>
                <div style={{fontSize:11,color:P.textMuted,marginBottom:4}}>{r.descripcion}</div>
                {r.month&&<Badge text={r.month} bg={P.lighter} color={P.primary}/>}
              </div>
              <button onClick={()=>delRec(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
            </div>)}
          </div>
        </>}
      </>}
    </div>
  );
}

// ── CONTENIDO ──────────────────────────────────────────────────────
function ContenidoView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", type:"Campana", date:"" });
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() {
    const {data} = await supabase.from("content").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRows(data||[]);
  }
  async function save() {
    if(!form.title){ setMsg("Título obligatorio."); return; }
    const today = new Date().toLocaleDateString("es-UY",{month:"short",year:"numeric"});
    const {data:inserted, error} = await supabase.from("content").insert([{title:form.title,type:form.type,date:form.date||today,company_id:companyId,is_new:true}]).select().single();
    if(error){ setMsg("Error: "+error.message); return; }
    if(form._file) {
      const ext = form._file.name.split('.').pop();
      const path = `${companyId}/${inserted.id}.${ext}`;
      const {error:upErr} = await supabase.storage.from("contenido").upload(path, form._file, {upsert:true,contentType:form._file.type});
      if(!upErr){ const {data} = supabase.storage.from("contenido").getPublicUrl(path); await supabase.from("content").update({file_url:data.publicUrl}).eq("id",inserted.id); }
    }
    setMsg("Contenido agregado."); setShowForm(false); load(); setForm({title:"",type:"Campana",date:""});
  }
  async function uploadFile(id, file) {
    setUploading(u=>({...u,[id]:true}));
    const ext = file.name.split('.').pop();
    const path = `${companyId}/${id}.${ext}`;
    const {error:upErr} = await supabase.storage.from("contenido").upload(path, file, {upsert:true,contentType:file.type});
    if(upErr){ setMsg("Error: "+upErr.message); setUploading(u=>({...u,[id]:false})); return; }
    const {data} = supabase.storage.from("contenido").getPublicUrl(path);
    await supabase.from("content").update({file_url:data.publicUrl}).eq("id",id);
    setUploading(u=>({...u,[id]:false}));
    setMsg("Archivo subido.");
    load();
  }
  async function del(id) { await supabase.from("content").delete().eq("id",id); load(); }

  const TYPE_COLORS = {Campana:{bg:"#FFF0E6",tx:"#7A3800"},Guia:{bg:P.lighter,tx:P.primary},Protocolo:{bg:"#EEF4FF",tx:"#1A3A8B"}};

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} piezas de contenido</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar contenido</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nuevo contenido</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Guia para lideres"/>
            <Select label="Tipo" value={form.type} onChange={v=>setForm({...form,type:v})}
              options={[{value:"Campana",label:"Campaña"},{value:"Guia",label:"Guía"},{value:"Protocolo",label:"Protocolo"}]}/>
            <Input label="Fecha (ej. May 2026)" value={form.date} onChange={v=>setForm({...form,date:v})}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Archivo</label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              📎 {form._file?form._file.name:"Seleccionar archivo"}
              <input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
            </label>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin contenido aún.</div></Card>}
          {rows.map(r=>{
            const col=TYPE_COLORS[r.type]||{bg:P.lighter,tx:P.primary};
            return <div key={r.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <Badge text={r.type==="Campana"?"Campaña":r.type==="Guia"?"Guía":r.type} bg={col.bg} color={col.tx}/>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:2}}>{r.title}</div>
                <div style={{fontSize:11,color:P.textMuted}}>{r.date}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {uploading[r.id]?"Subiendo...":r.file_url?"✓ Archivo":"⬆ Subir archivo"}
                  <input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(r.id,e.target.files[0])}/>
                </label>
                {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>}
                {r.is_new&&<Badge text="Nuevo" bg={P.primary} color="#fff"/>}
                <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
              </div>
            </div>;
          })}
        </div>
      </>}
    </div>
  );
}

// ── MOTIVOS DE CONSULTA ────────────────────────────────────────────
function MotivosView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reason:"", percentage:"", count:"", period:"" });
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() {
    const {data} = await supabase.from("consultation_reasons").select("*").eq("company_id",companyId).order("percentage",{ascending:false});
    setRows(data||[]);
  }
  async function save() {
    if(!form.reason){ setMsg("El motivo es obligatorio."); return; }
    const {error} = await supabase.from("consultation_reasons").insert([{
      ...form, company_id:companyId,
      percentage:parseFloat(form.percentage)||null,
      count:parseInt(form.count)||null
    }]);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Motivo guardado."); setShowForm(false); load(); setForm({reason:"",percentage:"",count:"",period:""}); }
  }
  async function del(id) { await supabase.from("consultation_reasons").delete().eq("id",id); load(); }

  const top = rows[0];

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        {top&&<div style={{background:P.lighter,borderRadius:12,border:`1px solid ${P.primary+"44"}`,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>🔝</span>
          <div>
            <div style={{fontSize:11,color:P.textMuted,marginBottom:2}}>Motivo más presente</div>
            <div style={{fontSize:14,fontWeight:700,color:P.primary}}>{top.reason} — {top.percentage!=null?`${top.percentage}%`:top.count!=null?`${top.count} casos`:"—"}</div>
          </div>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} motivos cargados</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar motivo</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nuevo motivo de consulta</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Motivo" value={form.reason} onChange={v=>setForm({...form,reason:v})} placeholder="ej. Ansiedad"/>
            <Input label="Porcentaje (%)" value={form.percentage} onChange={v=>setForm({...form,percentage:v})} type="number" placeholder="ej. 34.5"/>
            <Input label="Cantidad (opcional)" value={form.count} onChange={v=>setForm({...form,count:v})} type="number"/>
            <Input label="Período (ej. Q1 2026)" value={form.period} onChange={v=>setForm({...form,period:v})}/>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin motivos cargados aún.</div></Card>}
          {rows.map((r,i)=><div key={r.id} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:i===0?P.primary:P.lighter,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:11,fontWeight:700,color:i===0?"#fff":P.primary}}>#{i+1}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:P.text}}>{r.reason}</div>
              {r.period&&<div style={{fontSize:11,color:P.textMuted}}>{r.period}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {r.percentage!=null&&<span style={{fontSize:14,fontWeight:700,color:P.primary}}>{r.percentage}%</span>}
              {r.count!=null&&<span style={{fontSize:12,color:P.textMuted}}>{r.count} casos</span>}
              <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
            </div>
          </div>)}
        </div>
      </>}
    </div>
  );
}

// ── INFORMES ────────────────────────────────────────────────────────
function InformesView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", period:"" });
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() {
    const {data} = await supabase.from("informes").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRows(data||[]);
  }
  async function save() {
    if(!form.title){ setMsg("Título obligatorio."); return; }
    const {data:inserted, error} = await supabase.from("informes").insert([{title:form.title,period:form.period,company_id:companyId}]).select().single();
    if(error){ setMsg("Error: "+error.message); return; }
    if(form._file) {
      const ext = form._file.name.split('.').pop();
      const path = `${companyId}/${inserted.id}.${ext}`;
      const {error:upErr} = await supabase.storage.from("informes").upload(path, form._file, {upsert:true,contentType:form._file.type});
      if(!upErr){ const {data} = supabase.storage.from("informes").getPublicUrl(path); await supabase.from("informes").update({file_url:data.publicUrl}).eq("id",inserted.id); }
    }
    setMsg("Informe creado."); setShowForm(false); load(); setForm({title:"",period:""});
  }
  async function uploadFile(id, file) {
    setUploading(u=>({...u,[id]:true}));
    const ext = file.name.split('.').pop();
    const path = `${companyId}/${id}.${ext}`;
    const {error:upErr} = await supabase.storage.from("informes").upload(path, file, {upsert:true,contentType:file.type});
    if(upErr){ setMsg("Error: "+upErr.message); setUploading(u=>({...u,[id]:false})); return; }
    const {data} = supabase.storage.from("informes").getPublicUrl(path);
    await supabase.from("informes").update({file_url:data.publicUrl}).eq("id",id);
    setUploading(u=>({...u,[id]:false})); setMsg("Informe subido."); load();
  }
  async function del(id) { await supabase.from("informes").delete().eq("id",id); load(); }

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} informes</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Nuevo informe</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nuevo informe de uso</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Informe Q1 2026"/>
            <Input label="Período" value={form.period} onChange={v=>setForm({...form,period:v})} placeholder="ej. Ene–Mar 2026"/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Archivo (PDF)</label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              📎 {form._file?form._file.name:"Seleccionar archivo"}
              <input type="file" accept=".pdf,.xlsx,.docx" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
            </label>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin informes aún.</div></Card>}
          {rows.map(r=><Card key={r.id}>
            <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:3}}>{r.title}</div>
                {r.period&&<div style={{fontSize:12,color:P.textMuted}}>{r.period}</div>}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
                  {uploading[r.id]?"Subiendo...":r.file_url?"✓ Archivo":"⬆ Subir PDF"}
                  <input type="file" accept=".pdf,.xlsx,.docx" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(r.id,e.target.files[0])}/>
                </label>
                {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>}
                <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
              </div>
            </div>
          </Card>)}
        </div>
      </>}
    </div>
  );
}

// ── ENCUESTAS ARCHIVOS ─────────────────────────────────────────────
function EncuestasView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", descripcion:"" });
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() {
    const {data} = await supabase.from("encuestas_archivos").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRows(data||[]);
  }
  async function save() {
    if(!form.title){ setMsg("Título obligatorio."); return; }
    const {data:inserted, error} = await supabase.from("encuestas_archivos").insert([{title:form.title,descripcion:form.descripcion,company_id:companyId}]).select().single();
    if(error){ setMsg("Error: "+error.message); return; }
    if(form._file) {
      const ext = form._file.name.split('.').pop();
      const path = `${companyId}/${inserted.id}.${ext}`;
      const {error:upErr} = await supabase.storage.from("informes").upload(path, form._file, {upsert:true,contentType:form._file.type});
      if(!upErr){ const {data} = supabase.storage.from("informes").getPublicUrl(path); await supabase.from("encuestas_archivos").update({file_url:data.publicUrl}).eq("id",inserted.id); }
    }
    setMsg("Encuesta creada."); setShowForm(false); load(); setForm({title:"",descripcion:""});
  }
  async function uploadFile(id, file) {
    setUploading(u=>({...u,[id]:true}));
    const ext = file.name.split('.').pop();
    const path = `${companyId}/${id}.${ext}`;
    const {error:upErr} = await supabase.storage.from("informes").upload(path, file, {upsert:true,contentType:file.type});
    if(upErr){ setMsg("Error: "+upErr.message); setUploading(u=>({...u,[id]:false})); return; }
    const {data} = supabase.storage.from("informes").getPublicUrl(path);
    await supabase.from("encuestas_archivos").update({file_url:data.publicUrl}).eq("id",id);
    setUploading(u=>({...u,[id]:false})); setMsg("Archivo subido."); load();
  }
  async function del(id) { await supabase.from("encuestas_archivos").delete().eq("id",id); load(); }

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} encuestas</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva encuesta</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nueva encuesta descargable</SectionTitle>
          <Input label="Título" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Encuesta de Indice Tu Terapia Q2 2026"/>
          <Input label="Descripción" value={form.descripcion} onChange={v=>setForm({...form,descripcion:v})} placeholder="ej. 22 preguntas - 6 dimensiones"/>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Archivo</label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              📎 {form._file?form._file.name:"Seleccionar archivo"}
              <input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_file:e.target.files[0]})}/>
            </label>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin encuestas aún.</div></Card>}
          {rows.map(r=><Card key={r.id}>
            <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:3}}>{r.title}</div>
                {r.descripcion&&<div style={{fontSize:12,color:P.textMuted}}>{r.descripcion}</div>}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
                  {uploading[r.id]?"Subiendo...":r.file_url?"✓ Archivo":"⬆ Subir archivo"}
                  <input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadFile(r.id,e.target.files[0])}/>
                </label>
                {r.file_url&&<a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{background:P.accentBg,color:P.accent,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Ver</a>}
                <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
              </div>
            </div>
          </Card>)}
        </div>
      </>}
    </div>
  );
}

// ── TALLERISTAS ────────────────────────────────────────────────────
function TalleristasView({ companies }) {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", initials:"" });
  const [uploading, setUploading] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(()=>{ load(); },[]);
  async function load() {
    const {data} = await supabase.from("talleristas").select("*").order("name");
    setRows(data||[]);
  }
  async function save() {
    if(!form.name){ setMsg("Nombre obligatorio."); return; }
    const {data:inserted, error} = await supabase.from("talleristas").insert([{name:form.name,initials:form.initials}]).select().single();
    if(error){ setMsg("Error: "+error.message); return; }
    if(form._photoFile) {
      const ext = form._photoFile.name.split('.').pop();
      const path = `talleristas/${inserted.id}.${ext}`;
      const {error:upErr} = await supabase.storage.from("contenido").upload(path, form._photoFile, {upsert:true,contentType:form._photoFile.type});
      if(!upErr){ const {data} = supabase.storage.from("contenido").getPublicUrl(path); await supabase.from("talleristas").update({photo_url:data.publicUrl}).eq("id",inserted.id); }
    }
    setMsg("Tallerista creado."); setShowForm(false); load(); setForm({name:"",initials:""});
  }
  async function uploadPhoto(id, file) {
    setUploading(u=>({...u,[id]:true}));
    const ext = file.name.split('.').pop();
    const path = `talleristas/${id}.${ext}`;
    const {error:upErr} = await supabase.storage.from("contenido").upload(path, file, {upsert:true,contentType:file.type});
    if(upErr){ setMsg("Error: "+upErr.message); setUploading(u=>({...u,[id]:false})); return; }
    const {data} = supabase.storage.from("contenido").getPublicUrl(path);
    await supabase.from("talleristas").update({photo_url:data.publicUrl}).eq("id",id);
    setUploading(u=>({...u,[id]:false})); setMsg("Foto subida."); load();
  }
  async function del(id) { await supabase.from("talleristas").delete().eq("id",id); load(); }

  return (
    <div style={{padding:"24px 28px"}}>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:13,color:P.textMuted}}>{rows.length} talleristas registrados</div>
        <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar tallerista</Btn>
      </div>
      {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
        <SectionTitle>Nuevo tallerista</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Nombre completo" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. Juan Ignacio Delgado"/>
          <Input label="Iniciales" value={form.initials} onChange={v=>setForm({...form,initials:v})} placeholder="ej. JD"/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:600,color:P.textMuted,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Foto</label>
          <label style={{display:"inline-flex",alignItems:"center",gap:8,background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            📷 {form._photoFile?form._photoFile.name:"Seleccionar foto"}
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setForm({...form,_photoFile:e.target.files[0]})}/>
          </label>
        </div>
        <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted}}>Sin talleristas aún.</div></Card>}
        {rows.map(r=><Card key={r.id}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {r.photo_url
              ? <img src={r.photo_url} alt={r.name} style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
              : <div style={{width:52,height:52,borderRadius:"50%",background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{r.initials||r.name?.slice(0,2).toUpperCase()}</span>
                </div>
            }
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:2}}>{r.name}</div>
              <div style={{fontSize:12,color:P.textMuted}}>Iniciales: {r.initials||"—"}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <label style={{background:P.lighter,color:P.primary,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
                {uploading[r.id]?"Subiendo...":r.photo_url?"✓ Cambiar foto":"⬆ Subir foto"}
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadPhoto(r.id,e.target.files[0])}/>
              </label>
              <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16}}>🗑</button>
            </div>
          </div>
        </Card>)}
      </div>
    </div>
  );
}

// ── FRASES HEADERS ─────────────────────────────────────────────────
const MODULES_HEADERS = [
  { module:"individual", subs:["Sesiones","Adherencia","Distribución de cupones"], label:"Colaboradores" },
  { module:"colectivo",  subs:["Talleres","Contenido"], label:"Cultura de Bienestar" },
  { module:"estrategico",subs:["Bienestar del equipo","Consultoría Tu Terapia","Recursos y reportes"], label:"Estrategia de Bienestar" },
  { module:"gestion",    subs:["Facturación","Plan activo","Equipo TT"], label:"Gestión" },
];

function HeadersView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title:"", subtitle:"" });
  const [msg, setMsg] = useState("");

  useEffect(()=>{ if(companyId) load(); },[companyId]);
  async function load() {
    const {data} = await supabase.from("header_texts").select("*").eq("company_id",companyId);
    setRows(data||[]);
  }
  function getRow(module, sub) {
    return rows.find(r=>r.module===module&&r.sub===sub);
  }
  async function save(module, sub) {
    const existing = getRow(module, sub);
    if(existing) {
      await supabase.from("header_texts").update({title:form.title,subtitle:form.subtitle}).eq("id",existing.id);
    } else {
      await supabase.from("header_texts").insert([{company_id:companyId,module,sub,title:form.title,subtitle:form.subtitle}]);
    }
    setEditing(null); setMsg("Guardado."); load();
  }
  async function del(id) { await supabase.from("header_texts").delete().eq("id",id); load(); }

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={v=>{ setCompanyId(v); setMsg(""); }}/>
      {msg&&<div style={{padding:"10px 14px",background:P.lighter,color:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{fontSize:12,color:P.textMuted,marginBottom:16,lineHeight:1.6}}>
          Editá el título y subtítulo de cada pestaña. Si dejás vacío, el dashboard muestra el texto por defecto.
        </div>
        {MODULES_HEADERS.map(mod=><Card key={mod.module} style={{marginBottom:12}}>
          <SectionTitle>{mod.label}</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {mod.subs.map(sub=>{
              const row = getRow(mod.module, sub);
              const isEditing = editing===`${mod.module}-${sub}`;
              return <div key={sub} style={{padding:"10px 14px",background:P.gray50,borderRadius:8,border:`1px solid ${P.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isEditing?10:0}}>
                  <div>
                    <span style={{fontSize:12,fontWeight:600,color:P.text}}>{sub}</span>
                    {row?.title&&<span style={{fontSize:11,color:P.textMuted,marginLeft:8}}>"{row.title}"</span>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{ setEditing(`${mod.module}-${sub}`); setForm({title:row?.title||"",subtitle:row?.subtitle||""}); }}
                      style={{background:"none",border:`1px solid ${P.border}`,borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer",color:P.primary}}>
                      {row?.title?"Editar":"+ Agregar"}
                    </button>
                    {row&&<button onClick={()=>del(row.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:14}}>🗑</button>}
                  </div>
                </div>
                {isEditing&&<div>
                  <Input label="Título principal" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="ej. Tu equipo avanza hacia el bienestar"/>
                  <Input label="Subtítulo" value={form.subtitle} onChange={v=>setForm({...form,subtitle:v})} placeholder="ej. 2.573 sesiones realizadas este año"/>
                  <div style={{display:"flex",gap:8}}>
                    <Btn small onClick={()=>save(mod.module,sub)}>Guardar</Btn>
                    <Btn small variant="secondary" onClick={()=>setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>}
              </div>;
            })}
          </div>
        </Card>)}
      </>}
    </div>
  );
}

function Placeholder({ label }) {
  return <div style={{padding:"60px 28px",textAlign:"center",color:P.textMuted}}>
    <div style={{fontSize:32,marginBottom:12}}>🔧</div>
    <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:4}}>{label}</div>
    <div style={{fontSize:12}}>Disponible en la próxima iteración.</div>
  </div>;
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [companies, setCompanies] = useState([]);

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const {data:ad}=await supabase.from("admin_users").select("*").eq("email",session.user.email).single();
        if(ad){ setUser(session.user); setAdminData(ad); }
        else { await supabase.auth.signOut(); }
      }
      setLoading(false);
    });
  },[]);

  useEffect(()=>{ if(user) loadCompanies(); },[user]);
  async function loadCompanies() { const {data}=await supabase.from("companies").select("*").order("created_at",{ascending:false}); setCompanies(data||[]); }

  async function handleLogout() { await supabase.auth.signOut(); setUser(null); setAdminData(null); }

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:P.bg,fontFamily:"system-ui,sans-serif",color:P.textMuted,fontSize:13}}>Cargando...</div>;
  if(!user) return <LoginView onLogin={(u,ad)=>{ setUser(u); setAdminData(ad); }}/>;

  const titles={dashboard:"Dashboard",empresas:"Empresas",sesiones:"Sesiones",talleres:"Talleres",contenido:"Contenido",facturas:"Facturación",recomendaciones:"Recomendaciones",motivos:"Motivos de consulta", informes:"Informes de uso", encuestas:"Encuestas", talleristas:"Talleristas", headers:"Frases de headers",usuarios:"Usuarios empresa",tracking:"Tracking"};

  return (
    <div style={{display:"flex",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:P.bg,color:P.text}}>
      <Sidebar active={active} setActive={setActive} adminName={adminData?.name||user?.email} onLogout={handleLogout}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <Header title={titles[active]||active} sub={active==="sesiones"?"Cargá datos mensuales por empresa":active==="tracking"?"Actividad del dashboard":active==="recomendaciones"?"Recomendaciones clínicas por empresa":null}/>
        {active==="dashboard"&&<DashboardView companies={companies}/>}
        {active==="empresas"&&<EmpresasView companies={companies} reload={loadCompanies}/>}
        {active==="sesiones"&&<SesionesView companies={companies}/>}
        {active==="recomendaciones"&&<RecomendacionesView companies={companies}/>}
        {active==="tracking"&&<TrackingView companies={companies}/>}
        {active==="motivos"&&<MotivosView companies={companies}/>}
        {active==="informes"&&<InformesView companies={companies}/>}
        {active==="encuestas"&&<EncuestasView companies={companies}/>}
        {active==="talleristas"&&<TalleristasView companies={companies}/>}
        {active==="headers"&&<HeadersView companies={companies}/>}
        {active==="facturas"&&<FacturacionView companies={companies}/>}
        {active==="talleres"&&<TalleresView companies={companies}/>}
        {active==="contenido"&&<ContenidoView companies={companies}/>}
        {active==="usuarios"&&<UsuariosView companies={companies}/>}
      </div>
    </div>
  );
}

