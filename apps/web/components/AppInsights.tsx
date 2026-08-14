"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CONNECTION_STRING =
  process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;

// Minimal type for the global the App Insights snippet installs.
declare global {
  interface Window {
    appInsights?: {
      trackPageView: (opts?: { name?: string; uri?: string }) => void;
    };
  }
}

/**
 * Loads Azure Application Insights (JS SDK) via the official CDN snippet and
 * tracks a page view on every client-side route change.
 *
 * No-ops unless NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING is set, so local dev
 * and preview builds stay clean.
 */
export default function AppInsights() {
  const pathname = usePathname();

  // The snippet auto-tracks the first page load. This fires on every
  // subsequent App Router navigation (SPA transitions the SDK can't see).
  useEffect(() => {
    if (!CONNECTION_STRING) return;
    window.appInsights?.trackPageView({ uri: pathname });
  }, [pathname]);

  if (!CONNECTION_STRING) return null;

  return (
    <Script id="app-insights" strategy="afterInteractive">
      {`
        !(function (cfg){function e(){cfg.onInit&&cfg.onInit(n)}var x,w,D,t,E,n,C=window,O=document,b=C.location,q="script",I="ingestionendpoint",L="disableExceptionTracking",j="ai.device.";"instrumentationKey"[x="toLowerCase"]();var s="crossOrigin",R="POST",p="appInsightsSDK",u=cfg.name||"appInsights";(cfg.name||C[p])&&(C[p]=u);var g=C[u]||function(l){var i=!1,d=!1,g={initialize:!0,queue:[],sv:"8",version:2,config:l};function m(e,t){var n={},a="Browser";function s(e){e=""+e;return 1===e.length?"0"+e:e}return n[j+"id"]=a[x](),n[j+"type"]=a,n["ai.operation.name"]=b&&b.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(g.sv||g.version),{time:function(){var e=new Date;function t(e){var t=""+e;return 1===t.length&&(t="0"+t),t}return e.getUTCFullYear()+"-"+t(1+e.getUTCMonth())+"-"+t(e.getUTCDate())+"T"+t(e.getUTCHours())+":"+t(e.getUTCMinutes())+":"+t(e.getUTCSeconds())+"."+((e.getUTCMilliseconds()/1e3).toFixed(3)+"").slice(2,5)+"Z"}(),iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}},ver:undefined,seq:"1",aiDataContract:undefined}}var h=-1,v=0,y=["js.monitor.azure.com","js.cdn.applicationinsights.io","js.cdn.monitor.azure.com","js0.cdn.applicationinsights.io","js0.cdn.monitor.azure.com","js2.cdn.applicationinsights.io","js2.cdn.monitor.azure.com","az416426.vo.msecnd.net"],k=l.url||cfg.src;if(k){if((E=navigator)&&(~(E=(E.userAgent||"").toLowerCase()).indexOf("msie")||~E.indexOf("trident/"))&&~k.indexOf("ai.3")&&(k=k.replace(/(\\/)(ai\\.3\\.)([^\\d]*)$/,function(e,t,n){return t+"ai.2"+n})),!1!==cfg.cr)for(var b=0;b<y.length;b++)if(k.indexOf("/scripts/")>0){k=k.replace("/scripts/","/next/");break}function e(e){var n,t,a,s,c,u,l,f,p,m,g;i=!0,r.queue=[],d||(d=!0,s=k,c=(navigator||{}).userAgent||"",p=(a=(t=O.getElementsByTagName(q)[0]).src)&&a.substring(0,a.lastIndexOf("/")+1),f=(l=/(www[0-9]?\\.)?(bat|jsdelivr)/gi.test(c),u=/(www[0-9]?\\.)?(msn|live|bing)/gi.test(c),!(l||u)),m=function(e){var t=O.createElement(q);return t.src=e,f&&t.setAttribute(s,"anonymous"),n=t,t},g=function(e){for(var t,n=0;n<y.length;n++)if((t=m(("https:"===b.protocol?"https:":"http:")+"//"+y[n]+"/scripts/b/ai."+(e||"3")+".min.js")).readyState||(t.onload=function(){cfg.onInit&&cfg.onInit(r)}),c=t,f&&c.setAttribute(s,"anonymous"),(t=O.getElementsByTagName(q)[0]).parentNode.insertBefore(c,t),c)return c},h=m(s),g())}!1!==cfg.ld&&cfg.ld>=0?setTimeout(function(){e(cfg.ld)},cfg.ld):e(0)}try{r.cookie=O.cookie}catch(e){}function r(){}function o(e){for(;e.length;)!function(t){r[t]=function(){var e=arguments;i||r.queue.push(function(){r[t].apply(r,e)})}}(e.pop())}var f="track",c="TrackPage",v="TrackEvent";o([f+"Event",f+"PageView",f+"Exception",f+"Trace",f+"DependencyData",f+"Metric",f+"PageViewPerformance","start"+c,"stop"+c,"start"+v,"stop"+v,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),r.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4};var s=(l.extensionConfig||{}).ApplicationInsightsAnalytics||{};if(!0!==l[L]&&!0!==s[L]){var p="onerror";o(["_"+p]);var m=C[p];C[p]=function(e,t,n,a,s){var i=m&&m(e,t,n,a,s);return!0!==i&&r["_"+p]({message:e,url:t,lineNumber:n,columnNumber:a,error:s,evt:C.event}),i},l.autoExceptionInstrumented=!0}return r}(cfg.cfg);(C[u]=g).queue&&0===g.queue.length?(g.pollInternalLogs&&g.pollInternalLogs(),n=g,e()):setTimeout(function(){n=g,e()},1e3)})({
          src: "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
          cfg: {
            connectionString: "${CONNECTION_STRING}",
            enableAutoRouteTracking: false
          }
        });
      `}
    </Script>
  );
}
