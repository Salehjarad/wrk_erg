const _ = require('lodash')


const tags = [{value: "hello"}, {value: "b3"}, {value: "b5"}]
const newTags = [{value: "hello2"}, {value: "hello"}, {value: "b2"}, {value: "b5"}]

const clearTag = _.xorBy(tags, newTags, 'value');
const clearTagTow = _.remove(newTags, e => !clearTag.includes(e))


const myf = newTags.filter(e => {
    return tags.some(v => {
        return e.value !== v.value
    })
})

console.log(myf)