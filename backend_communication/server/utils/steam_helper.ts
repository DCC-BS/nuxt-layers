export function toStream<T>(items: T[]) {
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            function send(data: T) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                );
            }

            for (const item of items) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                send(item);
            }

            controller.close();
        },
    });

    return stream;
}
