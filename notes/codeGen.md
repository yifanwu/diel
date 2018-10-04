# Code Gen Notes

Discusses the plan for differe aspects of codegen.

## Indentation

Alex has an [indentation manager in P](https://github.com/p-org/P/blob/ssa/Src/Pc/CompilerCore/Backend/Prt/PrtCodeGenerator.cs). I can create a mal indented file and then put it through another parsing layer that basically does indentation based on {}'s and ()'s.