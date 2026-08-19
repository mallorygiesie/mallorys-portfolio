"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { ApplicationInsights } from "@microsoft/applicationinsights-web";

const CONNECTION_STRING =
  process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;

/**
 * Loads Azure Application Insights (JS SDK) and tracks a page view on every
 * client-side route change.
 *
 * Uses the npm SDK rather than the CDN loader snippet: the snippet is a single
 * minified line that has to be embedded in a JS template literal, where its
 * regex backslashes need hand-double-escaping. Getting that wrong silently
 * corrupts the blob, which is how it previously ended up calling
 * `setAttribute(<script url>, "anonymous")` and throwing on every page load.
 *
 * No-ops unless NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING is set, so local dev
 * and preview builds stay clean.
 */
export default function AppInsights() {
  const pathname = usePathname();
  const sdk = useRef<ApplicationInsights | null>(null);

  // Imported dynamically so the SDK stays out of the initial bundle and never
  // runs during the static export build.
  useEffect(() => {
    if (!CONNECTION_STRING) return;

    let cancelled = false;
    import("@microsoft/applicationinsights-web").then(
      ({ ApplicationInsights }) => {
        if (cancelled) return;
        const instance = new ApplicationInsights({
          config: {
            connectionString: CONNECTION_STRING,
            // We track transitions ourselves in the effect below; the SDK's
            // own route tracking double-counts App Router navigations.
            enableAutoRouteTracking: false,
          },
        });
        instance.loadAppInsights();
        sdk.current = instance;
        instance.trackPageView({ uri: window.location.pathname });
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // Fires on every App Router navigation after the first load. Skipped until
  // the SDK finishes loading, which is when the initial page view is sent.
  useEffect(() => {
    sdk.current?.trackPageView({ uri: pathname });
  }, [pathname]);

  return null;
}
