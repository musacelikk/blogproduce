'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useRef } from 'react';
import { trackPageView, sendBehaviorToBackend } from '@/lib/analytics';
import { auth } from '@/lib/auth';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function GoogleAnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageStartTime = useRef<number>(Date.now());
  const sessionTracked = useRef<boolean>(false);

  useEffect(() => {
    // Track session start on first page load
    if (!sessionTracked.current && typeof window !== 'undefined') {
      sessionTracked.current = true;
      sendBehaviorToBackend('session_start', {
        url: window.location.pathname,
      });
    }

    // Track page view
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
    
    // Reset page start time
    pageStartTime.current = Date.now();

    // Track time on page when leaving
    return () => {
      const timeOnPage = Math.floor((Date.now() - pageStartTime.current) / 1000);
      if (timeOnPage > 0) {
        sendBehaviorToBackend('time_on_page', {
          url: pathname,
          time_seconds: timeOnPage,
        }, timeOnPage * 1000);
      }
    };
  }, [pathname, searchParams]);

  // Track session end on page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - pageStartTime.current) / 1000);
      if (timeOnPage > 0) {
        // Use sendBeacon for reliable tracking on page unload
        const user = auth.getUser();
        const sessionId = localStorage.getItem('analytics_session_id');
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        const data = JSON.stringify({
          behaviorType: 'session_end',
          userId: user?.id || null,
          page: window.location.pathname,
          sessionId: sessionId || null,
          data: {
            time_seconds: timeOnPage,
          },
          duration: timeOnPage * 1000,
        });

        navigator.sendBeacon(`${API_BASE_URL}/admin/behaviors/track`, data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsContent />
    </Suspense>
  );
}

