"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsMutation = exports.TagsQuery = exports.Tags = void 0;
const schema_1 = require("@nexus/schema");
exports.Tags = schema_1.objectType({
    name: 'Tag',
    definition(t) {
        t.model.id();
        t.model.value();
        t.model.doc({ type: 'Document' });
    }
});
exports.TagsQuery = schema_1.extendType({
    type: 'Query',
    definition(t) {
        t.crud.tags();
    }
});
exports.TagsMutation = schema_1.extendType({
    type: 'Mutation',
    definition(t) {
        t.field('deleteTag', {
            type: 'Boolean',
            args: {
                value: schema_1.stringArg(),
            },
            resolve: async (_root, args, { prisma }) => {
                await prisma.tag.delete({ where: { value: String(args.value) } });
                return true;
            }
        });
    }
});
//# sourceMappingURL=Tags.js.map