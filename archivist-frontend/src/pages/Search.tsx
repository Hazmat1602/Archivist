import {ReactNode, useEffect, useMemo, useState} from "react";
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
    badges?: ReactNode | null;
    subtitle?: string | ReactNode | null;
    locationTrail?: ReactNode;
    createdDate?: string | null;
    expiryDate?: string | null;
    searchText: string;
}

const PINNED_STORAGE_KEY = "archivist_pinned_results";

function BulletPreview({ text, limit = 3 }: { text: string; limit?: number }) {
    const [expanded, setExpanded] = useState(false);
    const parts = text.split("•");
    const intro = parts[0]?.trim();
    const bullets = parts.slice(1).map((item) => item.trim()).filter(Boolean);

    if (bullets.length === 0) {
        return <p>{text}</p>;
    }

    const visibleBullets = expanded ? bullets : bullets.slice(0, limit);

    return (
        <div className="space-y-1">
            {intro && <p>{intro}</p>}

            <ul className="ml-5 list-disc space-y-0.5">
                {visibleBullets.map((item, i) => (
                    <li className="ml-5" key={i}>{item}</li>
                ))}
            </ul>

            {bullets.length > limit && (
                <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setExpanded((current) => !current)}
                >
                    {expanded ? "Show less" : `Show more`}
                </Button>
            )}
        </div>
    );
}

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
    const [draggedPinnedId, setDraggedPinnedId] = useState<string | null>(null);

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
                badges: (
                    <div className="flex gap-2" >
                        <Badge variant="secondary">
                            ID: {folder.retention_id}
                        </Badge>
                        <Badge variant="secondary">
                            Code: {folder.code}
                        </Badge>
                        <Badge variant="secondary">
                            Created: {folder.created_date}
                        </Badge>
                        <Badge variant="secondary">
                            Expiry: {folder.expiry_date}
                        </Badge>
                    </div>
                ),
                locationTrail: <Badge variant="outline"> {folder.retention_id} {'>'} {box?.code ?? "Unassigned"} {'>'} {location?.code ?? "Unassigned"} </Badge>,
                createdDate: folder.created_date,
                expiryDate: folder.expiry_date,
                searchText: [
                    folder.name,
                    folder.retention_id,
                    folder.code,
                    folder.created_date,
                    folder.expiry_date,
                    box?.code,
                    location?.code,
                ].filter(Boolean).join(" "),
            };
        });

        const boxResults: SearchResult[] = boxes.map((box) => {
            const location = box.location_id ? locationMap.get(box.location_id) : null;
            return {
                id: `box-${box.id}`,
                type: "box",
                title: box.name || box.code,
                badges: (
                    <div className="flex gap-2">
                        <Badge variant="secondary">
                            ID: {box.code}
                        </Badge>
                        <Badge variant="secondary">
                            Created: {box.created_date}
                        </Badge>
                        <Badge variant="secondary">
                            Expiry: {box.expiry_date}
                        </Badge>
                    </div>
                ),
                locationTrail: <Badge variant="outline"> {box?.code ?? "Unassigned"} {'>'} {location?.code ?? "Unassigned"} </Badge>,
                createdDate: box.created_date,
                expiryDate: box.expiry_date,
                searchText: [
                    box.name,
                    box.code,
                    box.created_date,
                    box.expiry_date,
                    location?.code,
                ].filter(Boolean).join(" "),
            };
        });

        const codeResults: SearchResult[] = codes.map((code) => ({
            id: `code-${code.id}`, 
            type: "code", 
            title: `(${code.code}) ${code.name}`,
            badges: (
                <div className="flex gap-2">
                    <Badge variant="secondary">
                        {code.period_description}
                    </Badge>
                </div>
            ),
            subtitle: code.code_description ? (
                <BulletPreview text={code.code_description} limit={3} />
            ) : null,
            searchText: [
                code.code,
                code.name,
                code.code_description,
                code.period_description,
            ].filter(Boolean).join(" "),
        }));
        
        const locationResults: SearchResult[] = locations.map((location) => ({
            id: `location-${location.id}`,
            type: "location", title: location.code,
            badges: (
                <div className="flex gap-2">
                    {location.local_storage ? <Badge variant="success">On Site</Badge> : <Badge variant="warning">Off Site</Badge> }
                </div>
            ),
            subtitle: location.description,
            searchText: [
                location.code,
                location.description,
                location.local_storage ? "On Site" : "Off Site",
            ].filter(Boolean).join(" "),
        }));
        
        const userResults: SearchResult[] = users.map((user) => ({
            id: `user-${user.id}`,
            type: "user",
            title: user.full_name || user.username,
            subtitle: `${user.username} • ${user.email}`,
            searchText: [
                user.full_name,
                user.username,
                user.email,
            ].filter(Boolean).join(" "),
        }));

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

            return result.searchText.toLowerCase().includes(q);
        });
    }, [query, allResults, pinnedResultIds, matchesFilters]);

    const visiblePinnedResults = pinnedResults;

    const togglePinnedResult = (resultId: string) => {
        setPinnedResultIds((current) =>
            current.includes(resultId)
                ? current.filter((entry) => entry !== resultId)
                : [...current, resultId].slice(-24)
        );
    };

    const movePinnedResult = (targetId: string) => {
        if (!draggedPinnedId || draggedPinnedId === targetId) return;

        setPinnedResultIds((current) => {
            const draggedIndex = current.indexOf(draggedPinnedId);
            const targetIndex = current.indexOf(targetId);

            if (draggedIndex === -1 || targetIndex === -1) return current;

            const updated = [...current];
            const [draggedItem] = updated.splice(draggedIndex, 1);
            updated.splice(targetIndex, 0, draggedItem);

            return updated;
        });

        setDraggedPinnedId(null);
    };

    const renderResult = (result: SearchResult) => {
        const isPinned = pinnedResultIds.includes(result.id);

        return (
            <div
                key={result.id}
                draggable={isPinned}
                onDragStart={() => {
                    if (isPinned) setDraggedPinnedId(result.id);
                }}
                onDragOver={(e) => {
                    if (isPinned) e.preventDefault();
                }}
                onDrop={() => {
                    if (isPinned) movePinnedResult(result.id);
                }}
                onDragEnd={() => setDraggedPinnedId(null)}
                className={[
                    "rounded-md border p-3 transition",
                    isPinned ? "cursor-grab active:cursor-grabbing" : "",
                    draggedPinnedId === result.id ? "opacity-50" : "",
                    isPinned
                        ? "border-amber-300 bg-amber-50 shadow-sm ring-1 ring-amber-200"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
            >
                <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                            {result.title}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                            {result.type}
                        </Badge>

                        <Button
                            variant={isPinned ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => togglePinnedResult(result.id)}
                        >
                            {isPinned ? (
                                <PinOff className="h-4 w-4" />
                            ) : (
                                <Pin className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {result.badges && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {result.badges}
                    </div>
                )}

                {result.subtitle && (
                    <div className="text-sm text-slate-600 text-justify">
                        {result.subtitle}
                    </div>
                )}

                {result.locationTrail && (
                    <div className="mt-2">
                        {result.locationTrail}
                    </div>
                )}
            </div>
        );
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