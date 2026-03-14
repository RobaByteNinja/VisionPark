/**
 * COMPONENT: AttendantManagement
 * PURPOSE: Manage parking attendants, enforcing Fayda ID formatting, Ethio Telecom numbers, strong passwords, and branch assignment.
 */

import React, { useState, useRef } from "react";
import { 
  Users, Plus, Trash2, Edit2, Mail, Lock, 
  Phone, MapPin, X, Key, ShieldCheck, AlertCircle, 
  RefreshCw, Eye, EyeOff, UploadCloud, Check, ChevronDown
} from "lucide-react";

// --- REQUIRED DATA STRUCTURES FOR DROPDOWNS ---
const REGION_GROUPS = [
  { group: "FEDERAL CITIES", options: ["Addis Ababa", "Dire Dawa"] },
  { group: "MAJOR REGIONS", options: ["Oromia Region", "Amhara Region", "Tigray Region", "Somali Region", "Sidama Region"] }
];

const CITIES_BY_REGION = {
  "Addis Ababa": ["Addis Ababa"], "Dire Dawa": ["Dire Dawa"],
  "Oromia Region": ["Adama"], "Amhara Region": ["Bahir Dar"],
  "Tigray Region": ["Mekelle"], "Somali Region": ["Jigjiga"], "Sidama Region": ["Hawassa"]
};

const BRANCHES_BY_CITY = {
  "Addis Ababa": ["Bole Airport Parking", "Piazza Street Parking", "Meskel Square Parking"],
  "Adama": ["Adama Bus Terminal Parking", "Stadium Parking"],
  "Dire Dawa": ["Dire Dawa Central Parking"],
  "Bahir Dar": ["Bahir Dar Lake Parking"],
  "Mekelle": ["Mekelle City Parking"],
  "Jigjiga": ["Jigjiga Market Parking"],
  "Hawassa": ["Hawassa Park & Ride"]
};

// --- MOCK DATA ---
const INITIAL_ATTENDANTS = [
  {
    id: "att_01", name: "Kebede Alemu", email: "kebede.visionpark@gmail.com", phone: "+251 911 234 567",
    faydaId: "1234 5678 9012 3456", address: "Bole, Addis Ababa", branch: "Bole Airport Parking",
    status: "Active", avatar: "https://i.pravatar.cc/150?u=kebede"
  }
];

// ✅ FIXED: Moved OUTSIDE the main component so it doesn't cause re-renders/flashing
const DropdownTrigger = ({ label, value, onClick, disabled }) => (
  <div className="space-y-1.5 w-full min-w-0">
    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">{label}</label>
    <button 
      type="button" 
      onClick={onClick} 
      disabled={disabled} 
      className={`w-full min-w-0 flex items-center justify-between bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm md:text-base rounded-xl px-4 py-3 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500 cursor-pointer'}`}
    >
      <span className="truncate pr-4">{value || "Select..."}</span>
      <ChevronDown className="h-5 w-5 text-zinc-400 shrink-0" />
    </button>
  </div>
);

export default function AttendantManagement() {
  const [attendants, setAttendants] = useState(INITIAL_ATTENDANTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); 

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "+251 ", faydaId: "", address: "", password: "",
    region: "Addis Ababa", city: "Addis Ababa", branch: "Bole Airport Parking"
  });

  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFaydaChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setFormData({ ...formData, faydaId: formatted });
    if (val.length === 16) setErrors((prev) => ({ ...prev, faydaId: null }));
    else setErrors((prev) => ({ ...prev, faydaId: "Fayda ID must be exactly 16 digits." }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, email: val });
    if (val && !val.toLowerCase().endsWith("@gmail.com")) setErrors((prev) => ({ ...prev, email: "Only @gmail.com addresses are allowed." }));
    else setErrors((prev) => ({ ...prev, email: null }));
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.startsWith('0')) val = '251' + val.substring(1);
    else if (!val.startsWith('251') && val.length > 0) {
      if (val.startsWith('9') || val.startsWith('7')) val = '251' + val;
      else val = '251';
    }
    if (val.length > 12) val = val.slice(0, 12);

    let formatted = '';
    if (val.length > 0) {
      formatted = '+' + val.substring(0, 3);
      if (val.length > 3) formatted += ' ' + val.substring(3, 6);
      if (val.length > 6) formatted += ' ' + val.substring(6, 9);
      if (val.length > 9) formatted += ' ' + val.substring(9, 12);
    }

    setFormData({ ...formData, phone: formatted });

    if (val.length > 3 && val.length < 12) setErrors((prev) => ({ ...prev, phone: "Incomplete phone number." }));
    else if (val.length === 12) {
      const networkCode = val.substring(3, 4);
      if (networkCode !== '9' && networkCode !== '7') setErrors((prev) => ({ ...prev, phone: "Must be a valid Ethio Telecom (9) or Safaricom (7) number." }));
      else setErrors((prev) => ({ ...prev, phone: null }));
    } else setErrors((prev) => ({ ...prev, phone: null }));
  };

  const checkPasswordStrength = (pass) => {
    if (!pass) return null;
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/[0-9]/.test(pass) || !/[!@#$%^&*]/.test(pass)) {
      return "Requires 8+ chars, upper, lower, number, and special char.";
    }
    return null;
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });
    setErrors((prev) => ({ ...prev, password: checkPasswordStrength(val) }));
  };

  const generatePassword = (e) => {
    e.preventDefault(); 
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const num = "0123456789";
    const special = "!@#$%^&*";
    const all = upper + lower + num + special;
    
    let pass = upper[Math.floor(Math.random() * upper.length)] + lower[Math.floor(Math.random() * lower.length)] + num[Math.floor(Math.random() * num.length)] + special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 8; i++) pass += all[Math.floor(Math.random() * all.length)];
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData((prev) => ({ ...prev, password: pass }));
    setErrors((prev) => ({ ...prev, password: null }));
    setShowPassword(true); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.faydaId.replace(/\s/g, '').length !== 16 || errors.email || errors.password || errors.phone || !formData.branch) {
      alert("Please fix the errors and ensure a branch is assigned before submitting.");
      return;
    }

    const newAttendant = {
      id: `att_${Date.now()}`,
      name: formData.name, email: formData.email, phone: formData.phone,
      faydaId: formData.faydaId, address: formData.address, branch: formData.branch,
      status: "Active", avatar: avatarPreview || `https://i.pravatar.cc/150?u=${formData.name.replace(/\s/g, '')}`
    };

    setAttendants([...attendants, newAttendant]);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", email: "", phone: "+251 ", faydaId: "", address: "", password: "", region: "Addis Ababa", city: "Addis Ababa", branch: "Bole Airport Parking" });
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Attendant Management</h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">Manage personnel, Fayda IDs, and branch assignments.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 outline-none">
          <Plus className="h-5 w-5" /> Add Attendant
        </button>
      </div>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-500" />
          <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Registered Attendants</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 text-[10px] md:text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-4 md:px-6 py-4 font-semibold">Attendant</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Fayda ID (FAN)</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Assigned Branch</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Status</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {attendants.map((att) => (
                <tr key={att.id} className="border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={att.avatar} alt={att.name} className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-zinc-200 dark:border-white/10 object-cover" />
                      <span className="font-bold text-zinc-900 dark:text-white">{att.name}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-900 dark:text-white flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-zinc-400" /> {att.email}</span>
                      <span className="text-zinc-500 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-zinc-400" /> {att.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 font-mono font-medium text-zinc-600 dark:text-zinc-300">{att.faydaId}</td>
                  <td className="px-4 md:px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">{att.branch}</td>
                  <td className="px-4 md:px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 md:px-2.5 md:py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-[10px] md:text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3 mr-1" /> {att.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Reset Password" type="button" className="p-2 text-zinc-400 hover:text-blue-500 bg-zinc-100 dark:bg-white/5 rounded-lg transition-colors outline-none"><Key className="h-4 w-4" /></button>
                      <button title="Edit" type="button" className="p-2 text-zinc-400 hover:text-emerald-500 bg-zinc-100 dark:bg-white/5 rounded-lg transition-colors outline-none"><Edit2 className="h-4 w-4" /></button>
                      <button title="Delete" type="button" className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-100 dark:bg-white/5 rounded-lg transition-colors outline-none"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Register New Attendant</h2>
              <button type="button" onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors outline-none"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <form id="attendantForm" onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
                
                <div className="flex justify-center mb-2">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  {avatarPreview ? (
                    <div className="relative">
                      <img src={avatarPreview} alt="Preview" className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover border-4 border-emerald-500 shadow-xl" />
                      <button type="button" onClick={handleRemoveImage} className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-transform hover:scale-110 outline-none"><X className="h-3 w-3 md:h-4 md:w-4" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-20 w-20 md:h-24 md:w-24 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center text-zinc-400 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer bg-zinc-50 dark:bg-white/5 outline-none">
                      <UploadCloud className="h-5 w-5 md:h-6 md:w-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Upload Photo</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Full Name</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Kebede Alemu" className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm md:text-base rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Fayda ID (FAN)</label>
                    <input required type="text" value={formData.faydaId} onChange={handleFaydaChange} placeholder="XXXX XXXX XXXX XXXX" className={`w-full bg-zinc-50 dark:bg-white/5 border ${errors.faydaId ? 'border-red-500' : 'border-zinc-200 dark:border-white/10'} text-sm md:text-base font-mono tracking-widest rounded-xl px-4 py-3 outline-none focus:ring-1 transition-all ${errors.faydaId ? 'focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`} />
                    {errors.faydaId && <p className="text-[10px] md:text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {errors.faydaId}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Gmail Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input required type="email" value={formData.email} onChange={handleEmailChange} placeholder="attendant@gmail.com" className={`w-full bg-zinc-50 dark:bg-white/5 border ${errors.email ? 'border-red-500' : 'border-zinc-200 dark:border-white/10'} text-sm md:text-base rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-1 transition-all ${errors.email ? 'focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`} />
                    </div>
                    {errors.email && <p className="text-[10px] md:text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input required type="tel" value={formData.phone} onChange={handlePhoneChange} placeholder="+251 9..." className={`w-full bg-zinc-50 dark:bg-white/5 border ${errors.phone ? 'border-red-500' : 'border-zinc-200 dark:border-white/10'} text-sm md:text-base font-mono rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-1 transition-all ${errors.phone ? 'focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`} />
                    </div>
                    {errors.phone && <p className="text-[10px] md:text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="e.g. Bole, Kebele 03" className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm md:text-base rounded-xl pl-10 pr-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 mt-2">
                  <h3 className="text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Assignment Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full min-w-0">
                    <DropdownTrigger label="Region" value={formData.region} onClick={() => setActiveDropdown('region')} />
                    <DropdownTrigger label="City" value={formData.city} onClick={() => setActiveDropdown('city')} disabled={!formData.region} />
                    <DropdownTrigger label="Assigned Branch" value={formData.branch} onClick={() => setActiveDropdown('branch')} disabled={!formData.city} />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> Secure Password
                    </label>
                    <button type="button" onClick={generatePassword} className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 outline-none self-start sm:self-auto">
                      <RefreshCw className="h-3 w-3" /> Suggest Strong Password
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={handlePasswordChange} placeholder="Enter or generate password" className={`w-full bg-white dark:bg-[#121214] border ${errors.password ? 'border-red-500' : 'border-zinc-200 dark:border-white/10'} text-sm md:text-base font-mono tracking-wider rounded-xl px-4 py-3 pr-10 outline-none focus:ring-1 transition-all ${errors.password ? 'focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white outline-none">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] md:text-xs text-red-500 font-medium flex items-center gap-1 mt-2"><AlertCircle className="h-3 w-3" /> {errors.password}</p>}
                  {!errors.password && (formData.password?.length || 0) > 0 && <p className="text-[10px] md:text-xs text-emerald-500 font-bold flex items-center gap-1 mt-2"><Check className="h-3 w-3" /> Password meets security requirements.</p>}
                </div>

              </form>
            </div>
            
            <div className="p-4 md:p-6 border-t border-zinc-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#18181b]">
              <button form="attendantForm" type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 md:py-3.5 text-sm md:text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all outline-none">
                Register Attendant
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDropdown && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setActiveDropdown(null)}></div>
          
          <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Select {activeDropdown === 'region' ? 'Region' : activeDropdown === 'city' ? 'City' : 'Branch'}
              </h2>
              <button type="button" onClick={() => setActiveDropdown(null)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-2 overflow-y-auto flex-1">
              {activeDropdown === 'region' && REGION_GROUPS.map((group) => (
                <div key={group.group} className="mb-2">
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{group.group}</div>
                  <div className="flex flex-col gap-1">
                    {group.options.map(opt => (
                      <button type="button" key={opt} onClick={() => { setFormData({...formData, region: opt, city: CITIES_BY_REGION[opt][0], branch: BRANCHES_BY_CITY[CITIES_BY_REGION[opt][0]]?.[0] || "" }); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none">
                        {opt} {formData.region === opt && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {activeDropdown === 'city' && CITIES_BY_REGION[formData.region]?.map(opt => (
                <button type="button" key={opt} onClick={() => { setFormData({...formData, city: opt, branch: BRANCHES_BY_CITY[opt]?.[0] || "" }); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none mt-1">
                  {opt} {formData.city === opt && <Check className="h-4 w-4 text-emerald-500" />}
                </button>
              ))}

              {activeDropdown === 'branch' && (
                BRANCHES_BY_CITY[formData.city]?.length > 0 ? (
                  BRANCHES_BY_CITY[formData.city].map(opt => (
                    <button type="button" key={opt} onClick={() => { setFormData({...formData, branch: opt}); setActiveDropdown(null); }} className="flex w-full px-4 py-3 rounded-xl text-sm font-medium justify-between hover:bg-zinc-50 dark:hover:bg-white/5 outline-none mt-1">
                      {opt} {formData.branch === opt && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-sm text-zinc-500 text-center">No branches configured for this city.</div>
                )
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}