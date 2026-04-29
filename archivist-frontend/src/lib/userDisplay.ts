import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";

function formatUser(user: User): string {
  return user.full_name?.trim() ? `${user.full_name} (${user.username})` : user.username;
}

export function useUserDisplayMap() {
  const [userMap, setUserMap] = useState<Record<number, string>>({});

  useEffect(() => {
    api.listUsers(0, 1000)
      .then((users) => {
        const entries = users.map((user) => [user.id, formatUser(user)] as const);
        setUserMap(Object.fromEntries(entries));
      })
      .catch(() => {
        setUserMap({});
      });
  }, []);

  const getUserLabel = (userId: number | null | undefined, fallbackPrefix = "User") => {
    if (userId == null) return null;
    return userMap[userId] ?? `${fallbackPrefix} #${userId}`;
  };

  return { userMap, getUserLabel };
}
