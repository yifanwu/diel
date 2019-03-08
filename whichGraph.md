Question 1: In joins, are we interested in seeing distribution of all data, or just the data that was selected?


Bar Graph/Histogram
Variables: 1
Small number of distinct attribute, or numerical data
Queries needed:
    select count(attribute distinct)
    attribute.type

Pie Chart
Variables 1
Small number of categories, can be used with any kind of data
Queries needed:
    select count(attribute distinct)

Top X Values:
Variables: 1
Works for any sort of non-numerial data

Line Graph
Variables: 2
Every thing is a distinct key value pairs (e.g. temp over time) of numerical data
Queries needed:
    attribute.type1, attribute.type2
    select count() from r group by attribute1 (time) vs. select count()

Multi Line Graph
Variables: 3-6
Used for representing multiple attributes over time, distinguished by color
Queries needed: something to determine we have data over time

Bubble Chart
Variables: 2
A few key, value pairs that have varying amount of frequency numerical data
Queries needed:
    attribute.type1, attribute.type2
    select attribute1, attribute2, count() group by attr1, attr2
        limited number of rows returned

Scatter Plot
Variables: 2
Sort of similar usage to line graph, except that does not have to be a function (one input, one output)
Best used for all other types for two variable data I think
Queries needed:
    attribute.type1, attribute.type2
    select count() from r group by attribute1, attribute2 vs. select count()

JOINS


There's not really a point showing data of primary key I think, so if the join condition is primary key, just ignore

But as for what attributes to look at, it should be what attributes are selected and the attributes of the join clause

Then, follow rules above for choosing graph types

Percentage
calculate percentage of data from table x or y that had a match

select a.attr1, b.attr2, b.attr3
from inner join a, b on a.attr4=10, a.id = b.id

a.id and b.id so we should not look at them.
Example for decomposing on a, show distribution of attr1, attr4 from original a
For decomposing on b, show distribution of attr2 and attr3

