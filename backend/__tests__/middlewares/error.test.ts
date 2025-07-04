import express, { NextFunction } from 'express';
import request from 'supertest';
import { notFound, errorHandler } from '../../src/middlewares/error';

function setupApp() {
  const app = express();
  // Route that throws an error with custom statusCode
  app.get('/error', (_req, _res, next: NextFunction) => {
    const err = new Error('Custom error');
    // @ts-ignore
    err.statusCode = 418;
    next(err);
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('notFound middleware', () => {
  it('should forward 404 error to errorHandler with path', async () => {
    const app = setupApp();
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Not Found - /unknown');
    expect(res.body).toHaveProperty('stack');
  });
});

describe('errorHandler middleware', () => {
  it('should use err.statusCode when present', async () => {
    const app = setupApp();
    const res = await request(app).get('/error');
    expect(res.status).toBe(418);
    expect(res.body).toEqual(
      expect.objectContaining({ message: 'Custom error' })
    );
  });

  it('should default to 500 for generic errors', async () => {
    const app = express();
    app.get('/error500', (_req, _res, next: NextFunction) => next(new Error('Generic')));
    app.use(notFound);
    app.use(errorHandler);
    const res = await request(app).get('/error500');
    expect(res.status).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({ message: 'Generic' })
    );
  });
});