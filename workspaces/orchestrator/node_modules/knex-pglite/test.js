const Knex = require("knex");
const ClientPGLite = require("./dist/index.js");

const knex = Knex({
  client: ClientPGLite,
  dialect: "postgres",
  connection: {},
});

async function main() {
  console.log(await knex.raw(`select NOW();`));
}

main().then(() => {
  knex.destroy();
});
