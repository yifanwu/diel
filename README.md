# DIEL

[![Build Status](https://travis-ci.org/yifanwu/diel.svg?branch=master)](https://travis-ci.org/yifanwu/diel)

We live in an era of big data and rich data visualization. However, as data increase in size, browser-based interactive visualizations eventually hit limits in storage and processing capacity. In order to provide interactivity over large datasets, visualization systems need to be rewritten to make use of powerful back-end services.

Unfortunately, this puts the burden of back-end expertise onto front-end developers. It would be far preferable if front-end developers could write visualizations once in a natural way, and have a framework take responsibility for transparently scaling up the visualization to use back-end services as needed. Achieving this goal requires rethinking how communication and state are managed by the framework: the mapping of interaction logic to server APIs or database queries, handling of results arriving asynchronously over the network, as well as basic cross-layer performance optimizations like caching.

We present DIEL, a framework that achieves this cross-layer and transparent autoscaling with a simple, declarative interface. DIEL treats UI events as a stream of data that is captured in an event history for reuse. Developers declare what the state of the interface should be after the arrival of events (user interaction, asynchronous network messages, data arrival). DIEL compiles these declarative specifications into relational queries over both event history and the data to be visualized. In doing so, DIEL makes it easier to develop visualizations that are robust against changes to the size and location of data. To evaluate the DIEL framework, we developed a prototype implementation and confirmed that DIEL supports a range of visualization and interaction designs. Further, visualizations written using DIEL can transparently and seamlessly scale to use back-end services with little intervention from the developer.

## Team

DIEL is a research project at [UC Berkeley RISE Lab](https://rise.cs.berkeley.edu/), by [Yifan Wu](http://twitter.com/yifanwu), with advising from [Joe Hellerstein](http://twitter.com/joe_hellerstein), [Eugen Wu](http://twitter.com/sirrice) and [Remco Chang](http://www.cs.tufts.edu/~remco/), and help from undergrad researchers [ryan](http://github.com/rmpurp) and [lucie](http://github.com/dkqntiqn).
