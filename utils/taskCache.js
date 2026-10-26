const NodeCache = require("node-cache");

const taskCache = new NodeCache({ stdTTL: 60 });

module.exports = taskCache;
