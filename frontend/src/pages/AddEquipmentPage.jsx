import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useCloudinaryUpload } from "../components/useCloudinaryUpload";

const CATEGORIES = ["tractor","harvester","sprayer","seeder","pump","tiller","other"];
const STATES     = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh","Rajasthan","Bihar","Gujarat","Karnataka","Tamil Nadu","Other"];

function Field({ label, type = "text", placeholder, value, onChange, error, required }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}{required && <span style={{ color:"#D85A30" }}> *</span>}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={error ? s.inputErr : s.input} />
      {error && <div style={s.fieldErr}>{error}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, children, required }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}{required && <span style={{ color:"#D85A30" }}> *</span>}</label>
      <select style={s.input} value={value} onChange={onChange}>{children}</select>
    </div>
  );
}

function TextareaField({ label, placeholder, value, onChange }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <textarea style={s.textarea} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}

// Image upload component — shows local preview, uploads to Cloudinary on submit
function ImageUpload({ previewUrl, onFileSelect, uploading, error }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024)    { alert("Image must be under 2MB. Please compress it."); return; }
    onFileSelect(file);
  };

  return (
    <div style={s.field}>
      <label style={s.label}>Equipment photo <span style={{ color:"#D85A30" }}>*</span></label>
      <p style={s.imgHint}>1 clear photo — this shows on the browse page for renters to see.</p>

      {previewUrl ? (
        <div style={s.previewWrap}>
          <img src={previewUrl} alt="Preview" style={s.previewImg} />
          {uploading && <div style={s.uploadingOverlay}>Uploading to Cloudinary…</div>}
          {!uploading && (
            <label style={s.changeBtn}>
              Change photo
              <input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
            </label>
          )}
          {!uploading && <div style={s.uploadDone}>✅ Photo ready</div>}
        </div>
      ) : (
        <label style={{ ...s.uploadZone, ...(error ? s.uploadZoneErr : {}) }}>
          <div style={{ fontSize:"32px", marginBottom:"10px" }}>📷</div>
          <div style={s.uploadText}>Click to upload equipment photo</div>
          <div style={s.uploadSub}>JPG, PNG · Max 2MB · 1 photo only</div>
          <input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
        </label>
      )}
      {error && <div style={s.fieldErr}>{error}</div>}
    </div>
  );
}

export default function AddEquipmentPage() {
  const { authFetch, user } = useAuth();
  const { uploadEquipmentPhoto } = useCloudinaryUpload();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", description: "", category: "tractor",
    pricePerDay: "", city: "", state: "Uttar Pradesh", pincode: "",
  });

  const [selectedFile,  setSelectedFile]  = useState(null);   // raw File object
  const [previewUrl,    setPreviewUrl]     = useState(null);   // local blob URL for preview
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);   // final URL after upload
  const [imgUploading,  setImgUploading]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [fieldErrors,   setFieldErrors]   = useState({});

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setFieldErrors(f => ({ ...f, [key]: "" }));
  };

  // When user selects a file:
  // 1. Show local preview immediately (fast, no wait)
  // 2. Upload to Cloudinary in the background
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // instant local preview
    setCloudinaryUrl(null);
    setFieldErrors(f => ({ ...f, image: "" }));

    setImgUploading(true);
    try {
      const url = await uploadEquipmentPhoto(file);
      setCloudinaryUrl(url);
    } catch (err) {
      setPreviewUrl(null);
      setSelectedFile(null);
      setFieldErrors(f => ({ ...f, image: err.message }));
    } finally {
      setImgUploading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name        = "Equipment name is required";
    if (!form.pricePerDay || isNaN(form.pricePerDay) || Number(form.pricePerDay) < 1)
                              errs.pricePerDay = "Enter a valid price (min ₹1)";
    if (!form.city.trim())    errs.city        = "City is required";
    if (!cloudinaryUrl)       errs.image       = imgUploading
      ? "Please wait — photo is still uploading"
      : "Please upload a photo of the equipment";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError("");
    try {
      // Send Cloudinary URL (not base64) to the backend
      const res  = await authFetch("/api/equipment", {
        method: "POST",
        body:   JSON.stringify({ ...form, pricePerDay: Number(form.pricePerDay), image: cloudinaryUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate(`/equipment/${data.equipment._id}`);
    } catch (err) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <button onClick={() => navigate(-1)} style={s.backLink}>← Back</button>
      <div style={s.header}>
        <h1 style={s.title}>List Your Equipment</h1>
        <p style={s.sub}>
          {user?.role === "vendor"
            ? "Add equipment to your vendor store"
            : "List your equipment for P2P rental and earn extra income"}
        </p>
      </div>

      <div style={s.formCard}>
        {user?.role === "farmer" && (
          <div style={s.infoBox}>Your listing will appear as a <strong>P2P listing</strong> — other farmers can rent directly from you.</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={s.section}>Equipment photo</div>
          <ImageUpload
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            uploading={imgUploading}
            error={fieldErrors.image}
          />

          <div style={s.section}>Basic information</div>
          <Field label="Equipment name" placeholder="e.g. Mahindra 265 DI Tractor"
            value={form.name} onChange={set("name")} error={fieldErrors.name} required />
          <SelectField label="Category" value={form.category} onChange={set("category")} required>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </SelectField>
          <TextareaField label="Description (optional)"
            placeholder="Condition, model year, features, any special notes…"
            value={form.description} onChange={set("description")} />

          <div style={s.section}>Pricing</div>
          <Field label="Price per day (₹)" type="number" placeholder="e.g. 1500"
            value={form.pricePerDay} onChange={set("pricePerDay")} error={fieldErrors.pricePerDay} required />

          <div style={s.section}>Location</div>
          <div style={s.row2}>
            <Field label="City" placeholder="e.g. Lucknow"
              value={form.city} onChange={set("city")} error={fieldErrors.city} required />
            <Field label="Pincode" placeholder="e.g. 226001"
              value={form.pincode} onChange={set("pincode")} />
          </div>
          <SelectField label="State" value={form.state} onChange={set("state")}>
            {STATES.map(st => <option key={st} value={st}>{st}</option>)}
          </SelectField>

          {error && <div style={s.errBox}>{error}</div>}

          <div style={s.btnRow}>
            <button type="button" onClick={() => navigate(-1)} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading || imgUploading}
              style={{ ...s.submitBtn, opacity: (loading || imgUploading) ? 0.7 : 1 }}>
              {imgUploading ? "Waiting for photo upload…" : loading ? "Creating listing…" : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:           { padding:"2rem", maxWidth:"600px", margin:"0 auto", fontFamily:"'DM Sans', sans-serif" },
  backLink:       { fontSize:"13px", color:"#3B6D11", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:"1rem", display:"block" },
  header:         { marginBottom:"1.5rem" },
  title:          { fontFamily:"'DM Serif Display', serif", fontSize:"24px", margin:"0 0 4px" },
  sub:            { fontSize:"13px", color:"#888", margin:0 },
  formCard:       { background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", padding:"1.5rem" },
  infoBox:        { background:"#EEEDFE", border:"0.5px solid #AFA9EC", borderRadius:"8px", padding:"10px 14px", fontSize:"12px", color:"#3C3489", marginBottom:"1.25rem" },
  section:        { fontSize:"11px", fontWeight:500, color:"#888", textTransform:"uppercase", letterSpacing:"0.07em", margin:"1.25rem 0 10px", paddingBottom:"6px", borderBottom:"0.5px solid #F0EEE9" },
  field:          { marginBottom:"1rem" },
  label:          { display:"block", fontSize:"12px", fontWeight:500, color:"#555", marginBottom:"5px" },
  imgHint:        { fontSize:"11px", color:"#AAA", marginBottom:"10px", lineHeight:1.5 },
  input:          { width:"100%", padding:"9px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:"white" },
  inputErr:       { width:"100%", padding:"9px 12px", borderRadius:"8px", border:"0.5px solid #E24B4A", fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:"white" },
  textarea:       { width:"100%", padding:"9px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:"white", height:"80px", resize:"vertical" },
  fieldErr:       { fontSize:"11px", color:"#A32D2D", marginTop:"4px" },
  uploadZone:     { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"1.5px dashed #DDD", borderRadius:"10px", padding:"2rem 1rem", cursor:"pointer", textAlign:"center", minHeight:"140px" },
  uploadZoneErr:  { border:"1.5px dashed #E24B4A" },
  uploadText:     { fontSize:"13px", fontWeight:500, color:"#555", marginBottom:"4px" },
  uploadSub:      { fontSize:"11px", color:"#AAA" },
  previewWrap:    { borderRadius:"10px", overflow:"hidden", border:"0.5px solid #E8E6E0", position:"relative" },
  previewImg:     { width:"100%", height:"200px", objectFit:"cover", display:"block" },
  uploadingOverlay:{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"13px", fontWeight:500 },
  changeBtn:      { display:"block", width:"100%", padding:"8px", background:"#F7F6F3", border:"none", fontSize:"12px", color:"#555", cursor:"pointer", textAlign:"center", fontFamily:"inherit" },
  uploadDone:     { padding:"8px 12px", background:"#EAF3DE", color:"#27500A", fontSize:"12px", textAlign:"center" },
  row2:           { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  errBox:         { background:"#FCEBEB", border:"0.5px solid #F09595", borderRadius:"8px", padding:"10px", fontSize:"12px", color:"#791F1F", marginBottom:"1rem" },
  btnRow:         { display:"flex", gap:"10px", marginTop:"1.25rem" },
  cancelBtn:      { flex:1, padding:"11px", borderRadius:"8px", border:"0.5px solid #DDD", background:"white", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" },
  submitBtn:      { flex:2, padding:"11px", borderRadius:"8px", border:"none", background:"#3B6D11", color:"white", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
};
