import { type HrTime, type Span, SpanStatusCode } from '@opentelemetry/api';
import { hrTime, hrTimeDuration } from '@opentelemetry/core';

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
