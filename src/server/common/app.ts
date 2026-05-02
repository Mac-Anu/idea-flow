import { Env, Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";

export const createHonoApp = <E extends Env>() => {
    const app = new Hono<E>();
    app.use(prettyJSON());
    return app;
};
