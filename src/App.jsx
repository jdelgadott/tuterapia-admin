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
        {companies.map(c=><div key={c.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:40,height:40,borderRadius:10,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{c.name?.slice(0,2).toUpperCase()}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:2}}>{c.name}</div>
            <div style={{fontSize:12,color:P.textMuted}}>@{c.domain} · {c.plan_type} · {c.monthly_plan} ses/mes · {c.start_date||"—"}</div>
          </div>
          <Badge text={c.plan_type}/>
          <button onClick={()=>del(c.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,padding:"4px"}}>🗑</button>
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
  const [form, setForm] = useState({ month:"", year:new Date().getFullYear(), canjeadas:0, realizadas:0, nuevos:0, c1:0, c2:0, c3:0, c4:0, c5:0, partial:false });
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

  const titles={dashboard:"Dashboard",empresas:"Empresas",sesiones:"Sesiones",talleres:"Talleres",contenido:"Contenido",facturas:"Facturación",recomendaciones:"Recomendaciones",usuarios:"Usuarios empresa",tracking:"Tracking"};

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
        {["talleres","contenido","facturas"].includes(active)&&<Placeholder label={titles[active]}/>}
        {active==="usuarios"&&<UsuariosView companies={companies}/>}
      </div>
    </div>
  );
}

