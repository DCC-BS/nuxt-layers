const apps = [
    {
        name: "TextMate",
        slug: "textmate",
    },
    {
        name: "Transcribo",
        slug: "transcribo",
    },
    {
        name: "BS-Übersetzer",
        slug: "bs-uebersetzer",
    },
] as const;

export type AppName = (typeof apps)[number]["name"];

export type AppLink = {
    name: AppName;
    to: string;
};

export function useAppList(currentAppName: AppName): AppLink[] {
    const {
        public: {
            appConfig: { appListUrlTemplate },
        },
    } = useRuntimeConfig();

    return apps
        .filter((app) => app.name !== currentAppName)
        .map((app) => ({
            name: app.name,
            to: appListUrlTemplate.replaceAll("{APP_NAME}", app.slug),
        }));
}
