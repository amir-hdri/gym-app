/**
 * `components/animations/Skeleton.tsx` already owns the skeleton family and is
 * what the existing pages import. Rather than ship a second, drifting
 * implementation, this module re-exports it so `@/components/ui/Skeleton` and
 * `@/components/animations/Skeleton` are the *same* component.
 *
 * Add new skeleton shapes in `components/animations/Skeleton.tsx`.
 */
export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  PageSkeleton,
} from "@/components/animations/Skeleton";
