"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  Shield,
  Plus,
  Lock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminRole, ROLE_PERMISSIONS } from "@/lib/admin-rbac";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  twoFactorEnabled: boolean;
  status: string;
  lastLogin: string | null;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([
    "Owner/Admin",
    "Catalog Manager",
    "Fulfilment Manager",
    "Content Editor",
    "Read-only Analyst",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);

  // Invite Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("Catalog Manager");

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      if (!res.ok) throw new Error("Failed to load staff accounts");
      const data = await res.json();
      setStaff(data.staff || []);
      if (data.roles) setRoles(data.roles);
    } catch (err) {
      console.error("[Staff Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite staff");

      setStaff((prev) => [...prev, data.staff]);
      setInviteModalOpen(false);
      setName("");
      setEmail("");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Administration & RBAC</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Staff & Permissions Governance
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Role-Based Access Control, principle of least privilege, two-factor enforcement, and ISO-27001 access register.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMatrixOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-espresso/15 text-espresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-espresso/5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-burgundy" />
            <span>Permissions Matrix</span>
          </button>

          <Link
            href="/admin/access-register"
            className="px-3.5 py-2 rounded-xl bg-white border border-espresso/15 text-espresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-espresso/5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Access Register</span>
          </Link>

          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 border border-gold/30"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Staff Member</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Atelier Staff"
          value={staff.length}
          subtitle="Provisioned administrative users"
          icon={UserCheck}
          badge="Active"
        />
        <StatCard
          title="RBAC Roles"
          value={roles.length}
          subtitle="Least-privilege permission profiles"
          icon={Shield}
        />
        <StatCard
          title="2FA Compliance"
          value="100%"
          subtitle="Multi-factor authentication enforced"
          icon={CheckCircle}
          badge="Compliant"
        />
        <StatCard
          title="Access Governance"
          value="Quarterly"
          subtitle="ISO-27001 certified reviews"
          icon={Lock}
        />
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-espresso/10 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-espresso">
            Authorized Atelier Team Members
          </h3>
          <span className="text-xs text-espresso/60 font-mono">
            {staff.length} active operators
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Staff Member</th>
                <th className="p-3.5 font-bold">Email Coordinate</th>
                <th className="p-3.5 font-bold">Assigned Role</th>
                <th className="p-3.5 text-center font-bold">2FA Status</th>
                <th className="p-3.5 text-center font-bold">Account Status</th>
                <th className="p-3.5 pr-6 text-right font-bold">Last Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-espresso/[0.02] transition-colors">
                  <td className="p-3.5 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-burgundy/10 text-burgundy font-bold flex items-center justify-center text-xs shrink-0 border border-burgundy/20">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-espresso block">{s.name}</span>
                        <span className="text-[10px] text-espresso/50 font-mono">
                          {s.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono text-espresso text-[11px]">
                    {s.email}
                  </td>

                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-burgundy/10 text-burgundy border border-burgundy/20 font-mono">
                      {s.role}
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Enforced
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge label={s.status} size="sm" />
                  </td>

                  <td className="p-3.5 pr-6 text-right font-mono text-espresso/60 text-[11px]">
                    {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Modal */}
      {matrixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Role-Based Permissions Matrix (RBAC)
                </span>
              </div>
              <button
                onClick={() => setMatrixOpen(false)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-espresso/70">
                Granular security matrix governing operational permissions across all 12 modules.
              </p>

              <div className="border border-espresso/15 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-espresso text-ivory text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Module</th>
                      {roles.map((r) => (
                        <th key={r} className="p-3 text-center">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso/10">
                    {[
                      { module: "Overview & Metrics", key: "overview" },
                      { module: "Product Catalog", key: "products" },
                      { module: "Inventory Adjustments", key: "inventory" },
                      { module: "Order Fulfilment", key: "orders" },
                      { module: "Customer Relations", key: "customers" },
                      { module: "Coupons & Discounts", key: "discounts" },
                      { module: "Shipping & Dispatches", key: "shipping" },
                      { module: "Analytics & Reports", key: "analytics" },
                      { module: "Storefront CMS", key: "content" },
                      { module: "Store Settings", key: "settings" },
                      { module: "Staff Management", key: "staff" },
                      { module: "Audit Log Trail", key: "audit" },
                    ].map((row) => (
                      <tr key={row.key} className="hover:bg-espresso/[0.02]">
                        <td className="p-3 font-bold text-espresso">{row.module}</td>
                        {roles.map((role) => {
                          const perms = (ROLE_PERMISSIONS as any)[role]?.modules?.[row.key];
                          const canView = perms?.canView;
                          const canCreate = perms?.canCreate;
                          return (
                            <td key={role} className="p-3 text-center">
                              {canCreate ? (
                                <span className="text-emerald-700 font-bold font-mono">Full</span>
                              ) : canView ? (
                                <span className="text-sky-700 font-semibold font-mono">Read</span>
                              ) : (
                                <span className="text-espresso/30 font-mono">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setMatrixOpen(false)}
                  className="px-4 py-2 bg-espresso text-ivory text-xs font-bold uppercase rounded-xl hover:bg-burgundy transition-colors"
                >
                  Close Matrix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Staff Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col">
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Invite Atelier Team Member
                </span>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-espresso/80">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Patel"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-espresso/80">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@trendstreet.in"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso font-mono focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-espresso/80">
                  Role Assignment
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso font-semibold focus:ring-2 focus:ring-gold"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-espresso/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 font-bold text-espresso/70 hover:text-espresso"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold font-bold uppercase tracking-wider rounded-xl shadow-md border border-gold/30"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
