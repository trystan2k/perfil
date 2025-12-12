import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ProfileLoadingSkeleton
 *
 * Displays a skeleton screen while profile data is loading.
 * Mimics the structure of a profile to reduce perceived load time
 * and prevent layout shift when actual content arrives.
 *
 * Accessibility: Uses aria-busy to indicate loading state and
 * aria-live="polite" for screen reader announcements when loading completes.
 */
export function ProfileLoadingSkeleton() {
  return (
    <div
      className="flex items-center justify-center min-h-main p-4"
      aria-busy="true"
      aria-live="polite"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Profile Name Skeleton */}
            <div>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Clues Section Skeleton */}
            <div>
              <Skeleton className="h-6 w-1/4 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>

            {/* Progress Bar Skeleton */}
            <div>
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
