import type { Socket } from 'node:net';
import { createServer as createServerOrig } from '@myrotvorets/create-server';
import { ValueType } from '@opentelemetry/api';
import { getMeter } from './utils.mjs';

export type { ServerEnvironment } from '@myrotvorets/create-server';

export async function createServer(
    ...params: Parameters<typeof createServerOrig>
): ReturnType<typeof createServerOrig> {
    const server = await createServerOrig(...params);

    const meter = getMeter();
    meter
        .createObservableUpDownCounter('server.connections.active', {
            description: 'Number of active connections.',
            unit: '{count}',
            valueType: ValueType.INT,
        })
        .addCallback((observable) => {
            server.getConnections((error, count) => observable.observe(error ? NaN : count));
        });

    const totalConnectionsCounter = meter.createCounter('server.connections.total', {
        description: 'Number of connections.',
        unit: '{count}',
        valueType: ValueType.INT,
    });

    const totalRequestsCounter = meter.createCounter('server.requests.total', {
        description: 'Number of requests.',
        unit: '{count}',
        valueType: ValueType.INT,
    });

    const totalHandledRequestsCounter = meter.createCounter('application.requests.total', {
        description: 'Number of handled requests.',
        unit: '{count}',
        valueType: ValueType.INT,
    });

    const socketBytesCounter = meter.createCounter('server.connections.bytes', {
        description: 'Number of bytes transferred.',
        unit: 'By',
        valueType: ValueType.INT,
    });

    server.on('connection', (socket: Socket) => {
        totalConnectionsCounter.add(1);
        socket.once('close', () => {
            socketBytesCounter.add(socket.bytesRead, { direction: 'in' });
            socketBytesCounter.add(socket.bytesWritten, { direction: 'out' });
            socketBytesCounter.add(socket.bytesRead + socket.bytesWritten, { direction: 'total' });
        });
    });

    server.on('request', (_req, res) => {
        totalRequestsCounter.add(1);
        res.once('close', () => {
            const status = res.headersSent ? res.statusCode : 499;
            totalHandledRequestsCounter.add(1, { status });
        });
    });

    return server;
}
