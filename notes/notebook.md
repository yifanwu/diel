# Notebook

This is mostly in `DielRuntime`

we will have an original representation of the queries in a list of queries?

Then we add them as public views

if the user makes an interaction we create corresponding queries.

the UI generation logic 

## Design decisions

We are going to allow the notebook to be tweaked, UNTIL they are changed into an interaction

It gets a little weird if we have interactions enable on views that are already dependent on interactions... We can make some assumptions to make this work. For now do not support. (Eeasoning about the future just in case, if we do wan tot add support, )

Developers will not be able to create views --- they can only write queries --> they can change how they are referenced by changing the name

## Arch

Need to think about how we are capturing the contextual knowledge and how to pass that around.

It's also not clear how we should encode the information --- casting the information seems to lose stuff, and the best is be able to reflect --- it seems like most parts of the notebook should know where the others come from.

## Features

**high light difference**

* compared to a previous version upon undo/redo
* when a new relation is generated as an interaction

## Implementation


### query gen
For the cards, for one dimentional data, we are just showing distributions; right now just going to do something naive and count the number of unique values, if it's less than 10, just do a group by that value and count, if it's numeric, then devide into ten buckets.

### cell representation

I'm going to basically use spans to directly annotate the AST --> rolling my own highlighter too I suppose.

met: on the performance side, really don't know how to do the aprsing progressively.