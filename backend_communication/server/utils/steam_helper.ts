export function toStream<T>(items: T[]) {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for (const item of items) {
                    if (cancelled) break;
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    if (cancelled) break;
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(item)}\n\n`),
                    );
                }
                if (!cancelled) controller.close();
            } catch (err) {
                controller.error(err);
            }
        },
        cancel() {
            cancelled = true;
        },
    });

    return stream;
}
