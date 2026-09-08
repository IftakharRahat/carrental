"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ROLE_DEFINITIONS,
  summarizeUserRoles,
} from "../domain/security-calculations";
import type {
  SecuritySettingsViewData,
  UserProfileItem,
  UserRole,
} from "../domain/security-types";
import {
  createUserAction,
  generateFullDatabaseBackupAction,
  updateUserRoleAction,
} from "../server/security-actions";

type SecurityViewProps = {
  data: SecuritySettingsViewData;
};

export function SecurityView({ data }: SecurityViewProps) {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<UserProfileItem[]>(data.users);

  // Add user modal state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("STAFF");

  // Edit user role modal state
  const [editingUser, setEditingUser] = useState<UserProfileItem | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("STAFF");
  const [editIsActive, setEditIsActive] = useState(true);

  const { tableCounts, posture, recentAuditLogs, currentUserRole } = data;
  const userSummary = summarizeUserRoles(users);
  const totalDatabaseRecords = tableCounts.reduce((s, t) => s + t.count, 0);

  // Backup action
  const handleGenerateBackup = () => {
    startTransition(async () => {
      const res = await generateFullDatabaseBackupAction();
      if (res.ok) {
        const { filename, jsonContent } = res.data;
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Full database backup generated (${filename}).`);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Add user handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUserAction(newEmail, newName, newRole);
      if (res.ok) {
        toast.success(`User "${newName}" invited successfully.`);
        setAddUserOpen(false);
        setNewName("");
        setNewEmail("");
        setNewRole("STAFF");
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Update user role handler
  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    startTransition(async () => {
      const res = await updateUserRoleAction(
        editingUser.id,
        editRole,
        editIsActive,
      );
      if (res.ok) {
        toast.success(`Updated role and access for ${editingUser.name}.`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, role: editRole, isActive: editIsActive }
              : u,
          ),
        );
        setEditingUser(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Security, Users &amp; Backup
            </h1>
            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
              Section 17
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Protect application access, user roles, private credentials, and database backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateBackup}
            disabled={isPending || currentUserRole !== "ADMIN"}
            className="gap-1.5 shadow-xs"
            data-testid="generate-backup-btn"
          >
            {isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Archive className="size-4" />
            )}
            Download System Backup
          </Button>
        </div>
      </div>

      {/* Top Security Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users Summary */}
        <Card className="border-border/80 shadow-xs" data-testid="kpi-sec-users">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              User Accounts
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {userSummary.activeUsers} <span className="text-xs font-normal text-muted-foreground">active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userSummary.activeAdmins} Admin · {userSummary.activeStaff} Staff · {userSummary.activeViewers} Viewer
            </p>
          </CardContent>
        </Card>

        {/* Auth Posture */}
        <Card className="border-border/80 shadow-xs" data-testid="kpi-sec-auth">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Authentication
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              Protected
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate" title={posture.sessionStrategy}>
              {posture.sessionStrategy}
            </p>
          </CardContent>
        </Card>

        {/* Database Total Records */}
        <Card className="border-border/80 shadow-xs" data-testid="kpi-sec-db">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Database Records
            </CardTitle>
            <div className="rounded-md bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
              <Database className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400">
              {totalDatabaseRecords} <span className="text-xs font-normal text-muted-foreground">records</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across 10 core PostgreSQL tables
            </p>
          </CardContent>
        </Card>

        {/* Private Google Sheets */}
        <Card className="border-border/80 shadow-xs" data-testid="kpi-sec-sheets">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data Privacy (Sheets)
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
              <FileSpreadsheet className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold tracking-tight text-amber-700 dark:text-amber-400">
              Private Only
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No public web links · Server-side credentials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 17.2 Users Management Table */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold">
                User Management &amp; Access Roles
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure team member access according to Section 17.2 roles.
              </p>
            </div>

            {currentUserRole === "ADMIN" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddUserOpen(true)}
                className="gap-1.5 self-start sm:self-auto text-xs"
                data-testid="add-user-btn"
              >
                <UserPlus className="size-3.5" />
                Invite User
              </Button>
            )}
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" data-testid="users-table">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">User</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                <th className="py-2.5 px-3 font-semibold">Account Status</th>
                <th className="py-2.5 px-3 font-semibold">Joined Date</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    {user.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={
                        user.role === "ADMIN"
                          ? "default"
                          : user.role === "STAFF"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                        <XCircle className="size-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">
                    {user.createdAt}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {currentUserRole === "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setEditingUser(user);
                          setEditRole(user.role);
                          setEditIsActive(user.isActive);
                        }}
                        className="h-7 text-xs px-2"
                        data-testid={`edit-user-btn-${user.id}`}
                      >
                        Edit Role
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 17.2 Role Permissions Matrix */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Section 17.2 Role Permission Matrix
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ROLE_DEFINITIONS.map((def) => (
            <Card key={def.role} className="border-border/80 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {def.label}
                  </CardTitle>
                  <Badge variant={def.badgeVariant} className="text-[10px]">
                    {def.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {def.description}
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                    Permitted Capabilities:
                  </span>
                  <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                    {def.permissions.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>

                {def.restrictedFrom.length > 0 && (
                  <div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                      Enforced Restrictions:
                    </span>
                    <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                      {def.restrictedFrom.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 17.1 & 17.3 Security Posture & Google Sheets Safeguards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 17.1 Authentication Policies */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                17.1 Authentication &amp; Credential Security
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 border-b pb-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>No Anonymous Access:</strong> All operational routes require an authorized session.
              </span>
            </div>
            <div className="flex items-start gap-2 border-b pb-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Plain-Text Passwords:</strong> Credentials are encrypted using industry-standard hashing algorithms by Clerk Auth.
              </span>
            </div>
            <div className="flex items-start gap-2 border-b pb-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Session Invalidation:</strong> Logout immediately revokes user session tokens server-side.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Rate-Limiting:</strong> Repeated failed attempts are throttled to prevent brute-force attacks.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 17.3 Google Sheets Security */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">
                17.3 Google Sheets Security Standards
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 border-b pb-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Strictly Private:</strong> Spreadsheet is restricted to authorized owners; never publish to the public web.
              </span>
            </div>
            <div className="flex items-start gap-2 border-b pb-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Server-Side Boundary:</strong> Google API service account credentials remain exclusively in server environment variables.
              </span>
            </div>
            <div className="flex items-start gap-2 border-b pb-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Client Exposure:</strong> Secret keys and JSON credentials are never bundled into frontend JavaScript.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Owner Sharing Only:</strong> Sharing permissions are restricted to verified business stakeholders.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 17.4 Backup & Disaster Recovery */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                17.4 System Backup &amp; Disaster Recovery
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Extract complete database snapshots and review disaster recovery procedures.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateBackup}
              disabled={isPending || currentUserRole !== "ADMIN"}
              className="gap-1.5 text-xs"
              data-testid="table-backup-btn"
            >
              <Download className="size-3.5" />
              Download Full Backup (.JSON)
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Table Counts Grid */}
          <div>
            <span className="text-xs font-semibold text-foreground block mb-2">
              Current Live Table Snapshot:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {tableCounts.map((t) => (
                <div
                  key={t.tableName}
                  className="rounded-md border p-2.5 bg-muted/10 text-xs"
                >
                  <span className="text-muted-foreground block text-[11px]">
                    {t.label}
                  </span>
                  <span className="font-bold text-sm text-foreground">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backup Guidelines */}
          <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-3 text-xs text-blue-950 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Archive className="size-3.5" /> Recommended Backup Procedure:
            </p>
            <p className="text-[11px] leading-relaxed">
              1. <strong>Automated Multi-Generation:</strong> Take daily exports and preserve weekly snapshots.<br />
              2. <strong>External Media:</strong> Vehicle photos and documents are secured in Vercel Blob private storage.<br />
              3. <strong>Verified Restore:</strong> Regularly test restoring snapshots into a staging database to verify recovery readiness.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security & System Audit Logs */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="text-sm font-semibold">
            Recent Security &amp; Transaction Audit Trail
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable log of system events, role changes, and backups.
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Entity</th>
                <th className="py-2.5 px-3 font-semibold">Reason / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No recent audit log entries recorded.
                  </td>
                </tr>
              ) : (
                recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {log.entityType}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground max-w-xs truncate">
                      {log.reason || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Invite User */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Invite New User</CardTitle>
            </CardHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-user-name" className="text-xs">Full Name *</Label>
                <Input
                  id="new-user-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tariq Mansoor"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-email" className="text-xs">Email Address *</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-role" className="text-xs">Role *</Label>
                <select
                  id="new-user-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="STAFF">Staff / Operator (Standard Operations)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                  <option value="VIEWER">Viewer (Read-Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Inviting..." : "Create Account"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Edit User Role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">
                Edit Role &amp; Access: {editingUser.name}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleUpdateRole} className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  value={editingUser.email}
                  disabled
                  className="h-8 text-xs bg-muted text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-user-role" className="text-xs">Role *</Label>
                <select
                  id="edit-user-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  data-testid="select-edit-role"
                >
                  <option value="STAFF">Staff / Operator</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="VIEWER">Viewer (Read-Only)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-active-toggle"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="edit-active-toggle" className="text-xs cursor-pointer">
                  Account is Active (permits login)
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} data-testid="save-role-btn">
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
