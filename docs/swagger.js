import swaggerJsdoc from 'swagger-jsdoc';

import { categorySchemas } from './schemas/category.schema.js';
import { commonSchemas } from './schemas/common.schema.js';
import { swaggerTags } from './tags.js';
// import { customerSchemas } from './schemas/customer.schema.js';
// import { menuSchemas } from './schemas/menu.schema.js';
// import { orderSchemas } from './schemas/order.schema.js';
// import { orderItemSchemas } from './schemas/orderItem.schema.js';
// import { inventorySchemas } from './schemas/inventory.schema.js';
// import { feedbackSchemas } from './schemas/feedback.schema.js';
// import { profileSchemas } from './schemas/profile.schema.js';
// import { billingSchemas } from './schemas/billing.schema.js';
// import { tableSchemas } from './schemas/table.schema.js';

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Cafe Backend API',
      version: '1.0.0',
      description: 'API documentation for cafe SaaS backend',
    },
    servers: [
      {
        url: 'http://localhost:7000/api',
        description: 'Local Development Server',
      },
      {
        url: 'https://cafestaging.strandixsystem.com/api',
        description: 'Staging Development Server',
      },
      {
        url: 'https://cafe.strandixsystem.com/api',
        description: 'Production Server',
      },
    ],
    tags: swaggerTags,
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ...commonSchemas,
        ...categorySchemas,
        // ...customerSchemas,
        // ...menuSchemas,
        // ...orderSchemas,
        // ...orderItemSchemas,
        // ...inventorySchemas,
        // ...feedbackSchemas,
        // ...profileSchemas,
        // ...billingSchemas,
        // ...tableSchemas,
      },
    },
  },
  apis: ['./routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
