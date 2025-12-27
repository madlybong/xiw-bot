import { EventEmitter } from 'events';

class LogBus extends EventEmitter {
    publish(instanceId: string, log: any) {
        console.log(`[LogBus] Emitting log:${instanceId}`);
        this.emit(`log:${instanceId}`, log);
    }

    subscribe(instanceId: string, callback: (log: any) => void) {
        const event = `log:${instanceId}`;
        this.on(event, callback);
        return () => this.off(event, callback);
    }
}

export const logBus = new LogBus();
