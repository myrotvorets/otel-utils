import { type Mock, mock } from 'node:test';
import { expect } from 'chai';
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

describe('Logger', function () {
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

    describe('#log', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.UNSPECIFIED;
            logger.log(expectedMessage, expectedSeverity);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: '',
            });
        });
    });

    describe('#trace', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.TRACE;
            logger.trace(expectedMessage);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: 'TRACE',
            });
        });
    });

    describe('#debug', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.DEBUG;
            logger.debug(expectedMessage);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: 'DEBUG',
            });
        });
    });

    describe('#info', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.INFO;
            logger.info(expectedMessage);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: 'INFO',
            });
        });
    });

    describe('#warning', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.WARN;
            logger.warning(expectedMessage);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: 'WARN',
            });
        });
    });

    describe('#error', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.ERROR;
            logger.error(expectedMessage);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: 'ERROR',
            });
        });
    });

    describe('#fatal', function () {
        it('should log a message', function () {
            const expectedMessage = "I've got a message to say";
            const expectedSeverity = SeverityNumber.FATAL;
            logger.fatal(expectedMessage);

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.includes({
                body: expectedMessage,
                severityNumber: expectedSeverity,
                severityText: 'FATAL',
            });
        });
    });

    describe('#setAttribute', function () {
        it('should set an attribute', function () {
            const attribute = 'foo';
            const value = 'bar';
            logger.setAttribute(attribute, value);
            logger.debug('Test');

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0])
                .to.be.an('object')
                .that.deep.includes({
                    attributes: {
                        [attribute]: value,
                    },
                });
        });
    });

    describe('#clearAttributes', function () {
        it('should clear all attributes', function () {
            logger.setAttribute('foo', 'bar');
            logger.setAttribute('baz', 'qux');
            logger.clearAttributes();
            logger.debug('Test');

            expect(onEmitMock.mock.callCount()).to.equal(1);
            expect(onEmitMock.mock.calls[0]!.arguments[0]).to.be.an('object').that.deep.includes({
                attributes: {},
            });
        });
    });
});
