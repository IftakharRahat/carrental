import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileSpreadsheet,
  LockKeyhole,
  PackageOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const foundations = [
  {
    title: "Neon PostgreSQL",
    description:
      "15-model relational schema with ledger and audit foundations.",
    icon: Database,
  },
  {
    title: "Financial integrity",
    description:
      "Money uses exact decimals and business actions are transaction-ready.",
    icon: CircleDollarSign,
  },
  {
    title: "Authentication",
    description:
      "Clerk boundary with Admin, Staff and Viewer application roles.",
    icon: LockKeyhole,
  },
  {
    title: "Exports and files",
    description:
      "XLSX, CSV and private file-storage packages are ready to integrate.",
    icon: FileSpreadsheet,
  },
];

const buildOrder = [
  "Buy Car and automatic purchase ledger entry",
  "Stock list and car financial summary",
  "Car Details with expenses and activity history",
  "Whole-car and dismantled-item recovery",
  "Business expenses and cash-flow ledger",
  "Monthly reports, exports and dashboard totals",
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            V1 foundation
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Project setup is ready
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 sm:text-base">
            The application shell, database model, validation boundary and test
            tooling are in place. Connect the external services, then build the
            transaction-generating workflow first.
          </p>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-emerald-600" />
          AED · Asia/Dubai · PostgreSQL-first
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/70 shadow-none">
        <CardContent className="flex gap-3 py-5 text-sm text-amber-950">
          <PackageOpen className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">
              External credentials are still required
            </p>
            <p className="mt-1 leading-6 text-amber-900/80">
              Copy <code>.env.example</code> to <code>.env</code>, then add the
              Neon, Clerk and Vercel Blob values before applying migrations.
            </p>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="foundation-heading">
        <h2 id="foundation-heading" className="sr-only">
          Technical foundation
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {foundations.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="leading-5">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recommended implementation sequence</CardTitle>
            <CardDescription>
              Keep every number traceable to its source transaction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {buildOrder.map((item, index) => (
                <li
                  key={item}
                  className="bg-background flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
                >
                  <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1">{item}</span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accounting invariants</CardTitle>
            <CardDescription>
              These rules are encoded in the domain foundation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Rule label="Stock value" value="Purchase + active car expenses" />
            <Rule label="Realized profit" value="Completed cars only" />
            <Rule label="Available cash" value="Opening cash + In − Out" />
            <Rule label="Corrections" value="Void with audit history" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground text-right">{value}</span>
    </div>
  );
}
