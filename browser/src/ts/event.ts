export class EventHook<TData> {
    private handlers: Array<[(data: TData) => void, any]> = [];

    public handle(callback: (data: TData) => void, context?: any) {
        this.handlers.push([callback, context]);
    }

    public release(callback: (data: TData) => void) {
        for (let index = 0; index < this.handlers.length; index++) {
            const element = this.handlers[index];
            if (element && element[0] == callback) {
                this.handlers.splice(index, 1);
                index--;
            }
        }
    }

    public fire(data: TData): boolean {
        if (this.handlers.length < 1) {
            return false;
        }

        for (let [cb, context] of this.handlers) {
            cb.call(context, data);
        }

        return true;
    }
}
