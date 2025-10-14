require("dotenv").config();
const { app } = require("./src/app");
const { sequelize } = require("./src/models");

const port = Number(process.env.PORT || 4000);

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB ok");
    app.listen(port, () => {
      console.log(`✅ API listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start", err);
    process.exit(1);
  }
}

start();

module.exports = { app };
