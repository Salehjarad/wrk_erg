import { objectType, extendType, stringArg, arg, intArg } from '@nexus/schema';


export const Tags = objectType({
    name: 'Tag',
    definition(t) {
        t.model.id()
        t.model.value()
        t.model.doc({ type: 'Document'})
    }
})

export const TagsQuery = extendType({
    type: 'Query',
    definition(t) {
        t.crud.tags()
    }
})

export const TagsMutation = extendType({
    type: 'Mutation',
    definition(t) {
        t.field('deleteTag', {
            type: 'Boolean',
            args: {
                value: stringArg(),
            },
            resolve: async (_root, args, { prisma }) => {
                await prisma.tag.delete({where: { value: String(args.value) }});
                return true;
            }
        })
    }
})