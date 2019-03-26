# DIEL V0 Source Code

We live in an era of big data and rich data visualization. However, as data increase in size, browser-based interactive visualizations eventually hit limits in storage and processing capacity. In order to provide interactivity over large datasets, visualization systems need to be rewritten to make use of powerful back-end services.

Unfortunately, this puts the burden of back-end expertise onto front-end developers. It would be far preferable if front-end developers could write visualizations once in a natural way, and have a framework take responsibility for transparently scaling up the visualization to use back-end services as needed. Achieving this goal requires rethinking how communication and state are managed by the framework: the mapping of interaction logic to server APIs or database queries, handling of results arriving asynchronously over the network, as well as basic cross-layer performance optimizations like caching.

We present DIEL, a framework that achieves this cross-layer and transparent autoscaling with a simple, declarative interface. DIEL treats UI events as a stream of data that is captured in an event history for reuse. Developers declare what the state of the interface should be after the arrival of events (user interaction, asynchronous network messages, data arrival). DIEL compiles these declarative specifications into relational queries over both event history and the data to be visualized. In doing so, DIEL makes it easier to develop visualizations that are robust against changes to the size and location of data. To evaluate the DIEL framework, we developed a prototype implementation and confirmed that DIEL supports a range of visualization and interaction designs. Further, visualizations written using DIEL can transparently and seamlessly scale to use back-end services with little intervention from the developer.

## Setting up locally

`cd code`
`npm install` (you might need some additional installations such as Node.js)
`npm run lang`

The run time version/notebook is at `npm run start`.  This is also hosted on the [DIEL project website](http://yifanwu.github.io/diel), but if you want to play around with the server instance, you should follow the instructions [here](#Using-a-Local-Database).  Then in `./src/compiler/config.ts`, change `DEMO_WITH_SOCKET` to true (currently set to false to run on the browser).  We currently just have the flights data setup to work with remotes---not some technical limitations, just hadn't had time to set up the bash scripts to get the other datasets ready yet!

## Using a Local Database

Go to `../server` (on the same level as the current directory), and follow the instructions of the readme.