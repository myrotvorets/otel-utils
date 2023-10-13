import { LogAttributeValue, LogAttributes, type Logger as OtelLogger, SeverityNumber } from '@opentelemetry/api-logs';

export class Logger {
    private readonly _logger: OtelLogger;
    private _attributes: LogAttributes;

    private static readonly severityMap: Record<SeverityNumber, string> = {
        [SeverityNumber.UNSPECIFIED]: '',
        [SeverityNumber.TRACE]: 'TRACE',
        [SeverityNumber.TRACE2]: 'TRACE',
        [SeverityNumber.TRACE3]: 'TRACE',
        [SeverityNumber.TRACE4]: 'TRACE',
        [SeverityNumber.DEBUG]: 'DEBUG',
        [SeverityNumber.DEBUG2]: 'DEBUG',
        [SeverityNumber.DEBUG3]: 'DEBUG',
        [SeverityNumber.DEBUG4]: 'DEBUG',
        [SeverityNumber.INFO]: 'INFO',
        [SeverityNumber.INFO2]: 'INFO',
        [SeverityNumber.INFO3]: 'INFO',
        [SeverityNumber.INFO4]: 'INFO',
        [SeverityNumber.WARN]: 'WARN',
        [SeverityNumber.WARN2]: 'WARN',
        [SeverityNumber.WARN3]: 'WARN',
        [SeverityNumber.WARN4]: 'WARN',
        [SeverityNumber.ERROR]: 'ERROR',
        [SeverityNumber.ERROR2]: 'ERROR',
        [SeverityNumber.ERROR3]: 'ERROR',
        [SeverityNumber.ERROR4]: 'ERROR',
        [SeverityNumber.FATAL]: 'FATAL',
        [SeverityNumber.FATAL2]: 'FATAL',
        [SeverityNumber.FATAL3]: 'FATAL',
        [SeverityNumber.FATAL4]: 'FATAL',
    };

    public constructor(logger: OtelLogger) {
        this._logger = logger;
        this._attributes = {};
    }

    public setAttribute(key: string, value: LogAttributeValue): void {
        this._attributes[key] = value;
    }

    public clearAttributes(): void {
        this._attributes = {};
    }

    public log(message: string, severity: SeverityNumber): void {
        this._logger.emit({
            body: message,
            severityNumber: severity,
            severityText: Logger.severityMap[severity],
            attributes: this._attributes,
        });
    }

    public trace(message: string): void {
        this.log(message, SeverityNumber.TRACE);
    }

    public debug(message: string): void {
        this.log(message, SeverityNumber.DEBUG);
    }

    public info(message: string): void {
        this.log(message, SeverityNumber.INFO);
    }

    public warning(message: string): void {
        this.log(message, SeverityNumber.WARN);
    }

    public error(message: string): void {
        this.log(message, SeverityNumber.ERROR);
    }

    public fatal(message: string): void {
        this.log(message, SeverityNumber.FATAL);
    }
}
