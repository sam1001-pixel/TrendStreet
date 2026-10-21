"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Download,
  FileCode,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AuditTrail } from "@/components/admin/AuditTrail";
import { AdminAccessRecord } from "@/types/store";

export default function AdminAccessRegisterPage() {
  const { accessRegister, addAccessRecord, updateAccessRecord, deleteAccessRecord } = useAdminAuth();

  const [activeModal, setActiveModal] = useState<"add" | "edit" | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AdminAccessRecord | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "sql" | "json" | null>(null);

  // New Record Form State
  const [formData, setFormData] = useState<Omit<AdminAccessRecord, "adminId">>({
    systemOrTool: "",
    category: "Operations",
    mainAdmin: "Sujal Solanki",
    backupAdmin: "Radha Solanki",
    department: "Executive & Commerce",
    accessLevel: "Full",
    numberOfAdminUsers: 2,
    billingOwner: "Sujal Solanki",
    plan: "Enterprise",
    seats: 5,
    renewalDate: "2027-01-15",
    companyOwnedAccount: true,
    sharedLogin: false,
    passwordManagerEntry: "1Password Atelier Vault / System Root",
    twoFactorOn: true,
    lastAccessReview: "2026-10-01",
    nextAccessReview: "2027-01-01",
    offboardingChecklistItem: "Revoke master tokens and invalidate active sessions",
    riskLevel: "Low",
    status: "Provisioned",
    notes: "Privileged account inspected under quarterly access governance.",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addAccessRecord(formData);
    setActiveModal(null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    updateAccessRecord(selectedRecord);
    setActiveModal(null);
    setSelectedRecord(null);
  };

  // CSV Generator per /admin-access-register skill
  const generateCSV = () => {
    const headers = [
      "System or Tool",
      "Category",
      "Main Admin",
      "Backup Admin",
      "Department",
      "Access Level",
      "Number of Admin Users",
      "Billing Owner",
      "Plan",
      "Seats",
      "Renewal Date",
      "Company Owned Account",
      "Shared Login",
      "Password Manager Entry",
      "Two Factor On",
      "Last Access Review",
      "Next Access Review",
      "Offboarding Checklist Item",
      "Risk Level",
      "Status",
      "Notes",
      "Admin ID",
    ];

    const rows = accessRegister.map((r) => [
      `"${r.systemOrTool.replace(/"/g, '""')}"`,
      r.category,
      `"${r.mainAdmin}"`,
      `"${r.backupAdmin}"`,
      `"${r.department}"`,
      r.accessLevel,
      r.numberOfAdminUsers,
      `"${r.billingOwner}"`,
      `"${r.plan}"`,
      r.seats,
      r.renewalDate,
      r.companyOwnedAccount ? "TRUE" : "FALSE",
      r.sharedLogin ? "TRUE" : "FALSE",
      `"${r.passwordManagerEntry}"`,
      r.twoFactorOn ? "TRUE" : "FALSE",
      r.lastAccessReview,
      r.nextAccessReview,
      `"${r.offboardingChecklistItem}"`,
      r.riskLevel,
      r.status,
      `"${r.notes}"`,
      r.adminId,
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  };

  // SQL DDL Generator per /admin-access-register skill
  const escapeSql = (str: string = "") => String(str || "").replace(/'/g, "''");

  const generateSQL = () => {
    return `-- Admin Access Register DDL & Seed
CREATE TABLE IF NOT EXISTS admin_access_register (
  admin_id SERIAL PRIMARY KEY,
  system_or_tool VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  main_admin VARCHAR(255) NOT NULL,
  backup_admin VARCHAR(255),
  department VARCHAR(255),
  access_level VARCHAR(100) NOT NULL,
  number_of_admin_users NUMERIC NOT NULL,
  billing_owner VARCHAR(255),
  plan VARCHAR(255),
  seats NUMERIC NOT NULL,
  renewal_date DATE NOT NULL,
  company_owned_account BOOLEAN NOT NULL,
  shared_login BOOLEAN NOT NULL,
  password_manager_entry VARCHAR(255),
  two_factor_on BOOLEAN NOT NULL,
  last_access_review DATE NOT NULL,
  next_access_review DATE NOT NULL,
  offboarding_checklist_item VARCHAR(255),
  risk_level VARCHAR(100) NOT NULL,
  status VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data:
${accessRegister
  .map(
    (r) =>
      `INSERT INTO admin_access_register (system_or_tool, category, main_admin, backup_admin, department, access_level, number_of_admin_users, billing_owner, plan, seats, renewal_date, company_owned_account, shared_login, password_manager_entry, two_factor_on, last_access_review, next_access_review, offboarding_checklist_item, risk_level, status, notes) VALUES ('${escapeSql(r.systemOrTool)}', '${escapeSql(r.category)}', '${escapeSql(r.mainAdmin)}', '${escapeSql(r.backupAdmin || "")}', '${escapeSql(r.department)}', '${escapeSql(r.accessLevel)}', ${Number(r.numberOfAdminUsers) || 1}, '${escapeSql(r.billingOwner || "")}', '${escapeSql(r.plan)}', ${Number(r.seats) || 1}, '${escapeSql(r.renewalDate)}', ${Boolean(r.companyOwnedAccount)}, ${Boolean(r.sharedLogin)}, '${escapeSql(r.passwordManagerEntry || "")}', ${Boolean(r.twoFactorOn)}, '${escapeSql(r.lastAccessReview)}', '${escapeSql(r.nextAccessReview)}', '${escapeSql(r.offboardingChecklistItem || "")}', '${escapeSql(r.riskLevel)}', '${escapeSql(r.status)}', '${escapeSql(r.notes || "")}');`
  )
  .join("\n")}`;
  };

  // JSON Schema Generator
  const generateJSON = () => {
    return JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title: "Admin Access Register",
        records: accessRegister,
      },
      null,
      2
    );
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AuditTrail />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.2em] text-crimson mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Layer 7: Protect — Privileged Account Governance</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Admin Access Register
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            System owner register, 2FA status, backup admins, seat counts, and quarterly access reviews.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveModal("add")}
            className="py-2.5 px-4 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register System</span>
          </button>

          <button
            onClick={() => setExportFormat(exportFormat ? null : "csv")}
            className="py-2.5 px-4 bg-white border border-burgundy/25 hover:border-burgundy text-burgundy text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export DDL / CSV</span>
          </button>
        </div>
      </div>

      {/* Export Accordion Drawer */}
      {exportFormat && (
        <div className="bg-white p-6 rounded-2xl border border-burgundy/20 shadow-lg space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-burgundy/15">
            <span className="font-bold text-xs uppercase tracking-wider text-burgundy flex items-center gap-2">
              <FileCode className="w-4 h-4 text-gold" />
              <span>Multi-Format Compliance Artifacts</span>
            </span>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setExportFormat("csv")}
                className={`px-3 py-1 rounded-md font-bold uppercase ${
                  exportFormat === "csv" ? "bg-burgundy text-gold" : "bg-ivory text-espresso"
                }`}
              >
                CSV
              </button>
              <button
                onClick={() => setExportFormat("sql")}
                className={`px-3 py-1 rounded-md font-bold uppercase ${
                  exportFormat === "sql" ? "bg-burgundy text-gold" : "bg-ivory text-espresso"
                }`}
              >
                SQL DDL
              </button>
              <button
                onClick={() => setExportFormat("json")}
                className={`px-3 py-1 rounded-md font-bold uppercase ${
                  exportFormat === "json" ? "bg-burgundy text-gold" : "bg-ivory text-espresso"
                }`}
              >
                JSON Schema
              </button>
              <button onClick={() => setExportFormat(null)} className="p-1 text-espresso/60 hover:text-burgundy">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <pre className="p-4 bg-espresso text-ivory rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
            {exportFormat === "csv" && generateCSV()}
            {exportFormat === "sql" && generateSQL()}
            {exportFormat === "json" && generateJSON()}
          </pre>

          <div className="flex justify-end space-x-3 text-xs">
            <button
              onClick={() => {
                if (exportFormat === "csv") downloadFile(generateCSV(), "admin_access_register.csv", "text/csv");
                if (exportFormat === "sql") downloadFile(generateSQL(), "admin_access_register.sql", "application/sql");
                if (exportFormat === "json") downloadFile(generateJSON(), "admin_access_register.json", "application/json");
              }}
              className="py-2 px-5 bg-burgundy hover:bg-crimson text-gold font-bold uppercase rounded-lg shadow-sm"
            >
              Download {exportFormat.toUpperCase()} File
            </button>
          </div>
        </div>
      )}

      {/* Main Register Table */}
      <div className="bg-white rounded-2xl border border-burgundy/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-ivory text-espresso/80 border-b border-burgundy/15 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3.5">System / Tool</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Main Admin</th>
                <th className="p-3.5">Backup Admin</th>
                <th className="p-3.5">Level</th>
                <th className="p-3.5">2FA</th>
                <th className="p-3.5">Seats / Plan</th>
                <th className="p-3.5">Next Review</th>
                <th className="p-3.5">Risk</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/10">
              {accessRegister.map((record) => (
                <tr key={record.adminId} className="hover:bg-ivory/50 transition-colors">
                  <td className="p-3.5">
                    <span className="font-bold text-espresso block">{record.systemOrTool}</span>
                    <span className="text-[10px] text-espresso/50 font-mono">{record.passwordManagerEntry}</span>
                  </td>
                  <td className="p-3.5 font-medium">{record.category}</td>
                  <td className="p-3.5 font-semibold text-burgundy">{record.mainAdmin}</td>
                  <td className="p-3.5 text-espresso/70">{record.backupAdmin}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-burgundy/10 text-burgundy font-bold text-[10px]">
                      {record.accessLevel}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {record.twoFactorOn ? (
                      <span className="text-green-700 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> ON
                      </span>
                    ) : (
                      <span className="text-red-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> OFF
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-espresso block">{record.seats} seats</span>
                    <span className="text-[10px] text-espresso/50">{record.plan}</span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-espresso/70">{record.nextAccessReview}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        record.riskLevel === "Critical"
                          ? "bg-red-100 text-red-800"
                          : record.riskLevel === "High"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {record.riskLevel}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-ivory text-espresso text-[10px] font-semibold border border-burgundy/15">
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setActiveModal("edit");
                      }}
                      className="p-1.5 text-burgundy hover:bg-burgundy/10 rounded"
                      title="Edit Register Entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove access record for ${record.systemOrTool}?`)) {
                          deleteAccessRecord(record.adminId);
                        }
                      }}
                      className="p-1.5 text-crimson hover:bg-crimson/10 rounded"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ivory rounded-3xl max-w-2xl w-full p-8 border border-burgundy/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-burgundy/20">
              <h3 className="font-serif text-xl font-bold text-espresso">
                {activeModal === "add" ? "Register Privileged System Account" : "Edit Access Record"}
              </h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedRecord(null);
                }}
                className="text-espresso/60 hover:text-burgundy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={activeModal === "add" ? handleCreate : handleUpdate}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">System or Tool Name</label>
                  <input
                    type="text"
                    required
                    value={activeModal === "add" ? formData.systemOrTool : selectedRecord?.systemOrTool || ""}
                    onChange={(e) => {
                      if (activeModal === "add") setFormData({ ...formData, systemOrTool: e.target.value });
                      else if (selectedRecord) setSelectedRecord({ ...selectedRecord, systemOrTool: e.target.value });
                    }}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Main Admin</label>
                  <input
                    type="text"
                    required
                    value={activeModal === "add" ? formData.mainAdmin : selectedRecord?.mainAdmin || ""}
                    onChange={(e) => {
                      if (activeModal === "add") setFormData({ ...formData, mainAdmin: e.target.value });
                      else if (selectedRecord) setSelectedRecord({ ...selectedRecord, mainAdmin: e.target.value });
                    }}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Backup Admin</label>
                  <input
                    type="text"
                    value={activeModal === "add" ? formData.backupAdmin : selectedRecord?.backupAdmin || ""}
                    onChange={(e) => {
                      if (activeModal === "add") setFormData({ ...formData, backupAdmin: e.target.value });
                      else if (selectedRecord) setSelectedRecord({ ...selectedRecord, backupAdmin: e.target.value });
                    }}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Access Level</label>
                  <select
                    value={activeModal === "add" ? formData.accessLevel : selectedRecord?.accessLevel || "Full"}
                    onChange={(e) => {
                      const val = e.target.value as "Full" | "Write" | "Read" | "No Access";
                      if (activeModal === "add") setFormData({ ...formData, accessLevel: val });
                      else if (selectedRecord) setSelectedRecord({ ...selectedRecord, accessLevel: val });
                    }}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  >
                    <option value="Full">Full</option>
                    <option value="Write">Write</option>
                    <option value="Read">Read</option>
                    <option value="No Access">No Access</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Risk Level</label>
                  <select
                    value={activeModal === "add" ? formData.riskLevel : selectedRecord?.riskLevel || "Low"}
                    onChange={(e) => {
                      const val = e.target.value as "Low" | "Medium" | "High" | "Critical";
                      if (activeModal === "add") setFormData({ ...formData, riskLevel: val });
                      else if (selectedRecord) setSelectedRecord({ ...selectedRecord, riskLevel: val });
                    }}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Next Access Review Date</label>
                  <input
                    type="date"
                    required
                    value={activeModal === "add" ? formData.nextAccessReview : selectedRecord?.nextAccessReview || ""}
                    onChange={(e) => {
                      if (activeModal === "add") setFormData({ ...formData, nextAccessReview: e.target.value });
                      else if (selectedRecord) setSelectedRecord({ ...selectedRecord, nextAccessReview: e.target.value });
                    }}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <label className="flex items-center space-x-2 font-semibold text-espresso cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeModal === "add" ? formData.twoFactorOn : selectedRecord?.twoFactorOn || false}
                      onChange={(e) => {
                        if (activeModal === "add") setFormData({ ...formData, twoFactorOn: e.target.checked });
                        else if (selectedRecord) setSelectedRecord({ ...selectedRecord, twoFactorOn: e.target.checked });
                      }}
                      className="w-4 h-4 text-burgundy rounded"
                    />
                    <span>Two Factor Authentication (2FA) Active</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setSelectedRecord(null);
                  }}
                  className="py-2.5 px-5 bg-white border border-burgundy/20 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-burgundy hover:bg-crimson text-gold font-bold uppercase tracking-wider rounded-xl shadow-md"
                >
                  {activeModal === "add" ? "Save to Access Register" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
