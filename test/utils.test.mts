import { setTimeout } from 'node:timers/promises';
import { expect } from 'chai';
import { SpanStatusCode, type Tracer } from '@opentelemetry/api';
import { hrTimeToMilliseconds, hrTimeToNanoseconds } from '@opentelemetry/core';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { observeDuration, recordErrorToSpan } from '../src/utils.mjs';

describe('utils', function () {
    describe('observeDuration', function () {
        it('should work with sync functions', async function () {
            const func = (): void => {
                /* Do nothing */
            };

            const duration = await observeDuration(func);
            const actual = hrTimeToNanoseconds(duration);
            expect(actual).to.be.greaterThan(0);
        });

        it('should work with async functions', async function () {
            const timeout = 10;
            const func = (): Promise<void> => setTimeout(timeout);
            const duration = await observeDuration(func);
            const actual = hrTimeToMilliseconds(duration);
            expect(actual).to.be.greaterThanOrEqual(timeout - 2);
        });
    });

    describe('recordErrorToSpan', function () {
        let provider: BasicTracerProvider;
        let tracer: Tracer;

        before(function () {
            provider = new BasicTracerProvider();
            tracer = provider.getTracer('test');
        });

        it('should convert non-errors to Error', function () {
            const expectedMessage = 'message';
            let err;
            const span = tracer.startActiveSpan('span', (span) => {
                try {
                    err = recordErrorToSpan(expectedMessage, span);
                    return span;
                } finally {
                    span.end();
                }
            });

            expect(err).to.be.instanceOf(Error).and.have.property('message', expectedMessage);
            expect(span).to.be.an('object').that.has.property('status').that.has.property('code', SpanStatusCode.ERROR);
            expect(span)
                .to.have.property('events')
                .that.has.lengthOf(1)
                .and.containSubset({
                    0: {
                        name: 'exception',
                        attributes: {
                            'exception.type': 'Error',
                            'exception.message': expectedMessage,
                        },
                    },
                });
        });

        it('should record errors', function () {
            const error = new TypeError('message');
            let err;
            const span = tracer.startActiveSpan('span', (span) => {
                try {
                    err = recordErrorToSpan(error, span);
                    return span;
                } finally {
                    span.end();
                }
            });

            expect(err).to.be.instanceOf(TypeError).and.have.property('message', error.message);
            expect(span).to.be.an('object').that.has.property('status').that.has.property('code', SpanStatusCode.ERROR);
            expect(span)
                .to.have.property('events')
                .that.has.lengthOf(1)
                .and.containSubset({
                    0: {
                        name: 'exception',
                        attributes: {
                            'exception.type': error.name,
                            'exception.message': error.message,
                            'exception.stacktrace': error.stack,
                        },
                    },
                });
        });
    });
});
