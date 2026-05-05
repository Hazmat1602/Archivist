import { useEffect, useMemo, useState } from "react";
import { api, type Box, type Folder, type Location, type RetentionCode, type User } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pin, PinOff, Search as SearchIcon } from "lucide-react";

type SearchType = "folder" | "box" | "code" | "location" | "user";

interface SearchResult {
  id: string;
  type: SearchType;
  title: string;
  subtitle: string;
  locationTrail?: string;
  createdDate?: string | null;
  expiryDate?: string | null;
}

const PINNED_STORAGE_KEY = "archivist_pinned_results";

export function Search() {
  const [query, setQuery] = useState("");
  const [resultTypeFilter, setResultTypeFilter] = useState<"all" | SearchType>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");

  const [folders, setFolders] = useState<Folder[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [codes, setCodes] = useState<RetentionCode[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedResultIds, setPinnedResultIds] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPinnedResultIds(parsed.filter((v): v is string => typeof v === "string"));
        }
      } catch {
        localStorage.removeItem(PINNED_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedResultIds));
  }, [pinnedResultIds]);

  useEffect(() => {
    Promise.all([api.listFolders(), api.listBoxes(), api.listCodes(), api.listLocations(), api.listUsers()])
      .then(([folderData, boxData, codeData, locationData, userData]) => {
        setFolders(folderData);
        setBoxes(boxData);
        setCodes(codeData);
        setLocations(locationData);
        setUsers(userData);
      })
      .finally(() => setLoading(false));
  }, []);

  const boxMap = useMemo(() => new Map(boxes.map((box) => [box.id, box])), [boxes]);
  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);

  const allResults = useMemo(() => {
    const folderResults: SearchResult[] = folders.map((folder) => {
      const box = folder.box_id ? boxMap.get(folder.box_id) : null;
      const location = box?.location_id ? locationMap.get(box.location_id) : null;
      return {
        id: `folder-${folder.id}`,
        type: "folder",
        title: folder.name,
        subtitle: `ID ${folder.retention_id} • Code ${folder.code}`,
        locationTrail: `Folder ${folder.code} > Box ${box?.code ?? "Unassigned"} > ${location?.code ?? "Unassigned"}`,
        createdDate: folder.created_date,
        expiryDate: folder.expiry_date,
      };
    });

    const boxResults: SearchResult[] = boxes.map((box) => {
      const location = box.location_id ? locationMap.get(box.location_id) : null;
      return {
        id: `box-${box.id}`,
        type: "box",
        title: box.name || box.code,
        subtitle: `Box ${box.code}`,
        locationTrail: `Box ${box.code} > ${location?.code ?? "Unassigned"}`,
        createdDate: box.created_date,
        expiryDate: box.expiry_date,
      };
    });

    const codeResults: SearchResult[] = codes.map((code) => ({ id: `code-${code.id}`, type: "code", title: code.code, subtitle: code.name }));
    const locationResults: SearchResult[] = locations.map((location) => ({ id: `location-${location.id}`, type: "location", title: location.code, subtitle: location.description }));
    const userResults: SearchResult[] = users.map((user) => ({ id: `user-${user.id}`, type: "user", title: user.full_name || user.username, subtitle: `${user.username} • ${user.email}` }));

    return [...folderResults, ...boxResults, ...codeResults, ...locationResults, ...userResults];
  }, [folders, boxes, codes, locations, users, boxMap, locationMap]);

  const resultMap = useMemo(() => new Map(allResults.map((result) => [result.id, result])), [allResults]);
  const pinnedResults = useMemo(() => pinnedResultIds.map((id) => resultMap.get(id)).filter((result): result is SearchResult => !!result), [pinnedResultIds, resultMap]);

  const dateInRange = (dateValue: string | null | undefined, fromValue: string, toValue: string) => {
    if (!fromValue && !toValue) return true;
    if (!dateValue) return false;
    const dateOnly = dateValue.slice(0, 10);
    if (fromValue && dateOnly < fromValue) return false;
    if (toValue && dateOnly > toValue) return false;
    return true;
  };

  const matchesFilters = (result: SearchResult) => {
    if (resultTypeFilter !== "all" && result.type !== resultTypeFilter) return false;
    if (!dateInRange(result.createdDate, createdFrom, createdTo)) return false;
    if (!dateInRange(result.expiryDate, expiryFrom, expiryTo)) return false;
    return true;
  };

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const candidates = allResults.filter((result) => !pinnedResultIds.includes(result.id));
    return candidates.filter((result) => {
      if (!matchesFilters(result)) return false;
      if (!q) return true;
      return [result.title, result.subtitle, result.locationTrail, result.type].some((value) => value?.toLowerCase().includes(q));
    });
  }, [allResults, pinnedResultIds, query, resultTypeFilter, createdFrom, createdTo, expiryFrom, expiryTo]);

  const visiblePinnedResults = useMemo(
    () => pinnedResults.filter((result) => matchesFilters(result)),
    [pinnedResults, resultTypeFilter, createdFrom, createdTo, expiryFrom, expiryTo],
  );

  const togglePinnedResult = (resultId: string) => {
    setPinnedResultIds((current) => (current.includes(resultId) ? current.filter((entry) => entry !== resultId) : [resultId, ...current].slice(0, 24)));
  };

  const renderResult = (result: SearchResult) => {
    const isPinned = pinnedResultIds.includes(result.id);
    return <div key={result.id} className="rounded-md border border-slate-200 p-3"><div className="mb-1 flex items-center justify-between gap-3"><p className="font-medium text-slate-900">{result.title}</p><div className="flex items-center gap-2"><Badge variant="secondary" className="capitalize">{result.type}</Badge><Button variant={isPinned ? "secondary" : "ghost"} size="icon" onClick={() => togglePinnedResult(result.id)}>{isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</Button></div></div><p className="text-sm text-slate-600">{result.subtitle}</p>{result.locationTrail && <p className="mt-1 text-xs text-slate-500">{result.locationTrail}</p>}</div>;
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Search</h1><p className="text-sm text-slate-500">Search folders, boxes, codes, locations, and users.</p></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><SearchIcon className="h-5 w-5" /> Global Search</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search by folder, box, code, location, or user" value={query} onChange={(e) => setQuery(e.target.value)} />

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Result type</Label><select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={resultTypeFilter} onChange={(e) => setResultTypeFilter(e.target.value as "all" | SearchType)}><option value="all">All</option><option value="folder">Folder</option><option value="box">Box</option><option value="code">Code</option><option value="location">Location</option><option value="user">User</option></select></div>
            <div className="space-y-1"><Label>Created date range</Label><div className="flex gap-2"><Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} /><Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} /></div></div>
            <div className="space-y-1"><Label>Expiry date range</Label><div className="flex gap-2"><Input type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} /><Input type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} /></div></div>
          </div>

          {visiblePinnedResults.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pinned results</p>{visiblePinnedResults.map(renderResult)}</div>}

          <div className="space-y-2">{query.trim() && filteredResults.length === 0 && <p className="text-sm text-slate-500">No matches found.</p>}{filteredResults.map(renderResult)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
