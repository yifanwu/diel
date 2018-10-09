# Debug

## ts-node oddidities

Sometimes the cache is not cleared, we can find where the files are by doing:

```bash
node
require('os')
os.tmpdir()
```

For example, `/var/folde/_h/d_tf4ms16vn5286zx7tr8yd40000gn/T`

Then remove whatever looks like e.g., the following `ts-node-4e5d2e76c9ea473c266612739622ce04347406d7cd18ea771468db51b9f91fe7`