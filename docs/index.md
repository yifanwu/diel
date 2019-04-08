# DIEL

Welcome to the DIEL home page.

## The Current State

Scaling a data analysis app from client-only to client-server requires a lot of engineering changes---setting up the APIs on the server, optimizing data processing (e.g., caching, prefetching), and coordinating networked requests with user interaction.

This doesn't have to be the case. Here's how.

## The UI (State) as a Query

When you query a database on the cloud, you do not have to specify _how_ to access the data, but merely _declare_ the logic. We think you can do the same with data that is on the client and data that is on the server.  

The critical step is to take on a (_very_) data-centric lens, where we see interactions as data, too <sup>[1](#meijer)</sup>. This observation applies to events in general. By unifying events with data, we can now define the state of the UI as a query.

The query can reference data that live on remote servers and the full event history, and the query execution engine will figure out how to keep the UI state up to date with the new values in the tables, which is to say, imperatively, that an event automatically causes the UI to reevaluate.

## Hello, DIEL

You can view the [live examples](https://logical-interactions.github.io/diel-gallery/).

### Counter Example

Let's start with the simplest example to outline the flow of coding in DIEL.  Let's consider a counter that increments and decrements by clicks on respective buttons.

In DIEL's model, we can store the click events as a row in a table, which we can call `clickEvent`. To differentiate between increments and decrements, we define the `delta` column, for each click on increment, the delta is `1`, and decrement is `-1`. To get the current count, we can sum up the `deltas.

![counter steps](https://i.ibb.co/8DBm4JJ/counter-steps.png)

Below illustrates the set up using a plain database on the client ([sql.js](https://github.com/kripken/sql.js/))<sup>[2](#clientdb)</sup>, without any custom diel logic.

![counter flow](https://i.ibb.co/4ZRt2nj/counter-flow.png)

### Chart Example

The previous example is indeed a _counter_ example because while it works, it makes no sense why anyone would load a giant js library (sql.js) and write in a different language (SQL), to do something trivial in a few lines of JavaScript code---but hopefully, you see how it works.

Now we look at a better-motivated example---interactive visualization.  The setting here is that we have two tables of information.  One is that of registration for a conference and for each participant their arrival and departure times, along with information of what animal they like (the example was originally for a talk at ForwardJS with the intention to produce humor).

First, let's see how we can use SQL to derive the static charts---the first scatter plot is just a raw selection, and the bar chart is a distribution which we can compute with a simple `group by` in SQL----`select count(), animal from attendee group by animal`.

To make the chart dynamic is to say that the chart _adapts_ to the user specifications, which, in DIEL, is to say that the data for the chart is derived from both the data tables and the interaction tables, via relational _join_s.  This idea is illustrated in the query on the lower right.  The join with `brushEvent` performs the hit testing---checking to see if the attendee's information falls into the range.  The join with register "links" the logic between the two charts---the filter is on attendee, which is identified by their emails.

![chart example with code](https://i.ibb.co/R07zQtH/chart-example.png)

As we have seen in the previous example, we need to reactively evaluate the views to keep the UI up to date---this is where the DIEL engine comes in. The DIEL engine triggers an event loop whenever there is a new event and reevaluates all the views that have dependencies on the event that has been invoked<sup>[3](#remote)</sup>. The overall flow is shown in the image below.  On the bottom are "original" relations, tables store raw data, and the above are the queries that derive new relations based on the base data and event tables, and finally on the top layer we have the _output_ views whose results are consumed by _rendering function_s that take in the tabular data and generates the DOM elements (you can use e.g., D3, Vega-Lite, or vanilla JS).

![chart model local](https://i.ibb.co/z2NGYV1/model.png)

### Real-time Example

Let's take the previous example a further---what happens if the `registry` table now is being updated in real time? In DIEL, we will change the registry table from a normal table, which is static, to an event---`CREATE EVENT TABLE registry (arrival INT, departure INT, email TEXT)`.  And this change will keep the brush selection up to date with the streamed registry data. Below is an example illustrating how the bar chart dependent on the new streamed in data in the scatter plot will be updated immediately.

![streaming example](https://i.ibb.co/SmLsFZP/streaming-example.png)

And below is the flow of the streaming example. In contrast to the previous one, the only thing that has changed is that the `registry` table is now an event table.

![streaming model](https://i.ibb.co/5Mmb7q3/streaming-flow.png)

## Using DIEL

Interested in trying out DIEL? You can install DIEL with `npm install diel`, or link [the js file](https://www.jsdelivr.com/package/npm/diel) directly in your HTML.

We are working on adding documentation and a full tutorial! Meanwhile, you can check out the [gallery](https://logical-interactions.github.io/diel-gallery/).

## The Vision

DIEL help us make use of many database techniques in **distributed query execution** and **materialized view maintainance**---our current [prototype](https://github.com/logical-interactions/diel) does not even scratch the surface.  DIEL is both completely stateful and stateless at the same time---it's stateful because all the causes for UI changes are recorded, and stateless because there is no intermediate state that is manipulated. For a more extensive (and academic) discussion, you can read [our submitted paper on DIEL](https://www.dropbox.com/s/777bah44ca7x2lu/diel_infovis_2019.pdf?dl=0);

Our hope is that by breaking the client-server architecture and making data more accessible, there can be more flexible **end-user programming** that are not confined to the limited APIs provided. And by restricting the data structure to relations and programming to relational operators, we hope to make **generating custom interactions** easier. Imagine using a tool where for every analysis task you can quickly assemble together an interactive interface to play with the data, instead of having to manually invoke functions with different parameters, or worse copy-paste cells with some changed configurations.

## People

Research @ UC Berkley: [yifan](http://twitter.com/yifanwu), advised by [eugene wu](http://www.cs.columbia.edu/~ewu/), [remco chang](http://www.cs.tufts.edu/~remco/), and [joe hellerstein](http://db.cs.berkeley.edu/jmh/), with contributions from [ryan](http://github.com/rmpurp) and [lucie](http://github.com/dkqntiqn).

<a name="meijer">1</a>: [Your Mouse is a Database
](https://queue.acm.org/detail.cfm?id=2169076) by Erik Meijer

<a name="clientdb">2</a>: Many people have the misconception of databases being a monstrous piece of software that's managed by DBAs. However, at its simplest, a database engine simply stores tables and executes relational queries, which are very simple---select, project, and join (with group by and aggregations).

<a name="remote">3</a>: This description omits the details of how DIEL executes across nodes---we'll update this document soon with details of how that works!