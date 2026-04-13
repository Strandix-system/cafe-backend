export function getSwaggerUiOptions() {
  return {
    explorer: true,
    customSiteTitle: "Aeternis API's Docs",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      onComplete: () => {
        try {
          const token = globalThis.localStorage?.getItem('swagger_jwt');
          if (!token) return;
          globalThis.window?.ui?.preauthorizeApiKey?.('bearerAuth', token);
        } catch {
          // ignore
        }
      },
      responseInterceptor: (res) => {
        try {
          const url = res?.url || res?.config?.url || '';
          const isLogin =
            typeof url === 'string' && url.includes('/api/auth/login');
          const ok = res?.status >= 200 && res?.status < 300;
          if (!isLogin || !ok) return res;

          const raw =
            res?.data ??
            res?.body ??
            res?.text ??
            (typeof res === 'string' ? res : undefined);
          if (!raw) return res;

          const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const token =
            payload?.result?.token ??
            payload?.token ??
            payload?.result?.accessToken ??
            payload?.accessToken;
          if (!token || typeof token !== 'string') return res;

          const rawToken = token.replace(/^Bearer\\s+/i, '').trim();
          if (!rawToken) return res;

          // Store ONLY the raw JWT. Swagger UI adds "Bearer " automatically for http bearer auth.
          globalThis.localStorage?.setItem('swagger_jwt', rawToken);
          globalThis.window?.ui?.preauthorizeApiKey?.('bearerAuth', rawToken);
        } catch {
          // ignore
        }
        return res;
      },
    },
  };
}
