import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  success: number;
  errors: string[];
}

export function Imports() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [boxData, setBoxData] = useState("");
  const [folderData, setFolderData] = useState("");

  const handleImportBoxes = async () => {
    setImporting(true);
    setResult(null);
    const lines = boxData.trim().split("\n").filter(Boolean);
    let success = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length < 1) { errors.push(`Invalid line: ${line}`); continue; }
      try {
        await api.createBox({ name: parts[0] });
        success++;
      } catch (e) {
        errors.push(`Failed: ${parts[0]} – ${e}`);
      }
    }

    setResult({ success, errors });
    setImporting(false);
    setBoxData("");
  };

  const handleImportFolders = async () => {
    setImporting(true);
    setResult(null);
    const lines = folderData.trim().split("\n").filter(Boolean);
    let success = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length < 3) { errors.push(`Invalid line (need code,name,start_date): ${line}`); continue; }
      try {
        await api.createFolder({ code: parts[0], name: parts[1], start_date: parts[2] });
        success++;
      } catch (e) {
        errors.push(`Failed: ${parts[1]} – ${e}`);
      }
    }

    setResult({ success, errors });
    setImporting(false);
    setFolderData("");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Import Data</h1>
        <p className="text-sm text-slate-500">Bulk import boxes and folders from CSV-style text</p>
      </div>

      {result && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 pt-6">
            {result.errors.length === 0 ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <p className="font-medium">
                Import complete: <Badge variant="success">{result.success} successful</Badge>
                {result.errors.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{result.errors.length} errors</Badge>
                )}
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-red-600">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5" /> Import Boxes</CardTitle>
            <CardDescription>One box name per line</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Box Names (one per line)</Label>
              <textarea
                className="flex min-h-32 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={boxData}
                onChange={(e) => setBoxData(e.target.value)}
                placeholder={"HR Records 2024\nFinance Q1\nLegal Contracts"}
              />
            </div>
            <Button onClick={handleImportBoxes} disabled={importing || !boxData.trim()}>
              <Upload className="mr-2 h-4 w-4" /> Import Boxes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5" /> Import Folders</CardTitle>
            <CardDescription>Format: code, name, start_date (one per line)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Folder Data (CSV format)</Label>
              <textarea
                className="flex min-h-32 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                value={folderData}
                onChange={(e) => setFolderData(e.target.value)}
                placeholder={"HR01, Employee Files 2024, 2024-01-15\nFIN01, Q1 Reports, 2024-03-31"}
              />
            </div>
            <Button onClick={handleImportFolders} disabled={importing || !folderData.trim()}>
              <Upload className="mr-2 h-4 w-4" /> Import Folders
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
