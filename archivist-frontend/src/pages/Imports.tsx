import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";

type ImportType = "codes" | "locations" | "folders" | "boxes";

interface ImportResult {
  type: ImportType;
  success: number;
  errors: string[];
}

export function Imports() {
  const [importing, setImporting] = useState<ImportType | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
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
    const errors: string[] = [];
    let success = 0;

    try {
      if (type === "codes") {
        const res = await api.importCodes(file);
        success = res.created;
      } else if (type === "locations") {
        const res = await api.importLocations(file);
        success = res.created;
      } else if (type === "folders") {
        const res = await api.importFolders(file);
        success = res.created;
      } else {
        const res = await api.importBoxes(file);
        success = res.created;
      }
    } catch (error) {
      errors.push(String(error));
    }

    setResult({ type, success, errors });
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
                {result.type} import complete: <Badge variant="success">{result.success} successful</Badge>
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
        {renderImportCard("codes", "Import Retention Codes", "Columns: Category, Sub-Category, Code, Name, Description, Retention Description, Retention Period/Retention Date")}
        {renderImportCard("locations", "Import Locations", "Columns: Code, Description, On Site")}
        {renderImportCard("folders", "Import Folders", "Columns: Code, Name, Start Date")}
        {renderImportCard("boxes", "Import Boxes", "Columns: Name, optional Retention IDs")}
      </div>
    </div>
  );
}
