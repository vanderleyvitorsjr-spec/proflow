import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() { return <div className="space-y-4"><Skeleton className="h-20 w-full" /><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /></div></div>; }
