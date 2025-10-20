import Knex from "knex";
import ClientPGLite from "./dist/index.js";

const knex = Knex({
  client: ClientPGLite,
  dialect: "postgres",
  connection: {},
});

console.log(await knex.raw(`select NOW();`));

knex.destroy();
