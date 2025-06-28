import { before, describe, it } from 'node:test';
import assert, { equal } from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { SpanStatusCode, type Tracer } from '@opentelemetry/api';
import { hrTimeToMilliseconds, hrTimeToNanoseconds } from '@opentelemetry/core';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { deepEqual, notDeepEqual } from 'node:assert';
import { getLogger, getMeter, getTracer, observeDuration, recordErrorToSpan } from '../src/utils.mjs';
import { Logger } from '../src/logger.mjs';

await describe('utils', async function () {
    await describe('observeDuration', async function () {
        await it('should work with sync functions', async function () {
            const func = (): void => {
                /* Do nothing */
            };

            const duration = await observeDuration(func);
            const actual = hrTimeToNanoseconds(duration);
            equal(actual > 0, true);
        });

        await it('should work with async functions', async function () {
            const timeout = 10;
            const func = (): Promise<void> => setTimeout(timeout);
            const duration = await observeDuration(func);
            const actual = hrTimeToMilliseconds(duration);
            equal(actual >= timeout - 2, true);
        });
    });

    await describe('recordErrorToSpan', async function () {
        let provider: BasicTracerProvider;
        let tracer: Tracer;

        before(function () {
            provider = new BasicTracerProvider();
            tracer = provider.getTracer('test');
        });

        await it('should convert non-errors to Error', function () {
            const expectedMessage = 'message';
            let err: unknown;
            const span = tracer.startActiveSpan('span', (span) => {
                try {
                    err = recordErrorToSpan(expectedMessage, span);
                    return span;
                } finally {
                    span.end();
                }
            });

            assert(typeof err === 'object');
            equal(err instanceof Error, true);
            equal((err as Error).message, expectedMessage);

            const spn = span as unknown as Record<string, unknown>;
            equal(typeof spn, 'object');
            equal(typeof spn['status'], 'object');
            equal((spn['status'] as Record<string, unknown>)['code'], SpanStatusCode.ERROR);

            equal(Array.isArray(spn['events']), true);
            equal((spn['events'] as unknown[]).length, 1);
            const event = (spn['events'] as unknown[])[0] as Record<string, unknown>;
            equal(typeof event, 'object');
            equal(event['name'], 'exception');
            equal(typeof event['attributes'], 'object');
            equal((event['attributes'] as Record<string, unknown>)['exception.type'], 'Error');
            equal((event['attributes'] as Record<string, unknown>)['exception.message'], expectedMessage);
        });

        await it('should record errors', function () {
            const error = new TypeError('message');
            let err: unknown;
            const span = tracer.startActiveSpan('span', (span) => {
                try {
                    err = recordErrorToSpan(error, span);
                    return span;
                } finally {
                    span.end();
                }
            });

            assert(typeof err === 'object');
            equal(err instanceof TypeError, true);
            equal((err as Error).message, error.message);

            const spn = span as unknown as Record<string, unknown>;
            equal(typeof spn, 'object');
            equal(typeof spn['status'], 'object');
            equal((spn['status'] as Record<string, unknown>)['code'], SpanStatusCode.ERROR);

            equal(Array.isArray(spn['events']), true);
            equal((spn['events'] as unknown[]).length, 1);
            const event = (spn['events'] as unknown[])[0] as Record<string, unknown>;
            equal(typeof event, 'object');
            equal(event['name'], 'exception');
            equal(typeof event['attributes'], 'object');
            equal((event['attributes'] as Record<string, unknown>)['exception.type'], error.name);
            equal((event['attributes'] as Record<string, unknown>)['exception.message'], error.message);
            equal((event['attributes'] as Record<string, unknown>)['exception.stacktrace'], error.stack);
        });
    });

    await it('should return a Tracer', function () {
        const tracer = getTracer('test');
        equal(typeof tracer, 'object');
        equal(typeof tracer.startActiveSpan, 'function');
    });

    await it('should return a Meter', function () {
        const meter = getMeter();
        equal(typeof meter, 'object');
        equal(typeof meter.createCounter, 'function');
    });

    await it('should return a Logger', function () {
        const logger = getLogger('test');
        equal(typeof logger, 'object');
        equal(logger instanceof Logger, true);
    });

    await it('should return the same logger for the same name', function () {
        const name = 'test';
        deepEqual(getLogger(name), getLogger(name));
    });

    await it('should return different loggers for different names', function () {
        notDeepEqual(getLogger('test1'), getLogger('test'));
    });

    await it('should fall back to OTEL_SERVICE_NAME', function (t) {
        const serviceName = 'test';
        process.env['OTEL_SERVICE_NAME'] = serviceName;
        process.env['npm_package_name'] = serviceName + serviceName;
        const instance = getLogger().logger as unknown;
        if (
            instance &&
            typeof instance === 'object' &&
            'instrumentationScope' in instance &&
            typeof instance.instrumentationScope === 'object' &&
            instance.instrumentationScope &&
            'name' in instance.instrumentationScope
        ) {
            equal(instance.instrumentationScope.name, serviceName);
        } else {
            t.skip();
        }
    });

    await it('should fall back to npm_package_name', function (t) {
        const serviceName = 'supertest';
        process.env['npm_package_name'] = serviceName;
        const instance = getLogger().logger as unknown;
        if (
            instance &&
            typeof instance === 'object' &&
            'instrumentationScope' in instance &&
            typeof instance.instrumentationScope === 'object' &&
            instance.instrumentationScope &&
            'name' in instance.instrumentationScope
        ) {
            equal(instance.instrumentationScope.name, serviceName);
        } else {
            t.skip();
        }
    });
});
