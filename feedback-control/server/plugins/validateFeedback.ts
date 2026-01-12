export default defineNitroPlugin(() => {
    const config = useRuntimeConfig();

    const githubToken = config.githubToken ?? process.env.GITHUB_TOKEN;
    const repo = config.repo;
    const owner = config.repoOwner;
    const project = config.project;

    if (!githubToken) {
        console.error(
            "FEEDBACK: GitHub token is not defined in runtime config or environment variables.",
        );
    }

    if (!repo) {
        console.error(
            "FEEDBACK: GitHub repository is not defined in runtime config.",
        );
    }

    if (!owner) {
        console.error(
            "FEEDBACK: GitHub repository owner is not defined in runtime config.",
        );
    }

    if (!project) {
        console.error(
            "FEEDBACK: Project name is not defined in runtime config.",
        );
    }
});
