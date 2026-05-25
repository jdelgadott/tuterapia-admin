import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const P = {
  primary:"#1A5C4A", light:"#2D9977", lighter:"#E6F4F0", bg:"#F5F7F6",
  border:"#DDE8E4", text:"#18211E", textMuted:"#607870", white:"#FFFFFF",
  gray50:"#F0F4F2", red:"#B03030", redBg:"#FAEAEA",
  accent:"#2a6aaa", accentBg:"#e8f2fc",
};

function Sidebar({ active, setActive }) {
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
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Panel de administración</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",fontWeight:600,marginTop:2}}>Tu Terapia</div>
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
    primary: { background:P.primary, color:"#fff", border:"none" },
    secondary: { background:P.lighter, color:P.primary, border:`1px solid ${P.border}` },
    danger: { background:P.redBg, color:P.red, border:`1px solid ${P.red}44` },
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

  useEffect(() => {
    supabase.from("page_views").select("*").order("created_at",{ascending:false}).limit(10)
      .then(({data})=>setPageViews(data||[]));
  }, []);

  const totalSessions = 0;

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
          ? <div style={{fontSize:12,color:P.textMuted,textAlign:"center",padding:"20px"}}>Sin empresas aún — creá la primera en la sección Empresas.</div>
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
        <SectionTitle>Últimas visitas al dashboard</SectionTitle>
        {pageViews.length===0
          ? <div style={{fontSize:12,color:P.textMuted,textAlign:"center",padding:"20px"}}>Sin visitas registradas aún.</div>
          : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
                {["Usuario","Módulo","Sección","Fecha"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{pageViews.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`}}>
                <td style={{padding:"9px 12px",color:P.text}}>{v.user_email||"anónimo"}</td>
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
    const { error } = await supabase.from("companies").insert([{
      ...form,
      monthly_plan: parseInt(form.monthly_plan)||300,
      session_price_ref: parseInt(form.session_price_ref)||1600,
      workshop_target: parseInt(form.workshop_target)||5,
    }]);
    if(error){ setMsg("Error: "+error.message); }
    else { setMsg("Empresa creada correctamente."); setShowForm(false); reload(); setForm({ name:"", domain:"", plan_type:"Cuponera Fija", plan_coverage:"100%", monthly_plan:"300", session_price_ref:"1600", start_date:"", workshop_target:"5", contact_name:"" }); }
    setLoading(false);
  }

  async function deleteCompany(id) {
    if(!confirm("¿Eliminar esta empresa y todos sus datos?")) return;
    await supabase.from("companies").delete().eq("id", id);
    reload();
  }

  return (
    <div style={{padding:"24px 28px"}}>
      {msg&&<div style={{padding:"10px 14px",background:msg.startsWith("Error")?P.redBg:P.lighter,color:msg.startsWith("Error")?P.red:P.primary,borderRadius:8,marginBottom:16,fontSize:12,fontWeight:500}}>{msg}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:13,color:P.textMuted}}>{companies.length} empresa{companies.length!==1?"s":""}</div>
        <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva empresa</Btn>
      </div>

      {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:20}}>
        <SectionTitle>Nueva empresa</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. TCS"/>
          <Input label="Dominio" value={form.domain} onChange={v=>setForm({...form,domain:v})} placeholder="ej. tcs.com"/>
          <Select label="Tipo de plan" value={form.plan_type} onChange={v=>setForm({...form,plan_type:v})}
            options={[{value:"Cuponera Fija",label:"Cuponera Fija"},{value:"A Demanda",label:"A Demanda"}]}/>
          <Select label="Cobertura" value={form.plan_coverage} onChange={v=>setForm({...form,plan_coverage:v})}
            options={[{value:"100%",label:"100%"},{value:"60%",label:"60%"},{value:"50%",label:"50%"}]}/>
          <Input label="Sesiones/mes" value={form.monthly_plan} onChange={v=>setForm({...form,monthly_plan:v})} type="number"/>
          <Input label="Precio ref. (UYU)" value={form.session_price_ref} onChange={v=>setForm({...form,session_price_ref:v})} type="number"/>
          <Input label="Fecha de inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
          <Input label="Target talleres/año" value={form.workshop_target} onChange={v=>setForm({...form,workshop_target:v})} type="number"/>
          <Input label="Contacto RRHH" value={form.contact_name} onChange={v=>setForm({...form,contact_name:v})} placeholder="ej. Laura M."/>
        </div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn onClick={save} disabled={loading}>{loading?"Guardando...":"Guardar empresa"}</Btn>
          <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn>
        </div>
      </Card>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {companies.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted,fontSize:13}}>No hay empresas. Creá la primera.</div></Card>}
        {companies.map(c=><div key={c.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:40,height:40,borderRadius:10,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{c.name?.slice(0,2).toUpperCase()}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:2}}>{c.name}</div>
            <div style={{fontSize:12,color:P.textMuted}}>@{c.domain} · {c.plan_type} · {c.monthly_plan} ses/mes · Inicio: {c.start_date||"—"}</div>
          </div>
          <Badge text={c.plan_type}/>
          <button onClick={()=>deleteCompany(c.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,padding:"4px"}}>🗑</button>
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

  useEffect(() => { if(companyId) load(); }, [companyId]);

  async function load() {
    const { data } = await supabase.from("sessions_data").select("*").eq("company_id",companyId).order("year").order("month");
    setRows(data||[]);
  }

  async function save() {
    if(!form.month){ setMsg("Ingresá el mes."); return; }
    const { error } = await supabase.from("sessions_data").insert([{...form,company_id:companyId,year:parseInt(form.year)}]);
    if(error) setMsg("Error: "+error.message);
    else { setMsg("Mes guardado."); setShowForm(false); load(); }
  }

  async function del(id) {
    await supabase.from("sessions_data").delete().eq("id",id);
    load();
  }

  const f = (k,v) => setForm({...form,[k]:parseInt(v)||0});

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={setCompanyId}/>
      {msg&&<div style={{padding:"10px 14px",background:P.lighter,color:P.primary,borderRadius:8,marginBottom:16,fontSize:12}}>{msg}</div>}
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} meses cargados</div>
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
            <label htmlFor="partial" style={{fontSize:12,color:P.textMuted}}>Mes parcial (en curso)</label>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <Card>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
                {["Mes","Canjeadas","Realizadas","Nuevos","C1","C2","C3","C4","C5","Parcial",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
                <td style={{padding:"8px 10px",fontWeight:600}}>{r.month} {r.year}</td>
                <td style={{padding:"8px 10px"}}>{r.canjeadas}</td>
                <td style={{padding:"8px 10px"}}>{r.realizadas}</td>
                <td style={{padding:"8px 10px"}}>{r.nuevos}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c1}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c2}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c3}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c4}</td>
                <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c5}</td>
                <td style={{padding:"8px 10px"}}>{r.partial?"✓":""}</td>
                <td style={{padding:"8px 10px"}}><button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer"}}>🗑</button></td>
              </tr>)}
              {rows.length===0&&<tr><td colSpan={11} style={{padding:"24px",textAlign:"center",color:P.textMuted}}>Sin datos aún</td></tr>}
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

  useEffect(() => { if(companyId) load(); }, [companyId]);
  async function load() {
    const { data } = await supabase.from("recommendations").select("*").eq("company_id",companyId).order("created_at",{ascending:false});
    setRows(data||[]);
  }
  async function save() {
    await supabase.from("recommendations").insert([{...form,company_id:companyId}]);
    setShowForm(false); load();
  }
  async function del(id) { await supabase.from("recommendations").delete().eq("id",id); load(); }

  const urgencyColors = { alta:{bg:P.redBg,tx:P.red}, media:{bg:P.accentBg,tx:P.accent}, baja:{bg:P.lighter,tx:P.primary} };

  return (
    <div style={{padding:"24px 28px"}}>
      <CompanySelect companies={companies} value={companyId} onChange={setCompanyId}/>
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} recomendaciones</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva recomendación</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nueva recomendación</SectionTitle>
          <Input label="Acción sugerida" value={form.action} onChange={v=>setForm({...form,action:v})} placeholder="ej. Lanzar campaña de activación Q2"/>
          <Textarea label="Razón / hallazgo" value={form.reason} onChange={v=>setForm({...form,reason:v})} placeholder="Describí el hallazgo clínico u operativo que justifica esta recomendación..."/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Select label="Urgencia" value={form.urgency} onChange={v=>setForm({...form,urgency:v})}
              options={[{value:"alta",label:"Urgente"},{value:"media",label:"Media prioridad"},{value:"baja",label:"A considerar"}]}/>
            <Input label="Fecha" value={form.date} onChange={v=>setForm({...form,date:v})}/>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Card>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.map((r,i)=>{
            const u=urgencyColors[r.urgency]||urgencyColors.media;
            return <Card key={r.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <Badge text={r.urgency==="alta"?"Urgente":r.urgency==="media"?"Media prioridad":"A considerar"} bg={u.bg} color={u.tx}/>
                    <span style={{fontSize:11,color:P.textMuted}}>{r.date}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:P.text,marginBottom:6}}>{r.action}</div>
                  <div style={{fontSize:12,color:P.textMuted,lineHeight:1.6}}>{r.reason}</div>
                </div>
                <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:16,marginLeft:12,flexShrink:0}}>🗑</button>
              </div>
            </Card>;
          })}
          {rows.length===0&&<Card><div style={{textAlign:"center",padding:"20px",color:P.textMuted,fontSize:13}}>Sin recomendaciones aún.</div></Card>}
        </div>
      </>}
    </div>
  );
}

// ── TRACKING ──────────────────────────────────────────────────────
function TrackingView({ companies }) {
  const [views, setViews] = useState([]);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => { load(); }, [companyId]);
  async function load() {
    let q = supabase.from("page_views").select("*").order("created_at",{ascending:false}).limit(100);
    if(companyId) q = q.eq("company_id",companyId);
    const { data } = await q;
    setViews(data||[]);
  }

  const byModule = views.reduce((acc,v)=>{ acc[v.module||"home"]=(acc[v.module||"home"]||0)+1; return acc; },{});

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
        {Object.keys(byModule).length===0&&<div style={{fontSize:12,color:P.textMuted,padding:"20px"}}>Sin visitas registradas.</div>}
      </div>
      <Card>
        <SectionTitle>Detalle de visitas ({views.length})</SectionTitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
              {["Usuario","Módulo","Sección","Fecha y hora"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
            </tr></thead>
            <tbody>{views.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
              <td style={{padding:"9px 12px"}}>{v.user_email||"anónimo"}</td>
              <td style={{padding:"9px 12px",color:P.primary,fontWeight:500}}>{v.module||"home"}</td>
              <td style={{padding:"9px 12px",color:P.textMuted}}>{v.sub||"—"}</td>
              <td style={{padding:"9px 12px",color:P.textMuted}}>{new Date(v.created_at).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
            </tr>)}
            {views.length===0&&<tr><td colSpan={4} style={{padding:"24px",textAlign:"center",color:P.textMuted}}>Sin visitas.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── PLACEHOLDER ────────────────────────────────────────────────────
function Placeholder({ label }) {
  return (
    <div style={{padding:"60px 28px",textAlign:"center",color:P.textMuted}}>
      <div style={{fontSize:32,marginBottom:12}}>🔧</div>
      <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:4}}>{label} — En construcción</div>
      <div style={{fontSize:12}}>Esta sección estará disponible en la próxima iteración.</div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function Admin() {
  const [active, setActive] = useState("dashboard");
  const [companies, setCompanies] = useState([]);

  useEffect(() => { loadCompanies(); }, []);
  async function loadCompanies() {
    const { data } = await supabase.from("companies").select("*").order("created_at",{ascending:false});
    setCompanies(data||[]);
  }

  const titles = {
    dashboard:"Dashboard", empresas:"Empresas", sesiones:"Sesiones",
    talleres:"Talleres", contenido:"Contenido", facturas:"Facturación",
    recomendaciones:"Recomendaciones", usuarios:"Usuarios empresa", tracking:"Tracking",
  };

  return (
    <div style={{display:"flex",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:P.bg,color:P.text}}>
      <Sidebar active={active} setActive={setActive}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <Header title={titles[active]||active}
          sub={active==="sesiones"?"Cargá los datos mensuales por empresa":active==="tracking"?"Actividad del dashboard por empresa":active==="recomendaciones"?"Recomendaciones clínicas y operativas para cada empresa":null}/>
        {active==="dashboard"&&<DashboardView companies={companies}/>}
        {active==="empresas"&&<EmpresasView companies={companies} reload={loadCompanies}/>}
        {active==="sesiones"&&<SesionesView companies={companies}/>}
        {active==="recomendaciones"&&<RecomendacionesView companies={companies}/>}
        {active==="tracking"&&<TrackingView companies={companies}/>}
        {["talleres","contenido","facturas","usuarios"].includes(active)&&<Placeholder label={titles[active]}/>}
      </div>
    </div>
  );
}

