const apps = [
    {
        name: "TextMate",
        slug: "textmate",
        image: "app-icons/textmate-96x96.png",
    },
    {
        name: "Transcribo",
        slug: "transcribo",
        image: "app-icons/transcriboLogo.svg"
    },
    {
        name: "BS-Übersetzer",
        slug: "bs-uebersetzer",
        image: "app-icons/bs-uebersetzer.png",
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
