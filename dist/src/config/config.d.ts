declare const _default: () => {
    port: number;
    database: {
        url: string | undefined;
        directUrl: string | undefined;
    };
    supabase: {
        url: string | undefined;
        anonKey: string | undefined;
        serviceRoleKey: string | undefined;
        jwtSecret: string | undefined;
    };
    google: {
        placesApiKey: string | undefined;
    };
};
export default _default;
