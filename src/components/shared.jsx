import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

const P = {
  primary:"#1A5C4A", light:"#2D9977", lighter:"#E6F4F0", bg:"#F5F7F6",
  border:"#DDE8E4", text:"#18211E", textMuted:"#607870", white:"#FFFFFF",
  gray50:"#F0F4F2", red:"#B03030", redBg:"#FAEAEA",
  accent:"#2a6aaa", accentBg:"#e8f2fc",
};

function Sidebar({ active, setActive }) {
  const items = [
    { id:"dashboard", icon:"🏠", label:"Dashboard" },
    { id:"empresas",  icon:"🏢", label:"Empresas" },
    { id:"sesiones",  icon:"📊", label:"Sesiones" },
    { id:"talleres",  icon:"👥", label:"Talleres" },
    { id:"contenido", icon:"📁", label:"Contenido" },
    { id:"facturas",  icon:"💳", label:"Facturación" },
    { id:"usuarios",  icon:"👤", label:"Usuarios" },
    { id:"tracking",  icon:"📈", label:"Tracking" },
    { id:"recomendaciones", icon:"💡", label:"Recomendaciones" },
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
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Sesión activa</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",fontWeight:600,marginTop:2}}>admin@tuterapia.com.uy</div>
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

function Btn({ children, onClick, variant="primary", small=false }) {
  const styles = {
    primary: { background:P.primary, color:"#fff", border:"none" },
    secondary: { background:P.lighter, color:P.primary, border:`1px solid ${P.border}` },
    danger: { background:P.redBg, color:P.red, border:`1px solid ${P.red}44` },
  };
  return (
    <button onClick={onClick} style={{...styles[variant],borderRadius:8,padding:small?"5px 12px":"8px 16px",fontSize:small?11:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
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

export { P, Sidebar, Header, Card, SectionTitle, Badge, Btn, Input, Select };
