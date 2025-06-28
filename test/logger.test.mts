import assert, { equal } from 'node:assert/strict';
import { type Mock, afterEach, before, describe, it, mock } from 'node:test';
import type { Context } from '@opentelemetry/api';
import { SeverityNumber, logs } from '@opentelemetry/api-logs';
import { type LogRecord, LogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { Logger } from '../src/logger.mjs';

let onEmitMock: Mock<LogRecordProcessor['onEmit']>;

class TestLogRecordProcessor implements LogRecordProcessor {
    public forceFlush(): Promise<void> {
        return Promise.resolve();
    }

    public onEmit(logRecord: LogRecord, context: Context): void {
        onEmitMock(logRecord, context);
    }

    public shutdown(): Promise<void> {
        return Promise.resolve();
    }
}

await describe('Logger', async function () {
    let logger: Logger;

    before(function () {
        onEmitMock = mock.fn();

        const loggerProvider = new LoggerProvider({
            processors: [new TestLogRecordProcessor()],
        });
        logs.setGlobalLoggerProvider(loggerProvider);

        logger = new Logger(loggerProvider.getLogger('test'));
    });

    afterEach(function () {
        onEmitMock.mock.resetCalls();
        mock.reset();
    });

    await describe('#log', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.UNSPECIFIED;
            logger.log(expectedMessage, expectedSeverity);

            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, '');
        });
    });

    await describe('#trace', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.TRACE;
            logger.trace(expectedMessage);
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, 'TRACE');
        });
    });

    await describe('#debug', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.DEBUG;
            logger.debug(expectedMessage);
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, 'DEBUG');
        });
    });

    await describe('#info', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.INFO;
            logger.info(expectedMessage);
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, 'INFO');
        });
    });

    await describe('#warning', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.WARN;
            logger.warning(expectedMessage);
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, 'WARN');
        });
    });

    await describe('#error', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.ERROR;
            logger.error(expectedMessage);
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, 'ERROR');
        });
    });

    await describe('#fatal', async function () {
        await it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.FATAL;
            logger.fatal(expectedMessage);
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].body, expectedMessage);
            equal(onEmitMock.mock.calls[0].arguments[0].severityNumber, expectedSeverity);
            equal(onEmitMock.mock.calls[0].arguments[0].severityText, 'FATAL');
        });
    });

    await describe('#setAttribute', async function () {
        await it('should set an attribute', function () {
            const attribute = 'foo';
            const value = 'bar';
            logger.setAttribute(attribute, value);
            logger.debug('Test');
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(typeof onEmitMock.mock.calls[0].arguments[0].attributes, 'object');
            equal(onEmitMock.mock.calls[0].arguments[0].attributes[attribute], value);
        });
    });

    await describe('#clearAttributes', async function () {
        await it('should clear all attributes', function () {
            logger.setAttribute('foo', 'bar');
            logger.setAttribute('baz', 'qux');
            logger.clearAttributes();
            logger.debug('Test');
            equal(onEmitMock.mock.callCount(), 1);
            assert(Array.isArray(onEmitMock.mock.calls));
            assert(onEmitMock.mock.calls[0] !== undefined);
            assert(Array.isArray(onEmitMock.mock.calls[0].arguments));
            equal(typeof onEmitMock.mock.calls[0].arguments[0], 'object');
            equal(typeof onEmitMock.mock.calls[0].arguments[0].attributes, 'object');
            equal(Object.keys(onEmitMock.mock.calls[0].arguments[0].attributes).length, 0);
        });
    });
});
