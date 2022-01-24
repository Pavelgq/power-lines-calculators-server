const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const logger = require("../../utils/logger");
const db = require("../../server/db");
const { generateKey, checkKey } = require("../../utils/accept-utils");
const { query } = require("../../utils/logger");

class ActionControllers {
  async createNewAction(req, res) {
    try {
      const { client_id, type, data, project_name, program_type, params } =
        req.body;
      const { accept_key } = req;
      let dataPath = "";
      if (data) {
        dataPath = `${client_id}-${Date.now()}.json`;

        await fs.writeFile(
          path.join(__dirname, `../../../data/calc-data/${dataPath}`),
          JSON.stringify(data),
          function (err, result) {
            if (err) console.log("error", err);
          }
        );
      }
      const result = await db.query(
        `INSERT INTO action (client_id, type, path_to_data, accept_key, project_name, program_type, params) VALUES ('${client_id}', '${type}', '${dataPath}', '${accept_key}', '${project_name}', '${program_type}', '${JSON.stringify(
          params
        )}') RETURNING *;`
      );

      return res.json({
        data: result.rows[0],
        message: "Действие пользователя сохранено",
      });
    } catch (error) {
      logger.error("action add: ", error);
      return res.status(400).json({ error });
    }
  }

  async getAllActions(req, res) {
    try {
      const clientId = req.query.client_id || -1;
      const programType = req.query.program_type || -1;
      let actions = {};

      const page = req.query.page || 1;
      const limit = req.query.limit;
      const offset = page * limit;
      let maxCount;

      const setClientId = (id) => {
        if (id !== -1) {
          return `client_id = ${id}`;
        } else {
          return "";
        }
      };

      const programTypeFilter = (type) => {
        if (type !== -1) {
          return `program_type = ${type}`;
        } else {
          return "";
        }
      };
      const whereString =
        setClientId(clientId) || programTypeFilter(programType) ? "WHERE" : "";
      const andString =
        setClientId(clientId) && programTypeFilter(programType) ? "AND" : "";

      const actionQuery = `SELECT * FROM action ${whereString} ${setClientId(
        clientId
      )} ${andString} ${programTypeFilter(programType)} LIMIT ${
        limit || "ALL"
      } OFFSET ${offset};`;

      actions = await db.query(actionQuery);
      maxCount = await db.query(
        `SELECT count(*) FROM action ${whereString} ${setClientId(
          clientId
        )} ${andString} ${programTypeFilter(programType)};`
      );

      const data = actions.rows;

      const result = { data };
      result.total_items = maxCount.rows[0].count;
      res.status(200).json(result);
    } catch (error) {
      logger.error("action get all: ", error);
      return res.status(400).json({ error });
    }
  }

  async getClientActions(req, res) {
    try {
      const clientId = req.params.id;
      const page = req.query.page;
      const limit = req.query.limit;
      const startIndex = page * limit;
      const endIndex = page * limit + limit;
      const actions = await db.query(
        `SELECT * FROM action WHERE client_id = '${clientId}';`
      );
      const data = actions.rows;
      const length = data.length;
      const result = { data: data.slice(startIndex, endIndex) };
      result.total_items = length;
      res.status(200).json(result);
    } catch (error) {
      logger.error("action get one: ", error);
      return res.status(400).json({ error });
    }
  }

  async getSaveFile(req, res, next) {
    try {
      console.log("file");
      let options = {
        root: path.join(__dirname, "../../../data/calc-data"),
        dotfiles: "deny",
        headers: {
          "x-timestamp": Date.now(),
          "x-sent": true,
        },
      };
      let fileName = req.params.name;
      res.sendFile(fileName, options, function (err) {
        if (err) {
          next(err);
        } else {
          console.log("Sent:", fileName);
        }
      });
    } catch (error) {
      logger.error("action safe file: ", error);
      return res.status(400).json({ error });
    }
  }
  async authorizeAction(req, res) {}
}

module.exports = ActionControllers;
