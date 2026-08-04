const apps = [
    {
        name: "TextMate",
        slug: "textmate",
        image: "app-icons/app-icon-textmate.svg",
    },
    {
        name: "Transcribo",
        slug: "transcribo",
        image: "app-icons/app-icon-transcribo.svg"
    },
    {
        name: "BS-Übersetzer",
        slug: "bs-uebersetzer",
        image: "app-icons/app-icon-translate.svg",
    },
] as const;

export type AppName = (typeof apps)[number]["name"];

export type AppLink = {
    name: AppName;
    to: string;
    image?: string;
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
            ...app,
            to: appListUrlTemplate.replaceAll("{APP_NAME}", app.slug),
        }));
}
