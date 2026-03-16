/**
 * COMPONENT: PayoutSettings
 * PURPOSE: Manage owner withdrawal accounts using Chapa-supported providers for Subaccount splits.
 */

import React, { useState } from "react";
import {
  Building, Smartphone, Plus, Trash2, CheckCircle,
  Wallet, ChevronDown, Check, X, ShieldCheck, AlertTriangle, ArrowUpRight
} from "lucide-react";

// --- CHAPA SUPPORTED PAYOUT PROVIDERS ---
const PAYOUT_PROVIDERS = [
  {
    category: "Primary Payment Gateways",
    options: [
      { name: "Telebirr", type: "mobile" },
      { name: "Commercial Bank of Ethiopia (CBE)", type: "bank" },
      { name: "Bank of Abyssinia", type: "bank" },
      { name: "Cooperative Bank of Oromia (COOP)", type: "bank" }
    ]
  },
  {
    category: "Other Supported Banks",
    options: [
      { name: "Awash Bank", type: "bank" },
      { name: "Addis International Bank", type: "bank" },
      { name: "Hibret Bank", type: "bank" },
      { name: "Berhan Bank", type: "bank" },
      { name: "Nib International Bank", type: "bank" },
      { name: "Enat Bank", type: "bank" },
      { name: "Amhara Bank", type: "bank" }
    ]
  },
  {
    category: "Microfinance & Wallets",
    options: [
      { name: "CBE Birr", type: "mobile" },
      { name: "AwashBirr", type: "mobile" },
      { name: "Amole", type: "mobile" },
      { name: "Coopay‑Ebirr", type: "mobile" },
      { name: "HelloCash", type: "mobile" },
      { name: "E‑Birr", type: "mobile" },
      { name: "M‑PESA Ethiopia", type: "mobile" }
    ]
  }
];

// --- MOCK DATA ---
const INITIAL_ACCOUNTS = [
  {
    id: "acc_01",
    provider: "Commercial Bank of Ethiopia (CBE)",
    type: "bank",
    holderName: "Kebede Alemu",
    accountNumber: "1000123456789",
    isPrimary: true,
    status: "Verified"
  },
  {
    id: "acc_02",
    provider: "Telebirr",
    type: "mobile",
    holderName: "Kebede Alemu",
    accountNumber: "+251911234567",
    isPrimary: false,
    status: "Verified"
  }
];

// Reusable Custom Dropdown Trigger
const DropdownTrigger = ({ label, value, onClick }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
    <button
      type="button" onClick={onClick}
      className="w-full flex items-center justify-between bg-zinc-50 dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-base font-bold rounded-xl px-4 py-3 outline-none hover:border-emerald-500 transition-all"
    >
      <span className="truncate">{value || "Select Provider"}</span>
      <ChevronDown className="h-5 w-5 text-zinc-400 shrink-0" />
    </button>
  </div>
);

export default function PayoutSettings() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(false);

  const [accountToDelete, setAccountToDelete] = useState(null);

  const [newProvider, setNewProvider] = useState("");
  const [newHolderName, setNewHolderName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");

  const formatCurrency = (num) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0 }).format(num);

  const handleSetPrimary = (id) => {
    setAccounts(accounts.map(acc => ({ ...acc, isPrimary: acc.id === id })));
  };

  const requestDelete = (id) => {
    setAccountToDelete(id);
  };

  const confirmDelete = () => {
    if (!accountToDelete) return;

    let updatedAccounts = accounts.filter(acc => acc.id !== accountToDelete);
    const deletedAcc = accounts.find(a => a.id === accountToDelete);

    if (deletedAcc?.isPrimary && updatedAccounts.length > 0) {
      updatedAccounts[0].isPrimary = true;
    }

    setAccounts(updatedAccounts);
    setAccountToDelete(null);
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newProvider || !newHolderName || !newAccountNumber) return;

    const allProviders = PAYOUT_PROVIDERS.flatMap(g => g.options);
    const providerData = allProviders.find(p => p.name === newProvider);

    const newAcc = {
      id: `acc_${Date.now()}`,
      provider: newProvider,
      type: providerData.type,
      holderName: newHolderName,
      accountNumber: newAccountNumber,
      isPrimary: accounts.length === 0,
      status: "Pending Verification"
    };

    setAccounts([...accounts, newAcc]);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewProvider("");
    setNewHolderName("");
    setNewAccountNumber("");
  };

  // Helper functions for dynamic input UI
  const getProviderInputType = (provider) => {
    if (!provider) return { label: "Account Number", placeholder: "1000..." };

    // Safaricom specific prefix
    if (provider === "M‑PESA Ethiopia") {
      return { label: "Mobile Number", placeholder: "+251 7..." };
    }

    const p = provider.toLowerCase();
    // Ethio Telecom & Mobile Wallet prefix
    if (p.includes("birr") || p.includes("cash") || p.includes("amole") || p.includes("telebirr")) {
      return { label: "Mobile Number", placeholder: "+251 9..." };
    }

    // Standard Bank
    return { label: "Account Number", placeholder: "1000..." };
  };

  const inputConfig = getProviderInputType(newProvider);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pb-10 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Payout Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage Chapa-supported accounts for your net earnings.</p>
        </div>
        <button
          type="button" onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 outline-none transition-all active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" /> Add Payout Method
        </button>
      </div>

      {/* Top Section: Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500 p-6 rounded-2xl border border-emerald-400 shadow-lg shadow-emerald-500/20 flex flex-col justify-between text-zinc-950 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-sm font-bold uppercase tracking-wider opacity-90">Ready for Withdrawal</span>
            <div className="p-2 bg-white/20 rounded-lg"><Wallet className="h-6 w-6" /></div>
          </div>
          <div className="relative z-10">
            <span className="text-4xl font-black">{formatCurrency(137750)}</span>
            <p className="text-sm font-bold opacity-90 mt-1 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Next auto-payout: Friday, 12:00 PM
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Processing (In Transit)</span>
            <div className="p-2 bg-zinc-100 dark:bg-white/5 rounded-lg"><ArrowUpRight className="h-6 w-6 text-zinc-400" /></div>
          </div>
          <div>
            <span className="text-4xl font-bold text-zinc-900 dark:text-white">{formatCurrency(12500)}</span>
            <p className="text-sm text-zinc-500 mt-1">Currently clearing Chapa gateways</p>
          </div>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Connected Accounts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className={`p-5 rounded-2xl border transition-all ${acc.isPrimary ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-[#121214] border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${acc.type === 'bank' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'}`}>
                    {acc.type === 'bank' ? <Building className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base">{acc.provider}</h3>
                    <p className="text-sm text-zinc-500 font-mono tracking-widest mt-0.5">
                      {acc.type === 'bank' ? `**** ${acc.accountNumber.slice(-4)}` : acc.accountNumber}
                    </p>
                  </div>
                </div>
                {acc.isPrimary && (
                  <span className="px-2.5 py-1 bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-lg">Primary</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/10 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-0.5">Account Holder</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{acc.holderName}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!acc.isPrimary && acc.status === "Verified" && (
                    <button type="button" onClick={() => handleSetPrimary(acc.id)} className="px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors outline-none">
                      Make Primary
                    </button>
                  )}
                  {acc.status === "Pending Verification" ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5" /> Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                      <ShieldCheck className="h-4 w-4" /> Verified
                    </span>
                  )}
                  <button type="button" onClick={() => requestDelete(acc.id)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors outline-none ml-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setIsModalOpen(true)} className="p-5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-transparent hover:bg-zinc-50 dark:hover:bg-white/5 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-emerald-500 transition-colors min-h-[160px] outline-none group">
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-white/5 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-300">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-bold text-sm mt-1">Link New Account</span>
          </button>
        </div>
      </div>

      {/* --- ADD ACCOUNT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-white/5">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Add Payout Method</h2>
              <button type="button" onClick={closeModal} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white outline-none rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="addAccountForm" onSubmit={handleAddAccount} className="flex flex-col gap-5">

                <DropdownTrigger
                  label="Select Bank / Provider"
                  value={newProvider}
                  onClick={() => setActiveDropdown(true)}
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Account Holder Name</label>
                  <input
                    required type="text" placeholder="As it appears on your ID"
                    value={newHolderName} onChange={(e) => setNewHolderName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-base font-bold rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {inputConfig.label}
                  </label>
                  <input
                    required type="text" placeholder={inputConfig.placeholder}
                    value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-base font-mono tracking-wider font-bold rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl flex gap-3 mt-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                    Your details are securely encrypted. Names must match your verified VisionPark owner identity to pass automated KYC checks.
                  </p>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#121214]">
              <button form="addAccountForm" type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] outline-none">
                Link Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- CUSTOM SELECT PROVIDER MODAL --- */}
      {activeDropdown && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveDropdown(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-white/5 shrink-0">
              <h2 className="text-xl font-bold dark:text-white">Select Provider</h2>
              <button type="button" onClick={() => setActiveDropdown(false)} className="p-2 dark:text-zinc-400 hover:dark:text-white outline-none"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-2 overflow-y-auto flex-1 overscroll-contain">
              {PAYOUT_PROVIDERS.map((group, gIndex) => (
                <div key={gIndex} className="mb-4 last:mb-0">
                  <p className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{group.category}</p>
                  <div className="flex flex-col gap-1">
                    {group.options.map(p => (
                      <button
                        key={p.name} type="button"
                        onClick={() => { setNewProvider(p.name); setActiveDropdown(false); }}
                        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all outline-none ${newProvider === p.name ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400">{p.type === 'bank' ? <Building className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}</span>
                          {p.name}
                        </div>
                        {newProvider === p.name && <Check className="h-4 w-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {accountToDelete && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAccountToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">

            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Remove Account</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{accounts.find(a => a.id === accountToDelete)?.provider}</strong>?
                {accounts.find(a => a.id === accountToDelete)?.isPrimary && accounts.length > 1 && (
                  <span className="block mt-2 text-amber-600 dark:text-amber-500 font-medium">
                    This is your Primary account. If deleted, the next available account will be set as Primary automatically.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button" onClick={() => setAccountToDelete(null)}
                className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-900 dark:text-white font-bold rounded-xl transition-colors outline-none"
              >
                Cancel
              </button>
              <button
                type="button" onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 outline-none"
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}