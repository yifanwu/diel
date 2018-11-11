# Code Gen Notes

Discusses the plan for differe aspects of codegen.

## Templating

Doing a separate pass, and the intermediate representations are all strings, to avoid constructing an IR that then deconstructing it.

## Indentation

Alex has an [indentation manager in P](https://github.com/p-org/P/blob/ssa/Src/Pc/CompilerCore/Backend/Prt/PrtCodeGenerator.cs). I can create a mal indented file and then put it through another parsing layer that basically does indentation based on {}'s and ()'s.

Actually ended up just using third party prettifier; more conveneint, since I'm generating TS and SQL (both of which have existing implementations; should have thought earlier!).