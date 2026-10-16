import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/client";

const configs = {
  stations: { title:"Stations", subtitle:"Create and maintain railway stations.", endpoint:"/admin/stations", fields:[["code","Station code"],["name","Station name"],["city","City"],["state","State"]], columns:["id","code","name","city","state"], paged:true },
  trains: { title:"Trains", subtitle:"Manage train numbers, names and endpoints.", endpoint:"/admin/trains", fields:[["number","Train number"],["name","Train name"],["totalDistance","Total distance (km)"],["sourceStationId","Source station ID"],["destinationStationId","Destination station ID"]], columns:["id","number","name","totalDistance","sourceStation","destinationStation"] },
  routes: { title:"Train routes", subtitle:"Manage the station sequence and timings for a train.", endpoint:"/admin/train-routes", fields:[["trainId","Train ID"],["stationId","Station ID"],["stationOrder","Station order"],["arrivalTime","Arrival time (HH:mm)"],["departureTime","Departure time (HH:mm)"],["haltMinutes","Halt minutes"],["distanceFromSource","Distance from source (km)"]], columns:["id","train","station","stationOrder","arrivalTime","departureTime","haltMinutes","distanceFromSource"], filterTrain:true },
  schedules: { title:"Train schedules", subtitle:"Set running dates and available seats for trains.", endpoint:"/admin/train-schedules", fields:[["trainId","Train ID"],["runDate","Run date"],["availableSeats","Available seats"]], columns:["id","trainId","runDate","availableSeats"], filterTrain:true }
};
const empty = config => Object.fromEntries(config.fields.map(([key])=>[key,""]));
function cell(value) {
  if (value == null) return "—";
  if (typeof value === "object") return value.name || value.code || value.id || JSON.stringify(value);
  return String(value);
}
export default function AdminResourcePage({ kind }) {
  const config = configs[kind];
  const [items,setItems] = useState([]);
  const [form,setForm] = useState(()=>empty(config));
  const [editing,setEditing] = useState(null);
  const [filterTrain,setFilterTrain] = useState("");
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const load = useCallback(async () => {
    if (config.filterTrain && !filterTrain.trim()) { setItems([]); return; }
    setLoading(true); setError("");
    try {
      let url = config.endpoint;
      if (kind === "routes") url += "/train/" + encodeURIComponent(filterTrain);
      else if (kind === "schedules") url += "/train/" + encodeURIComponent(filterTrain);
      else if (config.paged) url += "?page=0&size=100&sortBy=name&sortDir=asc";
      const result = await apiRequest(url);
      setItems(Array.isArray(result) ? result : Array.isArray(result.content) ? result.content : []);
    } catch (e) { setError(e.message || "Could not load records."); }
    finally { setLoading(false); }
  }, [config, filterTrain, kind]);
  useEffect(()=>{ if (!config.filterTrain) load(); },[load,config.filterTrain]);

  function payload() {
    const values = { ...form };
    if (kind === "stations") return { code:values.code.trim(), name:values.name.trim(), city:values.city.trim(), state:values.state.trim() };
    if (kind === "trains") return { number:values.number.trim(), name:values.name.trim(), totalDistance:values.totalDistance ? Number(values.totalDistance) : null, sourceStation:{ id:Number(values.sourceStationId) }, destinationStation:{ id:Number(values.destinationStationId) } };
    if (kind === "routes") return { train:{ id:Number(values.trainId) }, station:{ id:Number(values.stationId) }, stationOrder:Number(values.stationOrder), arrivalTime:values.arrivalTime || null, departureTime:values.departureTime || null, haltMinutes:values.haltMinutes===""?null:Number(values.haltMinutes), distanceFromSource:values.distanceFromSource===""?null:Number(values.distanceFromSource) };
    return { trainId:Number(values.trainId), runDate:values.runDate, availableSeats:Number(values.availableSeats) };
  }
  function edit(item) {
    setEditing(item.id);
    const next=empty(config);
    for (const [key] of config.fields) {
      if (kind==="trains" && key==="sourceStationId") next[key]=item.sourceStation?.id ?? "";
      else if (kind==="trains" && key==="destinationStationId") next[key]=item.destinationStation?.id ?? "";
      else if (kind==="routes" && key==="trainId") next[key]=item.train?.id ?? "";
      else if (kind==="routes" && key==="stationId") next[key]=item.station?.id ?? "";
      else if (key in item) next[key]=item[key] ?? "";
      else if (kind==="schedules" && key==="trainId") next[key]=item.trainId ?? "";
    }
    setForm(Object.fromEntries(Object.entries(next).map(([k,v])=>[k,v==null?"":String(v)])));
    setNotice("");
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const body=payload();
      const url=editing==null?config.endpoint:`${config.endpoint}/${editing}`;
      await apiRequest(url,{method:editing==null?"POST":"PUT",body:JSON.stringify(body)});
      setNotice(editing==null?"Record created successfully.":"Record updated successfully.");
      setForm(empty(config)); setEditing(null); await load();
    } catch(e) { setError(e.message || "Could not save record."); }
    finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete record #${item.id}?`)) return;
    setError(""); setNotice("");
    try { await apiRequest(`${config.endpoint}/${item.id}`,{method:"DELETE"}); setNotice("Record deleted."); await load(); }
    catch(e) { setError(e.message || "Could not delete record."); }
  }

  return <div className="page-stack admin-page">
    <div className="page-heading"><span className="eyebrow">ADMINISTRATION</span><h1>{config.title}</h1><p>{config.subtitle}</p></div>
    <section className="content-card">
      <div className="card-title"><div><h2>{editing==null?"Add a record":`Edit record #${editing}`}</h2><p>Fields are sent to the existing Spring Boot admin API.</p></div></div>
      <form className="admin-form" onSubmit={submit}>
        {config.fields.map(([key,label])=><label className="admin-field" key={key}><span>{label}</span><input required={["code","name","city","state","number","sourceStationId","destinationStationId","trainId","stationId","stationOrder","runDate","availableSeats"].includes(key)} type={["totalDistance","sourceStationId","destinationStationId","trainId","stationId","stationOrder","haltMinutes","distanceFromSource","availableSeats"].includes(key)?"number":key==="runDate"?"date":"text"} step={["haltMinutes","distanceFromSource","totalDistance","availableSeats"].includes(key)?"1":undefined} value={form[key]??""} onChange={e=>setForm(old=>({...old,[key]:e.target.value}))} placeholder={label}/></label>)}
        <div className="admin-form-actions"><button className="primary-button" disabled={saving}>{saving?"Saving…":editing==null?"Create record":"Save changes"}</button>{editing!=null&&<button type="button" className="secondary-button" onClick={()=>{setEditing(null);setForm(empty(config));}}>Cancel edit</button>}</div>
      </form>
      {error&&<p className="alert error" role="alert">{error}</p>}{notice&&<p className="alert success" role="status">{notice}</p>}
    </section>
    <section className="content-card">
      <div className="admin-list-heading"><div><h2>Existing {config.title.toLowerCase()}</h2><p>{config.filterTrain?"Enter a train ID to load its records.":"Records returned by the backend."}</p></div>
      {config.filterTrain&&<div className="admin-filter"><input aria-label="Train ID filter" type="number" min="1" placeholder="Train ID" value={filterTrain} onChange={e=>setFilterTrain(e.target.value)}/><button className="secondary-button" onClick={load} disabled={!filterTrain.trim()||loading}>Load</button></div>}
      {!config.filterTrain&&<button className="secondary-button" onClick={load} disabled={loading}>{loading?"Loading…":"Refresh"}</button>}</div>
      {loading?<p className="admin-empty">Loading records…</p>:items.length===0?<p className="admin-empty">{config.filterTrain&&!filterTrain.trim()?"Enter a train ID and select Load.":"No records found."}</p>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.columns.map(col=><th key={col}>{col.replace(/([A-Z])/g," $1")}</th>)}<th>Actions</th></tr></thead><tbody>{items.map(item=><tr key={item.id}>{config.columns.map(col=><td key={col}>{cell(item[col])}</td>)}<td><div className="table-actions"><button className="text-button" onClick={()=>edit(item)}>Edit</button><button className="text-button danger-text" onClick={()=>remove(item)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
