import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type ImportType = "codes" | "locations" | "folders" | "boxes" | "users";

interface ImportResult {
  type: ImportType;
  success: number;
  duplicates: string[];
  failed: string[];
}

export function Imports() {
  const [importing, setImporting] = useState<ImportType | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [folderIds, setFolderIds] = useState<string[]>([]);
  const [includeFolderIds, setIncludeFolderIds] = useState(false);
  const { user } = useAuth();
  const [files, setFiles] = useState<Partial<Record<ImportType, File | null>>>({
    codes: null,
    locations: null,
    folders: null,
    boxes: null,
  });

  const runImport = async (type: ImportType) => {
    const file = files[type];
    if (!file) return;

    setImporting(type);
    setResult(null);
    let success = 0;
    let duplicates: string[] = [];
    let failed: string[] = [];
    let returnedFolderIds: string[] = [];

    try {
      if (type === "codes") {
        const res = await api.importCodes(file);
        success = res.created;
        duplicates = res.duplicates;
        failed = res.failed;
      } else if (type === "locations") {
        const res = await api.importLocations(file);
        success = res.created;
        duplicates = res.duplicates;
        failed = res.failed;
      } else if (type === "folders") {
        const res = await api.importFolders(file);
        success = res.created;
        duplicates = res.duplicates;
        failed = res.failed;
        returnedFolderIds = res.retention_ids ?? [];
      } else if (type === "users") {
        const res = await api.importUsers(file);
        success = res.created;
        duplicates = res.duplicates;
        failed = res.failed;
      } else {
        const res = await api.importBoxes(file);
        success = res.created;
        duplicates = res.duplicates;
        failed = res.failed;
      }
    } catch (error) {
      failed.push(String(error));
    }

    setResult({ type, success, duplicates, failed });
    setFolderIds(type === "folders" && includeFolderIds ? returnedFolderIds : []);
    setImporting(null);
    setFiles((prev) => ({ ...prev, [type]: null }));
  };

  const renderImportCard = (type: ImportType, title: string, description: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5" /> {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`file-${type}`}>Excel file (.xlsx / .xlsm)</Label>
          <input
            id={`file-${type}`}
            type="file"
            accept=".xlsx,.xlsm"
            className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] ?? null;
              setFiles((prev) => ({ ...prev, [type]: selectedFile }));
            }}
          />
        </div>
        <Button onClick={() => runImport(type)} disabled={importing !== null || !files[type]}>
          <Upload className="mr-2 h-4 w-4" /> Upload & Import
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Import Data</h1>
        <p className="text-sm text-slate-500">Upload Excel files to import codes, locations, folders, and boxes.</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <input id="export-folder-ids" type="checkbox" checked={includeFolderIds} onChange={(e) => setIncludeFolderIds(e.target.checked)} />
          <Label htmlFor="export-folder-ids">When importing folders, include generated retention IDs in results</Label>
        </div>
      </div>

      {result && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 pt-6">
            {result.failed.length === 0 ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <p className="font-medium">
                {result.type} import complete: <Badge variant="success">{result.success} successful</Badge>
                {result.duplicates.length > 0 && (
                  <Badge className="ml-2" variant="secondary">{result.duplicates.length} duplicates</Badge>
                )}
                {result.failed.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{result.failed.length} failed</Badge>
                )}
              </p>
              {result.duplicates.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-amber-700">Duplicates</p>
                  <ul className="list-disc pl-5 text-sm text-amber-700">
                    {result.duplicates.map((d, i) => <li key={`dup-${i}`}>{d}</li>)}
                  </ul>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600">Failed Entries</p>
                  <ul className="list-disc pl-5 text-sm text-red-600">
                    {result.failed.map((e, i) => <li key={`fail-${i}`}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {folderIds.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Imported Folder Retention IDs</CardTitle>
            <CardDescription>Copy these IDs for downstream processes.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea className="h-40 w-full rounded-md border p-2 text-sm" readOnly value={folderIds.join("\n")} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {renderImportCard("folders", "Import Folders", "Columns: Code, Name, Start Date")}
        {renderImportCard("boxes", "Import Boxes", "Columns: Name, optional Retention IDs")}
        {renderImportCard("codes", "Import Retention Codes", "Columns: Category, Sub-Category, Code, Name, Description, Retention Description, Retention Period/Retention Date")}
        {renderImportCard("locations", "Import Locations", "Columns: Code, Description, On Site")}
        {user?.is_admin && renderImportCard("users", "Import Users (Admin)", "Columns: Username, Email, Password, optional Full Name, Is Admin, Is Active")}
      </div>
    </div>
  );
}
