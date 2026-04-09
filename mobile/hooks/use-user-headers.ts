import { useMemo } from "react";
import { useUser } from "@clerk/clerk-expo";

export function useUserHeaders(): Record<string, string> {
  const { user } = useUser();

  return useMemo(() => {
    const headers: Record<string, string> = {};
    if (user?.id) headers["x-clerk-user-id"] = user.id;
    if (user?.fullName) headers["x-user-name"] = user.fullName;
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) headers["x-user-email"] = email;
    if (user?.imageUrl) headers["x-user-image"] = user.imageUrl;
    return headers;
  }, [user]);
}