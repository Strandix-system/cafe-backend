import fs from 'fs';
import path from 'path';

import swaggerAutogen from 'swagger-autogen';

import { swaggerAutogenModels } from './swagger-autogen.models.js';
import { swaggerTags } from './tags.js';

const swaggerAutogenRunner = swaggerAutogen({
  openapi: '3.0.0',
});

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'Aeternis Backend API',
    version: '1.0.0',
    description: 'API documentation for Aeternis SaaS backend',
  },
  servers: [
    {
      url: 'http://localhost:7000',
      description: 'Local Development Server',
    },
    {
      url: 'https://cafestaging.strandixsystem.com',
      description: 'Staging Development Server',
    },
    {
      url: 'https://cafe.strandixsystem.com',
      description: 'Production Server',
    },
  ],
  tags: swaggerTags,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ...swaggerAutogenModels,
    },
  },
};

const outputFile = './docs/swagger-output.json';
const routesDir = path.join(process.cwd(), 'routes');

function getRouteFiles(dir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return getRouteFiles(fullPath);
    if (!entry.isFile()) return [];
    if (!entry.name.endsWith('.js')) return [];
    return [
      `./${path.relative(process.cwd(), fullPath).replaceAll('\\', '/')}`,
    ];
  });
}

const endpointsFiles = ['./app.js', ...getRouteFiles(routesDir)];

await swaggerAutogenRunner(outputFile, endpointsFiles, doc);

// Group endpoints in Swagger UI by tags (folders) without requiring per-route annotations.
const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

const tagByPrefix = [
  ['/', 'Health'],
  ['/api/razorpay-webhook', 'Webhook'],
  ['/api/auth', 'Auth'],
  ['/api/admin', 'Admin'],
  ['/api/category', 'Category'],
  ['/api/customer', 'Customer'],
  ['/api/menu', 'Menu'],
  ['/api/layout', 'Layout'],
  ['/api/profile', 'Profile'],
  ['/api/order', 'Order'],
  ['/api/qr', 'QR'],
  ['/api/signup', 'Signup'],
  ['/api/demo', 'Demo'],
  ['/api/issue-reported', 'Issue Reported'],
  ['/api/portfolio', 'Portfolio'],
  ['/api/notification', 'Notification'],
  ['/api/get-states', 'States'],
];

function pickTag(pathname) {
  for (const [prefix, tag] of tagByPrefix) {
    if (prefix === '/' && pathname === '/') return tag;
    if (prefix !== '/' && pathname.startsWith(prefix)) return tag;
  }
  return 'default';
}

const requestBodySchemaByOperation = new Map([
  ['POST /api/auth/login', '#/components/schemas/LoginRequest'],
  [
    'POST /api/auth/forgot-password',
    '#/components/schemas/ForgotPasswordRequest',
  ],
  [
    'POST /api/auth/reset-password/{token}',
    '#/components/schemas/ResetPasswordRequest',
  ],
  [
    'POST /api/auth/change-password',
    '#/components/schemas/ChangePasswordRequest',
  ],
  ['POST /api/category/create', '#/components/schemas/CreateCategoryRequest'],
  [
    'PATCH /api/category/update/{categoryId}',
    '#/components/schemas/UpdateCategoryRequest',
  ],
]);

for (const [pathname, methods] of Object.entries(spec.paths ?? {})) {
  for (const [method, op] of Object.entries(methods ?? {})) {
    if (!op || typeof op !== 'object') continue;
    if (!op.tags || !op.tags.length) op.tags = [pickTag(pathname)];

    // Hide infra headers coming from middleware (keeps Swagger UI clean).
    if (Array.isArray(op.parameters)) {
      op.parameters = op.parameters.filter(
        (p) =>
          !(
            p &&
            typeof p === 'object' &&
            p.in === 'header' &&
            String(p.name).toLowerCase() === 'x-forwarded-proto'
          ),
      );
    }

    // Mark endpoints as secured only when they actually accept Authorization header.
    const hasAuthorizationHeader = Array.isArray(op.parameters)
      ? op.parameters.some(
          (p) =>
            p &&
            typeof p === 'object' &&
            p.in === 'header' &&
            String(p.name).toLowerCase() === 'authorization',
        )
      : false;
    if (hasAuthorizationHeader) op.security = [{ bearerAuth: [] }];

    // Add request bodies for key endpoints without touching route files.
    const operationKey = `${method.toUpperCase()} ${pathname}`;
    const schemaRef = requestBodySchemaByOperation.get(operationKey);
    if (schemaRef && !op.requestBody) {
      op.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: schemaRef,
            },
          },
        },
      };
    }

    methods[method] = op;
  }
  spec.paths[pathname] = methods;
}

fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
