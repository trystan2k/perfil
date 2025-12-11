import { useEffect, useState } from 'react';

/**
 * useMediaQuery: Hook to check if a media query matches
 * @param query - Media query string (e.g., '(max-width: 767px)')
 * @returns boolean - Whether the media query matches
 *
 * Example:
 * const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
 * const isDesktop = useMediaQuery(MEDIA_QUERIES.desktop);
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch on server
  // This will be updated immediately in useEffect
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Set initial state with actual media query value
    // This happens immediately after mount, before render
    setMatches(mediaQueryList.matches);

    // Create event listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener (modern API)
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  // Return the current matches value
  // During hydration, this is false
  // After effect runs (synchronously), this is updated to true/false based on viewport
  return matches;
}
