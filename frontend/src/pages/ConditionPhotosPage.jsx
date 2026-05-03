import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useCloudinaryUpload } from "../components/useCloudinaryUpload";

// Photo grid — select files, show previews, track upload state
function PhotoGrid({ files, previews, uploading, onFilesAdd, onRemove, maxPhotos = 4 }) {
  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    const remaining = maxPhotos - files.length;
    onFilesAdd(newFiles.slice(0, remaining));
  };

  return (
    <div style={pg.grid}>
      {previews.map((preview, i) => (
        <div key={i} style={pg.wrap}>
          <img src={preview} alt={`Photo ${i+1}`} style={pg.img} />
          {uploading && <div style={pg.overlay}>⬆️</div>}
          {!uploading && (
            <button type="button" onClick={() => onRemove(i)} style={pg.removeBtn}>✕</button>
          )}
        </div>
      ))}
      {previews.length < maxPhotos && !uploading && (
        <label style={pg.addBtn}>
          <div style={{ fontSize:"22px", marginBottom:"4px" }}>📷</div>
          <div style={{ fontSize:"10px", color:"#888" }}>{previews.length}/{maxPhotos}</div>
          <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display:"none" }} />
        </label>
      )}
      {uploading && (
        <div style={pg.uploadingBadge}>Uploading </div>
      )}
    </div>
  );
}

function PhotoComparison({ dispatchPhotos, returnPhotos }) {
  return (
    <div style={cp.wrap}>
      <div style={cp.col}>
        <div style={{ ...cp.header, background:"#EAF3DE", color:"#27500A" }}>📤 Before rental</div>
        {dispatchPhotos?.images?.length > 0 ? (
          <>
            <div style={cp.grid}>
              {dispatchPhotos.images.map((url, i) => (
                <img key={i} src={url} alt={`Before ${i+1}`} style={cp.img} />
              ))}
            </div>
            {dispatchPhotos.note && <div style={cp.note}>Note: {dispatchPhotos.note}</div>}
            <div style={cp.date}>{new Date(dispatchPhotos.uploadedAt).toLocaleString("en-IN")}</div>
          </>
        ) : <div style={cp.empty}>No dispatch photos</div>}
      </div>
      <div style={cp.vs}>vs</div>
      <div style={cp.col}>
        <div style={{ ...cp.header, background:"#FAEEDA", color:"#633806" }}>📥 After rental</div>
        {returnPhotos?.images?.length > 0 ? (
          <>
            <div style={cp.grid}>
              {returnPhotos.images.map((url, i) => (
                <img key={i} src={url} alt={`After ${i+1}`} style={cp.img} />
              ))}
            </div>
            {returnPhotos.note && <div style={cp.note}>Note: {returnPhotos.note}</div>}
            <div style={cp.date}>{new Date(returnPhotos.uploadedAt).toLocaleString("en-IN")}</div>
          </>
        ) : <div style={cp.empty}>Waiting for return photos</div>}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  confirmed:  { background:"#EAF3DE", color:"#27500A" },
  dispatched: { background:"#E6F1FB", color:"#0C447C" },
  returned:   { background:"#FAEEDA", color:"#633806" },
  completed:  { background:"#E1F5EE", color:"#085041" },
  cancelled:  { background:"#FCEBEB", color:"#791F1F" },
};

export default function ConditionPhotosPage() {
  const { bookingId } = useParams();
  const { authFetch, user } = useAuth();
  const { uploadDispatchPhotos, uploadReturnPhotos } = useCloudinaryUpload();
  const navigate = useNavigate();

  const [booking,        setBooking]       = useState(null);
  const [loading,        setLoading]       = useState(true);
  const [files,          setFiles]         = useState([]);
  const [previews,       setPreviews]      = useState([]);
  const [note,           setNote]          = useState("");
  const [uploading,      setUploading]     = useState(false);
  const [submitting,     setSubmitting]    = useState(false);
  const [damageReported, setDamage]        = useState(false);
  const [conditionNote,  setConditionNote] = useState("");
  const [toast,          setToast]         = useState("");
  const [toastType,      setToastType]     = useState("success");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch(`/api/bookings/${bookingId}`);
        const data = await res.json();
        if (res.ok) setBooking(data.booking);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [bookingId]);

  const showToast = (msg, type = "success") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 4000);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(f => {
      if (!f.type.startsWith("image/")) { showToast("Only image files are allowed.", "error"); return false; }
      if (f.size > 3 * 1024 * 1024)    { showToast(`${f.name} is over 3MB. Please compress it.`, "error"); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      setPreviews(prev => [...prev, URL.createObjectURL(f)]);
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const isOwner  = user && booking && booking.owner?._id === user._id;
  const isRenter = user && booking && booking.renter?._id === user._id;

  const handleDispatch = async () => {
    if (files.length === 0) { showToast("Please add at least 1 photo.", "error"); return; }
    setUploading(true);
    try {
      // 1. Upload files to Cloudinary via backend
      const urls = await uploadDispatchPhotos(files, bookingId);

      // 2. Save URLs + update booking status
      setSubmitting(true);
      const res  = await authFetch(`/api/bookings/${bookingId}/dispatch-photos`, {
        method: "PATCH",
        body:   JSON.stringify({ images: urls, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Dispatch photos saved! Equipment marked as dispatched.");
      setBooking(data.booking);
      setFiles([]); setPreviews([]); setNote("");
    } catch (err) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setUploading(false); setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (files.length === 0) { showToast("Please add at least 1 photo.", "error"); return; }
    setUploading(true);
    try {
      const urls = await uploadReturnPhotos(files, bookingId);
      setSubmitting(true);
      const res  = await authFetch(`/api/bookings/${bookingId}/return-photos`, {
        method: "PATCH",
        body:   JSON.stringify({ images: urls, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Return photos saved! Waiting for owner to verify.");
      setBooking(data.booking);
      setFiles([]); setPreviews([]); setNote("");
    } catch (err) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setUploading(false); setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      const res  = await authFetch(`/api/bookings/${bookingId}/verify-condition`, {
        method: "PATCH",
        body:   JSON.stringify({ conditionNote, damageReported }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      setBooking(data.booking);
    } catch (err) {
      showToast(err.message || "Verification failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={s.center}>Loading…</div>;
  if (!booking) return <div style={s.center}>Booking not found.</div>;

  const eq     = booking.equipment;
  const status = booking.status;

  const STEPS = [
    { key:"confirmed", label:"Confirmed" },
    { key:"dispatched", label:"Dispatched" },
    { key:"returned", label:"Returned" },
    { key:"completed", label:"Completed" },
  ];
  const currentStep = STEPS.findIndex(st => st.key === status);

  return (
    <div style={s.page}>
      {toast && <div style={{ ...s.toast, background: toastType === "error" ? "#A32D2D" : "#1C3A0E" }}>{toast}</div>}

      <button onClick={() => navigate("/bookings")} style={s.back}>← Back to bookings</button>

      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.equipIcon}>
            {eq?.image
              ? <img src={eq.image} alt={eq.name} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"8px" }} />
              : "🚜"}
          </div>
          <div>
            <h1 style={s.title}>Condition Photos</h1>
            <div style={s.equipName}>{eq?.name}</div>
            <div style={s.meta}>
              {new Date(booking.fromDate).toLocaleDateString("en-IN")} → {new Date(booking.toDate).toLocaleDateString("en-IN")} · {booking.totalDays} days · ₹{booking.totalAmount?.toLocaleString()}
            </div>
          </div>
        </div>
        <span style={{ ...s.statusBadge, ...STATUS_COLORS[status] }}>{status}</span>
      </div>

      {/* Timeline */}
      <div style={s.timeline}>
        {STEPS.map((step, i) => (
          <div key={step.key} style={s.timelineItem}>
            <div style={{ ...s.dot, ...(i <= currentStep ? s.dotDone : s.dotPending) }}>
              {i <= currentStep ? "✓" : i + 1}
            </div>
            <div style={{ ...s.stepLabel, color: i <= currentStep ? "#3B6D11" : "#AAA" }}>{step.label}</div>
            {i < STEPS.length - 1 && (
              <div style={{ ...s.line, background: i < currentStep ? "#97C459" : "#E8E6E0" }} />
            )}
          </div>
        ))}
      </div>

      {/* Owner — upload dispatch photos */}
      {isOwner && status === "confirmed" && booking.paymentStatus === "paid" && (
        <div style={s.card}>
          <div style={s.cardTitle}>📤 Take photos before giving equipment to farmer</div>
          <div style={s.cardDesc}>These photos prove the condition when you handed it over. They will be stored securely and compared when the farmer returns it.</div>
          <PhotoGrid files={files} previews={previews} uploading={uploading} onFilesAdd={addFiles} onRemove={removeFile} />
          <div style={s.field}>
            <label style={s.label}>Condition note (optional)</label>
            <textarea style={s.textarea} placeholder="e.g. Small scratch on left door, tyres inflated, engine good…"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <button onClick={handleDispatch} disabled={uploading || submitting || files.length === 0}
            style={{ ...s.primaryBtn, opacity:(uploading||submitting||files.length===0)?0.6:1 }}>
            {uploading ? "Uploading to Cloudinary…" : submitting ? "Saving…" : `Upload ${files.length} photo${files.length !== 1 ? "s" : ""} & Mark Dispatched`}
          </button>
        </div>
      )}

      {/* Renter — upload return photos */}
      {isRenter && status === "dispatched" && (
        <div style={s.card}>
          <div style={s.cardTitle}>📥 Take photos before returning equipment</div>
          <div style={s.cardDesc}>These photos protect you from false damage claims. They are stored on Cloudinary alongside the owner's dispatch photos for comparison.</div>

          {booking.dispatchPhotos?.images?.length > 0 && (
            <div style={s.prevSection}>
              <div style={s.prevTitle}>Owner's dispatch photos (original condition)</div>
              <div style={cp.grid}>
                {booking.dispatchPhotos.images.map((url, i) => (
                  <img key={i} src={url} alt={`Original ${i+1}`} style={cp.img} />
                ))}
              </div>
              {booking.dispatchPhotos.note && <div style={cp.note}>Owner's note: {booking.dispatchPhotos.note}</div>}
            </div>
          )}

          <PhotoGrid files={files} previews={previews} uploading={uploading} onFilesAdd={addFiles} onRemove={removeFile} />
          <div style={s.field}>
            <label style={s.label}>Return note (optional)</label>
            <textarea style={s.textarea} placeholder="e.g. Returned in same condition, cleaned before returning…"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <button onClick={handleReturn} disabled={uploading || submitting || files.length === 0}
            style={{ ...s.primaryBtn, opacity:(uploading||submitting||files.length===0)?0.6:1 }}>
            {uploading ? "Uploading to Cloudinary…" : submitting ? "Saving…" : `Upload ${files.length} photo${files.length !== 1 ? "s" : ""} & Mark Returned`}
          </button>
        </div>
      )}

      {/* Owner — verify after return */}
      {isOwner && status === "returned" && (
        <div style={s.card}>
          <div style={s.cardTitle}>🔍 Compare and verify condition</div>
          <div style={s.cardDesc}>Compare the before and after photos stored, then mark the condition below.</div>
          <PhotoComparison dispatchPhotos={booking.dispatchPhotos} returnPhotos={booking.returnPhotos} />
          <div style={s.field}>
            <label style={s.label}>Condition note</label>
            <textarea style={s.textarea} placeholder="e.g. Returned in same condition. OR: Dent on bonnet not present before."
              value={conditionNote} onChange={e => setConditionNote(e.target.value)} />
          </div>
          <label style={s.damageToggle}>
            <input type="checkbox" checked={damageReported} onChange={e => setDamage(e.target.checked)}
              style={{ width:"16px", height:"16px", marginRight:"8px" }} />
            Report damage — equipment returned in worse condition
          </label>
          {damageReported && (
            <div style={s.damageWarn}>⚠️ Damage will be flagged. Contact the renter or raise a dispute with FarmLink admin.</div>
          )}
          <button onClick={handleVerify} disabled={submitting}
            style={{ ...s.primaryBtn, background: damageReported ? "#A32D2D" : "#3B6D11", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Saving…" : damageReported ? "Report Damage & Complete" : "✓ Condition OK — Complete Booking"}
          </button>
        </div>
      )}

      {status === "completed" && (
        <div style={s.card}>
          <div style={s.cardTitle}>✅ Booking completed</div>
          {booking.damageReported && <div style={s.damageWarn}>⚠️ Damage was reported for this booking.</div>}
          {booking.conditionNote  && <div style={s.conditionNote}>Owner's note: {booking.conditionNote}</div>}
          <PhotoComparison dispatchPhotos={booking.dispatchPhotos} returnPhotos={booking.returnPhotos} />
        </div>
      )}

      {isOwner  && status === "dispatched" && <div style={s.waitCard}><div style={{ fontSize:"28px", marginBottom:"10px" }}>⏳</div><div style={{ fontWeight:500 }}>Waiting for farmer to return</div></div>}
      {isRenter && status === "returned"   && <div style={s.waitCard}><div style={{ fontSize:"28px", marginBottom:"10px" }}>⏳</div><div style={{ fontWeight:500 }}>Waiting for owner to verify condition</div></div>}
    </div>
  );
}

const pg = {
  grid:      { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:"8px", marginBottom:"12px" },
  wrap:      { position:"relative", borderRadius:"8px", overflow:"hidden" },
  img:       { width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" },
  overlay:   { position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" },
  removeBtn: { position:"absolute", top:"4px", right:"4px", width:"20px", height:"20px", borderRadius:"50%", background:"rgba(0,0,0,0.6)", color:"white", border:"none", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center" },
  addBtn:    { aspectRatio:"1", border:"1.5px dashed #DDD", borderRadius:"8px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", textAlign:"center" },
  uploadingBadge: { gridColumn:"1/-1", padding:"8px", background:"#E6F1FB", borderRadius:"8px", fontSize:"12px", color:"#0C447C", textAlign:"center" },
};

const cp = {
  wrap:  { display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:"12px", alignItems:"start", marginBottom:"1.25rem" },
  col:   { display:"flex", flexDirection:"column", gap:"8px" },
  header:{ fontSize:"12px", fontWeight:500, padding:"6px 10px", borderRadius:"6px", textAlign:"center" },
  grid:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" },
  img:   { width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:"6px" },
  note:  { fontSize:"11px", color:"#555", fontStyle:"italic" },
  date:  { fontSize:"10px", color:"#AAA" },
  vs:    { fontSize:"14px", fontWeight:500, color:"#AAA", alignSelf:"center" },
  empty: { fontSize:"12px", color:"#AAA", textAlign:"center", padding:"1rem" },
};

const s = {
  page:          { padding:"2rem", maxWidth:"800px", margin:"0 auto", fontFamily:"'DM Sans', sans-serif" },
  back:          { fontSize:"13px", color:"#3B6D11", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:"1.25rem", display:"block" },
  header:        { display:"flex", justifyContent:"space-between", alignItems:"flex-start", background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", padding:"1.25rem", marginBottom:"1rem" },
  headerLeft:    { display:"flex", alignItems:"center", gap:"14px" },
  equipIcon:     { width:"52px", height:"52px", borderRadius:"8px", background:"#EAF3DE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", flexShrink:0, overflow:"hidden" },
  title:         { fontFamily:"'DM Serif Display', serif", fontSize:"20px", margin:"0 0 3px" },
  equipName:     { fontSize:"14px", fontWeight:500, marginBottom:"3px" },
  meta:          { fontSize:"12px", color:"#888" },
  statusBadge:   { fontSize:"11px", fontWeight:500, padding:"4px 12px", borderRadius:"8px", flexShrink:0 },
  timeline:      { display:"flex", alignItems:"center", background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", padding:"14px 20px", marginBottom:"1rem" },
  timelineItem:  { display:"flex", flexDirection:"column", alignItems:"center", position:"relative", flex:1 },
  dot:           { width:"28px", height:"28px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:500, marginBottom:"5px" },
  dotDone:       { background:"#3B6D11", color:"white" },
  dotPending:    { background:"#F0EEE9", color:"#888" },
  stepLabel:     { fontSize:"11px", fontWeight:500, textAlign:"center" },
  line:          { position:"absolute", top:"14px", left:"60%", width:"80%", height:"2px" },
  card:          { background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", padding:"1.5rem", marginBottom:"1rem" },
  cardTitle:     { fontSize:"16px", fontWeight:500, marginBottom:"8px" },
  cardDesc:      { fontSize:"13px", color:"#555", lineHeight:1.6, marginBottom:"1.25rem" },
  field:         { marginBottom:"1rem" },
  label:         { display:"block", fontSize:"12px", fontWeight:500, color:"#555", marginBottom:"5px" },
  textarea:      { width:"100%", padding:"9px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", height:"80px", resize:"vertical" },
  primaryBtn:    { width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:"#3B6D11", color:"white", fontSize:"14px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  prevSection:   { background:"#F7F6F3", borderRadius:"8px", padding:"12px", marginBottom:"1rem" },
  prevTitle:     { fontSize:"12px", fontWeight:500, color:"#555", marginBottom:"8px" },
  damageToggle:  { display:"flex", alignItems:"center", padding:"12px", background:"#FCEBEB", borderRadius:"8px", marginBottom:"1rem", cursor:"pointer", fontSize:"13px", color:"#791F1F" },
  damageWarn:    { background:"#FAEEDA", border:"0.5px solid #FAC775", borderRadius:"8px", padding:"10px 12px", fontSize:"12px", color:"#633806", marginBottom:"1rem" },
  conditionNote: { background:"#F7F6F3", borderRadius:"8px", padding:"10px 12px", fontSize:"13px", color:"#555", marginBottom:"1rem" },
  waitCard:      { background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", padding:"2rem", textAlign:"center" },
  center:        { textAlign:"center", padding:"4rem", color:"#888", fontFamily:"'DM Sans', sans-serif" },
  toast:         { position:"fixed", bottom:"24px", right:"24px", color:"white", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", zIndex:999 },
};
