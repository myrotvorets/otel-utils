import { access, constants, readFile, readdir } from 'node:fs/promises';
import { cpus } from 'node:os';
import { hrtime, memoryUsage, resourceUsage } from 'node:process';
import { ObservableUpDownCounter, ValueType } from '@opentelemetry/api';
import { type Meter, getMeter } from './utils.mjs';

async function countOpenFDs(): Promise<number> {
    try {
        const dir = await readdir('/proc/self/fd');
        return dir.length;
    } catch {
        return NaN;
    }
}

async function isAccessible(path: string, mode = constants.R_OK): Promise<boolean> {
    try {
        await access(path, mode);
        return true;
    } catch {
        return false;
    }
}

async function getMemoryStats(): Promise<[number, number]> {
    try {
        let vmrss, vmsize;
        const lines = (await readFile('/proc/self/status', 'utf-8')).split('\n');
        for (const line of lines) {
            const [key, value] = line.split(/[\s:]+/u, 2);
            if (key === 'VmRSS') {
                vmrss = +(value ?? NaN);
            } else if (key === 'VmSize') {
                vmsize = +(value ?? NaN);
            }
        }

        return [vmrss ?? NaN, vmsize ?? NaN];
    } catch {
        return [NaN, NaN];
    }
}

function createMemUsageCounter(meter: Meter): ObservableUpDownCounter {
    return meter.createObservableUpDownCounter('process.memory.usage', {
        unit: 'By',
        description: 'Memory usage (RSS) in bytes.',
        valueType: ValueType.INT,
    });
}

export async function initProcessMetrics(): Promise<void> {
    const meter = getMeter();
    const cpuTime = meter.createObservableCounter('process.cpu.time', {
        unit: 's',
        description: 'Total CPU seconds broken down by different states.',
        valueType: ValueType.DOUBLE,
    });

    const cpuUtilization = meter.createObservableGauge('process.cpu.utilization', {
        unit: '1',
        description:
            'Difference in process.cpu.time since the last measurement, divided by the elapsed time and number of CPUs available to the process.',
        valueType: ValueType.DOUBLE,
    });

    const contextSwitches = meter.createObservableCounter('process.context_switches', {
        unit: '{count}',
        description: 'Number of context switches.',
        valueType: ValueType.INT,
    });

    const pagingFaults = meter.createObservableCounter('process.paging.faults', {
        unit: '{fault}',
        description: 'Number of page faults.',
        valueType: ValueType.INT,
    });

    const diskIo = meter.createObservableCounter('process.disk.io', {
        unit: 'By',
        description: 'Disk bytes transferred.',
        valueType: ValueType.INT,
    });

    let lastUsage = resourceUsage();
    let lastObservationTime = hrtime.bigint();
    const cpuCount = cpus().length;

    meter.addBatchObservableCallback(
        (observer) => {
            const observationTime = hrtime.bigint();
            const usage = resourceUsage();

            observer.observe(cpuTime, usage.userCPUTime / 1e6, { state: 'user' });
            observer.observe(cpuTime, usage.systemCPUTime / 1e6, { state: 'system' });

            // cpuUsage is in microseconds, hrtime is in nanoseconds
            const elapsedUs = Number((observationTime - lastObservationTime) / 1000n);
            observer.observe(cpuUtilization, (usage.userCPUTime - lastUsage.userCPUTime) / elapsedUs / cpuCount, {
                state: 'user',
            });
            observer.observe(cpuUtilization, (usage.systemCPUTime - lastUsage.systemCPUTime) / elapsedUs / cpuCount, {
                state: 'system',
            });

            lastObservationTime = observationTime;
            lastUsage = usage;

            observer.observe(contextSwitches, usage.voluntaryContextSwitches, { type: 'voluntary' });
            observer.observe(contextSwitches, usage.involuntaryContextSwitches, { type: 'involuntary' });

            observer.observe(pagingFaults, usage.minorPageFault, { type: 'minor' });
            observer.observe(pagingFaults, usage.majorPageFault, { type: 'major' });

            observer.observe(diskIo, usage.fsRead * 512, { direction: 'read' });
            observer.observe(diskIo, usage.fsWrite * 512, { direction: 'write' });
        },
        [cpuTime, cpuUtilization, contextSwitches, pagingFaults, diskIo],
    );

    if (await isAccessible('/proc/self/fd', constants.R_OK | constants.X_OK)) {
        meter
            .createObservableUpDownCounter('process.open_file_descriptors', {
                unit: '{count}',
                description: 'Number of file descriptors in use by the process.',
                valueType: ValueType.INT,
            })
            .addCallback(async (observableResult) => observableResult.observe(await countOpenFDs()));
    }

    if (await isAccessible('/proc/self/status')) {
        const memUsage = createMemUsageCounter(meter);

        const memVirtual = meter.createObservableUpDownCounter('process.memory.virtual', {
            unit: 'By',
            description: 'The amount of committed virtual memory in bytes.',
            valueType: ValueType.INT,
        });

        meter.addBatchObservableCallback(
            async (observableResult) => {
                const [vmrss, vmsize] = await getMemoryStats();
                observableResult.observe(memUsage, vmrss);
                observableResult.observe(memVirtual, vmsize);
            },
            [memUsage, memVirtual],
        );
    } else {
        createMemUsageCounter(meter).addCallback((observableResult) => observableResult.observe(memoryUsage.rss()));
    }
}
