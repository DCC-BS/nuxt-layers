import { z } from "zod";

type EnvType = "build-time" | "runtime";

export const envRegistry = z.registry<{ envType: EnvType; group: string }>();
