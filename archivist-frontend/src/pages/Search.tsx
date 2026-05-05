import { useEffect, useMemo, useState } from "react";
import { api, type Box, type Folder, type Location, type RetentionCode, type User } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, PinOff, Search as SearchIcon } from "lucide-react";

type SearchType = "folder" | "box" | "code" | "location" | "user";

interface SearchResult {
  id: string;
  type: SearchType;
  title: string;
  subtitle: string;
  locationTrail?: string;
}

const PINNED_STORAGE_KEY = "archivist_pinned_searches";

export function Search() {
  const [query, setQuery] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [codes, setCodes] = useState<RetentionCode[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedSearches, setPinnedSearches] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPinnedSearches(parsed.filter((v): v is string => typeof v === "string"));
        }
      } catch {
        localStorage.removeItem(PINNED_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedSearches));
  }, [pinnedSearches]);

  useEffect(() => {
    Promise.all([
      api.listFolders(),
      api.listBoxes(),
      api.listCodes(),
      api.listLocations(),
      api.listUsers(),
    ])
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchResult[];

    const folderResults: SearchResult[] = folders
      .filter((folder) =>
        [folder.retention_id, folder.code, folder.name].some((value) => value?.toLowerCase().includes(q)),
      )
      .map((folder) => {
        const box = folder.box_id ? boxMap.get(folder.box_id) : null;
        const location = box?.location_id ? locationMap.get(box.location_id) : null;
        const trail = `Folder ${folder.code} > Box ${box?.code ?? "Unassigned"} > ${location?.code ?? "Unassigned"}`;
        return {
          id: `folder-${folder.id}`,
          type: "folder",
          title: folder.name,
          subtitle: `ID ${folder.retention_id} • Code ${folder.code}`,
          locationTrail: trail,
        };
      });

    const boxResults: SearchResult[] = boxes
      .filter((box) => [box.code, box.name].some((value) => value?.toLowerCase().includes(q)))
      .map((box) => {
        const location = box.location_id ? locationMap.get(box.location_id) : null;
        return {
          id: `box-${box.id}`,
          type: "box",
          title: box.name || box.code,
          subtitle: `Box ${box.code}`,
          locationTrail: `Box ${box.code} > ${location?.code ?? "Unassigned"}`,
        };
      });

    const codeResults: SearchResult[] = codes
      .filter((code) => [code.code, code.name, code.code_description].some((value) => value?.toLowerCase().includes(q)))
      .map((code) => ({
        id: `code-${code.id}`,
        type: "code",
        title: code.code,
        subtitle: code.name,
      }));

    const locationResults: SearchResult[] = locations
      .filter((location) => [location.code, location.description].some((value) => value?.toLowerCase().includes(q)))
      .map((location) => ({
        id: `location-${location.id}`,
        type: "location",
        title: location.code,
        subtitle: location.description,
      }));

    const userResults: SearchResult[] = users
      .filter((user) => [user.username, user.email, user.full_name].some((value) => value?.toLowerCase().includes(q)))
      .map((user) => ({
        id: `user-${user.id}`,
        type: "user",
        title: user.full_name || user.username,
        subtitle: `${user.username} • ${user.email}`,
      }));

    return [...folderResults, ...boxResults, ...codeResults, ...locationResults, ...userResults];
  }, [query, folders, boxes, codes, locations, users, boxMap, locationMap]);

  const togglePinnedSearch = (value: string) => {
    setPinnedSearches((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [value, ...current].slice(0, 12),
    );
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Search</h1>
        <p className="text-sm text-slate-500">Search folders, boxes, codes, locations, and users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SearchIcon className="h-5 w-5" /> Global Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by folder, box, code, location, or user"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              variant={pinnedSearches.includes(query.trim()) ? "secondary" : "outline"}
              onClick={() => query.trim() && togglePinnedSearch(query.trim())}
              disabled={!query.trim()}
            >
              {pinnedSearches.includes(query.trim()) ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          </div>

          {pinnedSearches.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pinnedSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  📌 {term}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {query.trim() && results.length === 0 && <p className="text-sm text-slate-500">No matches found.</p>}
            {results.map((result) => (
              <div key={result.id} className="rounded-md border border-slate-200 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{result.title}</p>
                  <Badge variant="secondary" className="capitalize">{result.type}</Badge>
                </div>
                <p className="text-sm text-slate-600">{result.subtitle}</p>
                {result.locationTrail && <p className="mt-1 text-xs text-slate-500">{result.locationTrail}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
