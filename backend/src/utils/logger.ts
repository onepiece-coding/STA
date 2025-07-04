import pino, { Logger, LoggerOptions, StreamEntry } from 'pino';
import { ecsFormat } from'@elastic/ecs-pino-format';
import { multistream } from "pino";

interface ExtendedLogger extends Logger {
  childWithContext(context: Record<string, any>): Logger;
}

// 1. Environment-aware configuration
const isProduction = process.env.NODE_ENV === 'production';

// 2. Redaction configuration (security critical)
const redactPaths = [
  'password',
  'token',
  '*.authorization',
  '*.accessToken',
  '*.refreshToken',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]'
];

// 3. Stream configuration
const streams:StreamEntry[] = [
  { stream: process.stdout }, // Required for Docker/K8s
  { 
    stream: pino.destination({
      dest: 'logs/combined.log',
      mkdir: true, // Auto-create logs directory
      sync: false // Asynchronous writes
    })
  }
];

if (isProduction) {
  streams.push({
    level: 'error',
    stream: pino.destination({
      dest: 'logs/error.log',
      minLength: 4096, // Buffer 4KB before writing
      sync: false
    })
  });
}

// 4. ECS customization for better Elasticsearch mapping
const ecsOptions = {
  convertReqRes: true,
  apmIntegration: Boolean(process.env.APM_SERVER_URL)
};

// 5. Logger instance
const opts: LoggerOptions = {
  ...ecsFormat(ecsOptions),
  level: process.env.LOG_LEVEL || 'info',
  redact: { paths: redactPaths, censor: '**REDACTED**', remove: isProduction },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  formatters: {
    log(obj) {
      if ((obj as any).context) {
        // merge your custom `context` field into ECS `labels`
        obj.labels = { ...(obj as any).labels, ...(obj as any).context };
        delete (obj as any).context;
      }
      return obj;
    },
  },
};

const logger = pino(opts, multistream(streams)) as ExtendedLogger;


// 6. Child logger factory for contextual logging
logger.childWithContext = (context: Record<string, any>) => logger.child({ context });

export default logger;