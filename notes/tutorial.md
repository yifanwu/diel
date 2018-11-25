# DIEL Tutorial

The reason why setup has to be called separately is because there is no async constructor.

```ts
  const d = new Diel(filePath);
  await d.Setup();
```

To use diel
```bash
npm install diel
# path directs to where dielconfig.json is located relative to 
npx diel-cli compile -p <path>
```

```json
{
  "src": "./src/tests/dir/*.sql",
  "dist": "./src/"
}
```

## Templating

Note that there can only be one level of templates --- cannot have templates within templates.

## Cross-filter

I had to do some boiler plate since each query is slightly different and the DSL logic implements that templating.

Need to iterate on what's allowed in the crossfilter predicate definition; right now it is a single join clause; might be too limiting?

## Relation Properties

We have the following keywords `dynamic`, 

## Constraints

Constraints can only be placed on dynamic tables.

## Type System

```diel
register <udf_name> type <type>;

```

For tables that will be loaded in, for now we ask the developer to provide us with the type definition.

## Using webworker tables

Webworker tables have to be loaded into a .db file and loaded in already.

## Things to watch out for

We assume some order dependence based on the relations defined prior.

## Diff from Paper

Note: got rid of the `LATEST` because it's not very clean.
