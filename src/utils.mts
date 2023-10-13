import {
    type HrTime,
    type Meter,
    type MeterOptions,
    type Span,
    SpanStatusCode,
    type Tracer,
    metrics,
    trace,
} from '@opentelemetry/api';
import { type LoggerOptions, logs } from '@opentelemetry/api-logs';
import { hrTime, hrTimeDuration } from '@opentelemetry/core';
import { Logger } from './logger.mjs';

export function recordErrorToSpan(e: unknown, span: Span): Error {
    let err: Error;
    if (!(e instanceof Error)) {
        err = new Error(e?.toString());
    } else {
        err = e;
    }

    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR });
    return err;
}

export async function observeDuration<TArgs extends unknown[]>(
    what: (...args: TArgs) => void | Promise<void>,
    ...args: TArgs
): Promise<HrTime> {
    const start = hrTime();
    await what(...args);
    const end = hrTime();
    return hrTimeDuration(start, end);
}

function guessServiceName(): string {
    return process.env['OTEL_SERVICE_NAME'] ?? process.env['npm_package_name'] ?? 'service';
}

const loggers: Record<string, Logger> = {};

export function tracer(name?: string, version?: string): Tracer {
    return trace.getTracer(name ?? guessServiceName(), version);
}

export function meter(name?: string, version?: string, options?: MeterOptions): Meter {
    return metrics.getMeter(name ?? guessServiceName(), version, options);
}

export function logger(name?: string, version?: string, options?: LoggerOptions): Logger {
    const n = name ?? guessServiceName();
    let logger = loggers[n];
    if (!logger) {
        logger = new Logger(logs.getLogger(n, version, options));
        loggers[n] = logger;
    }

    return logger;
}
