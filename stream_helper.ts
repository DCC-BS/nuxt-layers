export function toStream<T>(items: T[], prefix: string, postfix: string) {
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
						encoder.encode(`${prefix}${JSON.stringify(item)}${postfix}`),
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

export function toJsonStream<T>(items: T[]) {
	return toStream(items, "", "");
}

export function toSSEStream<T>(items: T[]) {
	return toStream(items, "data: ", "\n\n");
}
