import type { Instrumentation } from 'next';

/**
 * Server errors (pages, route handlers, server actions) go to PostHog error tracking.
 * Next.js calls this only for errors nothing caught: a route handler that catches its own
 * error and returns a 500 (or just logs it) is not reported here.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return;

  // posthog-node is Node only, so it is loaded here rather than at the top of the file.
  const { captureServerException } = await import('@/lib/posthogServer');
  await captureServerException(error, {
    // Without the query string: links like the newsletter unsubscribe carry an email.
    path: request.path.split('?')[0],
    method: request.method,
    route: context.routePath,
    route_type: context.routeType,
    render_source: context.renderSource,
    // Matches the digest the browser's error page reports for the same error.
    digest: (error as { digest?: string } | null)?.digest,
  });
};
