## CodeMirror

Internals here [https://codemirror.net/doc/internals.html](https://codemirror.net/doc/internals.html)

> So what I do is focus a hidden textarea, and let the browser believe that the user is typing into that. What we show to the user is a DOM structure we built to represent his document. If this is updated quickly enough, and shows some kind of believable cursor, it feels like a real text-input control.

Note that `prism.js` does not update it as is being typed, in constrast to CodeMirror.

### Interuptable parsers

https://codemirror.net/1/story.html#parser

We need an interuptable compiler... OK this is a bit crazy. but I should read it.


## Atom's Tree Sitter

This is a very promising candidate, but it would require http://tree-sitter.github.io/tree-sitter/creating-parsers

code: https://github.com/tree-sitter/tree-sitter
Talks:
* https://www.youtube.com/watch?v=Jes3bD6P0To
* https://www.youtube.com/watch?v=a1rC79DHpmY
* https://www.youtube.com/watch?v=0CGzC_iss-8


## Other editors

Looking at this editor for insights on how to manage text, popups, inline images.

**Medium style editor**

[older version of a Medium clone](https://github.com/yabwe/medium-editor/tree/ce95edecb57f89ebd60f5e02b86bb1c66d24f723) (found an earlier commit so as not to be overwhelmed by the complexity )

**Constrained form input**

[http://square.github.io/field-kit/](http://square.github.io/field-kit/) — took a look at [https://github.com/square/field-kit/blob/master/src/delimited_text_formatter.js](https://github.com/square/field-kit/blob/master/src/delimited_text_formatter.js) — they are actually just managing how things are being typed. I think I'm just going to have a separate text input for now, and then combine the input into the resulting view later.
