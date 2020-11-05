import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLUpload } from 'graphql-upload';
import { asNexusMethod } from '@nexus/schema'

export const DateTime = asNexusMethod(GraphQLDateTime, 'DateTime')
export const Upload = asNexusMethod(GraphQLUpload, 'upload')