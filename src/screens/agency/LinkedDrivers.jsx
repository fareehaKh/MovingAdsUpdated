import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAgencyVehiclesApi,
  getAgencyByUserApi
} from "../../api/authapi";
import { getUserSession, clearUserSession } from "../../utils/session";

const LinkedDrivers = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [vehicles, setVehicles] = useState([]);
  const [agency, setAgency] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const agencyRes = await getAgencyByUserApi(user.UserId);
    setAgency(agencyRes.data);

    const res = await getAgencyVehiclesApi(agencyRes.data.AgencyId);
    setVehicles(res.data || []);
  };

  const logout = () => {
    clearUserSession();
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🏢 MovingAds</div>

        <div style={styles.navItem} onClick={() => navigate("/agency")}>📊 Dashboard</div>
        <div style={styles.navItem} onClick={() => navigate("/agency/received-requests")}>📩 Requests</div>
        <div style={styles.navItemActive}>🚗 Drivers</div>

        <div style={styles.footer}>
          <div style={styles.agencyBox}>{agency?.AgencyName}</div>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </aside>

      <main style={styles.main}>
        <h2>Linked Drivers</h2>

        <div style={styles.grid}>
          {vehicles.map(v => (
            <div key={v.VehicleReg} style={styles.card}>
              {v.MediaPath && <img src={v.MediaPath} style={styles.img} />}
              <h4>{v.OwnerName}</h4>
              <p>{v.VehicleModel}</p>
              <p>{v.VehicleReg}</p>
              <p>{v.VehicleStatus}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LinkedDrivers;

const styles = {
  page:{ display:"flex", minHeight:"100vh", background:"#0f172a", color:"#fff" },

  sidebar:{ width:200, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:15 },

  logo:{ fontSize:20, marginBottom:20 },

  navItem:{ padding:8, fontSize:13, cursor:"pointer", opacity:0.7 },
  navItemActive:{ padding:8, fontSize:13, background:"#22c55e22", color:"#4ade80" },

  footer:{ marginTop:"auto" },

  agencyBox:{ background:"#1e293b", padding:10, borderRadius:8, marginBottom:10 },

  logoutBtn:{ width:"100%", padding:8, background:"#ef4444", border:"none", color:"#fff" },

  main:{ flex:1, padding:20 },

  grid:{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:15 },

  card:{ background:"#1e293b", padding:12, borderRadius:10 },

  img:{ width:"100%", height:140, objectFit:"cover", borderRadius:8 }
};