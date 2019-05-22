# Templated DIEL

DIEL is an event layer on top of SQL, which is still rather "low level", in the sense that its's not 

## Static

**Distribution**: creates a binning query, `create distribution of column_name from table_name`;

**Compare**: compares the distributions of the values `create comaprison (column_name from table_name, column_name from table_name)`

### Modifications

**Share scales**: `share scales for (column_name of chart_name, column_name of chart_name, ...)`

## Basic

**Selection**: is captured into a relation, can also show items queried by doing `select * from selection_name`;
**Filter**: replaces the old view with an augmented view that now takes into account the filtering

## Crossfilter

**Crossfilter**: creates multiple relevant queries

**Link**: to link two existing views, `link view_name with view_name`, and DIEL will find the default behavior, or the user can specify `link view_name with view_name by <predicate>`, whereby `predicate` can be of the form `view_name1.column_name = view_name2.column_name` if the linking is ambiguous.