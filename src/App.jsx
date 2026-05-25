import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { P, Sidebar, Header, Card, SectionTitle, Badge, Btn, Input, Select } from "./components/shared.jsx";

// ── DASHBOARD ──────────────────────────────────────────────────────
function DashboardView() {
  const [stats, setStats] = useState({ companies:0, sessions:0, pageViews:0 });
  const [recentViews, setRecentViews] = useState([]);

  useEffect(() => {
    async function load() {
      const [{ count: companies }, { count: sessions }, { count: pageViews }] = await Promise.all([
        supabase.from("companies").select("*", { count:"exact", head:true }),
        supabase.from("sessions_data").select("*", { count:"exact", head:true }),
        supabase.from("page_views").select("*", { count:"exact", head:true }),
      ]);
      setStats({ companies: companies||0, sessions: sessions||0, pageViews: pageViews||0 });
      const { data } = await supabase.from("page_views").select("*").order("created_at", { ascending:false }).limit(10);
      setRecentViews(data||[]);
    }
    load();
  }, []);

  return (
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[["Empresas activas",stats.companies,"🏢"],[`Meses de datos`,stats.sessions,"📊"],["Vistas al dash",stats.pageViews,"👁"]].map(([l,v,i])=>(
          <div key={l} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"18px 20px"}}>
            <div style={{fontSize:28,marginBottom:6}}>{i}</div>
            <div style={{fontSize:26,fontWeight:700,color:P.primary,letterSpacing:"-1px"}}>{v}</div>
            <div style={{fontSize:12,color:P.textMuted,marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>

      <Card>
        <SectionTitle>Actividad reciente del dashboard</SectionTitle>
        {recentViews.length===0
          ? <div style={{fontSize:12,color:P.textMuted,textAlign:"center",padding:"20px 0"}}>Sin visitas registradas aún</div>
          : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
                {["Empresa","Usuario","Módulo","Sección","Fecha"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{recentViews.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`}}>
                <td style={{padding:"9px 12px",color:P.text}}>{v.company_id||"—"}</td>
                <td style={{padding:"9px 12px",color:P.textMuted}}>{v.user_email||"—"}</td>
                <td style={{padding:"9px 12px",color:P.text}}>{v.module||"—"}</td>
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
function EmpresasView({ onSelect }) {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", domain:"", plan_type:"Cuponera Fija", monthly_plan:300, start_date:"" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending:false });
    setCompanies(data||[]);
  }

  async function saveCompany() {
    setLoading(true);
    await supabase.from("companies").insert([form]);
    setForm({ name:"", domain:"", plan_type:"Cuponera Fija", monthly_plan:300, start_date:"" });
    setShowForm(false);
    setLoading(false);
    loadCompanies();
  }

  return (
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:14,color:P.textMuted}}>{companies.length} empresa{companies.length!==1?"s":""} registrada{companies.length!==1?"s":""}</div>
        <Btn onClick={()=>setShowForm(!showForm)}>+ Nueva empresa</Btn>
      </div>

      {showForm&&<Card style={{marginBottom:20,background:P.lighter,borderColor:P.primary+"44"}}>
        <SectionTitle>Nueva empresa</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="ej. TCS"/>
          <Input label="Dominio" value={form.domain} onChange={v=>setForm({...form,domain:v})} placeholder="ej. tcs.com"/>
          <Select label="Tipo de plan" value={form.plan_type} onChange={v=>setForm({...form,plan_type:v})}
            options={[{value:"Cuponera Fija",label:"Cuponera Fija"},{value:"A Demanda",label:"A Demanda"}]}/>
          <Input label="Sesiones/mes" value={form.monthly_plan} onChange={v=>setForm({...form,monthly_plan:parseInt(v)||0})} type="number"/>
          <Input label="Inicio" value={form.start_date} onChange={v=>setForm({...form,start_date:v})} placeholder="ej. Julio 2025"/>
        </div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn onClick={saveCompany}>{loading?"Guardando...":"Guardar empresa"}</Btn>
          <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn>
        </div>
      </Card>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {companies.length===0&&<div style={{textAlign:"center",padding:"40px",color:P.textMuted,fontSize:13}}>No hay empresas registradas aún.</div>}
        {companies.map(c=><div key={c.id} style={{background:P.white,borderRadius:12,border:`1px solid ${P.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer"}} onClick={()=>onSelect(c)}>
          <div style={{width:40,height:40,borderRadius:10,background:P.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{c.name?.slice(0,2).toUpperCase()}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:2}}>{c.name}</div>
            <div style={{fontSize:12,color:P.textMuted}}>@{c.domain} · {c.plan_type} · Inicio: {c.start_date||"—"}</div>
          </div>
          <Badge text={c.plan_type==="Cuponera Fija"?"Cuponera":"A Demanda"}/>
          <span style={{fontSize:12,color:P.primary,fontWeight:600}}>Ver →</span>
        </div>)}
      </div>
    </div>
  );
}

// ── SESIONES ──────────────────────────────────────────────────────
function SesionesView({ companies }) {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ month:"", year:new Date().getFullYear(), canjeadas:0, realizadas:0, nuevos:0, c1:0, c2:0, c3:0, c4:0, c5:0, partial:false });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { if(companyId) loadRows(); }, [companyId]);

  async function loadRows() {
    const { data } = await supabase.from("sessions_data").select("*").eq("company_id", companyId).order("year").order("month");
    setRows(data||[]);
  }

  async function saveRow() {
    await supabase.from("sessions_data").insert([{ ...form, company_id:companyId }]);
    setShowForm(false);
    loadRows();
  }

  async function deleteRow(id) {
    await supabase.from("sessions_data").delete().eq("id", id);
    loadRows();
  }

  return (
    <div style={{padding:"24px 28px"}}>
      <div style={{marginBottom:20}}>
        <Select label="Empresa" value={companyId} onChange={setCompanyId}
          options={[{value:"",label:"Seleccioná una empresa"},...companies.map(c=>({value:c.id,label:c.name}))]}/>
      </div>
      {companyId&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:13,color:P.textMuted}}>{rows.length} mes{rows.length!==1?"es":""} cargado{rows.length!==1?"s":""}</div>
          <Btn onClick={()=>setShowForm(!showForm)}>+ Agregar mes</Btn>
        </div>
        {showForm&&<Card style={{background:P.lighter,borderColor:P.primary+"44",marginBottom:16}}>
          <SectionTitle>Nuevo mes de datos</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            <Input label="Mes" value={form.month} onChange={v=>setForm({...form,month:v})} placeholder="ej. May 26"/>
            <Input label="Año" value={form.year} onChange={v=>setForm({...form,year:parseInt(v)})} type="number"/>
            <Input label="Canjeadas" value={form.canjeadas} onChange={v=>setForm({...form,canjeadas:parseInt(v)||0})} type="number"/>
            <Input label="Realizadas" value={form.realizadas} onChange={v=>setForm({...form,realizadas:parseInt(v)||0})} type="number"/>
            <Input label="Nuevos" value={form.nuevos} onChange={v=>setForm({...form,nuevos:parseInt(v)||0})} type="number"/>
            <Input label="Cup. 1" value={form.c1} onChange={v=>setForm({...form,c1:parseInt(v)||0})} type="number"/>
            <Input label="Cup. 2" value={form.c2} onChange={v=>setForm({...form,c2:parseInt(v)||0})} type="number"/>
            <Input label="Cup. 3" value={form.c3} onChange={v=>setForm({...form,c3:parseInt(v)||0})} type="number"/>
            <Input label="Cup. 4" value={form.c4} onChange={v=>setForm({...form,c4:parseInt(v)||0})} type="number"/>
            <Input label="Cup. 5" value={form.c5} onChange={v=>setForm({...form,c5:parseInt(v)||0})} type="number"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <input type="checkbox" checked={form.partial} onChange={e=>setForm({...form,partial:e.target.checked})} id="partial"/>
            <label htmlFor="partial" style={{fontSize:12,color:P.textMuted}}>Mes parcial (en curso)</label>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={saveRow}>Guardar</Btn>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn>
          </div>
        </Card>}
        <Card>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
              {["Mes","Canjeadas","Realizadas","Nuevos","C1","C2","C3","C4","C5","Parcial",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
            </tr></thead>
            <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
              <td style={{padding:"8px 10px",fontWeight:600,color:P.text}}>{r.month} {r.year}</td>
              <td style={{padding:"8px 10px"}}>{r.canjeadas}</td>
              <td style={{padding:"8px 10px"}}>{r.realizadas}</td>
              <td style={{padding:"8px 10px"}}>{r.nuevos}</td>
              <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c1}</td>
              <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c2}</td>
              <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c3}</td>
              <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c4}</td>
              <td style={{padding:"8px 10px",color:P.textMuted}}>{r.c5}</td>
              <td style={{padding:"8px 10px"}}>{r.partial?"✓":""}</td>
              <td style={{padding:"8px 10px"}}><button onClick={()=>deleteRow(r.id)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:13}}>🗑</button></td>
            </tr>)}
            {rows.length===0&&<tr><td colSpan={11} style={{padding:"24px",textAlign:"center",color:P.textMuted}}>Sin datos cargados</td></tr>}
            </tbody>
          </table>
        </Card>
      </>}
    </div>
  );
}

// ── TRACKING ──────────────────────────────────────────────────────
function TrackingView({ companies }) {
  const [views, setViews] = useState([]);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => { loadViews(); }, [companyId]);

  async function loadViews() {
    let q = supabase.from("page_views").select("*").order("created_at", { ascending:false }).limit(50);
    if(companyId) q = q.eq("company_id", companyId);
    const { data } = await q;
    setViews(data||[]);
  }

  const byModule = views.reduce((acc, v) => { acc[v.module] = (acc[v.module]||0)+1; return acc; }, {});

  return (
    <div style={{padding:"24px 28px"}}>
      <div style={{marginBottom:20}}>
        <Select label="Filtrar por empresa" value={companyId} onChange={setCompanyId}
          options={[{value:"",label:"Todas las empresas"},...companies.map(c=>({value:c.id,label:c.name}))]}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {Object.entries(byModule).map(([mod,count])=>(
          <div key={mod} style={{background:P.white,borderRadius:10,border:`1px solid ${P.border}`,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:P.primary}}>{count}</div>
            <div style={{fontSize:11,color:P.textMuted,marginTop:2}}>{mod||"home"}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle>Últimas visitas</SectionTitle>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1.5px solid ${P.border}`}}>
            {["Usuario","Módulo","Sección","Fecha y hora"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",color:P.textMuted,fontWeight:600,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{views.map((v,i)=><tr key={i} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.white:P.gray50}}>
            <td style={{padding:"9px 12px",color:P.text}}>{v.user_email||"anónimo"}</td>
            <td style={{padding:"9px 12px",color:P.primary,fontWeight:500}}>{v.module||"home"}</td>
            <td style={{padding:"9px 12px",color:P.textMuted}}>{v.sub||"—"}</td>
            <td style={{padding:"9px 12px",color:P.textMuted}}>{new Date(v.created_at).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
          </tr>)}
          {views.length===0&&<tr><td colSpan={4} style={{padding:"24px",textAlign:"center",color:P.textMuted}}>Sin visitas registradas</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function Admin() {
  const [active, setActive] = useState("dashboard");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    supabase.from("companies").select("*").then(({ data }) => setCompanies(data||[]));
  }, []);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setActive("empresa_detail");
  };

  const titles = {
    dashboard:"Dashboard",empresas:"Empresas",sesiones:"Sesiones",talleres:"Talleres",
    contenido:"Contenido",facturas:"Facturación",usuarios:"Usuarios",tracking:"Tracking",
    recomendaciones:"Recomendaciones",empresa_detail:selectedCompany?.name||"Empresa",
  };

  return (
    <div style={{display:"flex",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:P.bg,color:P.text}}>
      <Sidebar active={active} setActive={setActive}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <Header title={titles[active]||active} sub={active==="sesiones"?"Cargá los datos mensuales por empresa":active==="tracking"?"Actividad del dashboard por empresa":null}/>
        {active==="dashboard"&&<DashboardView/>}
        {active==="empresas"&&<EmpresasView onSelect={handleSelectCompany}/>}
        {active==="sesiones"&&<SesionesView companies={companies}/>}
        {active==="tracking"&&<TrackingView companies={companies}/>}
        {(active==="talleres"||active==="contenido"||active==="facturas"||active==="usuarios"||active==="recomendaciones")&&
          <div style={{padding:"40px 28px",textAlign:"center",color:P.textMuted}}>
            <div style={{fontSize:32,marginBottom:12}}>🔧</div>
            <div style={{fontSize:14,fontWeight:600,color:P.text,marginBottom:4}}>En construcción</div>
            <div style={{fontSize:12}}>Esta sección estará disponible pronto.</div>
          </div>
        }
      </div>
    </div>
  );
}
