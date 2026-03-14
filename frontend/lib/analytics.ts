/**
 * Google Analytics helper functions
 */

import { auth } from './auth';

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>,
    ) => void;
    dataLayer?: any[];
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Session ID management
const SESSION_ID_KEY = 'analytics_session_id';
const SESSION_START_KEY = 'analytics_session_start';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  const sessionStart = localStorage.getItem(SESSION_START_KEY);
  
  // Create new session if doesn't exist or session is older than 30 minutes
  if (!sessionId || !sessionStart) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  } else {
    const sessionAge = Date.now() - parseInt(sessionStart, 10);
    // Reset session if older than 30 minutes (1800000 ms)
    if (sessionAge > 1800000) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }
  }
  
  return sessionId;
}

// Helper function to send event to backend
async function sendEventToBackend(
  eventType: string,
  eventName: string,
  properties?: Record<string, any>,
) {
  try {
    const user = auth.getUser();
    const sessionId = getOrCreateSessionId();
    
    await fetch(`${API_BASE_URL}/admin/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        eventName,
        userId: user?.id || null,
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        properties: properties || null,
        sessionId: sessionId || null,
      }),
    });
  } catch (error) {
    // Silently fail - don't break the app if tracking fails
    console.error('Failed to send event to backend:', error);
  }
}

// Helper function to send behavior to backend
export async function sendBehaviorToBackend(
  behaviorType: string,
  data?: Record<string, any>,
  duration?: number,
) {
  try {
    const user = auth.getUser();
    const sessionId = getOrCreateSessionId();
    
    await fetch(`${API_BASE_URL}/admin/behaviors/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        behaviorType,
        userId: user?.id || null,
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        sessionId: sessionId || null,
        data: data || null,
        duration: duration || null,
      }),
    });
  } catch (error) {
    // Silently fail - don't break the app if tracking fails
    console.error('Failed to send behavior to backend:', error);
  }
}

/**
 * Track a page view
 */
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined') return;

  // Send to Google Analytics
  if (GA_MEASUREMENT_ID && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }

  // Send to backend as event
  sendEventToBackend('page_view', 'page_view', {
    url,
  });

  // Send to backend as behavior
  sendBehaviorToBackend('page_view', {
    url,
  });
};

/**
 * Track an event
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
) => {
  if (typeof window === 'undefined') return;

  // Send to Google Analytics
  if (GA_MEASUREMENT_ID) {
    const sendEvent = () => {
      if (window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value,
        });
      } else {
        // Retry after a short delay if gtag is not yet loaded
        setTimeout(sendEvent, 100);
      }
    };
    sendEvent();
  }

  // Send to backend
  const eventTypeMap: Record<string, string> = {
    'click': 'button_click',
    'form_submit': 'form_submit',
    'form_error': 'form_submit',
    'search': 'search',
    'file_download': 'download',
    'video_start': 'video_play',
    'video_pause': 'video_pause',
    'purchase': 'custom',
    'sign_up': 'custom',
    'login': 'custom',
    'generate_content': 'custom',
    'view_item': 'custom',
  };

  const eventType = eventTypeMap[action] || 'custom';
  sendEventToBackend(eventType, action, {
    category,
    label,
    value,
  });
};

/**
 * Track a custom event with custom parameters
 */
export const trackCustomEvent = (
  eventName: string,
  parameters?: Record<string, any>,
) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  // Wait for gtag to be available
  const sendEvent = () => {
    if (window.gtag) {
      window.gtag('event', eventName, parameters || {});
    } else {
      // Retry after a short delay if gtag is not yet loaded
      setTimeout(sendEvent, 100);
    }
  };
  
  sendEvent();
};

/**
 * Track user registration
 */
export const trackRegistration = (method: string = 'email') => {
  trackEvent('sign_up', 'engagement', method);
};

/**
 * Track user login
 */
export const trackLogin = (method: string = 'email') => {
  trackEvent('login', 'engagement', method);
};

/**
 * Track blog generation
 */
export const trackBlogGeneration = (topic: string) => {
  trackEvent('generate_content', 'blog', topic);
};

/**
 * Track blog view
 */
export const trackBlogView = (blogId: string, blogTitle: string) => {
  trackEvent('view_item', 'blog', blogTitle, undefined);
  trackCustomEvent('blog_view', {
    blog_id: blogId,
    blog_title: blogTitle,
  });
};

/**
 * Track button click
 */
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('click', 'button', buttonName, undefined);
  trackCustomEvent('button_click', {
    button_name: buttonName,
    location: location || window.location.pathname,
  });
};

/**
 * Track form submission
 */
export const trackFormSubmit = (formName: string, success: boolean = true) => {
  trackEvent(success ? 'form_submit' : 'form_error', 'form', formName);
  trackCustomEvent('form_submit', {
    form_name: formName,
    success: success,
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', 'engagement', searchTerm, resultsCount);
  trackCustomEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Track download
 */
export const trackDownload = (fileName: string, fileType?: string) => {
  trackEvent('file_download', 'engagement', fileName);
  trackCustomEvent('download', {
    file_name: fileName,
    file_type: fileType,
  });
};

/**
 * Track video play
 */
export const trackVideoPlay = (videoName: string) => {
  trackEvent('video_start', 'video', videoName);
};

/**
 * Track video pause
 */
export const trackVideoPause = (videoName: string) => {
  trackEvent('video_pause', 'video', videoName);
};

/**
 * Track purchase (for pricing/plans)
 */
export const trackPurchase = (
  planName: string,
  value: number,
  currency: string = 'USD',
) => {
  trackEvent('purchase', 'ecommerce', planName, value);
  trackCustomEvent('purchase', {
    plan_name: planName,
    value: value,
    currency: currency,
  });
};

/**
 * Track scroll depth
 */
export const trackScrollDepth = (depth: number) => {
  trackCustomEvent('scroll_depth', {
    depth: depth,
  });
  
  // Send to backend as behavior
  sendBehaviorToBackend('scroll_depth', {
    depth: depth,
  });
};

/**
 * Track time on page
 */
export const trackTimeOnPage = (timeInSeconds: number) => {
  trackCustomEvent('time_on_page', {
    time_seconds: timeInSeconds,
  });
};

