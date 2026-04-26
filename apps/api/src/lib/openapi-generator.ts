import { Router } from 'express';

interface RouteContract {
  method: string;
  path: string;
  summary: string;
  tags: string[];
  responses: Record<number, { description: string }>;
}

const registeredContracts: RouteContract[] = [];

export function registerContract(contract: RouteContract): void {
  registeredContracts.push(contract);
}

export function generateOpenApiSpec(version = '1.0.0') {
  return {
    openapi: '3.0.3',
    info: { title: 'Chordially API', version },
    paths: registeredContracts.reduce<Record<string, unknown>>((acc, c) => {
      acc[c.path] = {
        ...((acc[c.path] as object) ?? {}),
        [c.method.toLowerCase()]: {
          summary: c.summary,
          tags: c.tags,
          responses: Object.fromEntries(
            Object.entries(c.responses).map(([code, val]) => [code, val])
          ),
        },
      };
      return acc;
    }, {}),
  };
}

export function openApiRouter(): Router {
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.json(generateOpenApiSpec());
  });

  return router;
}

// Seed a few baseline contracts so the spec is non-empty on first boot
registerContract({
  method: 'GET',
  path: '/health',
  summary: 'Liveness probe',
  tags: ['platform'],
  responses: { 200: { description: 'OK' } },
});

registerContract({
  method: 'GET',
  path: '/ready',
  summary: 'Readiness probe',
  tags: ['platform'],
  responses: { 200: { description: 'Ready' }, 503: { description: 'Not ready' } },
});
