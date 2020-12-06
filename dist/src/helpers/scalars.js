"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upload = exports.DateTime = void 0;
const graphql_iso_date_1 = require("graphql-iso-date");
const graphql_upload_1 = require("graphql-upload");
const schema_1 = require("@nexus/schema");
exports.DateTime = schema_1.asNexusMethod(graphql_iso_date_1.GraphQLDateTime, 'DateTime');
exports.Upload = schema_1.asNexusMethod(graphql_upload_1.GraphQLUpload, 'upload');
//# sourceMappingURL=scalars.js.map