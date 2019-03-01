# DIEL Runtime

As described in the page for [events](../events.md), the _DIEL_ engine reactively evaluates the outputs when there are input changes.

The top-level logic is in the function `tick`, described below.  The document will also address the physical execution logic later.

## Tick

The tick logic is in the method `tick` at https://github.com/yifanwu/diel/blob/master/code/src/runtime/DielRuntime.ts#L160 (note that the documented line might change due to new commits, but could be located for hash `b08d0ae`.  You should be able to find it in the file `DielRuntime.ts`.

This function is invoked via a trigger on the table `allInput` in [static.sql](https://github.com/yifanwu/diel/blob/master/code/src/compiler/codegen/static.sql). Everytime there is a new event, there is a new insertion into the table `allInput`, and the trigger would be invoked.


## Phsyical execution

TODO